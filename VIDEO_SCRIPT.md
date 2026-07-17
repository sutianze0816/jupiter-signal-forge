# ChangeProof Demo Video Script

Target length: 2 minutes 35 seconds. The final upload must be public on YouTube and under 3 minutes.

## 0:00-0:15 — Problem

**Screen:** Project cover, then the loaded ChangeProof workspace.

**Narration:**

"AI coding agents can produce a convincing diff in minutes. The hard part is proving that the change actually satisfies the product requirements. ChangeProof turns requirements, code, and tests into one auditable evidence map."

## 0:15-0:35 — Inputs

**Screen:** Slowly scroll the left input panel. Highlight acceptance criteria, code diff, and passing tests.

**Narration:**

"Here is a realistic API-key rotation change. The requirements include admin-only access, immediate revocation, a complete audit event, rate limiting, and cross-team privacy. The diff and two passing tests look reasonable at first glance."

## 0:35-1:05 — Run the audit

**Screen:** Click Run evidence audit. Show the 48% coverage, high risk, and Hold verdict.

**Narration:**

"ChangeProof maps every promise to implementation and test evidence. The old key is revoked and cross-team access returns 404, but the change never checks for an admin role, has no rate limiter, and omits the actor from the audit trail. Passing tests were not enough."

## 1:05-1:30 — Explore evidence

**Screen:** Show Coverage, Risks, and Test gaps tabs.

**Narration:**

"Each requirement gets a status, evidence statement, and confidence score. Risks include a precise location and mitigation. The test-gap view proposes the negative paths that would most increase confidence before merge."

## 1:30-1:48 — Export and workflow

**Screen:** Open Next actions, then click Export Markdown.

**Narration:**

"The result is not trapped in a chat. Teams get a short merge path and can export the full audit as Markdown or JSON for a pull request or CI artifact."

## 1:48-2:18 — GPT-5.6 and Codex

**Screen:** Switch the segmented control from Demo to Live; then show `lib/analyze.mjs` and `lib/schema.mjs` in the repository.

**Narration:**

"Live mode uses GPT-5.6 through the OpenAI Responses API. GPT-5.6 reasons across the complete requirement, diff, and test context, while strict Structured Outputs guarantee the report contract. Codex accelerated the entire build: requirements research, schema-first architecture, product interface, API integration, tests, and submission materials."

## 2:18-2:35 — Close

**Screen:** Return to the finished report and project cover.

**Narration:**

"ChangeProof gives teams evidence, not vibes, for AI-generated changes. It runs locally, includes a no-key demo for immediate testing, and is ready for GitHub and CI integration."

## Recording checklist

- Record at 1440p or 1080p in a quiet room.
- Keep browser zoom at 100% and hide personal bookmarks or notifications.
- Show the product working; do not use only slides.
- Say both "Codex" and "GPT-5.6" in the audio.
- Keep final duration below 3:00.
- Upload as Public, not Unlisted, because the challenge explicitly requires a public YouTube video.
