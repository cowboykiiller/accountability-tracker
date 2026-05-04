# Firestore Data Findings

Snapshot: `firestore-snapshot.json` (345 KB). Today's date: 2026-05-04 (today's Monday).

Collection counts — all match user's preliminary numbers:

| collection | docs |
|---|---:|
| habits | 894 |
| profiles | 6 |
| quotes | 26 |
| tasks | 13 |
| bets | 7 |
| weeklyGoals | 6 |
| moods | 3 |
| reflections | 3 |
| timeCapsules | 3 |
| visions | 3 |
| nonNegotiables | 2 |
| chatMessages | 1 |
| posts | 1 |
| checkIns | 1 |

Habit field frequency: `id` / `participant` / `weekStart` / `habit` / `target` = 894 (universal); `daysCompleted` 863 (the 31 missing are all `habitType: 'percentage'`); `category` 828; `habitType` 505 (389 missing default to 'daily'); `order` 421; `isNonNegotiable` 125; `instances` 52; `description` 15; `createdBy` and `createdAt` 3 each (only the three onboarding-flow aaron habits).

The user's "29% of habits have empty category" is approximately right but partial:
- 255/894 (28.5%) have `category: ""`.
- 66/894 (7.4%) are missing the `category` field entirely.
- Combined "no usable category": **321/894 = 35.9%**.

---

## 1. Empty categories

255 habits with `category: ""`. By participant: John 188 (73.7% of empty bucket; 65.3% of John's 288), Taylor 26 (9.3% of his), Brandon 24 (7.8% of his), aaron 14 (100%), "Brandon Brown" 3 (100%).

John's empty-cat distribution by week shows a clear cliff: through 2025-12-29 he has mixed empty/non-empty per week. **Starting 2026-01-12, every John habit has `category: ""`.** Every week from 01-12 through 04-27: empty count rising (3, 6, 6, 8, 11, 12, 12, 12, 12, 13, 13, 13, 14), non-empty zero. John's last `weekStart` is 2026-04-27 — he is missing the current week 2026-05-04 entirely.

Taylor and Brandon have only sporadic empties (peak 3/week, otherwise 0–1). Both have 0 empty in their most recent four weeks (2026-04-06 onward).

aaron's three onboarding habits are the only docs in the entire collection with `createdBy` + `createdAt` populated:
- `aaron_2026-04-20_further_my_jewelry_business_`
- `aaron_2026-04-20_moring_prep_with_brandon_`
- `aaron_2026-04-20_work_out_`

All `createdAt: 2026-04-20T11:03:12.xxxZ`, `createdBy: kAPtfiWPU5Oe2EXR2bvfLZaefKf2`, `category: ""`.

Cross-reference to `src/App.jsx`:
- Onboarding habit creation `src/App.jsx:1710-1722` writes `{ habit, participant, weekStart, target, daysCompleted, createdAt, createdBy }` — **no `category` field at all**.
- Manual `addHabit` `src/App.jsx:3623-3656`: `category: newHabit.category || inheritedCategory || ''`. Form initializes `category: ''` at `src/App.jsx:843`.
- `addBulkHabits` `src/App.jsx:3666-3692`: `category: inheritedCategory` only — no UI to pick category. Inherits or empty.
- `autoAddNonNegotiables` `src/App.jsx:3556-3568`: same inheritance-only pattern.
- "Copy from last week" `src/App.jsx:3478-3490`: `category: habit.category || ''`.

**Interpretation**: John switched habit-creation flows around 2026-01-12 — likely to bulk-add (no category UI) or copy-from-last-week with no prior categorized version to inherit from. Brandon's and Taylor's sparse empties are probably manual-form entries where the user didn't pick a category. aaron's 3 are onboarding artifacts. **Needs product decision**: whether bulk-add and onboarding should require category, or whether downstream code should treat empty as "Uncategorized" — currently `HABIT_CATEGORIES.find(c => c.id === habit.category)` at `src/App.jsx:7077` returns undefined for `''` and the badge silently disappears.

The user's "29%" rounds 28.5% but undercounts by ignoring the 66 docs missing the field outright (see Section 8).

---

## 2. Dirty participant data

Profiles (6):

| displayName | UID | linkedParticipant | createdAt |
|---|---|---|---|
| Brandon | `27t2ogPaGkMZKbA8yHvUzb8wtET2` | `Brandon` | (none; updated 2025-12-22) |
| Brandon Brown | `7fr2UlMvUDbLl7RhXZ47ZpbGSRn1` | `""` | 2026-04-06T19:09:02.838Z |
| OpenClaw Operations | `IDugTzb6vnZ6NMKT08nD7QynWhw2` | `""` | 2026-02-06T12:17:43.496Z |
| Aaron Brown | `kAPtfiWPU5Oe2EXR2bvfLZaefKf2` | `aaron` | 2026-04-20T11:03:12.041Z |
| Taylor Georges | `lJFiIjcJZfdTDwLPWgepzMENvrD3` | `Taylor` | (none) |
| John Simerlink | `q4sR3iJyBMYpYkTxx0jkHoxoIef1` | `John` | (none) |

`myParticipant = userProfile?.linkedParticipant || user?.displayName || ''` (`src/App.jsx:3034`). So:
- "Brandon Brown" profile (linkedParticipant="") falls through to displayName "Brandon Brown" for any habit/post writes.
- "OpenClaw Operations" profile (linkedParticipant="") would fall through to "OpenClaw Operations" — but **zero habits** with that participant or with `createdBy IDugTzb6vnZ6NMKT08nD7QynWhw2`.

**aaron (lowercase)**: 14 habits across 3 weeks (2026-04-20, 04-27, 05-04). Three are onboarding-flow docs (createdBy = kAPtfiWPU5Oe2EXR2bvfLZaefKf2 matching Aaron's profile). The other 11 use the standard `habit_<timestamp>` ID pattern. Profile `linkedParticipant: "aaron"` is set deliberately. Lowercase choice was made at profile creation, not a normalization bug.

**"Brandon Brown" habits** (3, all `weekStart: 2026-04-06`, all `isNonNegotiable: true`, all `daysCompleted: []`): habit names are exactly `"Workout"`, `"Meditate"`, `"Execute Trades"` — matching `nonNegotiable1/2/3` on `vision_2026_27t2ogPaGkMZKbA8yHvUzb8wtET2` (Brandon's primary UID, NOT Brandon Brown's). IDs `habit_1775502531903_nn_0_ykv3w` etc match the `autoAddNonNegotiables` pattern at `src/App.jsx:3556`. Brandon Brown's UID has no doc in `visions` / `reflections` / `timeCapsules`. The `onSnapshot` at `src/App.jsx:1567` fetches `visions/vision_2026_${user.uid}` — for the secondary account it should return nothing.

**Interpretation**: "Brandon Brown" is Brandon's secondary Google account (different gmail), onboarded 2026-04-06. `linkedParticipant=""` caused fallback to displayName, so its data writes as `participant="Brandon Brown"`. The auto-add somehow produced 3 NN habits even though the visions doc shouldn't have been readable for that UID — possibly stale React state, possibly a bug where `visionData` is shared across users in a tab. Data alone can't disambiguate. **Needs product decision**: whether to merge Brandon Brown into Brandon, or set `linkedParticipant`.

aaron is a real fourth user — Aaron Brown — onboarded 2026-04-20. Lowercase is intentional.

**OpenClaw Operations** (`ops***@ohiosbesthomebuyers.com`): real onboarded profile, zero usage. **Needs product decision**: clean up vs. keep.

The participant-counter histogram (Brandon 309, John 288, Taylor 280, aaron 14, Brandon Brown 3) matches the user's prelim. Brandon Brown and aaron are duplicate-account and 4th-user respectively, not normalization bugs.

---

## 3. Dormant collections

### chatMessages (1 doc)

```
{"id":"msg_1773756424445","text":"What's up boyz","sender":"Taylor","senderId":"lJFiIjcJZfdTDwLPWgepzMENvrD3","channel":"group","createdAt":"2026-03-17T14:07:04.445Z"}
```

**`grep -ni "chat" src/App.jsx` returns nothing.** No write path, no read path, no UI surface. Fully orphaned in source.

### posts (1 doc)

`post_1766355707189` from Taylor 2025-12-21 — the welcome message. `reactions: {}`, `comments: []`. Read at `src/App.jsx:1314`, writes at 2362/2394/2415, delete at 2422. Feed UI exists but nobody has posted since the welcome message four months ago. Genuinely unused.

### checkIns (1 doc)

`checkin_1766353651736`, Taylor "Taylor Georges" (note: profile displayName, not linkedParticipant), `weekStart: 2025-12-15`, wins/challenges/reflection populated. Read 1293, write 2161, delete 2170. Used once by Taylor, abandoned.

### moods (3 docs)

All Taylor, three consecutive late-Dec dates: 2025-12-25, 12-29, 12-31. Read 1549, write 5454, modal at 12470+. Taylor tried it for ~1 week; Brandon/John never used it.

### nonNegotiables (2 docs)

Both John, both 2026-01-05: "Get lunch with a coworker" and "call/hang with 1 friend/fam". Both `streak: 0`, no `lastUpdated`. Read 1426, write 5421, delete 5428, streak update 5437. John added two NNs and never marked any completion. Brandon and Taylor track NNs only via `visions.nonNegotiable1/2/3` and the `isNonNegotiable: true` flag on weekly habits, not via this collection.

### reflections (3 docs, year 2025)

One per active member, 2026-01-12 to 2026-01-22. Always-empty across all 3: `proudestMoment`, `relationshipHighlight`, `skillDeveloped`, `letterFromPastSelf`. Other fields populated. Keyed `reflection_2025_${user.uid}` (1585, 1644). One-time year-end exercise; 3 = expected steady state.

### timeCapsules (3 docs, year 2026)

One per active member, 2026-01-12 to 2026-01-22. `midYearUnlockDate: 2026-07-01`, `endYearUnlockDate: 2026-12-26`. Always-empty `gratitudeList`. Keyed `capsule_2026_${user.uid}` (1602, 1664). Annual artifact, mid-year not yet unlocked.

### visions (3 docs, year 2026)

One per active member, updated 2026-01-12 to 2026-01-26. Always-empty across all 3: `whyMatters`, `mainObstacle`, `overcomeStrategy`, `dailyHabit`, `monthlyMilestone`. `letterToSelf` populated. Strong evidence those five fields are vestigial schema or never rendered in the UI.

### bets (7 docs)

Status: declined 3, pending 3, completed 1. Two activity bursts:
- **2025-12-22 12:47–13:30** — 4 bets in ~3 minutes. Three declined, one (`bet_1766410225120` "Best Photo Challenge") accepted within 4 seconds, completed 13 days later.
- **2026-04-06 12:24–12:26** — 3 bets by Taylor, all still `pending` 4 weeks later, no `acceptedBy` / `declinedBy` entries.

Read 1335, writes 2457/2468/2491/2499/2522/2546/2553. Feature trialed but not adopted recurring.

### weeklyGoals (6 docs)

3 per week × 2 weeks (2026-04-20 and 2026-04-27 only). All three active members both weeks. Status: 4 active, 2 completed. Some active goals have `daysCompleted` ≥ `targetDays` but didn't auto-complete (e.g., Taylor 04-20: `targetDays=4`, `daysCompleted=[1,2,3,4]`). **Needs product decision**: when does status flip to `completed`? Read 1356, writes 2713/2750/2786, delete 2798.

### tasks (13 docs in Firestore)

All Taylor's, all `createdAt: 2025-12-29`, all `dueDate: 2025-12-29`. Statuses: Completed 3, In Progress 6, Not Started 4. **Tasks UI no longer reads/writes Firestore** — it polls `${SUPABASE_URL}/rest/v1/tasks` (`src/App.jsx:1465, 1506, 4018, 4084`). The 13 docs are stranded data from before the Supabase migration. Dead data.

### quotes (26 docs)

Spans `weekOf` 2025-12-22 → 2026-04-27, 18 distinct weeks. **First 14 weeks of habit tracking (Sep 15 – Dec 15) have no quote at all.** Most recent week 2026-05-04 has none. Some weeks have multiples (2025-12-22 has 4, 2026-03-02 has 3). Read 1272, writes 5978/5992. Feature came online ~2025-12-22; cron runs irregularly.

---

## 4. Habit usage patterns

(Restricted to Brandon / Taylor / John, daily-only, excluding `habitType: 'percentage'`.)

### Active weeks (out of 34)
- Brandon: 34/34, no dormant weeks.
- Taylor: 34/34, no dormant weeks.
- John: 31/34. Missing 2025-09-15 (one week late), 2026-05-04 (the current week — he hasn't created habits this week yet).

### Weekly completion rate (median / mean / min / max)
- Brandon: median 85.4%, mean 76.8%, min 3.1%, max 100.0%
- Taylor: median 87.3%, mean 75.7%, min 0.0%, max 100.0%
- John: median 72.7%, mean 59.5%, min 0.0%, max 100.0%

### Half-over-half trend (Sep 15 – Dec 29 vs Jan 05 – May 04)
- Brandon H1 71.6% → H2 80.1% (+8.5pp)
- Taylor H1 75.2% → H2 83.6% (+8.4pp)
- John H1 53.1% → H2 62.3% (+9.2pp)
- Group H1 65.3% → H2 75.1% (+9.8pp). **Trending up by ~10pp.**

### Per-participant × category counts
| category | Brandon | Taylor | John |
|---|---:|---:|---:|
| Business | 14 | 86 | 6 |
| Finance | 124 | 8 | 0 |
| Fitness | 32 | 30 | 17 |
| Health | 2 | 39 | 8 |
| Learning | 59 | 53 | 25 |
| Relationships | 10 | 22 | 29 |
| Spiritual | 44 | 16 | 15 |
| (empty) | 24 | 26 | 188 |

### Per-participant × category completion rate

**Brandon** — Relationships 90.0% (n=10), Fitness 80.2% (n=31), Finance 77.6% (n=79 daily-only of his Finance set), Learning 74.2%, Spiritual 73.6%, Business 70.6%, Health 50.0% (n=2).

**Taylor** — Spiritual 92.3%, Relationships 89.4%, Business 87.1%, Learning 83.9%, Fitness 82.8%, Health 79.2%, Finance 12.5% (n=8). Empty-cat 51.8%.

**John** — Learning 72.6%, Fitness 52.2%, Spiritual 51.4%, Relationships 49.0%, Health 13.5%, Business 0.0% (n=6, 0/18). Empty-cat 63.7% — **John completes empty-category habits at a higher rate than his categorized ones (49.4%).**

### Domain skew
- **Finance** dominated by Brandon (124 vs Taylor 8, John 0). 92 of Brandon's 124 are `percentage` (trading-related).
- **Business** dominated by Taylor (86 vs Brandon 14, John 6) — aligns with Taylor's wholesaling business in profile bio.
- **Learning** roughly balanced.
- **Relationships** is John's relative lead (29 vs Taylor 22, Brandon 10) — consistent with John's vision `wordOfYear: "COMMUNITY"`.
- **Health** is Taylor's lead.
- **Spiritual** is Brandon's lead.
- **Fitness** roughly balanced (Brandon 32, Taylor 30, John 17). **Brandon does NOT dominate fitness in habit counts.**

### Habits never completed (≥2 weeks they appear, sum daysCompleted = 0)
7 cases:
- Taylor "File Taxes for 2023" (4 weeks)
- Taylor "Learn 1 New Prayer" (3 weeks)
- John "Get iOS web mobile view working" (2 weeks)
- John "Track everything I eat" (2 weeks)
- John "Work on app 10 minutes" (2 weeks)
- John "No Social Media 9-5pm" (2 weeks)
- Taylor "Begin Disposition Training" (2 weeks)

### Top 10 highest-completion-rate named habits (≥4 weeks)
1. Taylor "Networking outreach" — 100% over 16 weeks
2. Taylor "15 minutes of online learning" — 100% / 14 weeks
3. Taylor "Reanalyze Quickbooks" — 100% / 5w
4. Taylor "Exercise" — 100% / 6w
5. Taylor "Track Grady's KPI's" — 100% / 4w
6. Taylor "Lock up Contracts / Close Deals" — 100% / 4w
7. Brandon "Text the group each trade" — 100% / 6w
8. Brandon "Workout 4 times" — 93.8% / 4w
9. Taylor "Eat Lean Meals" — 92.1% / 8w
10. John "non-PT exercise" — 91.7% / 12w

### Bottom 10
- Taylor "File Taxes for 2023" — 0.0% / 4w
- Taylor "Coworking Space Time" — 12.5% / 4w
- Taylor "Lock up 1 Assignment Contract" — 25.0% / 4w
- John "track my meals and symptoms" — 30.8% / 14w
- John "Text group at noon" — 33.3% / 9w
- John "Cardio" — 36.8% / 6w
- John "30 mins of focusmate session" — 38.5% / 9w
- Taylor "Wake up at 5am" — 45.2% / 11w
- John "do my PT" — 46.3% / 16w
- John "Talk with or hang with 1+ friend/fam" — 48.8% / 6w

**Interpretation**: Taylor and Brandon are similar high performers; John runs ~15pp behind every half but is improving as much as the others (~9pp). Group trend is positive. Taylor's "Wake up at 5am" weakness aligns with his 2026-04-20 weeklyGoal "Wake up a 6am". John's worst habits cluster in health (PT, cardio, meals — overlapping his stated `biggestChallenge: "acid reflux"`) and outreach (focusmate, group text — overlapping `wordOfYear: "COMMUNITY"`) — aspirational habits in his weakest areas.

---

## 5. Weekly goals

6 docs, exactly 3 per week × 2 weeks. All three members both weeks.

| weekStart | participant | goal | status | daysCompleted |
|---|---|---|---|---|
| 2026-04-20 | Brandon | "Up at 6am and get my daily prep done " | completed | [0,1,2,3,4] |
| 2026-04-20 | Taylor | "Wake up a 6am" | active | [1,2,3,4] |
| 2026-04-20 | John | "Text group at noon" | active | [5,0,1,2,4] |
| 2026-04-27 | Brandon | "3 Tennis sessions / 1 Gym Session" | active | [2,3,4] |
| 2026-04-27 | Taylor | "Daily employee intention" | completed | [0,2,3,1,4] |
| 2026-04-27 | John | "text group at noon" | active | [] |

Feature first appears 2026-04-20 — most recent two weeks, full participation. Likely introduced at a Monday meeting. Three goals stuck `active` despite having hit `targetDays` (Taylor 04-20 has 4 days for `targetDays=4`) — auto-complete logic doesn't appear to fire, or completion is manual only. **Needs product decision**: when does status flip from active → completed?

---

## 6. Bets / challenges

Status distribution: declined 3, pending 3, completed 1. Two bursts (2025-12-22 evening: 4 bets in 3 min; 2026-04-06 morning: 3 bets in 2 min). Only completed bet `bet_1766410225120` accepted within 4 seconds of creation, completed 13 days later (2026-01-05 02:30). Three Apr 6 pending bets have not been touched in 4 weeks (no `acceptedBy` / `declinedBy` / `acceptedAt` / `completedAt`). Feature trialed in volume but not adopted as recurring accountability.

---

## 7. Current week bleed

Most recent `weekStart` = **2026-05-04** ✅ matches today's Monday.

This week's habit counts: Brandon 11, aaron 6, Taylor 3, John 0. **John has not created habits for the current week.**

`currentWeekStart` defined `src/App.jsx:1762-1771`:
```js
const currentWeekStart = useMemo(() => {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(today);
  monday.setDate(today.getDate() + mondayOffset);
  return monday.toISOString().split('T')[0];
}, []);
```

`currentWeek` (selected week) `src/App.jsx:3000-3013`:
```js
const currentWeek = useMemo(() => {
  if (selectedWeek && ALL_WEEKS.includes(selectedWeek)) return selectedWeek;
  const currentMon = getCurrentMonday();
  if (ALL_WEEKS.includes(currentMon)) return currentMon;
  return ALL_WEEKS[ALL_WEEKS.length - 1] || '';
}, [selectedWeek, ALL_WEEKS]);
```

- **Compete leaderboard** `src/App.jsx:1904`: `habits.filter(h => h.participant === p && h.weekStart !== currentWeekStart)` — excludes current week ✅
- **Wrapped Stats** `src/App.jsx:1924`: `h.weekStart !== currentWeekStart` — excludes ✅
- **Streaks** `src/App.jsx:1822, 1845`: `if (h.weekStart === currentWeekStart) continue;` — excludes ✅
- **Scorecard** `src/App.jsx:3265-3283`:
  ```js
  if (scorecardRange === 'week') return habits.filter(h => h.weekStart === currentWeek);   // INCLUDES
  if (scorecardRange === '4weeks') {
    const pastWeeks = ALL_WEEKS.filter(w => w < currentWeekStart).slice(-4);                // excludes current
    return habits.filter(h => pastWeeks.includes(h.weekStart));
  }
  if (scorecardRange === 'quarter') {
    ...
    return habits.filter(h => ... && h.weekStart !== currentWeekStart);                      // excludes
  }
  return habits.filter(h => h.weekStart !== currentWeekStart);                               // All Time excludes
  ```

Confirmed: Scorecard "This Week" includes the current week; the other three ranges (4weeks, quarter, All Time) exclude it. The `'week'` filter uses `currentWeek` (selected) not `currentWeekStart` (real-world today) — so navigating back via `selectedWeek` to an old week has "This Week" view show that selected week. Appears intentional but **needs product decision** on whether the label should follow.

---

## 8. Anything else weird

**Percentage habits**: 53 with `habitType: 'percentage'`, all Brandon's, mostly Finance (45) and Business (4). 31 missing `daysCompleted` (correct, they use `instances`). 52 have `instances` field — one fewer than the percentage count, so one percentage habit is missing both `instances` and `daysCompleted` (malformed early doc). Recent scoring PR excludes percentage habits — 5.9% of habits excluded from completion-rate metrics.

**Duplicate habit-name within a (participant, week)**: Exactly one — Brandon 2026-04-06 `"execute trades"`:
- `habit_1775479711173` — 7 instances, 2 successes / 5 fails
- `habit_1775654973644` — 5 instances, 5 successes / 0 fails

Both percentage, target 50, Finance. Created ~2 days apart. No de-dup safeguard in `addHabit`.

**`daysCompleted.length > target` (over-completion)**: 160 habits. Not corruption — users beat their target. Examples: aaron habit `target=1`, `daysCompleted=[0,1,2]`; another `target=3`, `daysCompleted=[0..5]`. Streak code at `src/App.jsx:1831` uses `>=`, completion-rate calculations in scoring use `Math.min(dc, target)` to cap at target. **Caveat**: any path using raw `daysCompleted.length / target` will produce >100% values for these 160 habits.

**Habits missing `habitType` (389 / 43.5%)**: All have `daysCompleted` populated, behave as 'daily'. Concentrated in older data (2025-09-15 onward, peters out by ~2026-01). Legacy pre-schema data, app tolerates absence.

**Habits missing `category` field entirely (66)**: Distinct from `category=''`. 60 of 66 are weeks 2025-09 through 2025-12. Participants: John 45, Brandon 19, Taylor 2. 59 also missing `habitType`. Old data pre-dating the category field. Combined with the 255 empty-string cases, 35.9% of all habits have no usable category.

**Habits missing `order` (473 / 52.9%)**: Older data. UI sort tolerates absence.

**`createdBy` UIDs**: Only 3 habits have `createdBy` (the 3 onboarding-flow aaron habits). All UIDs match a profile. No orphan UIDs.

**Always-empty fields in feature collections**:
- `visions`: `whyMatters`, `mainObstacle`, `overcomeStrategy`, `dailyHabit`, `monthlyMilestone` — empty in all 3.
- `reflections`: `proudestMoment`, `relationshipHighlight`, `skillDeveloped`, `letterFromPastSelf` — empty in all 3.
- `nonNegotiables`: `streak: 0`, no `lastUpdated` on both — streak-update never invoked.
- `posts`: `reactions: {}`, `comments: []` — fully unused.

**Date format and weekday**: All 894 habits have `weekStart` matching `^\d{4}-\d{2}-\d{2}$`, all fall on a Monday ✅. **No format errors and no off-day weekStarts.**

**Duplicate IDs**: Zero duplicates within `habits` (or any collection) ✅.

**`daysCompleted` value range**: All values integers in [0, 6] ✅.

**Quotes anomaly**: Some weeks 2–4 quotes (2025-12-22: 4; 2026-03-02: 3); current week 2026-05-04: 0. First 14 weeks of habit tracking: 0.

**Brandon Brown duplicate-account artifacts**: 3 habits with `participant: "Brandon Brown"` (not "Brandon"), never completed (`daysCompleted: []`). `allParticipants` derivation at `src/App.jsx:1751-1759` walks both profiles and habits, so "Brandon Brown" and "aaron" both appear as participants for views that don't filter to the core 3 — potentially dragging combined stats.

---

## Questions raised but not answered

1. **John's category-loss event**: what changed in John's habit-creation flow on/around 2026-01-12? UI change, switch to bulk-add, or behavior?
2. **Brandon Brown auto-add origin**: how did `autoAddNonNegotiables` produce 3 habits when no `vision_2026_7fr2Ul...` doc exists?
3. **OpenClaw account purpose**: real user, abandoned signup, or test account?
4. **"aaron" lowercase intentionality**: deliberate or signup typo?
5. **Pending bets / active goals lifecycle**: why have 3 bets been pending for 4 weeks? Why are some weeklyGoals stuck `active` after hitting `targetDays`?
6. **Duplicate "execute trades" Brandon 2026-04-06**: abandoned then restarted, or accidental?
7. **Vision/reflection schema fields always empty**: vestigial, or hidden behind a flag?
8. **Quotes generation cadence**: cron vs manual? why current week missing?
9. **Tasks Supabase migration**: were 13 Firestore task docs deliberately stranded or missed by a script?
10. **chatMessages collection**: removed feature, A/B test, or branch never merged?
