// Working test · step 2 (test-waste.html?id=<MAC>): the user picks which type of waste they are putting in.
// After choosing, wait OPERATIONS.closeDelayMs (2 s), then in one write:
//   Operations/Door = 0 and Operations/sensor = "updates" → then go to step 3.
// (Old results were already deleted when "Open" was pressed on step 1.)
import { startPage } from "../app.js";
import { $, safe } from "../utils/dom.js";
import { pageUrl, isReload } from "../utils/paths.js";
import { pill } from "../components/pill.js";
import { toast } from "../components/toast.js";
import { state, binName } from "../store.js";
import { setOperations } from "../devices.js";
import { WASTE_TYPES, OPERATIONS, TEST_PAGE, TEST_SENSORS_PAGE } from "../config/app-config.js";

const binId = new URLSearchParams(location.search).get("id");
let selected = null;
let submitting = false; // true from the moment a type is chosen until we leave the page

const wasteCard = (w, enabled) => `
  <button class="waste-card ${selected === w.id ? "selected" : ""}" data-waste="${safe(w.id)}" ${enabled ? "" : "disabled"}>
    <span class="waste-icon" aria-hidden="true">${w.icon}</span>
    <span class="waste-label">${safe(w.label)}</span>
    <span class="sub">${safe(w.hint)}</span>
  </button>`;

const currentBin = () => state.bins.find(b => b.id === binId);
const isOnline = () => currentBin()?.status === "Online";

// Message shown while the dustbin is not usable (null = online, all good).
function blockedMessage(bin) {
  if (!bin) return `Dustbin not found. <a href="test.html">Choose another dustbin</a>.`;
  if (bin.status === "Offline") return `⚠ This dustbin is offline. <a href="test.html">Choose another dustbin</a>.`;
  if (bin.status !== "Online") return "Checking the dustbin is online…";
  return null;
}

function renderTestWaste() {
  const bin = currentBin();
  $("testBinInfo").innerHTML = bin
    ? `Dustbin: <b>${safe(binName(bin))}</b> · ${pill(bin.status)}`
    : `Dustbin <b>${safe(binId || "—")}</b>`;

  // Once a type is chosen the door must still be closed, so ignore status changes from here on.
  const blocked = submitting ? null : blockedMessage(bin);
  if (blocked) selected = null;
  $("wasteGrid").innerHTML = WASTE_TYPES.map(w => wasteCard(w, !blocked && !submitting)).join("");
  $("testBlocked").innerHTML = blocked || "";
  $("testBlocked").classList.toggle("hidden", !blocked);
  if (blocked) $("testResult").innerHTML = "";
}

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

// Called when the user taps a waste type.
async function onWasteSelected(type) {
  if (submitting || !isOnline()) return;
  submitting = true;
  selected = type.id;
  renderTestWaste();
  $("testResult").innerHTML = `<span class="pill">Selected: ${safe(type.label)}</span><p class="muted">Closing the door…</p>`;

  await wait(OPERATIONS.closeDelayMs);
  try {
    await setOperations(binId, {
      [OPERATIONS.doorField]: OPERATIONS.doorClose,
      [OPERATIONS.sensorField]: OPERATIONS.sensorUpdates,
    });
    location.href = `${pageUrl(TEST_SENSORS_PAGE)}?id=${encodeURIComponent(binId)}&type=${encodeURIComponent(type.id)}`;
  } catch (err) {
    console.error(err);
    toast(`Could not close the door: ${err.code || err.message}`);
    $("testResult").innerHTML = `<span class="pill bad">Failed to close the door — tap a waste type to retry.</span>`;
    submitting = false;
    selected = null;
    renderTestWaste();
  }
}

function initTestWaste() {
  $("wasteGrid").addEventListener("click", e => {
    const card = e.target.closest("[data-waste]");
    if (card) onWasteSelected(WASTE_TYPES.find(w => w.id === card.dataset.waste));
  });
}

// Refreshing any test step starts the test again from "Choose a dustbin".
if (isReload()) location.replace(pageUrl(TEST_PAGE));
else startPage({ page: "testWaste", collections: ["bins"], init: initTestWaste, render: renderTestWaste, bare: true });
