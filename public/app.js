const form = document.querySelector("#scan-form");
const queryInput = document.querySelector("#query");
const resultsEl = document.querySelector("#results");
const ticketTitle = document.querySelector("#ticket-title");
const ticketSummary = document.querySelector("#ticket-summary");
const ticketCode = document.querySelector("#ticket-code");
const modeEl = document.querySelector("#mode");
const generatedEl = document.querySelector("#generated");

let activeId = "";

function money(value) {
  if (!Number.isFinite(value) || value === 0) return "-";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumSignificantDigits: 5
  }).format(value);
}

function pct(value) {
  if (!Number.isFinite(value)) return "-";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

function decisionClass(direction) {
  if (direction === "BUY_BELOW") return "buy";
  if (direction === "SELL_ABOVE") return "sell";
  return "wait";
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function selectSignal(item) {
  activeId = item.id;
  document.querySelectorAll(".signal").forEach((el) => {
    el.classList.toggle("active", el.dataset.id === item.id);
  });
  ticketTitle.textContent = `${item.symbol} ${item.decision.direction.replace("_", " ")}`;
  ticketTitle.className = decisionClass(item.decision.direction);
  ticketSummary.textContent = item.decision.summary;
  ticketCode.textContent = JSON.stringify(item.decision.triggerDraft, null, 2);
}

function render(data) {
  modeEl.textContent = data.mode;
  generatedEl.textContent = new Date(data.generatedAt).toLocaleString();
  resultsEl.innerHTML = "";
  data.results.forEach((item) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "signal";
    button.dataset.id = item.id;
    const direction = item.decision.direction.replace("_", " ");
    const logo = el("div", "logo");
    if (item.icon) {
      const img = document.createElement("img");
      img.src = item.icon;
      img.alt = "";
      logo.appendChild(img);
    }

    const name = el("div", "name");
    const title = document.createElement("strong");
    title.textContent = `${item.name} `;
    title.appendChild(el("span", "", item.symbol));
    const chips = el("div", "chips");
    chips.append(
      el("span", `chip ${decisionClass(item.decision.direction)}`, direction),
      el("span", "chip", item.verification),
      el("span", "chip", `block ${item.blockId ?? "-"}`)
    );
    name.append(title, chips);

    const metrics = el("div", "metrics");
    [
      ["Price", money(item.usdPrice)],
      ["24h", pct(item.score.priceChange24h)],
      ["Risk", item.score.risk.toFixed(0)]
    ].forEach(([label, value]) => {
      const metric = document.createElement("div");
      metric.append(el("span", "", label), el("strong", "", value));
      metrics.appendChild(metric);
    });

    button.append(logo, name, metrics);
    button.addEventListener("click", () => selectSignal(item));
    resultsEl.appendChild(button);
  });
  if (data.results.length) {
    selectSignal(data.results.find((item) => item.id === activeId) || data.results[0]);
  } else {
    ticketTitle.textContent = "No signals";
    ticketSummary.textContent = "Try another token query.";
    ticketCode.textContent = "{}";
  }
}

async function scan(query) {
  const loading = el("div", "signal");
  const name = el("div", "name");
  name.append(el("strong", "", "Scanning Jupiter APIs..."), el("span", "", "Tokens, Price, and local strategy engine"));
  loading.appendChild(name);
  resultsEl.replaceChildren(loading);
  const res = await fetch(`/api/scan?query=${encodeURIComponent(query)}`);
  if (!res.ok) {
    throw new Error(await res.text());
  }
  render(await res.json());
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  scan(queryInput.value).catch((error) => {
    renderError(error);
  });
});

scan(queryInput.value).catch((error) => {
  renderError(error);
});

function renderError(error) {
  const failed = el("div", "signal");
  const name = el("div", "name");
  name.append(el("strong", "", "Scan failed"), el("span", "", error.message));
  failed.appendChild(name);
  resultsEl.replaceChildren(failed);
}
