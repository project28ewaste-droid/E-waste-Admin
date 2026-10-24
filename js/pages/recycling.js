// Recycling page: transfer history + "Record transfer" form.
import { startPage } from "../app.js";
import { $, safe, emptyRow, onInputs, searchValue } from "../utils/dom.js";
import { kg, sum, num } from "../utils/format.js";
import { pill } from "../components/pill.js";
import { openModal } from "../components/modal.js";
import { state, saveRecord, nextId, emptyMessage } from "../store.js";

const STAGES = ["Awaiting pickup", "Sent to recycler", "Recycled confirmed"];

const recyclingRow = r => `
  <tr>
    <td>${safe(r.id)}</td>
    <td>${safe(r.bin)}</td>
    <td>${safe(r.facility)}</td>
    <td>${kg(r.weight)}</td>
    <td>${safe(r.date)}</td>
    <td>${pill(r.stage)}</td>
  </tr>`;

export function renderRecycling() {
  const all = state.recycling;
  const q = searchValue("recycleSearch");
  const stage = $("recycleFilter").value;
  const list = all.filter(
    r => `${r.id} ${r.bin} ${r.facility}`.toLowerCase().includes(q) && (stage === "all" || r.stage === stage)
  );

  $("recycleTable").innerHTML = list.map(recyclingRow).join("") || emptyRow(6, emptyMessage("recycling", all.length > 0));

  $("recAwaiting").textContent = kg(sum(all.filter(r => r.stage === "Awaiting pickup"), "weight"));
  $("recSent").textContent = kg(sum(all.filter(r => r.stage !== "Awaiting pickup"), "weight"));
  $("batchCount").textContent = all.length;
  $("recConfirmed").textContent = all.filter(r => r.stage === "Recycled confirmed").length;
}

function openAddRecycling() {
  openModal({
    title: "Record recycling transfer",
    fields: [
      { name: "bin", label: "Source bin(s)", placeholder: "B01, B02", required: true },
      { name: "facility", label: "Recycler / facility", required: true },
      { name: "weight", label: "Weight in kg", type: "number", required: true },
      { name: "date", label: "Transfer date", type: "date", value: new Date().toISOString().slice(0, 10), required: true },
      { name: "stage", label: "Stage", options: STAGES },
    ],
    onSave: d => {
      const id = nextId(state.recycling, "RB");
      return saveRecord("recycling", id, { bin: d.bin, facility: d.facility, weight: num(d.weight), date: d.date, stage: d.stage });
    },
  });
}

export function initRecycling() {
  onInputs(["recycleSearch", "recycleFilter"], renderRecycling);
  $("addRecycle").onclick = openAddRecycling;
}

startPage({ page: "recycling", collections: ["recycling"], init: initRecycling, render: renderRecycling });
