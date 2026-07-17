export const sampleInput = {
  title: "Team-scoped API key rotation",
  requirements: `Only team admins can rotate API keys.
The old key becomes invalid immediately after rotation.
An audit event records the actor, team, key, and timestamp.
Rotations are limited to three per hour per team.
Cross-team key IDs return 404 without leaking key existence.`,
  diff: `diff --git a/src/routes/keys.ts b/src/routes/keys.ts
index 93ad44e..e37c1fa 100644
--- a/src/routes/keys.ts
+++ b/src/routes/keys.ts
@@ -18,6 +18,32 @@ router.get("/teams/:teamId/keys", requireUser, listKeys);
+router.post("/teams/:teamId/keys/:keyId/rotate", requireUser, async (req, res) => {
+  const key = await db.apiKey.findUnique({ where: { id: req.params.keyId } });
+  if (!key || key.teamId !== req.params.teamId) return res.sendStatus(404);
+
+  const next = await db.$transaction(async (tx) => {
+    await tx.apiKey.update({ where: { id: key.id }, data: { revokedAt: new Date() } });
+    return tx.apiKey.create({
+      data: { teamId: key.teamId, label: key.label, secretHash: await hash(newSecret()) }
+    });
+  });
+
+  await audit.write({ type: "api_key.rotated", teamId: key.teamId, keyId: key.id });
+  return res.status(201).json({ id: next.id });
+});

diff --git a/test/keys.test.ts b/test/keys.test.ts
index 044cb8c..d601fcc 100644
--- a/test/keys.test.ts
+++ b/test/keys.test.ts
@@ -41,3 +41,25 @@ describe("API keys", () => {
+  it("rotates a key and revokes the previous key", async () => { /* passing */ });
+  it("returns 404 for a key owned by another team", async () => { /* passing */ });
+});`,
  tests: `PASS test/keys.test.ts
  API keys
    ✓ rotates a key and revokes the previous key (42 ms)
    ✓ returns 404 for a key owned by another team (11 ms)

Test Suites: 1 passed, 1 total
Tests:       2 passed, 2 total`
};

export const sampleReport = {
  summary: "The rotation path correctly scopes keys to a team and revokes the old credential transactionally, but authorization, rate limiting, and audit attribution are incomplete. The happy path works; the protection around it does not yet meet the stated contract.",
  coverageScore: 48,
  riskLevel: "high",
  confidence: 94,
  verdict: "hold",
  criteria: [
    {
      criterion: "Only team admins can rotate API keys.",
      status: "missing",
      evidence: "The route uses requireUser but never checks team membership or an admin role.",
      confidence: 99
    },
    {
      criterion: "The old key becomes invalid immediately after rotation.",
      status: "covered",
      evidence: "The transaction sets revokedAt before creating the replacement key; the passing test exercises revocation.",
      confidence: 95
    },
    {
      criterion: "An audit event records actor, team, key, and timestamp.",
      status: "partial",
      evidence: "The event includes teamId and keyId, but actor identity and an explicit event timestamp are absent.",
      confidence: 97
    },
    {
      criterion: "Rotations are limited to three per hour per team.",
      status: "missing",
      evidence: "No rate-limit lookup, counter, middleware, or test appears in the supplied change.",
      confidence: 99
    },
    {
      criterion: "Cross-team key IDs return 404 without leaking key existence.",
      status: "covered",
      evidence: "The team mismatch returns 404 and the passing cross-team test confirms the behavior.",
      confidence: 96
    }
  ],
  risks: [
    {
      severity: "critical",
      title: "Any signed-in user can rotate another team's key",
      location: "src/routes/keys.ts: POST rotate handler",
      detail: "requireUser proves identity but not authorization. A user who knows a team and key ID can rotate that key.",
      mitigation: "Require team membership and an admin role before loading or mutating the key. Add a negative authorization test."
    },
    {
      severity: "high",
      title: "Unbounded rotation can be abused",
      location: "src/routes/keys.ts: POST rotate handler",
      detail: "The stated three-per-hour control is absent, allowing repeated key churn and audit noise.",
      mitigation: "Add a team-scoped atomic rate limiter and return 429 with retry metadata."
    },
    {
      severity: "medium",
      title: "Audit trail cannot identify the actor",
      location: "audit.write payload",
      detail: "The event records the affected team and key but not the authenticated user responsible for the action.",
      mitigation: "Include actorId and occurredAt in the audit payload and assert both fields in tests."
    }
  ],
  testGaps: [
    {
      priority: "P0",
      scenario: "Non-admin team member attempts rotation",
      why: "This is the highest-impact authorization boundary and currently has no implementation or evidence.",
      suggestedTest: "Create a member role, POST the rotate endpoint, expect 403, and assert the key remains active."
    },
    {
      priority: "P0",
      scenario: "Fourth rotation inside one hour",
      why: "The requirement is entirely unimplemented and needs an executable contract.",
      suggestedTest: "Perform three rotations for one team, then expect the fourth request to return 429."
    },
    {
      priority: "P1",
      scenario: "Audit record contains actor and timestamp",
      why: "The current passing tests do not verify audit completeness.",
      suggestedTest: "Spy on audit.write and assert actorId, teamId, keyId, and occurredAt."
    }
  ],
  nextActions: [
    "Block the route on a team-admin authorization check.",
    "Add an atomic team-scoped rotation rate limit.",
    "Extend audit data with actorId and occurredAt.",
    "Add the three missing negative-path tests before merge."
  ]
};
