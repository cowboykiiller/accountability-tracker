# Security

## Known issues

### Firestore security rules are wide-open for authenticated users

**Status:** Open. Must be addressed before any external launch, opening beta access to non-friend testers, or charging users.

The currently-deployed Firestore rules:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

**What this allows today**

Any signed-in user can read **every document in every collection**. Concretely that includes:

- Other users' `habits`, `weeklyGoals`, `reflections`, `timeCapsules`, `visions`, `nonNegotiables`, `moods`, `checkIns`
- DM threads in `chatMessages`
- `profiles` (email, photoURL, bio, location, goals)
- `posts`, reactions, comments
- `bets`, `tasks`, `quotes`

Any signed-in user can also **write** any document in any collection — create, modify, or delete data belonging to anyone else. That includes overwriting another user's habits, rewriting their profile, deleting their posts, or posting messages as them.

**Proposed direction (not yet implemented)**

A per-collection rule set rather than a single catch-all:

- **Most collections** — `habits`, `profiles`, `weeklyGoals`, `quotes`, `posts`, `bets`, `reflections`, `timeCapsules`, `visions`, `nonNegotiables`, `moods`, `checkIns`, `tasks`: readable by all authenticated users, because the leaderboard, scorecard, wrapped stats, and group activity surfaces all depend on cross-user visibility. Writes scoped to the document's owning UID (e.g. `request.auth.uid == resource.data.userId` or `== resource.data.createdBy`), with create-rules guarding the same.
- **`chatMessages`** — DMs. Both reads and writes scoped to the documented participants only (e.g. `request.auth.uid in resource.data.participantUids`). No broad read access.

Designing the actual rules requires a careful audit of the codebase's read patterns first — especially the leaderboard, scorecard, and wrapped stats — to make sure the necessary cross-user reads keep working. Many habit docs in the production data are missing fields like `userId` / `createdBy` (see `findings.md`), so any UID-scoped write rule needs a data backfill plan alongside it. That's a separate work session, not a one-line fix.

### Out-of-scope reminders for the rules work

- Backfill `createdBy` / `userId` on legacy habit docs before tightening writes — currently only 3 of 948 habit docs have `createdBy` populated.
- The `profiles` collection mixes `displayName`, `nickname`, `linkedParticipant`, and the (non-canonical) `odingDisplayName` fields. Decide which is authoritative for write rules before locking down.
- Two profiles in production still have empty `linkedParticipant` ("Brandon Brown", "OpenClaw Operations", "Taylor at OHBH") — see Fix B banner. Tightening profile-write rules without first resolving these orphans risks locking those accounts out of repair.
