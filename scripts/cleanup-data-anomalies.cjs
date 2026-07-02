/* eslint-disable */
// One-time cleanup of the data anomalies found in the 2026-07-02 math audit
// (see math-audit-2026-07-02.md). Deletes:
//   A. The 3 stray 'Brandon Brown' habit docs (secondary-account artifacts,
//      all weekStart 2026-04-06, empty daysCompleted).
//   B. The duplicate percentage habit doc for Brandon's "execute trades"
//      (habit_1775654973644 — keeps the earlier habit_1775479711173).
//   C. Future-dated auto-created non-negotiable docs with no completions
//      (weekStart beyond the CURRENT real week at run time, empty daysCompleted,
//      id matching the auto-add "_nn_" pattern).
//
// DRY RUN by default — prints exactly what would be deleted and exits.
// Run with --apply to actually delete.
//
//   node scripts/cleanup-data-anomalies.cjs           # dry run
//   node scripts/cleanup-data-anomalies.cjs --apply   # delete for real
const admin = require('firebase-admin');

const KEY_PATH = '/Users/taylorgeorges/Downloads/the-accountability-group-firebase-adminsdk-fbsvc-b191aab53a.json';
admin.initializeApp({ credential: admin.credential.cert(require(KEY_PATH)) });
const db = admin.firestore();

const APPLY = process.argv.includes('--apply');

// Monday of the current ISO week, UTC (matches scoring.js getISOWeekStart).
const currentMondayUTC = () => {
  const d = new Date();
  const day = d.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + diff));
  return monday.toISOString().split('T')[0];
};

const DUPLICATE_ID = 'habit_1775654973644'; // duplicate of habit_1775479711173

(async () => {
  const snap = await db.collection('habits').get();
  const docs = snap.docs.map(d => ({ ref: d.ref, id: d.id, ...d.data() }));
  const currentWeek = currentMondayUTC();
  console.log(`Fetched ${docs.length} habit docs. Current UTC week: ${currentWeek}. Mode: ${APPLY ? 'APPLY' : 'DRY RUN'}\n`);

  const targets = [];

  // A. Brandon Brown strays
  for (const d of docs.filter(d => d.participant === 'Brandon Brown')) {
    targets.push({ reason: 'A: Brandon Brown stray', d });
  }

  // B. Duplicate execute-trades doc
  for (const d of docs.filter(d => d.id === DUPLICATE_ID)) {
    targets.push({ reason: 'B: duplicate "execute trades"', d });
  }

  // C. Future-dated empty auto-created NN docs
  for (const d of docs.filter(d =>
    d.weekStart > currentWeek &&
    /_nn_/.test(d.id) &&
    (!Array.isArray(d.daysCompleted) || d.daysCompleted.length === 0)
  )) {
    targets.push({ reason: 'C: future empty NN doc', d });
  }

  if (!targets.length) {
    console.log('Nothing to delete — all clean.');
    process.exit(0);
  }

  for (const { reason, d } of targets) {
    console.log(`[${reason}] ${d.id}`);
    console.log(`    participant=${d.participant}  weekStart=${d.weekStart}  habit="${d.habit}"  target=${d.target}  daysCompleted=${JSON.stringify(d.daysCompleted ?? null)}  habitType=${d.habitType || 'daily'}`);
  }
  console.log(`\n${targets.length} doc(s) matched.`);

  if (!APPLY) {
    console.log('Dry run only — re-run with --apply to delete.');
    process.exit(0);
  }

  for (const { d } of targets) {
    await d.ref.delete();
    console.log(`deleted ${d.id}`);
  }
  console.log('Done.');
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
