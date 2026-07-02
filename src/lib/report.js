/**
 * Mid-Year Performance Report.
 *
 * Two halves, both pure-ish:
 *   1. computeMidYearReport() — turns raw habit data into a graded, group +
 *      per-person report object. No React/Firebase imports.
 *   2. generateReportPDF() — renders that object into a branded Accountability
 *      Group PDF via jsPDF and triggers a download.
 *
 * Sectors are inferred from habit names with the same keyword map the Wrapped
 * recap uses, so grades line up with what members already see in-app.
 */
import { jsPDF } from 'jspdf';
import { DAYS } from '../constants/index.js';
import { isFullVacationWeek, previousISOWeek, nextISOWeek, computeLongestStreak } from './scoring.js';

// ---------------------------------------------------------------------------
// Sector definitions (keyword-inferred, first match wins — mirrors wrappedStats)
// ---------------------------------------------------------------------------
export const SECTORS = [
  { key: 'fitness', label: 'Fitness', keywords: ['workout', 'run', 'gym', 'exercise', 'cardio', 'lift', 'walk', 'stretch', 'yoga', 'steps'] },
  { key: 'health', label: 'Health', keywords: ['sleep', 'water', 'eat', 'diet', 'vitamin', 'health', 'track food', 'no sugar', 'no alcohol', 'fast'] },
  { key: 'business', label: 'Business', keywords: ['work', 'client', 'call', 'email', 'meeting', 'sales', 'deal', 'business', 'lead', 'prospect', 'tiktok', 'post', 'content'] },
  { key: 'finance', label: 'Finance', keywords: ['trade', 'invest', 'money', 'budget', 'save', 'finance', 'stock', 'crypto', 'portfolio'] },
  { key: 'learning', label: 'Learning', keywords: ['read', 'learn', 'study', 'course', 'book', 'podcast', 'code', 'practice'] },
  { key: 'mindfulness', label: 'Mindfulness', keywords: ['journal', 'gratitude', 'reflect', 'pray', 'meditat', 'mindful', 'quiet', 'breathe'] },
  { key: 'social', label: 'Relationships', keywords: ['friend', 'family', 'hang', 'connect', 'relationship', 'date', 'wife', 'kids'] },
  { key: 'discipline', label: 'Discipline', keywords: ['no social', 'no phone', 'wake', 'morning', 'routine', 'discipline', 'focus', 'cold'] }
];

export const sectorForHabit = (name) => {
  const n = (name || '').toLowerCase();
  for (const s of SECTORS) {
    if (s.keywords.some(kw => n.includes(kw))) return s.key;
  }
  return null;
};

// Clamped to target — matches scoring.js's over-completion policy: extra
// checks beyond the weekly target don't inflate any rate.
const completedDays = (h) => {
  const raw = Array.isArray(h.daysCompleted) ? h.daysCompleted.length : DAYS.filter(d => h.days?.[d]).length;
  return Math.min(raw, h.target || 5);
};

const possibleDays = (h) => (h.target || 5);

const isCountable = (h) => h.habitType !== 'percentage' && h.target !== 0;

const rate = (completed, possible) => (possible > 0 ? Math.round((completed / possible) * 100) : 0);

const avg = (arr) => (arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0);

// ---------------------------------------------------------------------------
// Grading
// ---------------------------------------------------------------------------
// Standard academic scale → letter + GPA points + a tier for coloring.
const GRADE_TABLE = [
  { min: 97, letter: 'A+', points: 4.3, tier: 'A' },
  { min: 93, letter: 'A', points: 4.0, tier: 'A' },
  { min: 90, letter: 'A-', points: 3.7, tier: 'A' },
  { min: 87, letter: 'B+', points: 3.3, tier: 'B' },
  { min: 83, letter: 'B', points: 3.0, tier: 'B' },
  { min: 80, letter: 'B-', points: 2.7, tier: 'B' },
  { min: 77, letter: 'C+', points: 2.3, tier: 'C' },
  { min: 73, letter: 'C', points: 2.0, tier: 'C' },
  { min: 70, letter: 'C-', points: 1.7, tier: 'C' },
  { min: 67, letter: 'D+', points: 1.3, tier: 'D' },
  { min: 63, letter: 'D', points: 1.0, tier: 'D' },
  { min: 60, letter: 'D-', points: 0.7, tier: 'D' },
  { min: 0, letter: 'F', points: 0.0, tier: 'F' }
];

export const gradeFromRate = (r) => GRADE_TABLE.find(g => r >= g.min) || GRADE_TABLE[GRADE_TABLE.length - 1];

// GPA points (0–4.3) → nearest letter, for the group's average grade.
const gradeFromPoints = (p) => {
  let best = GRADE_TABLE[GRADE_TABLE.length - 1];
  let bestDiff = Infinity;
  for (const g of GRADE_TABLE) {
    const d = Math.abs(g.points - p);
    if (d < bestDiff) { bestDiff = d; best = g; }
  }
  return best;
};

// ---------------------------------------------------------------------------
// Weekly aggregation
// ---------------------------------------------------------------------------
const weeklyFromHabits = (subset) => {
  const perf = {};
  for (const h of subset) {
    if (!isCountable(h) || !h.weekStart) continue;
    if (!perf[h.weekStart]) perf[h.weekStart] = { completed: 0, possible: 0 };
    perf[h.weekStart].completed += completedDays(h);
    perf[h.weekStart].possible += possibleDays(h);
  }
  const weeks = Object.keys(perf).sort();
  weeks.forEach(w => { perf[w].rate = rate(perf[w].completed, perf[w].possible); });
  const totalCompleted = weeks.reduce((s, w) => s + perf[w].completed, 0);
  const totalPossible = weeks.reduce((s, w) => s + perf[w].possible, 0);
  return { perf, weeks, overall: { completed: totalCompleted, possible: totalPossible, rate: rate(totalCompleted, totalPossible) } };
};

// First-half vs second-half average weekly rate → trend.
const trendFromWeekly = ({ perf, weeks }) => {
  if (weeks.length < 2) return { label: 'steady', delta: 0, firstAvg: weeks.length ? perf[weeks[0]].rate : 0, secondAvg: weeks.length ? perf[weeks[0]].rate : 0 };
  const mid = Math.floor(weeks.length / 2);
  const firstAvg = avg(weeks.slice(0, mid).map(w => perf[w].rate));
  const secondAvg = avg(weeks.slice(mid).map(w => perf[w].rate));
  const delta = secondAvg - firstAvg;
  const label = delta >= 5 ? 'improving' : delta <= -5 ? 'declining' : 'steady';
  return { label, delta, firstAvg, secondAvg };
};

// Canonical streak semantics (matches scoring.js computeStreak): consecutive
// CALENDAR weeks at a raw ratio >= 0.7 — an untracked gap week breaks the
// streak, full-vacation weeks are invisible, and the current streak is
// anchored at the week before `endISO` (it goes stale if tracking stopped).
const streaksFromWeekly = ({ perf, weeks }, { endISO, isVacWeek } = {}) => {
  if (!weeks.length) return { longest: 0, current: 0, perfectWeeks: 0 };
  const end = endISO || nextISOWeek(weeks[weeks.length - 1]);
  const vac = isVacWeek || (() => false);
  const met = (w) => !!perf[w] && perf[w].possible > 0 && (perf[w].completed / perf[w].possible) >= 0.7;

  const longest = computeLongestStreak(perf, end, { isVacWeek: vac });

  let current = 0;
  let cursor = previousISOWeek(end);
  for (let i = 0; i < 520; i++) {
    if (vac(cursor)) { cursor = previousISOWeek(cursor); continue; }
    if (!met(cursor)) break;
    current++;
    cursor = previousISOWeek(cursor);
  }

  // A perfect week means every counted day was hit, not a rounded 99.6%.
  const perfectWeeks = weeks.filter(w => perf[w].possible > 0 && perf[w].completed >= perf[w].possible).length;
  return { longest, current, perfectWeeks };
};

// Per-sector grades for a habit subset. `habits` counts DISTINCT habit names
// (not habit-week rows — 2 habits over 20 weeks is 2, not 40).
const sectorGrades = (subset) => {
  const acc = {};
  for (const h of subset) {
    if (!isCountable(h)) continue;
    const key = sectorForHabit(h.habit);
    if (!key) continue;
    if (!acc[key]) acc[key] = { completed: 0, possible: 0, names: new Set() };
    acc[key].completed += completedDays(h);
    acc[key].possible += possibleDays(h);
    acc[key].names.add((h.habit || '').toLowerCase().trim());
  }
  return SECTORS
    .filter(s => acc[s.key] && acc[s.key].possible > 0)
    .map(s => {
      const r = rate(acc[s.key].completed, acc[s.key].possible);
      return { key: s.key, label: s.label, rate: r, grade: gradeFromRate(r), habits: acc[s.key].names.size };
    });
};

// Top / weakest individual habits (>=2 weeks of data).
const habitRankings = (subset) => {
  const stats = {};
  for (const h of subset) {
    if (!isCountable(h)) continue;
    const name = (h.habit || '').trim();
    if (!name) continue;
    const k = name.toLowerCase();
    if (!stats[k]) stats[k] = { name, completed: 0, possible: 0, weeks: 0 };
    stats[k].completed += completedDays(h);
    stats[k].possible += possibleDays(h);
    stats[k].weeks++;
  }
  return Object.values(stats)
    .filter(h => h.weeks >= 2)
    .map(h => ({ ...h, rate: rate(h.completed, h.possible) }))
    .sort((a, b) => b.rate - a.rate);
};

// ---------------------------------------------------------------------------
// Narrative helpers
// ---------------------------------------------------------------------------
const personWins = (p) => {
  const out = [];
  if (p.overall.rate >= 80) out.push(`Elite consistency — ${p.overall.rate}% completion across the half.`);
  const strong = p.sectors.filter(s => s.rate >= 80).slice(0, 2);
  strong.forEach(s => out.push(`${s.label} is a clear strength (${s.rate}%, ${s.grade.letter}).`));
  if (p.streak.current >= 3) out.push(`Riding a ${p.streak.current}-week streak of 70%+ weeks.`);
  if (p.trend.label === 'improving') out.push(`Building momentum — up ${p.trend.delta} pts in the back half.`);
  if (p.streak.perfectWeeks > 0) out.push(`${p.streak.perfectWeeks} perfect week${p.streak.perfectWeeks > 1 ? 's' : ''} in the books.`);
  if (p.topHabit && p.topHabit.rate >= 90) out.push(`"${p.topHabit.name}" is locked in at ${p.topHabit.rate}%.`);
  if (!out.length) out.push(`Showed up and put data on the board — that's the foundation.`);
  return out.slice(0, 3);
};

const personImproves = (p) => {
  const out = [];
  const weak = p.sectors.filter(s => s.rate < 70).sort((a, b) => a.rate - b.rate).slice(0, 2);
  weak.forEach(s => out.push(`${s.label} needs attention (${s.rate}%, ${s.grade.letter}).`));
  if (p.trend.label === 'declining') out.push(`Slipping lately — down ${Math.abs(p.trend.delta)} pts; reset the routine.`);
  if (p.weakHabit && p.weakHabit.rate < 50 && (!p.topHabit || p.weakHabit.name !== p.topHabit.name)) {
    out.push(`"${p.weakHabit.name}" is lagging at ${p.weakHabit.rate}% — shrink it or reschedule it.`);
  }
  if (p.overall.rate < 60) out.push(`Overall completion is under 60% — anchor on 2 keystone habits.`);
  if (p.streak.current === 0) out.push(`No active streak — string together one clean week to restart.`);
  if (!out.length) out.push(`Push a strong sector to 90%+ and chase your first perfect week.`);
  return out.slice(0, 3);
};

const groupTrendsNarrative = (people, groupSectors, groupTrend) => {
  const out = [];
  if (groupTrend.label === 'improving') out.push(`The group is trending UP — back-half weeks averaged ${groupTrend.delta} pts higher than the first half.`);
  else if (groupTrend.label === 'declining') out.push(`The group cooled off — back-half weeks dropped ${Math.abs(groupTrend.delta)} pts vs. the first half.`);
  else out.push(`The group held steady through the first half — consistent, with room to push higher.`);

  const improving = people.filter(p => p.trend.label === 'improving').map(p => p.name);
  const declining = people.filter(p => p.trend.label === 'declining').map(p => p.name);
  if (improving.length) out.push(`Trending up: ${improving.join(', ')}.`);
  if (declining.length) out.push(`Watch the dip: ${declining.join(', ')}.`);

  const best = [...groupSectors].sort((a, b) => b.rate - a.rate)[0];
  const worst = [...groupSectors].sort((a, b) => a.rate - b.rate)[0];
  if (best) out.push(`Strongest sector group-wide: ${best.label} (${best.rate}%).`);
  if (worst && worst.key !== best?.key) out.push(`Most contested sector: ${worst.label} (${worst.rate}%).`);
  return out;
};

const groupWins = (people, groupSectors) => {
  const out = [];
  groupSectors.filter(s => s.rate >= 80).slice(0, 3).forEach(s => out.push(`${s.label}: the group is dialed in at ${s.rate}% (${s.grade.letter}).`));
  const streakers = people.filter(p => p.streak.current >= 3).map(p => `${p.name} (${p.streak.current}w)`);
  if (streakers.length) out.push(`Active 70%+ streaks: ${streakers.join(', ')}.`);
  const perfect = people.reduce((s, p) => s + p.streak.perfectWeeks, 0);
  if (perfect) out.push(`${perfect} perfect week${perfect > 1 ? 's' : ''} logged across the group.`);
  if (!out.length) out.push(`Everyone is on the board with tracked data — momentum starts here.`);
  return out.slice(0, 4);
};

const groupImproves = (people, groupSectors) => {
  const out = [];
  groupSectors.filter(s => s.rate < 70).sort((a, b) => a.rate - b.rate).slice(0, 3)
    .forEach(s => out.push(`${s.label} is the group's soft spot (${s.rate}%, ${s.grade.letter}) — pick one shared habit to lift it.`));
  const lowest = [...people].sort((a, b) => a.overall.rate - b.overall.rate)[0];
  if (lowest && lowest.overall.rate < 65) out.push(`${lowest.name} could use a check-in (${lowest.overall.rate}% overall) — rally around them.`);
  const noStreak = people.filter(p => p.streak.current === 0).map(p => p.name);
  if (noStreak.length) out.push(`Restart streaks: ${noStreak.join(', ')} — one clean week resets the clock.`);
  if (!out.length) out.push(`Chase A's — nudge the B sectors over 90% to raise the group GPA.`);
  return out.slice(0, 4);
};

const buildAwards = (people) => {
  const awards = [];
  const withData = people.filter(p => p.overall.possible > 0);
  if (!withData.length) return awards;

  const mvp = [...withData].sort((a, b) => b.overall.rate - a.overall.rate)[0];
  awards.push({ title: 'MVP of the Half', name: mvp.displayName || mvp.name, stat: `${mvp.overall.rate}% overall (${mvp.overall.grade.letter})`, blurb: 'Highest completion rate in the group. Leading from the front.' });

  const improved = [...withData].sort((a, b) => b.trend.delta - a.trend.delta)[0];
  if (improved && improved.trend.delta > 0) {
    awards.push({ title: 'Most Improved', name: improved.displayName || improved.name, stat: `+${improved.trend.delta} pts back half`, blurb: 'Biggest jump from the first half to the second. The arrow is pointing up.' });
  }

  const consistent = [...withData].sort((a, b) => (b.streak.current - a.streak.current) || (b.streak.longest - a.streak.longest) || (b.overall.rate - a.overall.rate))[0];
  if (consistent && (consistent.streak.current > 0 || consistent.streak.longest > 0)) {
    awards.push({ title: 'Most Consistent', name: consistent.displayName || consistent.name, stat: `${consistent.streak.current}-week active streak`, blurb: 'Shows up week after week. Consistency compounds.' });
  }

  const balanced = withData
    .filter(p => p.sectors.length >= 3)
    .map(p => ({ p, spread: Math.max(...p.sectors.map(s => s.rate)) - Math.min(...p.sectors.map(s => s.rate)) }))
    .sort((a, b) => a.spread - b.spread)[0];
  if (balanced) {
    awards.push({ title: 'Most Balanced', name: balanced.p.displayName || balanced.p.name, stat: `${balanced.p.sectors.length} sectors, tight spread`, blurb: 'Strong across the board, not just one lane. True well-rounded effort.' });
  }

  const comeback = withData
    .filter(p => p.trend.firstAvg < 60 && p.trend.delta > 0)
    .sort((a, b) => b.trend.delta - a.trend.delta)[0];
  if (comeback && comeback.name !== improved?.name) {
    awards.push({ title: 'Comeback Award', name: comeback.displayName || comeback.name, stat: `${comeback.trend.firstAvg}% → ${comeback.trend.secondAvg}%`, blurb: 'Started slow, finished strong. Never counted out.' });
  }

  return awards;
};

const headlineFor = (grade) => {
  switch (grade.tier) {
    case 'A': return 'Championship form. The group is operating at an elite level.';
    case 'B': return 'Strong, dependable execution. A few tweaks from greatness.';
    case 'C': return 'A solid base is built. The second half is where it gets won.';
    case 'D': return 'The data tells the truth — time to recommit and rebuild momentum.';
    default: return 'Reset and refocus. Every comeback starts with one honest week.';
  }
};

// ---------------------------------------------------------------------------
// Public: compute the full report object
// ---------------------------------------------------------------------------
export const computeMidYearReport = (habits, vacations = [], participants = [], options = {}) => {
  const {
    // '2025-12-29' is the Monday of ISO week 2026-W01 (the week containing
    // Jan 1) — starting at '2026-01-01' would silently drop everyone's first
    // tracked week of the year, since habit docs are keyed by their Monday.
    startISO = '2025-12-29',
    endISO = null,           // exclusive (typically currentWeekStart); null = include all
    year = 2026
  } = options;
  const visions = options.visions || [];

  const inWindow = (h) =>
    h.weekStart && h.weekStart >= startISO && (endISO ? h.weekStart < endISO : true);

  const windowHabits = (habits || []).filter(inWindow);

  // Full-vacation weeks are excluded from every rate/grade denominator and
  // invisible to streaks — the same treatment scoring.js gives the in-app
  // scorecard. Cached per (participant, week).
  const vacCache = new Map();
  const isVacationWeekFor = (participant, weekStart) => {
    if (!Array.isArray(vacations) || vacations.length === 0 || !participant || !weekStart) return false;
    const k = `${participant}|${weekStart}`;
    if (!vacCache.has(k)) vacCache.set(k, isFullVacationWeek(weekStart, vacations, participant));
    return vacCache.get(k);
  };
  const isVacHabit = (h) => isVacationWeekFor(h.participant, h.weekStart);

  // Who to report on: provided participants ∪ anyone with data, that actually has data.
  const names = Array.from(new Set([
    ...participants,
    ...windowHabits.map(h => h.participant).filter(Boolean)
  ]));

  const visionByName = {};
  visions.forEach(v => { if (v.participant) visionByName[v.participant.toLowerCase()] = v; });

  // Calendar ISO weeks elapsed in the report window (for year-end forecasts).
  let weeksElapsed = 0;
  if (endISO) {
    for (let w = startISO; w < endISO && weeksElapsed < 60; w = nextISOWeek(w)) weeksElapsed++;
  }

  const people = names
    .map(name => {
      const subset = windowHabits.filter(h => h.participant === name && !isVacHabit(h));
      if (!subset.length) return null;
      const weekly = weeklyFromHabits(subset);
      if (weekly.overall.possible === 0) return null;
      const trend = trendFromWeekly(weekly);
      const streak = streaksFromWeekly(weekly, { endISO, isVacWeek: (w) => isVacationWeekFor(name, w) });
      const sectors = sectorGrades(subset);
      const ranks = habitRankings(subset);
      const vision = visionByName[name.toLowerCase()] || null;
      const totalDaysCompleted = subset.reduce((s, h) => s + (isCountable(h) ? completedDays(h) : 0), 0);
      const overall = { ...weekly.overall, grade: gradeFromRate(weekly.overall.rate) };
      const person = {
        name,
        // PDF-facing casing ('aaron' → 'Aaron'); matching stays on raw `name`.
        displayName: name ? name.charAt(0).toUpperCase() + name.slice(1) : name,
        overall,
        weekly,
        trend,
        streak,
        sectors,
        topHabit: ranks[0] || null,
        weakHabit: ranks.length > 1 ? ranks[ranks.length - 1] : null,
        habitsTracked: subset.length,
        weeksTracked: weekly.weeks.length,
        totalDaysCompleted,
        wordOfYear: vision?.wordOfYear || null,
        biggestGoal: vision?.biggestGoal || null
      };
      person.wins = personWins(person);
      person.improves = personImproves(person);
      return person;
    })
    .filter(Boolean)
    .sort((a, b) => b.overall.rate - a.overall.rate);

  // Group aggregates (over all in-window habits belonging to reported people,
  // with each member's full-vacation weeks excluded).
  const reportedNames = new Set(people.map(p => p.name));
  const groupSubset = windowHabits.filter(h => reportedNames.has(h.participant) && !isVacHabit(h));
  const groupWeekly = weeklyFromHabits(groupSubset);
  const groupTrend = trendFromWeekly(groupWeekly);
  const groupSectorsRaw = sectorGrades(groupSubset);
  const overallRate = groupWeekly.overall.rate;
  const gpaPoints = people.length ? +(people.reduce((s, p) => s + p.overall.grade.points, 0) / people.length).toFixed(2) : 0;
  const groupGrade = gradeFromPoints(gpaPoints);
  const totalDaysCompleted = people.reduce((s, p) => s + p.totalDaysCompleted, 0);

  const allWeeks = groupWeekly.weeks;
  const dateRange = allWeeks.length
    ? { from: allWeeks[0], to: allWeeks[allWeeks.length - 1] }
    : { from: startISO, to: endISO || startISO };

  return {
    year,
    generatedAt: new Date().toISOString(),
    dateRange,
    weeksCovered: allWeeks.length,
    weeksElapsed: weeksElapsed || allWeeks.length,
    group: {
      overallRate,
      grade: gradeFromPoints(gpaPoints),
      gpa: gpaPoints,
      letterGrade: groupGrade.letter,
      headline: headlineFor(groupGrade),
      sectors: groupSectorsRaw,
      trend: groupTrend,
      totalDaysCompleted,
      memberCount: people.length,
      habitsTracked: groupSubset.length,
      wins: groupWins(people, groupSectorsRaw),
      improves: groupImproves(people, groupSectorsRaw),
      trends: groupTrendsNarrative(people, groupSectorsRaw, groupTrend)
    },
    awards: buildAwards(people),
    people
  };
};

// ===========================================================================
// PERSONALIZATION — turns one member's stats into a fun, shareable profile
// ===========================================================================

// Fun persona based on the shape of the stat line (priority order matters).
const pickArchetype = (p) => {
  const r = p.overall.rate, st = p.streak.current, lst = p.streak.longest;
  const d = p.trend.delta, pw = p.streak.perfectWeeks;
  const rates = p.sectors.map(s => s.rate);
  const spread = rates.length ? Math.max(...rates) - Math.min(...rates) : 0;
  const highSectors = p.sectors.filter(s => s.rate >= 85).length;
  if (r >= 90 && st >= 8) return { name: 'The Machine', tag: 'Automatic. Unbothered. Relentless.' };
  if (pw >= 3) return { name: 'The Perfectionist', tag: '100% or it didn’t happen.' };
  if (d >= 12 && p.trend.firstAvg < 65) return { name: 'The Comeback Kid', tag: 'Started slow, finished on fire.' };
  if (d >= 10) return { name: 'The Riser', tag: 'Trending up and not looking back.' };
  if (r >= 82 && spread <= 15 && p.sectors.length >= 4) return { name: 'The All-Rounder', tag: 'Strong everywhere, weak nowhere.' };
  if (st >= 6 && r >= 70) return { name: 'The Steady Hand', tag: 'Shows up. Every. Single. Week.' };
  if (highSectors >= 1 && spread >= 30) return { name: 'The Specialist', tag: 'Absolutely elite in your lane.' };
  if (d <= -10) return { name: 'The Sleeping Giant', tag: 'More in the tank than the scoreboard shows.' };
  if (r >= 70) return { name: 'The Workhorse', tag: 'Quietly stacking the work.' };
  if (lst >= 4) return { name: 'The Flash Streaker', tag: 'Capable of greatness in bursts.' };
  if (r >= 50) return { name: 'The Grinder', tag: 'In the arena, putting in the reps.' };
  return { name: 'The Rookie', tag: 'Day one of the climb. Onward and up.' };
};

const sectorTier = (p, key, tiers) => {
  const s = p.sectors.find(x => x.key === key);
  return s && tiers.includes(s.grade.tier);
};

// Earned achievement badges (name + short description).
const computeBadges = (p) => {
  const b = [];
  if (p.overall.grade.tier === 'A') b.push(['Honor Roll', 'A-tier overall. Elite company.']);
  else if (p.overall.grade.tier === 'B') b.push(['Dean’s List', 'Solid B-tier half. Dependable.']);
  if (p.streak.current >= 8) b.push(['Iron Streak', `${p.streak.current} weeks unbroken.`]);
  else if (p.streak.current >= 4) b.push(['On Fire', `${p.streak.current}-week active streak.`]);
  if (p.streak.longest >= 10) b.push(['Streak Machine', `${p.streak.longest}-week best streak.`]);
  if (p.streak.perfectWeeks >= 3) b.push(['Flawless x3', `${p.streak.perfectWeeks} perfect weeks.`]);
  else if (p.streak.perfectWeeks >= 1) b.push(['Perfect Week Club', `${p.streak.perfectWeeks} perfect week${p.streak.perfectWeeks > 1 ? 's' : ''}.`]);
  if (p.totalDaysCompleted >= 300) b.push(['Triple Century', '300+ habit-days logged.']);
  else if (p.totalDaysCompleted >= 200) b.push(['Double Century', '200+ habit-days logged.']);
  else if (p.totalDaysCompleted >= 100) b.push(['Centurion', '100+ habit-days logged.']);
  if (p.trend.label === 'improving' && p.trend.delta >= 10) b.push(['Comeback Artist', `Up ${p.trend.delta} pts in the back half.`]);
  if (sectorTier(p, 'fitness', ['A'])) b.push(['Beast Mode', 'Fitness graded A-tier.']);
  if (sectorTier(p, 'business', ['A'])) b.push(['Rainmaker', 'Business graded A-tier.']);
  if (sectorTier(p, 'finance', ['A', 'B'])) b.push(['Money Moves', 'Finance dialed in.']);
  if (sectorTier(p, 'learning', ['A', 'B'])) b.push(['Scholar', 'Learning on lock.']);
  if (sectorTier(p, 'mindfulness', ['A', 'B'])) b.push(['Zen Master', 'Mindfulness on point.']);
  if (sectorTier(p, 'discipline', ['A'])) b.push(['Iron Will', 'Discipline graded A-tier.']);
  if (sectorTier(p, 'social', ['A', 'B'])) b.push(['Connector', 'Relationships nurtured.']);
  if (sectorTier(p, 'health', ['A', 'B'])) b.push(['Well-Oiled', 'Health graded high.']);
  if (p.sectors.filter(s => s.rate >= 70).length >= 4) b.push(['Renaissance', '4+ sectors above 70%.']);
  return b.slice(0, 8).map(([name, desc]) => ({ name, desc }));
};

// Group-leading superlatives this member owns.
const computeSuperlatives = (p, people) => {
  const out = [];
  const leads = (key) => people.every(o => o === p || key(p) >= key(o)) && key(p) > 0;
  if (leads(x => x.overall.rate)) out.push({ title: 'The MVP', detail: `Top completion in the group (${p.overall.rate}%).` });
  if (leads(x => x.streak.current)) out.push({ title: 'The Iron Man', detail: `Longest active streak (${p.streak.current}w).` });
  if (leads(x => x.trend.delta) && p.trend.delta > 0) out.push({ title: 'Most Improved', detail: `Biggest back-half jump (+${p.trend.delta}).` });
  if (leads(x => x.totalDaysCompleted)) out.push({ title: 'The Workhorse', detail: `Most habit-days logged (${p.totalDaysCompleted}).` });
  // Sector champ: highest rate in a sector among everyone who has it.
  p.sectors.forEach(s => {
    const rivals = people.filter(o => o !== p).map(o => o.sectors.find(x => x.key === s.key)?.rate ?? -1);
    if (s.rate > 0 && rivals.every(r => s.rate >= r) && rivals.some(r => r >= 0)) {
      out.push({ title: `${s.label} Champ`, detail: `Group-best ${s.label} (${s.rate}%).` });
    }
  });
  return out.slice(0, 5);
};

// Playful self-roast (kind, shareable). Picks the relevant ones.
const computeRoast = (p) => {
  const out = [];
  const weak = [...p.sectors].sort((a, b) => a.rate - b.rate)[0];
  if (weak && weak.rate < 65) out.push(`Your ${weak.label} grade (${weak.grade.letter}) is doing a stunning impression of a participation trophy.`);
  if (p.trend.label === 'declining') out.push(`Someone found the cruise-control button in the back half — the data noticed, friend.`);
  if (p.weakHabit && p.weakHabit.rate < 50) out.push(`"${p.weakHabit.name}" at ${p.weakHabit.rate}%? At this point it’s more of a suggestion than a habit.`);
  if (p.streak.current === 0) out.push(`Current streak: zero. Your last clean week is filing a missing-persons report.`);
  if (p.overall.rate < 60) out.push(`Sub-60% overall — we admire the optimism of all those untouched checkboxes.`);
  if (!out.length) out.push(`Honestly? Hard to roast this half. Show-off.`);
  return out.slice(0, 3);
};

const computeToast = (p) => {
  const out = [];
  if (p.overall.rate >= 85) out.push(`${p.overall.rate}% completion across the half — that’s championship-level consistency.`);
  const strong = p.sectors.filter(s => s.rate >= 80).slice(0, 2);
  strong.forEach(s => out.push(`${s.label} is a flat-out strength (${s.rate}%, ${s.grade.letter}). Keep feeding it.`));
  if (p.streak.current >= 4) out.push(`${p.streak.current} weeks of 70%+ in a row. That’s a habit, not a fluke.`);
  if (p.trend.label === 'improving') out.push(`Up ${p.trend.delta} pts in the back half — the arrow is pointing the right way.`);
  if (p.streak.perfectWeeks > 0) out.push(`${p.streak.perfectWeeks} perfect week${p.streak.perfectWeeks > 1 ? 's' : ''} — absolute lock-in.`);
  if (!out.length) out.push(`You put real data on the board this half — that’s the foundation everything stacks on.`);
  return out.slice(0, 3);
};

const computeForecast = (p, weeksElapsed) => {
  // Calendar weeks left in the year — NOT 52 minus weeks-with-data, which
  // handed members phantom future weeks for every week they skipped.
  const weeksRemaining = Math.max(0, 52 - weeksElapsed);
  const perWeek = p.weeksTracked ? p.totalDaysCompleted / p.weeksTracked : 0;
  const projDays = Math.round(p.totalDaysCompleted + perWeek * weeksRemaining);
  const projRate = p.trend.label === 'improving'
    ? Math.min(100, Math.round(p.trend.secondAvg + p.trend.delta))
    : p.overall.rate;
  const lines = [];
  lines.push(`At your current pace, you’re on track for about ${projDays.toLocaleString()} habit-days by Dec 31.`);
  if (p.trend.label === 'improving') lines.push(`If the back-half momentum holds, you finish the year around ${projRate}% — a full grade jump is in reach.`);
  else if (p.trend.label === 'declining') lines.push(`Reverse the slide and an ${gradeFromRate(Math.min(100, p.overall.rate + 8)).letter} is absolutely on the table by December.`);
  else lines.push(`Hold the line and you lock in a ${p.overall.grade.letter}; push 8 points and you change letters.`);
  if (p.streak.current > 0) lines.push(`Keep the streak alive and it reaches ${p.streak.current + weeksRemaining} weeks by year-end.`);
  return lines;
};

const computeChallenge = (p) => {
  const weak = [...p.sectors].sort((a, b) => a.rate - b.rate)[0];
  // GRADE_TABLE is ordered A+ → F, so search from the bottom up to find the
  // NEAREST next grade (a plain .find() would always return A+).
  const nextGrade = [...GRADE_TABLE].reverse().find(g => g.min > p.overall.rate);
  const toNextGrade = nextGrade ? nextGrade.min - p.overall.rate : 0;
  if (weak && weak.rate < 70) {
    return `Pick ONE ${weak.label.toLowerCase()} habit and hit it 6 of 7 days for the next 4 weeks. Drag that ${weak.grade.letter} up a full letter.`;
  }
  if (toNextGrade > 0 && toNextGrade <= 5) {
    return `You’re ${toNextGrade} point${toNextGrade > 1 ? 's' : ''} from a ${nextGrade.letter}. One extra check-in a week gets you there. Go take it.`;
  }
  if (p.streak.current < 4) {
    return `String together 4 straight weeks at 70%+ and earn your "On Fire" badge by next check-in.`;
  }
  return `Chase your first (or next) perfect week — 7-for-7 across every habit. The trophy case has room.`;
};

const QUOTE_BANK = [
  '"Discipline is choosing between what you want now and what you want most."',
  '"You do not rise to the level of your goals. You fall to the level of your systems."',
  '"Motivation gets you started. Habit keeps you going."',
  '"Small disciplines repeated with consistency lead to great achievements."',
  '"The man who moves a mountain begins by carrying away small stones."'
];
const computeQuote = (p) => {
  if (p.wordOfYear) return `"${p.wordOfYear}" isn’t a resolution — it’s a rep. Stack another 26 weeks of it.`;
  // Deterministic pick (no Math.random in this codebase): hash the name.
  const idx = (p.name || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0) % QUOTE_BANK.length;
  return QUOTE_BANK[idx];
};

const computeFunFact = (p) => {
  const facts = [];
  facts.push(`${p.totalDaysCompleted.toLocaleString()} habit-days completed — roughly ${(p.totalDaysCompleted / 7).toFixed(1)} solid weeks of pure execution.`);
  if (p.streak.longest >= 2) facts.push(`Your best streak (${p.streak.longest} weeks) is ${p.streak.longest * 7} straight days of showing up.`);
  if (p.topHabit) facts.push(`"${p.topHabit.name}" is your signature move — ${p.topHabit.rate}% completion all half.`);
  const idx = (p.name || '').length % facts.length;
  return facts[idx];
};

export const personalize = (report, subjectName) => {
  const people = report.people;
  if (!people.length) return null;
  const subject = people.find(p => p.name.toLowerCase() === String(subjectName || '').toLowerCase()) || people[0];
  const N = people.length;
  const rankOf = (cmp) => [...people].sort(cmp).findIndex(p => p === subject) + 1;
  return {
    subject,
    N,
    ranks: {
      overall: rankOf((a, b) => b.overall.rate - a.overall.rate),
      streak: rankOf((a, b) => b.streak.current - a.streak.current),
      trend: rankOf((a, b) => b.trend.delta - a.trend.delta),
      days: rankOf((a, b) => b.totalDaysCompleted - a.totalDaysCompleted)
    },
    archetype: pickArchetype(subject),
    badges: computeBadges(subject),
    superlatives: computeSuperlatives(subject, people),
    roast: computeRoast(subject),
    toast: computeToast(subject),
    forecast: computeForecast(subject, report.weeksElapsed),
    challenge: computeChallenge(subject),
    quote: computeQuote(subject),
    funFact: computeFunFact(subject)
  };
};

// ===========================================================================
// PDF RENDERING
// ===========================================================================
const NAVY = [30, 58, 95];
const GOLD = [245, 184, 0];
const INK = [33, 37, 41];
const MUTE = [108, 117, 125];
const LIGHT = [233, 236, 239];
const WHITE = [255, 255, 255];

const TIER_COLOR = {
  A: [22, 163, 74],
  B: [13, 148, 136],
  C: [217, 119, 6],
  D: [234, 88, 12],
  F: [220, 38, 38]
};
const gradeColor = (grade) => TIER_COLOR[grade.tier] || MUTE;

const fmtDate = (iso) => {
  try {
    return new Date(iso + (iso.length === 10 ? 'T00:00:00' : '')).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch { return iso; }
};

/**
 * Render a PERSONALIZED, shareable mid-year report for one member and download
 * it. opts.subject selects the member (defaults to the top performer).
 * opts.output === 'arraybuffer' returns bytes instead of saving (test harness).
 */
export const generateReportPDF = (report, opts = {}) => {
  const personal = personalize(report, opts.subject);
  if (!personal) throw new Error('No data to build a personalized report.');
  const { subject: p } = personal;

  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 40;
  const logo = opts.logo || null;
  const safeName = (p.name || 'Member').replace(/[^a-z0-9]+/gi, '-');
  const fileName = opts.fileName || `${safeName}-Mid-Year-Report-${report.year}.pdf`;

  let pageNum = 0;
  const setFill = (c) => doc.setFillColor(c[0], c[1], c[2]);
  const setText = (c) => doc.setTextColor(c[0], c[1], c[2]);
  const setDraw = (c) => doc.setDrawColor(c[0], c[1], c[2]);

  const footer = () => {
    setText(MUTE); doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
    doc.text('THE ACCOUNTABILITY GROUP', M, H - 22);
    doc.text(`${p.displayName || p.name} • 2026 Mid-Year Report`, W / 2, H - 22, { align: 'center' });
    doc.text(`Page ${pageNum}`, W - M, H - 22, { align: 'right' });
    setDraw(LIGHT); doc.setLineWidth(0.5); doc.line(M, H - 32, W - M, H - 32);
  };
  const newPage = (first = false) => { if (!first) doc.addPage(); pageNum++; footer(); };

  const contentHeader = (title) => {
    setFill(NAVY); doc.rect(0, 0, W, 54, 'F');
    if (logo) { try { doc.addImage(logo, 'PNG', M, 13, 28, 28); } catch (e) {} }
    setText(WHITE); doc.setFont('helvetica', 'bold'); doc.setFontSize(13);
    doc.text(title, logo ? M + 38 : M, 33);
    setText(GOLD); doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
    doc.text(`THE ACCOUNTABILITY GROUP • ${report.year}`, W - M, 33, { align: 'right' });
    return 54 + 26;
  };

  const gradeBadge = (x, y, size, grade, fontSize) => {
    setFill(gradeColor(grade));
    doc.roundedRect(x, y, size, size, size * 0.18, size * 0.18, 'F');
    setText(WHITE); doc.setFont('helvetica', 'bold'); doc.setFontSize(fontSize || size * 0.5);
    doc.text(grade.letter, x + size / 2, y + size / 2 + 1, { align: 'center', baseline: 'middle' });
  };

  const bar = (x, y, w, h, pct, color) => {
    setFill(LIGHT); doc.roundedRect(x, y, w, h, h / 2, h / 2, 'F');
    const fillW = Math.max(h, (Math.min(100, Math.max(0, pct)) / 100) * w);
    setFill(color); doc.roundedRect(x, y, fillW, h, h / 2, h / 2, 'F');
  };

  const sectionLabel = (text, x, y) => {
    setText(NAVY); doc.setFont('helvetica', 'bold'); doc.setFontSize(12);
    doc.text(text, x, y);
    setDraw(GOLD); doc.setLineWidth(2); doc.line(x, y + 5, x + 28, y + 5);
    return y + 22;
  };

  const bullets = (items, x, y, w, dot, size = 9, lh = 12, gap = 5) => {
    items.forEach(item => {
      setFill(dot); doc.circle(x + 2, y - 3, 1.6, 'F');
      setText(INK); doc.setFont('helvetica', 'normal'); doc.setFontSize(size);
      const lines = doc.splitTextToSize(item, w - 12);
      lines.forEach((ln, i) => doc.text(ln, x + 10, y + i * lh));
      y += lines.length * lh + gap;
    });
    return y;
  };

  // Pill/chip with a title (and optional subtitle) — used for badges & superlatives.
  const chip = (x, y, w, title, sub, accent) => {
    const h = sub ? 38 : 24;
    setFill([248, 249, 250]); doc.roundedRect(x, y, w, h, 6, 6, 'F');
    setFill(accent || GOLD); doc.roundedRect(x, y, 4, h, 2, 2, 'F');
    setText(NAVY); doc.setFont('helvetica', 'bold'); doc.setFontSize(9.5);
    doc.text(title, x + 12, y + (sub ? 16 : 15));
    if (sub) {
      setText(MUTE); doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5);
      const sl = doc.splitTextToSize(sub, w - 18);
      doc.text(sl.slice(0, 2), x + 12, y + 28);
    }
    return h;
  };

  // ----- PAGE 1: PERSONALIZED COVER -----
  newPage(true);
  setFill(NAVY); doc.rect(0, 0, W, 300, 'F');
  setFill(GOLD); doc.rect(0, 300, W, 6, 'F');
  if (logo) { try { doc.addImage(logo, 'PNG', W / 2 - 26, 34, 52, 52); } catch (e) {} }
  setText(GOLD); doc.setFont('helvetica', 'bold'); doc.setFontSize(11);
  doc.text('2026 MID-YEAR REPORT', W / 2, 108, { align: 'center' });
  setText(WHITE); doc.setFont('helvetica', 'bold'); doc.setFontSize(40);
  doc.text(p.displayName || p.name, W / 2, 150, { align: 'center' });
  // Archetype
  setText(GOLD); doc.setFont('helvetica', 'bold'); doc.setFontSize(17);
  doc.text(personal.archetype.name, W / 2, 182, { align: 'center' });
  setText([205, 214, 228]); doc.setFont('helvetica', 'italic'); doc.setFontSize(11);
  doc.text(personal.archetype.tag, W / 2, 202, { align: 'center' });
  // Word of year chip
  if (p.wordOfYear) {
    const label = `WORD OF THE YEAR  •  ${String(p.wordOfYear).toUpperCase()}`;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
    const tw = doc.getTextWidth(label) + 24;
    setFill([255, 255, 255]); doc.setGState && doc.setGState(new doc.GState({ opacity: 0.12 }));
    doc.roundedRect(W / 2 - tw / 2, 222, tw, 22, 11, 11, 'F');
    doc.setGState && doc.setGState(new doc.GState({ opacity: 1 }));
    setText(WHITE); doc.text(label, W / 2, 236, { align: 'center' });
  }
  // Date range
  setText([170, 182, 200]); doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
  doc.text(`${fmtDate(report.dateRange.from)} – ${fmtDate(report.dateRange.to)}  •  ${p.weeksTracked} weeks tracked`, W / 2, 274, { align: 'center' });

  // Big grade ring
  const cx = W / 2, cy = 410;
  const gc = gradeColor(p.overall.grade);
  setFill(gc); doc.circle(cx, cy, 66, 'F');
  setFill(WHITE); doc.circle(cx, cy, 56, 'F');
  setText(gc); doc.setFont('helvetica', 'bold'); doc.setFontSize(50);
  doc.text(p.overall.grade.letter, cx, cy + 3, { align: 'center', baseline: 'middle' });
  setText(NAVY); doc.setFontSize(10);
  doc.text('YOUR OVERALL GRADE', cx, cy + 86, { align: 'center' });

  // Hero stat trio
  const trioY = cy + 128;
  const stat = (label, value, x) => {
    setText(NAVY); doc.setFont('helvetica', 'bold'); doc.setFontSize(22);
    doc.text(value, x, trioY, { align: 'center' });
    setText(MUTE); doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
    doc.text(label, x, trioY + 16, { align: 'center' });
  };
  stat('COMPLETION', `${p.overall.rate}%`, W / 2 - 150);
  stat('CURRENT STREAK', `${p.streak.current}w`, W / 2);
  stat('HABIT-DAYS', `${p.totalDaysCompleted.toLocaleString()}`, W / 2 + 150);

  // Rank ribbon
  setFill([248, 249, 250]); doc.roundedRect(M, trioY + 40, W - 2 * M, 40, 8, 8, 'F');
  setText(NAVY); doc.setFont('helvetica', 'bold'); doc.setFontSize(12);
  const ord = (n) => { const s = ['th', 'st', 'nd', 'rd']; const v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); };
  doc.text(`Currently ranked ${ord(personal.ranks.overall)} of ${personal.N} in the group`, W / 2, trioY + 65, { align: 'center' });

  // ----- PAGE 2: REPORT CARD + TROPHY CASE -----
  newPage();
  let y = contentHeader(`${p.displayName || p.name} — Report Card`);
  y = sectionLabel('Sector Grades', M, y);
  const sectors = p.sectors;
  if (sectors.length) {
    const colW = (W - 2 * M - 16) / 2, rowH = 34;
    sectors.forEach((s, i) => {
      const col = i % 2, rowIdx = Math.floor(i / 2);
      const x = M + col * (colW + 16), ry = y + rowIdx * (rowH + 8);
      setFill([248, 249, 250]); doc.roundedRect(x, ry, colW, rowH, 6, 6, 'F');
      gradeBadge(x + 6, ry + 6, rowH - 12, s.grade, 12);
      setText(INK); doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
      doc.text(s.label, x + rowH + 4, ry + 14);
      setText(MUTE); doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
      doc.text(`${s.rate}% • ${s.habits} habit${s.habits > 1 ? 's' : ''}`, x + rowH + 4, ry + 26);
      bar(x + rowH + 4, ry + rowH - 7, colW - rowH - 12, 4, s.rate, gradeColor(s.grade));
    });
    y += Math.ceil(sectors.length / 2) * (rowH + 8) + 12;
  } else {
    setText(MUTE); doc.setFont('helvetica', 'italic'); doc.setFontSize(9);
    doc.text('Not enough categorized habits to grade sectors yet.', M, y); y += 20;
  }

  // Signature move + focus
  const halfW = (W - 2 * M - 16) / 2;
  let yL = sectionLabel('Signature Move', M, y);
  if (p.topHabit) {
    setText(NAVY); doc.setFont('helvetica', 'bold'); doc.setFontSize(11);
    doc.text(`"${p.topHabit.name}"`, M, yL); yL += 14;
    setText(MUTE); doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
    doc.text(`${p.topHabit.rate}% completion — your most reliable rep.`, M, yL); yL += 16;
  } else { setText(MUTE); doc.setFontSize(9); doc.text('Track 2+ weeks to surface this.', M, yL); yL += 16; }
  let yR = sectionLabel('Focus Habit', M + halfW + 16, y);
  if (p.weakHabit && (!p.topHabit || p.weakHabit.name !== p.topHabit.name)) {
    setText(NAVY); doc.setFont('helvetica', 'bold'); doc.setFontSize(11);
    doc.text(`"${p.weakHabit.name}"`, M + halfW + 16, yR); yR += 14;
    setText(MUTE); doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
    doc.text(`${p.weakHabit.rate}% — the one with the most upside.`, M + halfW + 16, yR); yR += 16;
  } else { setText(MUTE); doc.setFontSize(9); doc.text('No clear laggard — nice.', M + halfW + 16, yR); yR += 16; }
  y = Math.max(yL, yR) + 6;

  // Trophy case
  y = sectionLabel('Trophy Case', M, y);
  if (personal.badges.length) {
    const colW = (W - 2 * M - 16) / 2;
    let rowY = y;
    personal.badges.forEach((bdg, i) => {
      const col = i % 2;
      const x = M + col * (colW + 16);
      const h = chip(x, rowY, colW, bdg.name, bdg.desc, GOLD);
      if (col === 1 || i === personal.badges.length - 1) rowY += h + 8;
    });
    y = rowY + 4;
  } else {
    setText(MUTE); doc.setFont('helvetica', 'italic'); doc.setFontSize(9);
    doc.text('No badges yet — your first one is a few solid weeks away.', M, y); y += 18;
  }

  // ----- PAGE 3: ROAST & TOAST + SUPERLATIVES -----
  newPage();
  y = contentHeader('The Toast & The Roast');
  let ty = sectionLabel('The Toast', M, y);
  setText(MUTE); doc.setFont('helvetica', 'italic'); doc.setFontSize(8);
  doc.text('(genuine props — read these out loud)', M, ty);
  ty = bullets(personal.toast, M, ty + 12, W - 2 * M, TIER_COLOR.A, 10, 14, 7);
  ty += 8;
  let ry2 = sectionLabel('The Roast', M, ty);
  setText(MUTE); doc.setFont('helvetica', 'italic'); doc.setFontSize(8);
  doc.text('(said with love)', M, ry2);
  ry2 = bullets(personal.roast, M, ry2 + 12, W - 2 * M, TIER_COLOR.D, 10, 14, 7);
  y = ry2 + 10;

  y = sectionLabel('Superlatives You Own', M, y);
  if (personal.superlatives.length) {
    const colW = (W - 2 * M - 16) / 2;
    let rowY = y;
    personal.superlatives.forEach((s, i) => {
      const col = i % 2;
      const x = M + col * (colW + 16);
      const h = chip(x, rowY, colW, s.title, s.detail, NAVY);
      if (col === 1 || i === personal.superlatives.length - 1) rowY += h + 8;
    });
    y = rowY + 6;
  } else {
    setText(MUTE); doc.setFont('helvetica', 'italic'); doc.setFontSize(9);
    doc.text('No group-leading titles this half — plenty up for grabs in the second.', M, y); y += 18;
  }

  // Fun fact callout
  setFill(NAVY); doc.roundedRect(M, y, W - 2 * M, 48, 8, 8, 'F');
  setFill(GOLD); doc.roundedRect(M, y, 5, 48, 2, 2, 'F');
  setText(GOLD); doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
  doc.text('BY THE NUMBERS', M + 16, y + 18);
  setText(WHITE); doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
  doc.text(doc.splitTextToSize(personal.funFact, W - 2 * M - 32), M + 16, y + 34);

  // ----- PAGE 4: POWER RANKINGS + GAME PLAN -----
  newPage();
  y = contentHeader('Power Rankings vs. The Group');
  y = sectionLabel('Where Everyone Stands', M, y);
  // Table header
  const cols = [
    { t: '#', w: 28, align: 'left' },
    { t: 'Member', w: 150, align: 'left' },
    { t: 'Grade', w: 60, align: 'center' },
    { t: 'Completion', w: 120, align: 'center' },
    { t: 'Streak', w: 70, align: 'center' },
    { t: 'Trend', w: 70, align: 'center' }
  ];
  let tx = M;
  setText(MUTE); doc.setFont('helvetica', 'bold'); doc.setFontSize(8);
  cols.forEach(c => { doc.text(c.t.toUpperCase(), c.align === 'center' ? tx + c.w / 2 : tx, y, { align: c.align }); tx += c.w; });
  y += 6;
  const rowH = 26;
  report.people.forEach((m, i) => {
    const isMe = m === p;
    const ry = y + i * rowH;
    if (isMe) { setFill([235, 240, 247]); doc.roundedRect(M - 6, ry, W - 2 * M + 12, rowH - 4, 5, 5, 'F'); setFill(GOLD); doc.roundedRect(M - 6, ry, 4, rowH - 4, 2, 2, 'F'); }
    else { setDraw(LIGHT); doc.setLineWidth(0.5); doc.line(M, ry + rowH - 4, W - M, ry + rowH - 4); }
    let cxp = M;
    const cellY = ry + 15;
    setText(isMe ? NAVY : INK); doc.setFont('helvetica', isMe ? 'bold' : 'normal'); doc.setFontSize(9);
    doc.text(`${i + 1}`, cxp, cellY); cxp += cols[0].w;
    doc.text(isMe ? `${m.displayName || m.name}  (you)` : (m.displayName || m.name), cxp, cellY); cxp += cols[1].w;
    // grade chip
    const gc2 = gradeColor(m.overall.grade);
    setFill(gc2); doc.roundedRect(cxp + cols[2].w / 2 - 14, ry + 4, 28, 15, 3, 3, 'F');
    setText(WHITE); doc.setFont('helvetica', 'bold'); doc.setFontSize(8);
    doc.text(m.overall.grade.letter, cxp + cols[2].w / 2, ry + 14.5, { align: 'center', baseline: 'middle' }); cxp += cols[2].w;
    setText(isMe ? NAVY : INK); doc.setFont('helvetica', isMe ? 'bold' : 'normal'); doc.setFontSize(9);
    doc.text(`${m.overall.rate}%`, cxp + cols[3].w / 2, cellY, { align: 'center' }); cxp += cols[3].w;
    doc.text(`${m.streak.current}w`, cxp + cols[4].w / 2, cellY, { align: 'center' }); cxp += cols[4].w;
    const td = m.trend.delta;
    setText(td > 0 ? TIER_COLOR.A : td < 0 ? TIER_COLOR.F : MUTE);
    doc.text(td > 0 ? `+${td}` : td < 0 ? `${td}` : '—', cxp + cols[5].w / 2, cellY, { align: 'center' });
  });
  y += report.people.length * rowH + 8;

  // Your ranks callout
  setText(NAVY); doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
  const rk = personal.ranks;
  doc.text(`You rank #${rk.overall} overall • #${rk.streak} in streaks • #${rk.trend} in momentum • #${rk.days} in total volume.`, M, y);
  y += 18;

  // Game plan
  y = sectionLabel('Your Second-Half Game Plan', M, y);
  y = bullets(personal.forecast, M, y, W - 2 * M, NAVY, 9.5, 13, 6);
  y += 4;
  // Challenge box
  setFill([255, 248, 225]); doc.roundedRect(M, y, W - 2 * M, 54, 8, 8, 'F');
  setFill(GOLD); doc.roundedRect(M, y, 5, 54, 2, 2, 'F');
  setText([146, 110, 0]); doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
  doc.text('THE CHALLENGE', M + 16, y + 17);
  setText(INK); doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5);
  doc.text(doc.splitTextToSize(personal.challenge, W - 2 * M - 32), M + 16, y + 32);
  y += 66;
  // Quote
  setText(NAVY); doc.setFont('helvetica', 'italic'); doc.setFontSize(11);
  doc.text(doc.splitTextToSize(personal.quote, W - 2 * M - 40), W / 2, y + 6, { align: 'center' });

  if (opts.output === 'arraybuffer') return doc.output('arraybuffer');
  doc.save(fileName);
  return fileName;
};

