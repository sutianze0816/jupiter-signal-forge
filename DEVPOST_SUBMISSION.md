# Devpost Submission Draft

## Project name

ChangeProof

## Tagline

Evidence, not vibes, for AI-generated changes.

## Track

Developer Tools

## Short description

ChangeProof audits AI-generated code against product requirements and test evidence, then returns a traceable coverage matrix, risk register, missing tests, and merge path powered by GPT-5.6.

## Inspiration

Coding agents can produce a convincing implementation in minutes, but reviewers still have to answer a harder question: did the change actually satisfy the product contract? Important gaps often live between artifacts. A ticket asks for admin-only access, the diff checks only authentication, and the happy-path test still passes.

We built ChangeProof to make those gaps visible. It treats requirements, code, and tests as one evidence set and gives reviewers a structured argument they can inspect instead of a generic AI summary.

## What it does

Users paste acceptance criteria, a unified git diff, and optional test or CI output. ChangeProof returns:

- A coverage score and merge verdict.
- A row-by-row evidence matrix for every acceptance criterion.
- Security, reliability, and operational risks with locations and mitigations.
- Prioritized missing tests with executable test suggestions.
- A short next-action path and exportable Markdown/JSON report.

A built-in sample loads automatically and Demo mode requires no credentials. Live mode uses GPT-5.6 for semantic reasoning across the complete change context.

## How we built it

ChangeProof is a dependency-free Node.js application with a browser-native frontend. The server exposes a small evidence API and keeps OpenAI credentials off the client.

Live analysis uses the OpenAI Responses API with the `gpt-5.6` model alias and a strict JSON Schema. The schema gives the model room to reason while guaranteeing a stable report contract for rendering and export.

The deterministic Demo engine mirrors the same contract and adapts to custom inputs, so judges can test the workflow without an API key. Node's built-in test runner validates the sample verdict, fallback mapping, input handling, and output contract.

Codex was used throughout the project: requirement research, idea selection, schema-first architecture, implementation, tests, responsive UI, documentation, and submission preparation. The key product decision was to build an evidence workspace rather than another chat interface.

## Challenges we ran into

The hardest design problem was separating plausible claims from actual evidence. A diff may mention a requirement keyword without implementing the behavior, while a passing test may exercise only the happy path. We solved this by making the model classify every criterion as covered, partial, or missing and require a concise evidence statement for each classification.

We also needed a judging path that works without exposing credentials. The shared report schema lets Demo and Live modes drive the exact same interface without pretending that deterministic analysis is GPT-5.6.

## Accomplishments that we're proud of

- The first screen is a complete, interactive audit rather than a setup page.
- Every conclusion is traceable to a requirement, code location, or test signal.
- The product works without dependencies or credentials, but has a real GPT-5.6 path.
- Reports can move directly into a pull request or CI artifact.
- The bundled example catches a critical authorization failure even though the supplied tests pass.

## What we learned

The most useful role for a frontier model in code review is not writing more prose. It is reconciling multiple artifacts, tracking missing evidence, and returning a structure that humans can challenge. GPT-5.6's context and structured-output support make that workflow practical.

## What's next

- GitHub App integration that audits pull requests automatically.
- Repository-aware evidence links to exact lines and symbols.
- CI status checks that block merges on uncovered P0 criteria.
- Team-specific policy packs for security, privacy, and reliability.
- Longitudinal tracking of which requirements repeatedly escape review.

## Built with

Codex, GPT-5.6, OpenAI Responses API, Structured Outputs, Node.js, JavaScript, HTML, CSS

## Required links

- Devpost project: https://devpost.com/software/changeproof-jc0b52
- Code repository: https://github.com/sutianze0816/jupiter-signal-forge/tree/openai-build-week-changeproof
- Demo video: https://youtu.be/w7MBDbXMNkU
- Live demo: https://keliu.xmyingshiyun.com/changeproof/

## Codex feedback session ID

019e19bd-807a-7800-8981-d2b5ef5c26d9
