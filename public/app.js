const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const state = {
  mode: "demo",
  report: null,
  meta: null,
  title: ""
};

const els = {
  form: $("#auditForm"),
  title: $("#titleInput"),
  requirements: $("#requirementsInput"),
  diff: $("#diffInput"),
  tests: $("#testsInput"),
  run: $("#runAudit"),
  empty: $("#emptyState"),
  loading: $("#loadingState"),
  report: $("#reportView"),
  toast: $("#toast")
};

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function showToast(message) {
  els.toast.textContent = message;
  els.toast.hidden = false;
  clearTimeout(showToast.timeout);
  showToast.timeout = setTimeout(() => { els.toast.hidden = true; }, 3200);
}

function setLoading(loading) {
  els.empty.hidden = true;
  els.loading.hidden = !loading;
  els.report.hidden = loading || !state.report;
  els.run.disabled = loading;
  $(".button-label").textContent = loading ? "Auditing evidence..." : "Run evidence audit";
}

function updateCounts() {
  const criteria = els.requirements.value.split(/\n+/).filter((line) => line.trim()).length;
  const changed = els.diff.value.split("\n").filter((line) => /^[+-](?![+-])/.test(line)).length;
  $("#criteriaCount").textContent = `${criteria} ${criteria === 1 ? "criterion" : "criteria"}`;
  $("#diffCount").textContent = `${changed} changed ${changed === 1 ? "line" : "lines"}`;
}

async function loadSample({ announce = true } = {}) {
  const response = await fetch("api/sample");
  const sample = await response.json();
  els.title.value = sample.title;
  els.requirements.value = sample.requirements;
  els.diff.value = sample.diff;
  els.tests.value = sample.tests;
  updateCounts();
  if (announce) showToast("Sample evidence loaded");
}

function verdictText(value) {
  return { ship: "Ready to ship", "ship-with-guards": "Ship with guards", hold: "Hold for fixes" }[value] || value;
}

function renderCriteria(criteria) {
  $("#criteriaRows").innerHTML = criteria.map((item) => `
    <tr>
      <td><strong>${escapeHtml(item.criterion)}</strong></td>
      <td><span class="status-pill status-${escapeHtml(item.status)}">${escapeHtml(item.status)}</span></td>
      <td>${escapeHtml(item.evidence)}</td>
      <td><strong>${item.confidence}%</strong><div class="confidence-bar"><span style="width:${item.confidence}%"></span></div></td>
    </tr>
  `).join("");
}

function renderRisks(risks) {
  $("#riskList").innerHTML = risks.map((risk) => `
    <article class="risk-item">
      <div><span class="severity-pill severity-${escapeHtml(risk.severity)}">${escapeHtml(risk.severity)}</span></div>
      <div>
        <h4>${escapeHtml(risk.title)}</h4>
        <p><code>${escapeHtml(risk.location)}</code></p>
        <p>${escapeHtml(risk.detail)}</p>
        <p class="mitigation"><strong>Mitigation:</strong> ${escapeHtml(risk.mitigation)}</p>
      </div>
    </article>
  `).join("");
}

function renderGaps(gaps) {
  $("#gapList").innerHTML = gaps.map((gap) => `
    <article class="gap-item">
      <div><span class="priority-pill priority-${escapeHtml(gap.priority)}">${escapeHtml(gap.priority)}</span></div>
      <div>
        <h4>${escapeHtml(gap.scenario)}</h4>
        <p>${escapeHtml(gap.why)}</p>
        <code>${escapeHtml(gap.suggestedTest)}</code>
      </div>
    </article>
  `).join("");
}

function renderActions(actions) {
  $("#actionList").innerHTML = actions.map((action) => `<li>${escapeHtml(action)}</li>`).join("");
}

function renderReport(report, meta) {
  state.report = report;
  state.meta = meta;
  state.title = els.title.value || "Untitled change";
  $("#reportTitle").textContent = state.title;
  $("#coverageScore").textContent = report.coverageScore;
  $("#scoreRing").style.setProperty("--score", `${report.coverageScore * 3.6}deg`);
  $("#verdictLabel").textContent = verdictText(report.verdict);
  $("#riskLevel").textContent = report.riskLevel;
  $("#confidenceScore").textContent = `${report.confidence}%`;
  $("#engineLabel").textContent = meta.mode === "live" ? meta.model : "Demo engine";
  $("#summaryText").textContent = report.summary;
  $("#criteriaTotal").textContent = report.criteria.length;
  $("#riskTotal").textContent = report.risks.length;
  $("#testTotal").textContent = report.testGaps.length;
  renderCriteria(report.criteria);
  renderRisks(report.risks);
  renderGaps(report.testGaps);
  renderActions(report.nextActions);
  $("#exportMarkdown").disabled = false;
  $("#exportJson").disabled = false;
  els.loading.hidden = true;
  els.report.hidden = false;
}

async function runAudit() {
  if (!els.requirements.value.trim() || !els.diff.value.trim()) {
    showToast("Add acceptance criteria and a code diff first");
    return;
  }
  setLoading(true);
  const phases = ["Mapping requirements to implementation...", "Inspecting risk boundaries...", "Comparing tests to promised behavior..."];
  let phase = 0;
  const phaseTimer = setInterval(() => {
    phase = (phase + 1) % phases.length;
    $("#loadingText").textContent = phases[phase];
  }, 900);
  try {
    const response = await fetch("api/analyze", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        title: els.title.value,
        requirements: els.requirements.value,
        diff: els.diff.value,
        tests: els.tests.value,
        mode: state.mode
      })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Audit failed");
    renderReport(data.report, data);
    showToast(data.mode === "live" ? `Audited with ${data.model}` : "Demo audit complete");
  } catch (error) {
    els.loading.hidden = true;
    els.empty.hidden = false;
    showToast(error.message);
  } finally {
    clearInterval(phaseTimer);
    els.run.disabled = false;
    $(".button-label").textContent = "Run evidence audit";
  }
}

function toMarkdown() {
  const report = state.report;
  const lines = [
    `# ChangeProof Audit: ${state.title}`,
    "",
    `- Verdict: ${verdictText(report.verdict)}`,
    `- Coverage: ${report.coverageScore}%`,
    `- Risk: ${report.riskLevel}`,
    `- Confidence: ${report.confidence}%`,
    `- Engine: ${state.meta.model}`,
    "",
    "## Conclusion",
    "",
    report.summary,
    "",
    "## Requirement Coverage",
    "",
    ...report.criteria.map((item) => `- **${item.status.toUpperCase()}** ${item.criterion}\n  - Evidence: ${item.evidence} (${item.confidence}% confidence)`),
    "",
    "## Risks",
    "",
    ...report.risks.map((risk) => `- **${risk.severity.toUpperCase()} — ${risk.title}**\n  - Location: ${risk.location}\n  - ${risk.detail}\n  - Mitigation: ${risk.mitigation}`),
    "",
    "## Missing Tests",
    "",
    ...report.testGaps.map((gap) => `- **${gap.priority} — ${gap.scenario}**\n  - ${gap.why}\n  - Suggested: ${gap.suggestedTest}`),
    "",
    "## Next Actions",
    "",
    ...report.nextActions.map((action, index) => `${index + 1}. ${action}`)
  ];
  return lines.join("\n");
}

function download(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function activateTab(name) {
  $$(".tab").forEach((tab) => tab.classList.toggle("active", tab.dataset.tab === name));
  $$(".tab-panel").forEach((panel) => panel.classList.toggle("active", panel.dataset.panel === name));
}

async function init() {
  try {
    const status = await fetch("api/status").then((response) => response.json());
    $("#modelLabel").textContent = status.liveAvailable ? `${status.model} ready` : "Demo ready · GPT-5.6 optional";
    if (!status.liveAvailable) {
      $("#liveMode").title = "Set OPENAI_API_KEY on the server to enable Live mode";
    }
    await loadSample({ announce: false });
    await runAudit();
  } catch (error) {
    $("#modelLabel").textContent = "Runtime unavailable";
    showToast(error.message);
  }
}

els.form.addEventListener("submit", (event) => { event.preventDefault(); runAudit(); });
$("#loadSample").addEventListener("click", () => loadSample());
els.requirements.addEventListener("input", updateCounts);
els.diff.addEventListener("input", updateCounts);
$$('.mode-button').forEach((button) => button.addEventListener("click", () => {
  state.mode = button.dataset.mode;
  $$(".mode-button").forEach((item) => item.classList.toggle("active", item === button));
  if (state.mode === "live") showToast("Live mode uses the server's OPENAI_API_KEY with GPT-5.6");
}));
$$('.tab').forEach((button) => button.addEventListener("click", () => activateTab(button.dataset.tab)));
$("#exportMarkdown").addEventListener("click", () => download("changeproof-audit.md", toMarkdown(), "text/markdown"));
$("#exportJson").addEventListener("click", () => download("changeproof-audit.json", JSON.stringify(state.report, null, 2), "application/json"));
document.addEventListener("keydown", (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
    event.preventDefault();
    runAudit();
  }
});

init();
