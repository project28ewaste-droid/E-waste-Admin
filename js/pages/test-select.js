// Working test · step 1 (test.html): list the dustbins.
// "Open" (only when Online) replaces bins/<MAC>/Operations with { Door: 1 } in Realtime Database
// (all other Operations values are deleted), then goes to the waste-type screen.
import { startPage } from "../app.js";
import { $, safe } from "../utils/dom.js";
import { pageUrl } from "../utils/paths.js";
import { pill } from "../components/pill.js";
import { toast } from "../components/toast.js";
import { state, emptyMessage, binName } from "../store.js";
import { replaceOperations } from "../devices.js";
import { TEST_WASTE_PAGE, OPERATIONS } from "../config/app-config.js";

let opening = null; // MAC currently being opened

const binCard = b => `
  <div class="test-bin">
    <div class="bin-idline">
      <span class="bin-icon large" aria-hidden="true">🗑️</span>
      <div>
        <div class="test-bin-name">${safe(binName(b))}</div>
        <div class="sub">${safe(b.id)}</div>
      </div>
    </div>
    <div>${pill(b.status)}</div>
    ${openButton(b)}
  </div>`;

// Only an Online dustbin can be opened.
function openButton(b) {
  if (opening === b.id) return '<button class="primary" disabled>Opening…</button>';
  if (b.status === "Online") return `<button class="primary" data-open="${safe(b.id)}">Open</button>`;
  const reason = b.status === "Offline" ? "Dustbin offline" : "Checking dustbin…";
  return `<button class="primary" disabled title="Dustbin must be online to open">${reason}</button>`;
}

function renderTestSelect() {
  $("testBins").innerHTML = state.bins.map(binCard).join("") || `<p class="muted">${safe(emptyMessage("bins"))}</p>`;
}

async function openBin(mac) {
  if (opening) return;
  const bin = state.bins.find(b => b.id === mac);
  if (bin?.status !== "Online") return toast("Dustbin must be online to open.");

  opening = mac;
  renderTestSelect();
  try {
    // Fresh start: Operations becomes just { Door: 1 } — old sensor/results are deleted.
    await replaceOperations(mac, { [OPERATIONS.doorField]: OPERATIONS.doorOpen });
    location.href = `${pageUrl(TEST_WASTE_PAGE)}?id=${encodeURIComponent(mac)}`;
  } catch (err) {
    console.error(err);
    toast(`Could not open dustbin: ${err.code || err.message}`);
    opening = null;
    renderTestSelect();
  }
}

function initTestSelect() {
  $("testBins").addEventListener("click", e => {
    const btn = e.target.closest("[data-open]");
    if (btn) openBin(btn.dataset.open);
  });
}

startPage({ page: "test", collections: ["bins"], init: initTestSelect, render: renderTestSelect, bare: true });
