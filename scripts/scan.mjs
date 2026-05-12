const query = process.argv[2] || "JUP";
const base = process.env.SIGNAL_FORGE_URL || "http://localhost:4173";

const res = await fetch(`${base}/api/scan?query=${encodeURIComponent(query)}`);
if (!res.ok) {
  throw new Error(await res.text());
}
console.log(JSON.stringify(await res.json(), null, 2));
