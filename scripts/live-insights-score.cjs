/* eslint-disable */
// Read-only: computes the Insights 300-850 score from LIVE Firestore data,
// exactly as the shipped App.jsx does (post commit 330364a), for one
// participant across all three time periods. No writes.
//   node scripts/live-insights-score.cjs Taylor
const admin = require('firebase-admin');
const KEY_PATH = '/Users/taylorgeorges/Downloads/the-accountability-group-firebase-adminsdk-fbsvc-b191aab53a.json';
admin.initializeApp({ credential: admin.credential.cert(require(KEY_PATH)) });
const db = admin.firestore();

const PARTICIPANT = process.argv[2] || 'Taylor';

// --- replicas of src/lib/scoring.js (post-fix) ---
const isCountableHabit = (h) => h.habitType !== 'percentage' && h.target !== 0;
const countedDays = (h) => Math.min(h.daysCompleted?.length || 0, h.target || 5);
const previousISOWeek = (ws) => { const d = new Date(`${ws}T00:00:00Z`); d.setUTCDate(d.getUTCDate() - 7); return d.toISOString().split('T')[0]; };
const isVacationDay = (dateISO, vacations, participant) => {
  if (!dateISO || !participant || !Array.isArray(vacations) || vacations.length === 0) return false;
  return vacations.some(v => v && v.participant === participant && v.startDate && v.endDate && v.startDate <= dateISO && dateISO <= v.endDate);
};
const weekDays = (ws) => { const base = new Date(`${ws}T00:00:00Z`); return Array.from({length:7},(_,i)=>{const d=new Date(base);d.setUTCDate(base.getUTCDate()+i);return d.toISOString().split('T')[0];}); };
const isFullVacationWeek = (ws, vacations, p) => {
  if (!ws || !p || !Array.isArray(vacations) || vacations.length === 0) return false;
  return weekDays(ws).every(d => isVacationDay(d, vacations, p));
};
const computeRate = (habits, vacations, participant) => {
  const useVac = Array.isArray(vacations) && vacations.length > 0 && !!participant;
  let c = 0, t = 0;
  for (const h of habits) {
    if (!isCountableHabit(h)) continue;
    if (useVac && isFullVacationWeek(h.weekStart, vacations, participant)) continue;
    t += (h.target || 5); c += countedDays(h);
  }
  return t > 0 ? Math.round((c / t) * 100) : 0;
};
const computeStreak = (habits, currentWeekStart, threshold, vacations, participant) => {
  const useVac = Array.isArray(vacations) && vacations.length > 0 && !!participant;
  const buckets = {};
  for (const h of habits) {
    if (!isCountableHabit(h)) continue;
    if (!h.weekStart || h.weekStart >= currentWeekStart) continue;
    if (!buckets[h.weekStart]) buckets[h.weekStart] = { completed: 0, possible: 0 };
    buckets[h.weekStart].possible += (h.target || 5);
    buckets[h.weekStart].completed += countedDays(h);
  }
  let streak = 0, cursor = previousISOWeek(currentWeekStart);
  for (let i = 0; i < 520; i++) {
    if (useVac && isFullVacationWeek(cursor, vacations, participant)) { cursor = previousISOWeek(cursor); continue; }
    const b = buckets[cursor];
    if (!b || b.possible === 0) break;
    if ((b.completed / b.possible) < threshold) break;
    streak += 1; cursor = previousISOWeek(cursor);
  }
  return streak;
};

// getStatus replica (post-fix)
const getStatus = (h) => {
  if (h.habitType === 'percentage') {
    const inst = h.instances || [];
    if (inst.length === 0) return 'Pending';
    const pct = Math.round((inst.filter(i => i.success).length / inst.length) * 100);
    const t = h.target;
    return pct > t ? 'Exceeded' : pct >= t ? 'Done' : pct >= t * 0.75 ? 'On Track' : pct >= t * 0.5 ? 'At Risk' : 'Missed';
  }
  if (h.target === 0) return 'Pending';
  const c = (h.daysCompleted || []).length, t = h.target || 5;
  return c > t ? 'Exceeded' : c >= t ? 'Done' : c >= t * 0.75 ? 'On Track' : c >= t * 0.5 ? 'At Risk' : 'Missed';
};

// SECTORS + sectorForHabit replica (src/lib/report.js)
const SECTORS = [
  { key: 'fitness', keywords: ['workout', 'run', 'gym', 'exercise', 'cardio', 'lift', 'walk', 'stretch', 'yoga', 'steps'] },
  { key: 'health', keywords: ['sleep', 'water', 'eat', 'diet', 'vitamin', 'health', 'track food', 'no sugar', 'no alcohol', 'fast'] },
  { key: 'business', keywords: ['work', 'client', 'call', 'email', 'meeting', 'sales', 'deal', 'business', 'lead', 'prospect', 'tiktok', 'post', 'content'] },
  { key: 'finance', keywords: ['trade', 'invest', 'money', 'budget', 'save', 'finance', 'stock', 'crypto', 'portfolio'] },
  { key: 'learning', keywords: ['read', 'learn', 'study', 'course', 'book', 'podcast', 'code', 'practice'] },
  { key: 'mindfulness', keywords: ['journal', 'gratitude', 'reflect', 'pray', 'meditat', 'mindful', 'quiet', 'breathe'] },
  { key: 'social', keywords: ['friend', 'family', 'hang', 'connect', 'relationship', 'date', 'wife', 'kids'] },
  { key: 'discipline', keywords: ['no social', 'no phone', 'wake', 'morning', 'routine', 'discipline', 'focus', 'cold'] }
];
const sectorForHabit = (name) => {
  const n = (name || '').toLowerCase();
  for (const s of SECTORS) if (s.keywords.some(kw => n.includes(kw))) return s.key;
  return null;
};

// Local-date helpers (post-fix constants)
const pad = (n) => String(n).padStart(2, '0');
const toLocalISODate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const getMondayOf = (date) => { const d = new Date(date); const day = d.getDay(); const diff = d.getDate() - day + (day === 0 ? -6 : 1); return toLocalISODate(new Date(d.getFullYear(), d.getMonth(), diff)); };

(async () => {
  const [hSnap, vSnap] = await Promise.all([db.collection('habits').get(), db.collection('vacations').get()]);
  const habits = hSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  const vacations = vSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  const currentWeekStart = getMondayOf(new Date());
  console.log(`Live data: ${habits.length} habits, ${vacations.length} vacations. currentWeekStart=${currentWeekStart}. Participant=${PARTICIPANT}\n`);

  for (const [period, weeksBack] of [['month', 4], ['quarter', 13], ['year', 52]]) {
    const startDate = new Date(); startDate.setDate(startDate.getDate() - weeksBack * 7);
    const periodStartDate = toLocalISODate(startDate);
    const myHabits = habits.filter(h => h.participant === PARTICIPANT && h.weekStart >= periodStartDate && h.weekStart < currentWeekStart);
    const totalHabits = myHabits.length;
    const completedHabits = myHabits.filter(h => ['Done', 'Exceeded'].includes(getStatus(h))).length;
    const exceededHabits = myHabits.filter(h => getStatus(h) === 'Exceeded').length;
    const hasCountable = myHabits.some(isCountableHabit);
    const completionRate = hasCountable ? computeRate(myHabits, vacations, PARTICIPANT)
      : (totalHabits > 0 ? Math.round((completedHabits / totalHabits) * 100) : 0);
    const completionPoints = Math.round(completionRate * 3);
    const currentStreak = computeStreak(habits.filter(h => h.participant === PARTICIPANT), currentWeekStart, 0.7, vacations, PARTICIPANT);
    const streakPoints = Math.min(currentStreak * 12, 100);
    const uniqueWeeks = [...new Set(myHabits.map(h => h.weekStart))].sort().filter(w => !isFullVacationWeek(w, vacations, PARTICIPANT));
    const weeklyRates = uniqueWeeks.map(week => {
      const wh = myHabits.filter(h => h.weekStart === week && isCountableHabit(h));
      const t = wh.reduce((s, h) => s + (h.target || 5), 0);
      const c = wh.reduce((s, h) => s + countedDays(h), 0);
      return t > 0 ? (c / t) * 100 : null;
    }).filter(r => r !== null);
    const avgRate = weeklyRates.length ? weeklyRates.reduce((a, b) => a + b, 0) / weeklyRates.length : 0;
    const variance = weeklyRates.length > 1 ? weeklyRates.reduce((s, r) => s + (r - avgRate) ** 2, 0) / weeklyRates.length : 0;
    const dataPointPenalty = weeklyRates.length < 4 ? (4 - weeklyRates.length) * 15 : 0;
    const consistencyPoints = Math.max(0, 75 - Math.round(Math.sqrt(variance) * 1.5) - dataPointPenalty);
    const excellencePoints = Math.round((totalHabits > 0 ? (exceededHabits / totalHabits) * 100 : 0) * 0.5);
    const CATEGORY_TO_SECTOR = { fitness: 'fitness', business: 'business', finance: 'finance', health: 'health', learning: 'learning', relationships: 'social', spiritual: 'mindfulness' };
    const lifeAreas = new Set();
    myHabits.forEach(h => {
      const area = sectorForHabit(h.habit) || CATEGORY_TO_SECTOR[(h.category || '').trim().toLowerCase()];
      if (area) lifeAreas.add(area);
    });
    const categoryPoints = Math.min(Math.round(lifeAreas.size * 3.5), 25);
    const totalScore = Math.min(850, Math.max(300, 300 + completionPoints + streakPoints + consistencyPoints + excellencePoints + categoryPoints));
    console.log(`${period.padEnd(8)} score=${totalScore}  completion=${completionRate}%  streak=${currentStreak}w  weeks=${uniqueWeeks.length}  pts: C${completionPoints}/S${streakPoints}/K${consistencyPoints}/E${excellencePoints}/B${categoryPoints}`);
  }
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
