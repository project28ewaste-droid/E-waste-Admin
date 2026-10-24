// Overview page: headline stats, bin cards, recent activity, latest deposits.
import { startPage } from "../app.js";
import { $, safe } from "../utils/dom.js";
import { kg, sum } from "../utils/format.js";
import { pill, fillBar } from "../components/pill.js";
import { state } from "../store.js";

const binCard = b => `
  <div class="bin" data-bin="${safe(b.id)}" role="button" tabindex="0" title="Open bin details">
    <div class="binrow">
      <div class="bin-idline">
        <span class="bin-icon" aria-hidden="true">🗑️</span>
        <div>
          <div class="binname">${safe(b.id)} · ${safe(b.loc)}</div>
          <div class="sub">${kg(b.weight)} recorded</div>
        </div>
      </div>
      ${pill(b.status)}
    </div>
    ${fillBar(b.fill)}
    <div class="sub">Fill level ${b.fill}%</div>
  </div>`;

const activityItem = a => `
  <div class="activity">
    <b>${safe(a.title)}</b><br>
    <span class="sub">${safe(a.meta)}</span> &nbsp; ${pill(a.status)}
  </div>`;

export function renderOverview() {
  const { bins, deposits, trips } = state;
  const accepted = deposits.filter(d => d.status === "Accepted");

  $("ovBins").textContent = bins.length;
  $("ovOnline").textContent = `${bins.filter(b => b.status === "Online").length} online`;
  $("ovCollected").textContent = kg(sum(accepted, "weight"));
  $("ovUsers").textContent = new Set(deposits.map(d => d.user)).size;
  $("ovTrips").textContent = trips.filter(t => t.status === "Completed").length;

  $("overviewBins").innerHTML = bins.slice(0, 4).map(binCard).join("") || '<p class="muted">No bins yet.</p>';

  const activity = [
    ...deposits.slice(0, 3).map(d => ({ title: `${d.user} deposited ${kg(d.weight, 2)}`, meta: `${d.bin} · ${d.date}`, status: d.status })),
    ...trips.slice(0, 1).map(t => ({ title: `Collection ${t.id}`, meta: `${t.vehicle} · ${t.date}`, status: t.status })),
  ];
  $("activity").innerHTML = activity.map(activityItem).join("") || '<p class="muted">No activity yet.</p>';

  $("latestDeposits").innerHTML = deposits
    .slice(0, 4)
    .map(d => `<tr><td>${safe(d.user)}</td><td>${safe(d.bin)}</td><td>${kg(d.weight, 2)}</td><td>${safe(d.type)}</td><td>${pill(d.status)}</td></tr>`)
    .join("");
}

startPage({ page: "overview", collections: ["bins", "deposits", "trips"], render: renderOverview });
