// Bin detail page (bin-detail.html?id=B01): opened by clicking any element with data-bin="B01".
import { startPage } from "../app.js";
import { $, safe, emptyRow } from "../utils/dom.js";
import { kg, sum, timeAgo, splitIds } from "../utils/format.js";
import { pill, fillBar } from "../components/pill.js";
import { state } from "../store.js";

const currentBinId = new URLSearchParams(location.search).get("id");

const table = (headers, rows) => `
  <div class="tablewrap">
    <table>
      <thead><tr>${headers.map(h => `<th>${h}</th>`).join("")}</tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </div>`;

function renderBinDetail() {
  const id = currentBinId;
  const b = state.bins.find(x => x.id === id);
  if (!b) {
    $("detailContent").innerHTML = `<p class="muted">${id ? `Bin “${safe(id)}” was not found.` : "No bin selected."}</p>`;
    return;
  }

  const deposits = state.deposits.filter(d => d.bin === id);
  const accepted = deposits.filter(d => d.status === "Accepted");
  const trips = state.trips.filter(t => splitIds(t.bins).includes(id));
  const recycling = state.recycling.filter(r => splitIds(r.bin).includes(id));

  const categories = {};
  accepted.forEach(d => (categories[d.type] = (categories[d.type] || 0) + d.weight));

  $("detailTitle").innerHTML = `
    <span class="bin-idline">
      <span class="bin-icon large" aria-hidden="true">🗑️</span>
      <span>${safe(b.id)} · ${safe(b.loc)}</span>
    </span>`;
  $("detailSubtitle").textContent = `Bin ID ${b.id} · Location: ${b.loc}`;
  $("detailStatus").innerHTML = pill(b.status);

  const categoryRows =
    Object.entries(categories).map(([type, w]) => `<tr><td>${safe(type)}</td><td>${kg(w, 2)}</td></tr>`).join("") ||
    emptyRow(2, "No accepted deposits recorded for this bin.");

  const depositRows =
    deposits.map(d => `<tr><td>${safe(d.id)}</td><td>${safe(d.user)}</td><td>${safe(d.type)}</td><td>${kg(d.weight, 2)}</td><td>${safe(d.date)}</td><td>${pill(d.status)}</td></tr>`).join("") ||
    emptyRow(6, "No deposit history recorded.");

  const tripRows =
    trips.map(t => `<tr><td>${safe(t.id)}</td><td>${safe(t.vehicle)}</td><td>${safe(t.driver)}</td><td>${safe(t.date)}</td><td>${kg(t.weight)}</td><td>${pill(t.status)}</td></tr>`).join("") ||
    emptyRow(6, "No collection trips recorded for this bin.");

  const recyclingRows =
    recycling.map(r => `<tr><td>${safe(r.id)}</td><td>${safe(r.facility)}</td><td>${kg(r.weight)}</td><td>${safe(r.date)}</td><td>${pill(r.stage)}</td></tr>`).join("") ||
    emptyRow(5, "No recycling transfers recorded for this bin.");

  const updated = safe(timeAgo(b.updated));

  $("detailContent").innerHTML = `
    <div class="detailstats">
      <div class="stat"><label>♻ Accepted deposit weight</label><strong>${kg(sum(accepted, "weight"), 2)}</strong><span class="muted">${accepted.length} accepted deposits</span></div>
      <div class="stat"><label>Bin fill level</label><strong>${b.fill}%</strong>${fillBar(b.fill)}</div>
      <div class="stat"><label>Collection trips</label><strong>${trips.length}</strong><span class="muted">${trips.filter(t => t.status === "Completed").length} completed</span></div>
      <div class="stat"><label>Waste weight (sensor)</label><strong>${kg(b.weight)}</strong><span class="muted">Last reply ${updated}</span></div>
    </div>

    <div class="grid">
      <div class="card">
        <h2>Current sensor readings</h2>
        <div class="tablewrap"><table><tbody>
          <tr><th>Fill sensor</th><td>${b.fill}%</td></tr>
          <tr><th>Weight sensor</th><td>${kg(b.weight)}</td></tr>
          <tr><th>Temperature</th><td>${b.temp === null ? "No reading" : `${b.temp} °C`}</td></tr>
          <tr><th>Connectivity / status</th><td>${pill(b.status)}</td></tr>
          <tr><th>Last reply</th><td>${updated}</td></tr>
        </tbody></table></div>
      </div>
      <div class="card">
        <h2>♻ Waste categories</h2>
        <div class="sub">Accepted deposit weights by category</div>
        ${table(["Waste type", "Weight"], categoryRows)}
      </div>
    </div>

    <div class="card">
      <h2>🗑️ User deposit history</h2>
      <div class="sub">Every recorded deposit associated with ${safe(b.id)}</div>
      ${table(["Deposit ID", "User", "Waste type", "Weight", "Date/time", "Status"], depositRows)}
    </div>

    <div class="card">
      <h2>🚚 Vehicle collection history</h2>
      <div class="sub">${trips.length} trip record(s) associated with this bin</div>
      ${table(["Trip ID", "Vehicle", "Driver", "Date/time", "Trip weight", "Status"], tripRows)}
    </div>

    <div class="card">
      <h2>♻ Recycling and collection transfers</h2>
      ${table(["Batch ID", "Facility", "Weight", "Date", "Stage"], recyclingRows)}
    </div>`;
}

startPage({
  page: "binDetail",
  collections: ["bins", "deposits", "trips", "recycling"],
  render: renderBinDetail,
});
