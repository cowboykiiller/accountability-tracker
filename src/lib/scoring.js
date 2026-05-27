/**
 * Pure scoring/streak helpers shared between Compete and Scorecard.
 * No React or Firebase imports — keep it that way.
 *
 * Percentage-type habits (h.habitType === 'percentage') are excluded from
 * computeRate and computeStreak. The day-level rate has no natural unit
 * for percentage habits; integrating them is deferred.
 *
 * Timezone: getISOWeekStart and previousISOWeek use UTC math so they are
 * independent of viewer timezone. App.jsx still derives currentWeekStart
 * from local time elsewhere — that bug is out of scope for this module
 * but the helpers below won't reintroduce it.
 *
 * Vacation mode: computeRate and computeStreak accept optional `vacations`
 * and `participant` arguments. A "full-vacation week" (all 7 days of an
 * ISO week fall within a vacation range for the participant) is excluded
 * from rate denominator and is invisible to the streak walk (neither
 * breaks nor increments). Partial-vacation weeks score normally.
 */

/**
 * Returns the Monday of the given date's ISO week as a 'YYYY-MM-DD' string.
 *
 * @param {Date|string|number} date
 * @returns {string} 'YYYY-MM-DD'
 */
export const getISOWeekStart = (date) => {
  const d = new Date(date);
  const day = d.getUTCDay(); // 0=Sun..6=Sat
  const diff = day === 0 ? -6 : 1 - day; // shift to Monday
  const monday = new Date(Date.UTC(
    d.getUTCFullYear(),
    d.getUTCMonth(),
    d.getUTCDate() + diff
  ));
  return monday.toISOString().split('T')[0];
};

/**
 * Returns the YYYY-MM-DD string for exactly 7 days earlier.
 *
 * @param {string} weekStartString - 'YYYY-MM-DD'
 * @returns {string} 'YYYY-MM-DD'
 */
export const previousISOWeek = (weekStartString) => {
  const d = new Date(`${weekStartString}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 7);
  return d.toISOString().split('T')[0];
};

/**
 * True if `dateISO` falls within any of the given participant's vacation
 * ranges (inclusive on both ends). All comparisons are string-level on
 * 'YYYY-MM-DD', which is lexicographically equivalent to date order and
 * avoids any timezone math.
 *
 * @param {string} dateISO - 'YYYY-MM-DD'
 * @param {Array<{participant: string, startDate: string, endDate: string}>} vacations
 * @param {string} participant
 * @returns {boolean}
 */
export const isVacationDay = (dateISO, vacations, participant) => {
  if (!dateISO || !participant || !Array.isArray(vacations) || vacations.length === 0) return false;
  for (const v of vacations) {
    if (!v || v.participant !== participant) continue;
    if (!v.startDate || !v.endDate) continue;
    if (v.startDate <= dateISO && dateISO <= v.endDate) return true;
  }
  return false;
};

/**
 * Returns the 7 ISO date strings ('YYYY-MM-DD') for the ISO week starting
 * at `weekStartISO`. Uses UTC math to mirror previousISOWeek/getISOWeekStart.
 *
 * @param {string} weekStartISO
 * @returns {string[]} length 7
 */
const weekDays = (weekStartISO) => {
  const base = new Date(`${weekStartISO}T00:00:00Z`);
  const out = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(base);
    d.setUTCDate(base.getUTCDate() + i);
    out.push(d.toISOString().split('T')[0]);
  }
  return out;
};

/**
 * True iff all 7 days of the ISO week starting at `weekStartISO` are
 * vacation days for `participant`. Vacations belonging to other
 * participants are ignored.
 *
 * @param {string} weekStartISO
 * @param {Array} vacations
 * @param {string} participant
 * @returns {boolean}
 */
export const isFullVacationWeek = (weekStartISO, vacations, participant) => {
  if (!weekStartISO || !participant || !Array.isArray(vacations) || vacations.length === 0) return false;
  const days = weekDays(weekStartISO);
  for (const d of days) {
    if (!isVacationDay(d, vacations, participant)) return false;
  }
  return true;
};

/**
 * Returns the subset of the week's 7 days that are vacation days for the
 * participant. May be empty (no vacation), partial (1-6), or full (7).
 *
 * @param {string} weekStartISO
 * @param {Array} vacations
 * @param {string} participant
 * @returns {string[]} 0-7 'YYYY-MM-DD' strings
 */
export const getVacationDaysInWeek = (weekStartISO, vacations, participant) => {
  if (!weekStartISO || !participant) return [];
  return weekDays(weekStartISO).filter(d => isVacationDay(d, vacations, participant));
};

/**
 * Day-level completion rate as an integer percentage 0-100.
 *
 *   rate = round( Σ daysCompleted.length / Σ target * 100 )
 *
 * Habits with target === 0 are excluded entirely (they would otherwise
 * silently coerce to 5 via `target||5`). Percentage-type habits are also
 * excluded — see module note.
 *
 * Vacation mode: if `vacations` and `participant` are provided, habits
 * whose weekStart is a full-vacation week for the participant are excluded
 * from both numerator and denominator. Partial-vacation weeks count normally.
 *
 * @param {Array<{habitType?: string, target?: number, daysCompleted?: any[], weekStart?: string}>} habits
 * @param {Array} [vacations]
 * @param {string} [participant]
 * @returns {number} 0-100
 */
export const computeRate = (habits, vacations, participant) => {
  const useVacations = Array.isArray(vacations) && vacations.length > 0 && !!participant;
  const fullWeekCache = useVacations ? new Map() : null;
  const isFullWeek = (weekStart) => {
    if (!useVacations || !weekStart) return false;
    if (fullWeekCache.has(weekStart)) return fullWeekCache.get(weekStart);
    const v = isFullVacationWeek(weekStart, vacations, participant);
    fullWeekCache.set(weekStart, v);
    return v;
  };

  let totalCompleted = 0;
  let totalPossible = 0;
  for (const h of habits) {
    if (h.habitType === 'percentage') continue;
    if (h.target === 0) continue;
    if (isFullWeek(h.weekStart)) continue;
    const target = h.target || 5;
    totalPossible += target;
    totalCompleted += (h.daysCompleted?.length || 0);
  }
  if (totalPossible === 0) return 0;
  return Math.round((totalCompleted / totalPossible) * 100);
};

/**
 * Streak count: consecutive ISO weeks (each exactly 7 days earlier) where
 * the participant met >= threshold of their weekly target.
 *
 *   1. Filter to past weeks (weekStart < currentWeekStart).
 *   2. Bucket by weekStart, computing weekly aggregate ratio.
 *   3. Walk backward starting at previousISOWeek(currentWeekStart):
 *        - full-vacation week → invisible, step back without changing streak
 *        - bucket missing OR ratio < threshold → break (dead streak)
 *        - else → streak++, step back one ISO week
 *
 * Recency invariant: the FIRST non-vacation week the walk encounters
 * must qualify. A non-vacation gap (missing data OR sub-threshold week)
 * kills the streak — we do NOT keep searching for an older qualifying
 * week behind it. This prevents an old single qualifying week from being
 * resurrected by a long vacation sitting in front of it.
 *
 * Percentage-type habits and target===0 habits are excluded from each
 * weekly bucket.
 *
 * @param {Array} habits
 * @param {string} currentWeekStart - 'YYYY-MM-DD' Monday of the current week
 * @param {number} [threshold=0.7]
 * @param {Array} [vacations]
 * @param {string} [participant]
 * @returns {number}
 */
export const computeStreak = (habits, currentWeekStart, threshold = 0.7, vacations, participant) => {
  const useVacations = Array.isArray(vacations) && vacations.length > 0 && !!participant;
  const buckets = {};
  for (const h of habits) {
    if (h.habitType === 'percentage') continue;
    if (h.target === 0) continue;
    if (!h.weekStart || h.weekStart >= currentWeekStart) continue;
    if (!buckets[h.weekStart]) buckets[h.weekStart] = { completed: 0, possible: 0 };
    const target = h.target || 5;
    buckets[h.weekStart].possible += target;
    buckets[h.weekStart].completed += (h.daysCompleted?.length || 0);
  }
  let streak = 0;
  let cursor = previousISOWeek(currentWeekStart);
  // Cap the backward walk. Guards against two pathological cases:
  //   1. Misconfigured open-ended vacation data that would otherwise let
  //      the walk skip vacation weeks forever.
  //   2. An unbounded walk through empty history if neither break
  //      condition trips.
  // 520 ≈ 10 years; far beyond any realistic streak.
  for (let i = 0; i < 520; i++) {
    if (useVacations && isFullVacationWeek(cursor, vacations, participant)) {
      cursor = previousISOWeek(cursor);
      continue;
    }
    const b = buckets[cursor];
    if (!b || b.possible === 0) break;
    if ((b.completed / b.possible) < threshold) break;
    streak += 1;
    cursor = previousISOWeek(cursor);
  }
  return streak;
};

/**
 * Single canonical leaderboard score: rate plus 10 points per streak week.
 *
 * @param {number} rate - integer 0-100
 * @param {number} streak - non-negative integer
 * @returns {number}
 */
export const computeScore = (rate, streak) => rate + streak * 10;
