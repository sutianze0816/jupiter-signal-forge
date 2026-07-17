![ChangeProof cover](media/changeproof-cover.png)

# ChangeProof

**Evidence, not vibes, for AI-generated changes.**

ChangeProof is a developer tool that audits a proposed code change against its acceptance criteria and test evidence. It produces a requirement coverage matrix, a risk register, targeted missing tests, and a concrete merge path.

The tool is built for teams using coding agents. Generated code can look plausible while silently missing authorization checks, rate limits, audit fields, or negative-path tests. ChangeProof turns the product promise, implementation, and verification artifacts into one reviewable evidence set.

## Try it in 60 seconds

Open the hosted demo: **https://keliu.xmyingshiyun.com/changeproof/**

Watch the public YouTube demo: **https://youtu.be/w7MBDbXMNkU**

Review the narrated 2:09 demo artifact: [`media/changeproof-demo.mp4`](media/changeproof-demo.mp4)

Requirements: Node.js 20 or newer. There are no runtime package dependencies.

```bash
git clone --branch openai-build-week-changeproof --single-branch https://github.com/sutianze0816/jupiter-signal-forge.git changeproof
cd changeproof
npm start
```

Open [http://127.0.0.1:4175](http://127.0.0.1:4175). A complete sample audit loads automatically, and Demo mode works without an API key.

To run a live semantic audit with GPT-5.6:

```bash
export OPENAI_API_KEY="your-key"
export OPENAI_MODEL="gpt-5.6"
npm start
```

Then choose **Live / GPT-5.6** and run the audit again.

## What it does

- Maps every acceptance criterion to implementation and test evidence.
- Separates `covered`, `partial`, and `missing` behavior with confidence scores.
- Finds security, reliability, and operational risks in the change surface.
- Generates prioritized negative-path and regression tests.
- Produces a short merge path instead of an unstructured code-review essay.
- Exports the complete audit as Markdown or JSON for pull requests and CI.
- Includes a deterministic, adaptive Demo engine so judges can test the full product without rebuilding or supplying credentials.

## How GPT-5.6 is used

Live mode sends the change title, requirements, unified diff, and test evidence to the OpenAI Responses API using the `gpt-5.6` alias. GPT-5.6 is asked to reason across all four artifacts as a single evidence set.

The response is constrained by a strict JSON Schema. That keeps the frontend predictable and forces every audit to return the same typed contract: summary, scores, per-criterion evidence, risks, test gaps, and next actions.

The relevant implementation is in:

- [`lib/analyze.mjs`](lib/analyze.mjs): prompt, Responses API call, output extraction, and demo fallback.
- [`lib/schema.mjs`](lib/schema.mjs): strict structured-output schema and local validation.
- [`public/app.js`](public/app.js): interactive audit workspace, rendering, tabs, and report export.

## How Codex accelerated the build

Codex was used end to end in one primary session to:

1. Read and reconcile the Build Week requirements and official GPT-5.6 documentation.
2. Select a problem where long-context reasoning is essential rather than decorative.
3. Design the evidence contract before implementing the UI.
4. Build the dependency-free Node server, product interface, adaptive demo engine, GPT-5.6 integration, tests, and submission materials.
5. Run syntax checks and automated tests, then iterate on the product states and responsive layout.

Key decisions made with Codex:

- **Evidence matrix over chat:** reviewers need traceability, not another conversational answer.
- **Strict structured output:** an audit is only useful if each conclusion can be rendered, exported, and checked consistently.
- **Demo and Live modes:** judges can experience the full product immediately, while Live mode demonstrates the real GPT-5.6 reasoning path.
- **No client-side API key:** live requests run through the local server so credentials never enter browser storage.

Primary Codex `/feedback` session ID:

```text
019e19bd-807a-7800-8981-d2b5ef5c26d9
```

## Architecture

```text
Browser workspace
  -> POST /api/analyze
     -> Demo evidence engine (no key)
     -> GPT-5.6 Responses API (Live mode)
        -> strict JSON Schema
  <- typed evidence report
     -> coverage / risks / tests / merge path
     -> Markdown and JSON export
```

The app intentionally uses the Node standard library and browser-native JavaScript. This keeps setup fast, reduces dependency risk, and makes the judging path transparent.

## API

### `GET /api/status`

Returns the configured model and whether Live mode is available.

### `GET /api/sample`

Returns the bundled API-key-rotation change used by the automatic demo.

### `POST /api/analyze`

```json
{
  "title": "Team-scoped API key rotation",
  "requirements": "One acceptance criterion per line",
  "diff": "A unified git diff",
  "tests": "Test output or CI evidence",
  "mode": "demo"
}
```

Set `mode` to `live` to use GPT-5.6 when `OPENAI_API_KEY` is configured.

## Tests

```bash
npm test
```

The test suite verifies the sample verdict, adaptive fallback behavior, report contract, and required-input validation.

## Supported platforms

- macOS, Linux, and Windows with Node.js 20+
- Current Chrome, Edge, Firefox, and Safari
- Desktop and mobile layouts

## Security and privacy

- API keys stay on the server and are never returned to the browser.
- Demo mode performs no network calls.
- Inputs are held in browser memory and are not persisted by ChangeProof.
- The local server accepts request bodies up to 1.5 MB and rejects path traversal.

For sensitive proprietary diffs, run the app locally and review your organization's OpenAI data controls before enabling Live mode.

## License

MIT
