export const reportSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "summary",
    "coverageScore",
    "riskLevel",
    "confidence",
    "verdict",
    "criteria",
    "risks",
    "testGaps",
    "nextActions"
  ],
  properties: {
    summary: { type: "string" },
    coverageScore: { type: "integer", minimum: 0, maximum: 100 },
    riskLevel: { type: "string", enum: ["low", "medium", "high", "critical"] },
    confidence: { type: "integer", minimum: 0, maximum: 100 },
    verdict: { type: "string", enum: ["ship", "ship-with-guards", "hold"] },
    criteria: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["criterion", "status", "evidence", "confidence"],
        properties: {
          criterion: { type: "string" },
          status: { type: "string", enum: ["covered", "partial", "missing"] },
          evidence: { type: "string" },
          confidence: { type: "integer", minimum: 0, maximum: 100 }
        }
      }
    },
    risks: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["severity", "title", "location", "detail", "mitigation"],
        properties: {
          severity: { type: "string", enum: ["low", "medium", "high", "critical"] },
          title: { type: "string" },
          location: { type: "string" },
          detail: { type: "string" },
          mitigation: { type: "string" }
        }
      }
    },
    testGaps: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["priority", "scenario", "why", "suggestedTest"],
        properties: {
          priority: { type: "string", enum: ["P0", "P1", "P2"] },
          scenario: { type: "string" },
          why: { type: "string" },
          suggestedTest: { type: "string" }
        }
      }
    },
    nextActions: {
      type: "array",
      items: { type: "string" }
    }
  }
};

export function validateReport(report) {
  const errors = [];
  if (!report || typeof report !== "object") errors.push("Report must be an object");
  if (!Number.isInteger(report?.coverageScore)) errors.push("coverageScore must be an integer");
  if (!Array.isArray(report?.criteria)) errors.push("criteria must be an array");
  if (!Array.isArray(report?.risks)) errors.push("risks must be an array");
  if (!Array.isArray(report?.testGaps)) errors.push("testGaps must be an array");
  if (!Array.isArray(report?.nextActions)) errors.push("nextActions must be an array");
  return errors;
}
