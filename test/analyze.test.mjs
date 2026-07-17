import test from "node:test";
import assert from "node:assert/strict";
import { analyzeChange, fallbackReport, sampleInput } from "../lib/analyze.mjs";
import { validateReport } from "../lib/schema.mjs";

test("sample audit produces a valid high-risk hold report", async () => {
  const result = await analyzeChange(sampleInput, { mode: "demo" });
  assert.equal(result.mode, "demo");
  assert.equal(result.report.verdict, "hold");
  assert.equal(result.report.riskLevel, "high");
  assert.equal(validateReport(result.report).length, 0);
});

test("fallback audit maps arbitrary requirements to criteria", () => {
  const report = fallbackReport({
    title: "Export invoices",
    requirements: "Users can export invoices as CSV.\nExports include a timestamp.",
    diff: "+++ b/src/export.js\n+export function exportInvoices() {}",
    tests: ""
  });
  assert.equal(report.criteria.length, 2);
  assert.ok(report.coverageScore >= 0 && report.coverageScore <= 100);
  assert.equal(validateReport(report).length, 0);
});

test("analysis rejects missing evidence inputs", async () => {
  await assert.rejects(
    () => analyzeChange({ requirements: "Do a thing", diff: "" }, { mode: "demo" }),
    /required/
  );
});
