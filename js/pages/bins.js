// Dustbins page: one row per ESP32 (MAC address), with live Online/Offline status.
import { startPage } from "../app.js";
import { $, safe, emptyRow, onInputs, searchValue } from "../utils/dom.js";
import { kg, timeAgo } from "../utils/format.js";
import { pill, fillBar } from "../components/pill.js";
import { openModal } from "../components/modal.js";
import { toast } from "../components/toast.js";
import { state, saveRecord, emptyMessage } from "../store.js";
import { FILL_ALERT_LEVEL } from "../config/app-config.js";

const binRow = b => `
  <tr data-bin="${safe(b.id)}" title="Open bin details">
    <td>
      <div class="bin-idline">
        <span class="bin-icon" aria-hidden="true">🗑️</span>
        <div><b>${safe(b.id)}</b><br><small>${safe(b.loc)}</small></div>
      </div>
    </td>
    <td>${kg(b.weight)}</td>
    <td>${fillBar(b.fill)}${b.fill}%</td>
    <td>${b.temp === null ? "—" : `${b.temp}°C`}</td>
    <td>${safe(timeAgo(b.updated))}</td>
    <td>${pill(b.status)}</td>
  </tr>`;

export function renderBins() {
  const q = searchValue("binSearch");
  const status = $("binFilter").value;
  const list = state.bins.filter(
    b => `${b.id} ${b.loc}`.toLowerCase().includes(q) && (status === "all" || b.status === status)
  );

  $("binsTable").innerHTML = list.map(binRow).join("") || emptyRow(6, emptyMessage("bins", state.bins.length > 0));

  $("binTotal").textContent = state.bins.length;
  $("pickupCount").textContent = state.bins.filter(b => b.fill >= FILL_ALERT_LEVEL).length;
  $("binOnline").textContent = state.bins.filter(b => b.status === "Online").length;
  $("binOffline").textContent = state.bins.filter(b => b.status === "Offline").length;
}

// Bins themselves come from the ESP32 MACs; this only saves the location to Firestore bins/<MAC>.
function openSetLocation() {
  if (!state.bins.length) return toast("No ESP32 bins found yet.");
  openModal({
    title: "Set bin location",
    fields: [
      { name: "id", label: "Bin (MAC address)", options: state.bins.map(b => b.id) },
      { name: "loc", label: "Location", placeholder: "College Main Gate", required: true },
    ],
    onSave: d => saveRecord("bins", d.id, { loc: d.loc.trim() }, { merge: true }),
  });
}

export function initBins() {
  onInputs(["binSearch", "binFilter"], renderBins);
  $("setLocation").onclick = openSetLocation;
}

startPage({ page: "bins", collections: ["bins"], init: initBins, render: renderBins });
