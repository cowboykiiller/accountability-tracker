# Math Audit — Habit Tracking & Scorecard

Date: 2026-07-02. Scope: every calculation that affects habit-completion numbers — rates, streaks, scores, grades — across Dashboard, Track, Compete, Scorecard, Insights, Wrapped, the monthly/analytics views, and the new (uncommitted) Mid-Year Report PDF. Method: four parallel audits (App.jsx inline math; core date/vacation layer; report.js vs canonical; empirical run of the real formulas against `firestore-snapshot.json`) plus a verified code review of the uncommitted diff.

**Verdict: the suspicion is confirmed.** The app currently runs **at least four different "completion rate" formulas and three different streak formulas simultaneously.** The canonical math (`src/lib/scoring.js`) is correct and passes all 21 vacation tests and the regression baseline — but most views don't use it.

## The smoking gun (real data, actual code)

Computed with the app's own formulas against the Firestore snapshot, `currentWeekStart = 2026-06-29`:

| Participant | Compete leaderboard | Scorecard "Last 4 Weeks" | Dashboard hero (month) | Mid-Year PDF |
|---|---|---|---|---|
| Taylor | 87% | 0% | 63% | 90% |
| Brandon | 83% | 0% | **14%** | 85% |
| John | 69% | 0% | 56% | 78% |

Same person, same day, four different numbers.

---

## HIGH severity

### 1. `currentWeekStart` becomes a Tuesday after 8pm Eastern — streaks zero out app-wide
`src/App.jsx:1921-1928`. The memo shifts today's Date to Monday but **keeps the wall-clock time**, then calls `.toISOString()` (UTC). Any app load at/after 8:00pm EDT (7pm EST) yields Monday+1 — a Tuesday string. Verified by simulation. Consequences, all at once:

- `computeStreak` walks Tuesday-keyed weeks that match no Monday-keyed bucket → **every participant's streak displays 0** (Compete, dashboard `myStreak`, profile modal, credit-score factor). Leaderboard scores drop 10 pts per lost streak week.
- The `h.weekStart !== currentWeekStart` exclusion fails everywhere → the half-finished live week is graded as a past week, dragging every rate down mid-week (leaderboard :2080, wrapped :2100/:2251, scorecard ranges :3385-3397, per-habit streaks :1998/:2021).
- The Mid-Year Report's `endISO` inherits it → the in-progress week gets graded in the PDF despite the code comment promising otherwise.
- Insights uses `getCurrentMonday()` (correct in US timezones), so after 8pm Compete and Insights disagree about the same person.
- Correct at 7:59pm, wrong at 8:01pm, self-heals after local midnight. **This is the most likely cause of phantom 0-streak reports** (including the paused Brandon mystery).
- Related landmine: onboarding (`src/App.jsx:1862-1867`) uses the same pattern and **persists** `weekStart` to Firestore — a user onboarding after 8pm ET gets permanently Tuesday-keyed habits. All 948 existing docs are clean Mondays; it just hasn't fired yet. Same pattern at :5170-5175 (habit-linking lookup).
- The memo's `[]` deps also freeze the week across a Sunday-midnight rollover until reload.

**Fix:** replace the memo body with a UTC-safe Monday (reuse `getISOWeekStart` from scoring.js), refresh at midnight, and fix the onboarding write path.

### 2. Percentage-type habits are counted as day-habits in most non-canonical views
`computeRate` correctly excludes `habitType === 'percentage'` (their targets — 50/75/100 — are percentages, not days). But these views don't:

- **Dashboard hero/period/team/trend/category** (`src/App.jsx:6758-6805`)
- **Tracker week ring** (:7121-7123)
- **Wrapped rate + grade + group stats** (:2105-2110, :2146-2154, :2250-2260)
- **Monthly report** (:3275-3323), **dayAnalytics** (:3197-3230), **per-habit streaks** (:1956-2073)

All 55 percentage docs are Brandon's. Empirically his dashboard shows **14% vs the real 69%** (a target-100 habit adds 100 phantom "days" to his denominator), his Wrapped grade computes as an F while his canonical rate is 83%, and every percentage habit shows a permanent 0-streak "cold" badge. Taylor and John have no percentage habits — which is why only Brandon's numbers look insane, and only in some views.

**Fix:** apply the canonical exclusions (`habitType === 'percentage'`, `target === 0`) in every listed site — ideally by routing them through `computeRate`.

### 3. Scorecard "Team Leaderboard" (non-owner view): ranks scrambled and sorted by the wrong quantity
`src/App.jsx:8913-8936`. Rank badges (`idx + 1`) are assigned **before** sorting, so after the sort the list can read 2, 1, 3 top-to-bottom. And the comparator sorts by raw count of Done/Exceeded habit-docs, not the displayed percentage — someone tracking 40 habits at 55% outranks someone at 92% on 12 habits. Only Brandon and John see this view.

### 4. Over-completion is uncapped — rates inflate and failing weeks pass the streak threshold
`scoring.js:158-163` + toggle UI. Nothing caps `daysCompleted.length` at `target`; the UI happily lets a target-1 habit collect 7 checks. Real data: **175 of 948 docs exceed target (274 surplus days); 28 participant-weeks grade over 100%** (John hit 146% one week). Clamped-to-target rates: Taylor 87→78, Brandon 83→76, **John 69→56**. Surplus on one habit also subsidizes misses on others past the 0.7 streak threshold. This may be intended "Exceeded" culture — but it's a policy decision that currently rewards checkbox-spam and is undocumented.

### 5. The Mid-Year Report PDF (uncommitted) grades on different equations than the app
`src/lib/report.js`:
- **Vacations completely ignored** (:283 — parameter accepted, never used). A logged vacation week counts as a 0% week in the PDF; the in-app scorecard excludes it. Grades, streaks, trends and the roast lines all inherit it.
- **The first ISO week of 2026 is dropped** (:291 — window starts `'2026-01-01'`, but that week's docs are keyed `2025-12-29`). Everyone's first week of the year vanishes from the report.
- **Streaks diverge two ways** (:111-122): gap weeks with no data don't break the streak (canonical breaks), and the threshold is rounded `>= 70` vs raw `0.7` (a 69.6% week passes in the PDF, breaks in-app). Someone who quit tracking in February still shows an "active streak" in July.
- **Forecast inflation** (:481): weeks-remaining = 52 − weeks-*with-data* instead of calendar weeks elapsed — a member who skipped 11 weeks gets 11 phantom future weeks in their projection.
- **"Brandon Brown" ghost row**: the stray secondary-account docs (3 docs, week 2026-04-06 — inside the window) create a phantom member in Power Rankings with a tiny denominator; it also inflates member count and skews group GPA. ('aaron' lowercase matching is fine; it just prints uncased on the cover.)
- Sector "habits" counts are habit-week rows, not distinct habits ("Fitness — 40 habits").

### 6. Dashboard default shows 0% for everyone because of three future-dated docs
Three auto-created next-week non-negotiable docs (Brandon, `weekStart 2026-05-18`, created 5 days early, all empty) make that week the "latest data week," so the dashboard's default week window contains only 3 empty docs → **0% for every member**. The auto-add-next-week flow plants these every week. Also: any 4-week tracking gap zeroes the entire Scorecard "Last 4 Weeks" tab (calendar-window slicing at :3385) while Compete still shows numbers.

---

## MEDIUM severity

- **M1. Four rate formulas coexist.** (a) canonical day-level `computeRate`; (b) status-share (Done+Exceeded / total habits) in dashboard `myRank`, insights credit-score inputs, "This Week" tile; (c) `target || 0` day-level (dashboard hero, monthly view :7599, breakdown modal :14185 — falsy target adds numerator with no denominator → >100% possible); (d) `target || 5` including percentage habits (wrapped, monthly report, AI suggestions). Every pair disagrees for someone.
- **M2. Three streak formulas.** Canonical `computeStreak` (calendar-anchored, 0.7, vacation-aware); `habitStreaks` per-habit (:1956-2073 — document-order adjacency so gaps are invisible, 100% threshold, no vacation handling, percentage habits included); report.js (`streaksFromWeekly`, gap-tolerant, rounded-70). Wrapped has a fourth variant of "current streak" with no consecutive-week check.
- **M3. `getStatus` mishandles target 0 / missing target** (:424-443): `target 0` → permanent 'Done' freebie (canonical excludes); missing target → permanent 'Missed'. Corrupts every status-based count (scorecard Done tile, category chips, credit score, breakdown modal).
- **M4. Insights labels lie**: streak factor says "weeks at 80%+" but computes at 70%; "X% of habits completed" is status-based and reads near 0 for someone at a solid day-level rate.
- **M5. Monthly report buckets weeks into months by Monday date** (a Jul 29–Aug 4 week is wholly "July"), includes the in-progress week, no vacation exclusion.
- **M6. dayAnalytics best/worst day** (:3197-3230): denominator counts all 7 days for every habit regardless of target, includes future days of the current week — systematically deflated and biased.
- **M7. Duplicate doc**: Brandon's "execute trades" percentage habit exists twice for 2026-04-06 (`habit_1775479711173`, `habit_1775654973644`) — double-counted in any status/percentage view.
- **M8. UTC-"today" in vacation badges** (VacationsSection.jsx:7, App.jsx:10958): after 8pm ET the "on vacation" state flips 4–5 hours early. Cosmetic.

## LOW severity

- Partial-vacation semantics are a UX trap (working as designed): a Mon–Sat 6-day vacation gives zero scoring relief; nothing in the form warns about it.
- `getCurrentMonday` and friends are local-midnight-based — returns Sunday's date for any UTC+ timezone user (fine in Ohio, wrong if anyone travels to Europe). Three week-boundary implementations exist in total.
- Power-ranking ties in the PDF have no tie-breaker; "Most Consistent" can print "0-week active streak"; "perfect week" is rounded (249/250 counts).
- 52 legacy habit docs have numeric (not string) IDs — would break string-keyed logic.
- `habitCorrelations` counts 7 days/week regardless of target; feeds one insight card.
- Dead-but-wrong code computes status-based team stats that are never rendered (`overallStats`, `teamComparison`, `participantData`, etc.) — delete to prevent future wiring of wrong math.

## Verified clean

- `scoring.js` internal math: UTC week arithmetic self-consistent; vacation edge cases (inverted ranges, missing endDate, cross-week stitching, no-resurrection rule, participant scoping) all correct; 520-week cap sane.
- All existing verification scripts pass: `verify-scoring-regression.cjs` (0 divergences vs baseline), `verify-vacation-logic.cjs` (21/21), `verify-fix-a.cjs`, `trace-one.cjs`.
- `daysCompleted` hygiene: 0 duplicate tokens, 0 invalid tokens across 948 docs; the toggle paths can't double-add.
- All 948 `weekStart` values are valid Mondays; every doc has a numeric target ≥ 1 (targets > 7 are all percentage-type, correctly excluded by canonical code).
- `computeStreak` threshold is consistent at every call site (single site, explicit 0.7).
- Compete leaderboard & scorecard headline rates use the shared helpers correctly (their only defect is the H1 week-string input).
- Report module: `isCountable` exclusions applied at every aggregation; no division-by-zero paths; name matching for 'aaron' works.

## Recommended fix order

1. **H1** — one canonical UTC Monday helper used everywhere (`currentWeekStart` memo, onboarding write, habit-linking); add a midnight refresh. Fixes streak-zeroing, in-progress-week leaks, and the PDF `endISO` in one shot.
2. **H2** — add the percentage/target-0 exclusions to dashboard, tracker ring, wrapped, monthly, habitStreaks (or route them through `computeRate`). Fixes Brandon everywhere.
3. **H3** — scorecard team-leaderboard sort/rank (sort first, then badge; sort by the displayed rate).
4. **Report.js** — thread vacations through; `startISO = '2025-12-29'`; align streak walk with `computeStreak`; fix forecast; exclude 'Brandon Brown'.
5. **Data cleanup** (one-time script): delete the 3 'Brandon Brown' strays, the duplicate "execute trades" doc, decide on the 3 future NN docs (and stop the auto-add flow from creating them early).
6. **Policy decision** — over-completion: keep "Exceeded" but clamp per-habit contribution to `target` inside rate/streak math (recommended), or leave as-is and document it. This changes headline numbers (John 69→56), so the group should agree before it ships.
7. **Consolidation pass** — one rate formula, one streak formula, one week-boundary function; delete the dead status-based stats.

---

*Separate from the math: the code review of the uncommitted pause/delete-account feature found it non-functional (ReferenceError on undefined `moods`/`scheduledEvents`), missing five collections from deletion, deleting data before re-auth can fail, swallowing partial failures, missing challenged-party bets, leaking every member's private letter-to-self via the unfiltered `visions` listener, and a resume gate with no error UI. Tracked separately from this report.*
