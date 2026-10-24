// Vehicles page: collection trips + "Schedule collection" form.
import { startPage } from "../app.js";
import { $, safe, emptyRow, onInputs, searchValue } from "../utils/dom.js";
import { kg, sum } from "../utils/format.js";
import { pill } from "../components/pill.js";
import { openModal } from "../components/modal.js";
import { state, saveRecord, nextId, emptyMessage } from "../store.js";

const tripRow = t => `
  <tr>
    <td>${safe(t.id)}</td>
    <td>${safe(t.vehicle)}</td>
    <td>${safe(t.driver)}</td>
    <td>${safe(t.bins)}</td>
    <td>${kg(t.weight)}</td>
    <td>${safe(t.date)}</td>
    <td>${pill(t.status)}</td>
  </tr>`;

export function renderVehicles() {
  const all = state.trips;
  const q = searchValue("tripSearch");
  const status = $("tripFilter").value;
  const list = all.filter(
    t => `${t.id} ${t.vehicle} ${t.driver} ${t.bins}`.toLowerCase().includes(q) && (status === "all" || t.status === status)
  );

  $("tripsTable").innerHTML = list.map(tripRow).join("") || emptyRow(7, emptyMessage("trips", all.length > 0));

  const completed = all.filter(t => t.status === "Completed");
  $("tripTotal").textContent = all.length;
  $("tripDone").textContent = completed.length;
  $("tripScheduled").textContent = all.filter(t => t.status === "Scheduled").length;
  $("tripWeight").textContent = kg(sum(completed, "weight"));
}

function openAddTrip() {
  openModal({
    title: "Schedule vehicle collection",
    fields: [
      { name: "vehicle", label: "Vehicle number", placeholder: "TN 09 AB 1234", required: true },
      { name: "driver", label: "Driver name", required: true },
      { name: "bins", label: "Bins to service", placeholder: "B01, B02", required: true },
      { name: "date", label: "Date and time", placeholder: "2026-10-20 09:00", required: true },
      { name: "status", label: "Status", options: ["Scheduled", "Completed", "Cancelled"] },
    ],
    onSave: d => {
      const id = nextId(state.trips, "TR");
      return saveRecord("trips", id, { vehicle: d.vehicle, driver: d.driver, bins: d.bins, date: d.date, weight: 0, status: d.status });
    },
  });
}

export function initVehicles() {
  onInputs(["tripSearch", "tripFilter"], renderVehicles);
  $("addTrip").onclick = openAddTrip;
}

startPage({ page: "vehicles", collections: ["trips"], init: initVehicles, render: renderVehicles });
