# Security Specification — AI Engineer Command Center (Phase 0 TDD)

## 1. Data Invariants

1. **Strict Single-Tenant PII & State Isolation**: Every learner document lives strictly under `/users/{userId}` and its subcollections. Only an authenticated user whose `request.auth.uid == userId` AND `request.auth.token.email_verified == true` may read or write any document under `/users/{userId}`.
2. **Identity Integrity**: Every document MUST store `ownerId == request.auth.uid` on create and keep `ownerId` immutable on update (`incoming().ownerId == existing().ownerId`).
3. **Path Variable Hardening**: Every single-document path variable (`userId`, `topicId`, `moduleId`, `resourceId`, `sessionId`, `exerciseId`, `projectId`, `conceptId`, `cardId`, `attemptId`, `entryId`, `logId`) MUST satisfy `isValidId()` (`^[a-zA-Z0-9_\\-]+$`, `size() <= 128`).
4. **Strict Keys & Volumetric Bounds**: Every `create` enforces `hasAll` and `hasOnly` allowlists; every `update` enforces `isValid[Entity](incoming())` and `affectedKeys().hasOnly(...)`; every string and list has explicit `.size()` limits; arrays validate element types.
5. **Temporal Integrity**: All `createdAt` on create and `updatedAt` on create/update must equal `request.time`. `createdAt` is immutable on update.
6. **Immutable Audit Collections**: `quizAttempts` and `activityLogs` are append-only (`allow update: if false;`) to prevent falsifying revision/activity history.
7. **Secure List Queries**: Every `allow list` verifies `isVerifiedOwner(userId)` AND `resource.data.ownerId == request.auth.uid` without calling `get()` or `exists()`.

## 2. The "Dirty Dozen" Adversarial Payloads (Must Return PERMISSION_DENIED)

1. **Unauthenticated Read**: `GET /users/uid_a` with `auth = null`.
2. **Cross-User Read**: `GET /users/uid_a/journalEntries/j1` authenticated as `uid_b`.
3. **Unverified Email Write**: `CREATE /users/uid_a` with `auth = { uid: "uid_a", token: { email_verified: false } }`.
4. **Owner Spoofing on Create**: `CREATE /users/uid_a/projects/p1` with `ownerId: "uid_b"`.
5. **Shadow Ghost Field Injection**: `CREATE /users/uid_a/topicProgress/w1_m1_t1` including undocumented field `isAdmin: true`.
6. **ID Poisoning Attack**: `CREATE /users/uid_a/projects/invalid$id!with/slashes` or 200-char ID.
7. **Denial-of-Wallet String Bloat**: `UPDATE /users/uid_a/journalEntries/j1` with `learnedToday` length > 3000 chars.
8. **Invalid Enum Injection**: `UPDATE /users/uid_a/topicProgress/w1_m1_t1` with `status: "mastered_by_magic"`.
9. **Client Timestamp Forgery**: `CREATE /users/uid_a/studySessions/s1` with client-supplied past `createdAt` (`createdAt != request.time`).
10. **Immutable Field Mutation**: `UPDATE /users/uid_a/projects/p1` changing `ownerId` or `createdAt`.
11. **Array Type/Size Poisoning**: `CREATE /users/uid_a/projects/p1` with `skills` array containing 50 items or non-string `[12345]`.
12. **History Tampering**: `UPDATE /users/uid_a/quizAttempts/q1` attempting to raise `score` from 2 to 5.
