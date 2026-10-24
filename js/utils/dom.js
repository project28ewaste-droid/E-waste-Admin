// Small DOM helpers shared by every page.

export const $ = id => document.getElementById(id);

// Escapes text before putting it into innerHTML.
export const safe = s =>
  String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

// A single full-width "nothing here" table row.
export const emptyRow = (cols, text) => `<tr><td colspan="${cols}">${safe(text)}</td></tr>`;

// Re-runs `render` whenever any of the given inputs change (search boxes, filters).
export function onInputs(ids, render) {
  ids.forEach(id => $(id).addEventListener("input", render));
}

// Lowercased value of a search box.
export const searchValue = id => ($(id)?.value || "").trim().toLowerCase();
