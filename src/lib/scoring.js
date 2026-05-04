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
 * Day-level completion rate as an integer percentage 0-100.
 *
 *   rate = round( Σ daysCompleted.length / Σ target * 100 )
 *
 * Habits with target === 0 are excluded entirely (they would otherwise
 * silently coerce to 5 via `target||5`). Percentage-type habits are also
 * excluded — see module note.
 *
 * @param {Array<{habitType?: string, target?: number, daysCompleted?: any[]}>} habits
 * @returns {number} 0-100
 */
export const computeRate = (habits) => {
  let totalCompleted = 0;
  let totalPossible = 0;
  for (const h of habits) {
    if (h.habitType === 'percentage') continue;
    if (h.target === 0) continue;
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
 *        - bucket exists AND ratio >= threshold → streak++, step back one ISO week
 *        - otherwise → break
 *
 * Percentage-type habits and target===0 habits are excluded from each
 * weekly bucket.
 *
 * @param {Array} habits
 * @param {string} currentWeekStart - 'YYYY-MM-DD' Monday of the current week
 * @param {number} [threshold=0.7]
 * @returns {number}
 */
export const computeStreak = (habits, currentWeekStart, threshold = 0.7) => {
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
  while (true) {
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
