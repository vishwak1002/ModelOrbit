const DATA_URL = "../../data/normalized/models.json";
const state = { models: [], lens: "both", pipeline: "all", query: "", view: "galaxy", selectedId: null };
const els = {
  snapshotDate: document.querySelector("#snapshot-date"), catalogCount: document.querySelector("#catalog-count"), readyCount: document.querySelector("#ready-count"), sourceName: document.querySelector("#source-name"), sourceChecksum: document.querySelector("#source-checksum"), lens: document.querySelector("#lens"), search: document.querySelector("#search"), pipeline: document.querySelector("#pipeline-filter"), resultHeading: document.querySelector("#result-heading"), resultCount: document.querySelector("#result-count"), empty: document.querySelector("#galaxy-empty"), error: document.querySelector("#galaxy-error"), errorCopy: document.querySelector("#error-copy"), stage: document.querySelector("#galaxy-stage"), tableStage: document.querySelector("#table-stage"), nodes: document.querySelector("#orbit-nodes"), table: document.querySelector("#model-table"), showAll: document.querySelector("#show-all"), retry: document.querySelector("#retry"), inspectorEmpty: document.querySelector("#inspector-empty"), inspectorContent: document.querySelector("#inspector-content"), inspectorStatus: document.querySelector("#inspector-status"), modelTitle: document.querySelector("#model-title"), modelAuthor: document.querySelector("#model-author"), modelSource: document.querySelector("#model-source"), modelRevision: document.querySelector("#model-revision"), modelPipeline: document.querySelector("#model-pipeline"), modelIos: document.querySelector("#model-ios"), modelAndroid: document.querySelector("#model-android"), modelParams: document.querySelector("#model-params"), modelAge: document.querySelector("#model-age"), freshness: document.querySelector("#freshness-banner")
};

const statusLabel = (status) => ({ ready: "Verified", partial: "Partial", blocked: "Blocked", failed: "Failed", unknown: "Not tested", stale: "Stale" }[status] ?? "Unknown");
const formatParams = (value) => { if (!value) return "Not reported"; if (value >= 1e9) return `${(value / 1e9).toFixed(1)}B`; if (value >= 1e6) return `${(value / 1e6).toFixed(0)}M`; return value.toLocaleString(); };
const pipelineLabel = (value) => value.replaceAll("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
const modelStatus = (model) => model.status || "unknown";

function setSnapshotMeta(payload) {
  const date = payload.sourceSnapshot.replace("-models.tsv", "");
  els.snapshotDate.textContent = date;
  els.catalogCount.textContent = payload.records.length;
  els.readyCount.textContent = payload.records.filter((model) => modelStatus(model) === "ready").length;
  els.sourceName.textContent = payload.sourceSnapshot.replace(".tsv", "");
  els.sourceChecksum.textContent = payload.sourceChecksum.slice(0, 16) + "…";
}

function filteredModels() {
  return state.models.filter((model) => {
    const searchable = `${model.modelId} ${model.author} ${model.pipeline}`.toLowerCase();
    const matchesQuery = !state.query || searchable.includes(state.query.toLowerCase());
    const matchesPipeline = state.pipeline === "all" || model.pipeline === state.pipeline;
    const status = modelStatus(model);
    const matchesLens = state.lens === "all" || (state.lens === "both" && status === "ready") || (state.lens === "ios" && ["ready", "partial"].includes(model.iosStatus)) || (state.lens === "android" && ["ready", "partial"].includes(model.androidStatus));
    return matchesQuery && matchesPipeline && matchesLens;
  });
}

function nodePosition(index, total) {
  const angle = (index / Math.max(total, 1)) * Math.PI * 2 - Math.PI / 2;
  const ring = 105 + (index % 3) * 72;
  return { x: 365 + Math.cos(angle) * ring * 1.38, y: 260 + Math.sin(angle) * ring * .8 };
}

function renderGalaxy(models) {
  els.nodes.replaceChildren();
  models.forEach((model, index) => {
    const { x, y } = nodePosition(index, models.length);
    const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
    group.classList.add("orbit-node", modelStatus(model));
    group.dataset.modelId = model.id;
    group.setAttribute("tabindex", "0");
    group.setAttribute("role", "button");
    group.setAttribute("aria-label", `${model.modelId}, ${statusLabel(modelStatus(model))}, ${pipelineLabel(model.pipeline)}`);
    group.innerHTML = `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="6"></circle><text x="${(x + 12).toFixed(1)}" y="${(y + 4).toFixed(1)}">${model.modelId.split("/").pop().slice(0, 22)}</text>`;
    group.addEventListener("click", () => selectModel(model.id));
    group.addEventListener("keydown", (event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); selectModel(model.id); } });
    els.nodes.append(group);
  });
}

function renderTable(models) {
  els.table.replaceChildren();
  models.forEach((model) => {
    const row = document.createElement("tr");
    row.className = "model-row";
    row.tabIndex = 0;
    row.innerHTML = `<td>${model.modelId}</td><td>${pipelineLabel(model.pipeline)}</td><td><span class="table-status ${model.iosStatus}">${statusLabel(model.iosStatus)}</span></td><td><span class="table-status ${model.androidStatus}">${statusLabel(model.androidStatus)}</span></td><td><a href="${model.url}" target="_blank" rel="noreferrer">Source ↗</a></td>`;
    row.addEventListener("click", (event) => { if (event.target.closest("a")) return; selectModel(model.id); });
    row.addEventListener("keydown", (event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); selectModel(model.id); } });
    els.table.append(row);
  });
}

function renderInspector(model) {
  if (!model) { els.inspectorEmpty.hidden = false; els.inspectorContent.hidden = true; return; }
  els.inspectorEmpty.hidden = true;
  els.inspectorContent.hidden = false;
  const status = modelStatus(model);
  els.inspectorStatus.className = `status-badge ${status}`;
  els.inspectorStatus.textContent = statusLabel(status);
  els.modelTitle.textContent = model.modelId;
  els.modelAuthor.textContent = `by ${model.author}`;
  els.modelSource.href = model.url;
  els.modelRevision.textContent = model.revision || "Pending ingest";
  els.modelPipeline.textContent = pipelineLabel(model.pipeline);
  els.modelIos.textContent = statusLabel(model.iosStatus);
  els.modelAndroid.textContent = statusLabel(model.androidStatus);
  els.modelParams.textContent = formatParams(model.parameters);
  els.modelAge.textContent = model.evidenceAgeDays ? `${model.evidenceAgeDays} days` : "No run yet";
}

function selectModel(id) {
  state.selectedId = id;
  const model = state.models.find((candidate) => candidate.id === id);
  renderInspector(model);
  document.querySelectorAll(".orbit-node").forEach((node) => node.classList.toggle("selected", node.dataset.modelId === id));
}

function render() {
  const models = filteredModels();
  const isBoth = state.lens === "both";
  els.resultHeading.textContent = isBoth ? "Verified cross-platform models" : state.lens === "all" ? "Full catalog" : `${state.lens === "ios" ? "iPhone" : "Android"} lane`;
  els.resultCount.textContent = `${models.length} ${models.length === 1 ? "record" : "records"}`;
  els.empty.hidden = models.length !== 0;
  els.stage.hidden = models.length === 0 || state.view !== "galaxy";
  els.tableStage.hidden = models.length === 0 || state.view !== "table";
  if (models.length) { renderGalaxy(models); renderTable(models); }
  if (state.selectedId && !models.some((model) => model.id === state.selectedId)) renderInspector(null);
  if (!state.selectedId && models.length === 1) selectModel(models[0].id);
}

function showError(error) {
  els.stage.hidden = true; els.empty.hidden = true; els.error.hidden = false; els.errorCopy.textContent = error instanceof Error ? error.message : "The last valid snapshot could not be loaded.";
}

async function loadData() {
  els.error.hidden = true;
  try {
    const response = await fetch(DATA_URL, { cache: "no-store" });
    if (!response.ok) throw new Error(`Snapshot request returned ${response.status}.`);
    const payload = await response.json();
    if (!Array.isArray(payload.records) || payload.records.length !== 26) throw new Error("Snapshot validation expected 26 model records.");
    state.models = payload.records;
    setSnapshotMeta(payload);
    const pipelines = [...new Set(state.models.map((model) => model.pipeline))].sort();
    pipelines.forEach((pipeline) => { const option = document.createElement("option"); option.value = pipeline; option.textContent = pipelineLabel(pipeline); els.pipeline.append(option); });
    render();
  } catch (error) { showError(error); }
}

els.lens.addEventListener("change", (event) => { state.lens = event.target.value; render(); });
els.search.addEventListener("input", (event) => { state.query = event.target.value.trim(); render(); });
els.pipeline.addEventListener("change", (event) => { state.pipeline = event.target.value; render(); });
document.querySelectorAll(".view-button").forEach((button) => button.addEventListener("click", () => { state.view = button.dataset.view; document.querySelectorAll(".view-button").forEach((candidate) => candidate.classList.toggle("active", candidate === button)); render(); }));
els.showAll.addEventListener("click", () => { state.lens = "all"; els.lens.value = "all"; render(); });
els.retry.addEventListener("click", loadData);

loadData();
