// Rewards page: points and voucher transactions.
import { startPage } from "../app.js";
import { $, safe, emptyRow } from "../utils/dom.js";
import { pill } from "../components/pill.js";
import { state, emptyMessage } from "../store.js";

const formatPoints = p => (p > 0 ? `+${p}` : p < 0 ? `−${Math.abs(p)}` : "0");

const rewardRow = r => `
  <tr>
    <td>${safe(r.id)}</td>
    <td>${safe(r.user)}</td>
    <td>${safe(r.activity)}</td>
    <td>${formatPoints(r.points)}</td>
    <td>${safe(r.date)}</td>
    <td>${pill(r.status)}</td>
  </tr>`;

export function renderRewards() {
  const all = state.rewards;
  const vouchers = all.filter(r => /voucher/i.test(r.activity || ""));

  $("rewardsTable").innerHTML = all.map(rewardRow).join("") || emptyRow(6, emptyMessage("rewards"));

  $("rwIssued").textContent = all.filter(r => r.points > 0).reduce((n, r) => n + r.points, 0).toLocaleString();
  $("rwRedeemed").textContent = Math.abs(all.filter(r => r.points < 0).reduce((n, r) => n + r.points, 0)).toLocaleString();
  $("rwPending").textContent = vouchers.filter(r => r.status === "Pending").length;
  $("rwVouchers").textContent = vouchers.length;
}

startPage({ page: "rewards", collections: ["rewards"], render: renderRewards });
