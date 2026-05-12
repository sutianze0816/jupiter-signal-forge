import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const publicDir = join(__dirname, "public");
const port = Number(process.env.PORT || 4173);
const jupApiKey = process.env.JUP_API_KEY || "";

const tokenAliases = new Map([
  ["SOL", "So11111111111111111111111111111111111111112"],
  ["JUP", "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN"],
  ["USDC", "EPjFWdd5AufqSSqeM2qBBE3f2cWNdeDWsjzxnWs8t1v"]
]);

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml"
};

function jupHeaders() {
  return jupApiKey ? { "x-api-key": jupApiKey } : {};
}

async function fetchJson(url) {
  const res = await fetch(url, { headers: jupHeaders() });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`${res.status} ${res.statusText}: ${body.slice(0, 240)}`);
  }
  return res.json();
}

function scoreToken(token, price) {
  const s5 = token.stats5m || {};
  const s1 = token.stats1h || {};
  const s24 = token.stats24h || {};
  const liquidity = Number(price?.liquidity ?? token.liquidity ?? 0);
  const organicScore = Number(token.organicScore ?? (token.organicScoreLabel === "high" ? 80 : 45));
  const priceChange24h = Number(price?.priceChange24h ?? s24.priceChange ?? 0);
  const shortImpulse = Number(s5.priceChange ?? 0) * 0.35 + Number(s1.priceChange ?? 0) * 0.65;
  const liquidityScore = Math.min(100, Math.log10(Math.max(liquidity, 1)) * 14);
  const risk = Math.max(0, Math.min(100, 100 - organicScore + Math.max(0, 25 - liquidityScore)));
  const opportunity = Math.max(0, Math.min(100, 50 + shortImpulse * 4 - Math.abs(priceChange24h) * 0.5 + liquidityScore * 0.2));
  return { liquidity, organicScore, priceChange24h, shortImpulse, risk, opportunity };
}

function decisionFor(token, price, score) {
  const symbol = token.symbol || "TOKEN";
  const usd = Number(price?.usdPrice ?? token.usdPrice ?? 0);
  const baseMint = token.id;
  const usdcMint = tokenAliases.get("USDC");
  const direction =
    score.risk > 60 ? "WAIT" :
    score.priceChange24h < -3 && score.organicScore > 50 ? "BUY_BELOW" :
    score.priceChange24h > 4 ? "SELL_ABOVE" :
    "DCA_WATCH";

  const triggerPriceUsd =
    direction === "BUY_BELOW" ? usd * 0.985 :
    direction === "SELL_ABOVE" ? usd * 1.025 :
    usd;

  return {
    direction,
    summary:
      direction === "WAIT" ? `${symbol} has weak trust/liquidity signals. Watch, do not trigger.` :
      direction === "BUY_BELOW" ? `${symbol} is down with usable organic/liquidity signals. Stage a buy-below alert.` :
      direction === "SELL_ABOVE" ? `${symbol} is extended. Stage a take-profit style sell-above alert.` :
      `${symbol} is in the middle. Use DCA or wait for a cleaner trigger.`,
    triggerDraft: {
      endpoint: "POST https://api.jup.ag/trigger/v2/orders/price",
      note: "Draft only. Trigger V2 requires an API key, wallet challenge JWT, vault setup, and signed deposit flow.",
      body: {
        orderType: "single",
        inputMint: direction === "SELL_ABOVE" ? baseMint : usdcMint,
        outputMint: direction === "SELL_ABOVE" ? usdcMint : baseMint,
        triggerPriceUsd: Number(triggerPriceUsd.toFixed(6)),
        direction: direction === "SELL_ABOVE" ? "sellAbove" : "buyBelow",
        slippageBps: direction === "WAIT" ? null : "rtse",
        rationale: "Generated from Jupiter Tokens + Price API signal scan"
      }
    }
  };
}

async function scan(query) {
  const q = query.trim() || "JUP";
  const tokenUrl = `https://api.jup.ag/tokens/v2/search?query=${encodeURIComponent(q)}`;
  const tokens = await fetchJson(tokenUrl);
  const usable = tokens
    .filter((t) => t.id && t.symbol && (t.usdPrice || t.liquidity))
    .slice(0, 8);
  const ids = usable.map((t) => t.id).join(",");
  const prices = ids ? await fetchJson(`https://api.jup.ag/price/v3?ids=${encodeURIComponent(ids)}`) : {};

  const rows = usable.map((token) => {
    const price = prices[token.id] || {};
    const score = scoreToken(token, price);
    return {
      id: token.id,
      name: token.name,
      symbol: token.symbol,
      icon: token.icon,
      verification: token.verification || "unknown",
      holderCount: token.holderCount || null,
      usdPrice: Number(price.usdPrice ?? token.usdPrice ?? 0),
      blockId: price.blockId || token.priceBlockId || null,
      stats: {
        stats5m: token.stats5m || null,
        stats1h: token.stats1h || null,
        stats24h: token.stats24h || null
      },
      score,
      decision: decisionFor(token, price, score)
    };
  });

  rows.sort((a, b) => b.score.opportunity - a.score.opportunity);
  return {
    query: q,
    generatedAt: new Date().toISOString(),
    mode: jupApiKey ? "developer-platform-key" : "keyless-prototype",
    sources: [
      "https://api.jup.ag/tokens/v2/search",
      "https://api.jup.ag/price/v3",
      "https://developers.jup.ag/docs/trigger/index.md"
    ],
    results: rows
  };
}

async function serveStatic(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  let pathname = url.pathname === "/" ? "/index.html" : url.pathname;
  pathname = normalize(pathname).replace(/^(\.\.[/\\])+/, "");
  const filePath = join(publicDir, pathname);
  try {
    const body = await readFile(filePath);
    res.writeHead(200, { "content-type": contentTypes[extname(filePath)] || "application/octet-stream" });
    res.end(body);
  } catch {
    res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    res.end("Not found");
  }
}

createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    if (url.pathname === "/api/scan") {
      const query = url.searchParams.get("query") || "JUP";
      const body = await scan(query);
      res.writeHead(200, { "content-type": "application/json; charset=utf-8" });
      res.end(JSON.stringify(body, null, 2));
      return;
    }
    await serveStatic(req, res);
  } catch (error) {
    res.writeHead(500, { "content-type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ error: error.message }, null, 2));
  }
}).listen(port, () => {
  console.log(`Jupiter Signal Forge running at http://localhost:${port}`);
});
