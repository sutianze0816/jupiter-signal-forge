import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { analyzeChange, sampleInput } from "./lib/analyze.mjs";

const root = fileURLToPath(new URL("./public", import.meta.url));
const port = Number(process.env.PORT || 4175);
const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png"
};

function sendJson(res, status, body) {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
  res.end(JSON.stringify(body));
}

async function readBody(req) {
  let body = "";
  for await (const chunk of req) {
    body += chunk;
    if (body.length > 1_500_000) throw new Error("Request body is too large.");
  }
  return JSON.parse(body || "{}");
}

async function serveStatic(req, res) {
  const pathname = new URL(req.url, "http://localhost").pathname;
  const requested = pathname === "/" ? "/index.html" : pathname;
  const filePath = normalize(join(root, requested));
  if (!filePath.startsWith(root)) return sendJson(res, 403, { error: "Forbidden" });
  try {
    const info = await stat(filePath);
    if (!info.isFile()) throw new Error("Not a file");
    const content = await readFile(filePath);
    res.writeHead(200, {
      "content-type": mime[extname(filePath)] || "application/octet-stream",
      "cache-control": pathname === "/" ? "no-store" : "public, max-age=300"
    });
    res.end(content);
  } catch {
    sendJson(res, 404, { error: "Not found" });
  }
}

const server = createServer(async (req, res) => {
  try {
    if (req.method === "GET" && req.url === "/api/status") {
      return sendJson(res, 200, {
        liveAvailable: Boolean(process.env.OPENAI_API_KEY),
        model: process.env.OPENAI_MODEL || "gpt-5.6"
      });
    }
    if (req.method === "GET" && req.url === "/api/sample") {
      return sendJson(res, 200, sampleInput);
    }
    if (req.method === "POST" && req.url === "/api/analyze") {
      const body = await readBody(req);
      const result = await analyzeChange(body, { mode: body.mode });
      return sendJson(res, 200, result);
    }
    if (req.method !== "GET" && req.method !== "HEAD") {
      return sendJson(res, 405, { error: "Method not allowed" });
    }
    return serveStatic(req, res);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    sendJson(res, message.includes("required") ? 400 : 500, { error: message });
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`ChangeProof running at http://127.0.0.1:${port}`);
});

export { server };
