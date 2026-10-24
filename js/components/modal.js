// Reusable form modal.
//
// openModal({
//   title: "Register dustbin",
//   fields: [{ name, label, type?, placeholder?, required?, options? }],
//   onSave: async data => { ... }   // throw an Error to show it and keep the modal open
// });
import { $, safe } from "../utils/dom.js";
import { toast } from "./toast.js";

function fieldHtml(f) {
  const input = f.options
    ? `<select name="${f.name}">${f.options.map(o => `<option>${safe(o)}</option>`).join("")}</select>`
    : `<input name="${f.name}" type="${f.type || "text"}" ${f.type === "number" ? 'step="any"' : ""}
         placeholder="${safe(f.placeholder || "")}" value="${safe(f.value || "")}" ${f.required ? "required" : ""}>`;
  return `<div class="field"><label>${safe(f.label)}</label>${input}</div>`;
}

export function closeModal() {
  $("modalHost").innerHTML = "";
}

export function openModal({ title, fields, onSave }) {
  $("modalHost").innerHTML = `
    <div class="modalbg">
      <form class="modal" id="modalForm">
        <h2>${safe(title)}</h2>
        <p class="muted">Saved to Firestore.</p>
        ${fields.map(fieldHtml).join("")}
        <div class="actions">
          <button type="button" class="secondary" id="modalCancel">Cancel</button>
          <button class="primary" id="modalSave">Save</button>
        </div>
      </form>
    </div>`;

  $("modalCancel").onclick = closeModal;
  $("modalForm").onsubmit = async e => {
    e.preventDefault();
    const saveBtn = $("modalSave");
    saveBtn.disabled = true;
    try {
      await onSave(Object.fromEntries(new FormData(e.target)));
      closeModal();
      toast("Saved.");
    } catch (err) {
      console.error(err);
      toast(err.code === "permission-denied" ? "Permission denied by Firestore rules." : err.message);
      saveBtn.disabled = false;
    }
  };
}
