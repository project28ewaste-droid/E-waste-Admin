// Users & Deposits page (users.html).
import { startPage } from "../app.js";
import { $, safe, emptyRow, onInputs, searchValue } from "../utils/dom.js";
import { kg, sum } from "../utils/format.js";
import { pill } from "../components/pill.js";
import { state, emptyMessage } from "../store.js";

const depositRow = d => `
  <tr>
    <td>${safe(d.id)}</td>
    <td>${safe(d.user)}</td>
    <td>${safe(d.bin)}</td>
    <td>${kg(d.weight, 2)}</td>
    <td>${safe(d.type)}</td>
    <td>${safe(d.date)}</td>
    <td>${pill(d.status)}</td>
  </tr>`;

export function renderDeposits() {
  const all = state.deposits;
  const q = searchValue("depositSearch");
  const status = $("depositFilter").value;
  const list = all.filter(
    d => `${d.id} ${d.user} ${d.bin} ${d.type}`.toLowerCase().includes(q) && (status === "all" || d.status === status)
  );

  $("depositsTable").innerHTML = list.map(depositRow).join("") || emptyRow(7, emptyMessage("deposits", all.length > 0));

  const accepted = all.filter(d => d.status === "Accepted");
  $("depUsers").textContent = new Set(all.map(d => d.user)).size;
  $("depAccepted").textContent = accepted.length;
  $("depositCount").textContent = all.length;
  $("depAverage").textContent = kg(accepted.length ? sum(accepted, "weight") / accepted.length : 0, 2);
}

export function initDeposits() {
  onInputs(["depositSearch", "depositFilter"], renderDeposits);
}

startPage({ page: "users", collections: ["deposits"], init: initDeposits, render: renderDeposits });
