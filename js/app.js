// Shared start-up for every dashboard page.
//
// Each page script calls:
//   startPage({
//     page: "bins",                      // id from NAV_PAGES in components/layout.js
//     collections: ["bins"],             // keys from COLLECTIONS in config/app-config.js
//     init: () => { ... },               // optional: wire up buttons / search boxes once
//     render: () => { ... },             // redraw the page whenever data changes
//   });
import { requireAuth, logout } from "./auth.js";
import { downloadCsv } from "./utils/export-csv.js";
import { $ } from "./utils/dom.js";
import { pageUrl } from "./utils/paths.js";
import { BIN_DETAIL_PAGE } from "./config/app-config.js";
import { toast } from "./components/toast.js";
import { renderLayout, setSourceBadge } from "./components/layout.js";
import { subscribe, fetchCollection, hasErrors } from "./store.js";

// Link to the detail page for one bin.
export const binDetailUrl = id => `${pageUrl(BIN_DETAIL_PAGE)}?id=${encodeURIComponent(id)}`;

async function exportDeposits() {
  const deposits = await fetchCollection("deposits");
  downloadCsv("ewaste-deposits.csv", [
    ["Deposit ID", "User", "Bin", "Weight kg", "Waste type", "Date", "Status"],
    ...deposits.map(d => [d.id, d.user, d.bin, d.weight, d.type, d.date, d.status]),
  ]);
}

// Anything with data-bin="B01" opens that bin's detail page.
function wireBinLinks() {
  const open = el => (location.href = binDetailUrl(el.dataset.bin));
  document.body.addEventListener("click", e => {
    const el = e.target.closest("[data-bin]");
    if (el) open(el);
  });
  document.body.addEventListener("keydown", e => {
    if ((e.key === "Enter" || e.key === " ") && e.target.matches(".bin[data-bin]")) {
      e.preventDefault();
      open(e.target);
    }
  });
}

export async function startPage({ page, collections, init, render }) {
  const user = await requireAuth();
  if (!user) return;

  renderLayout(page, user);
  $("logoutBtn").onclick = logout;
  $("export").onclick = () =>
    exportDeposits().catch(err => toast(`Export failed: ${err.code || err.message}`));
  wireBinLinks();
  init?.();

  document.body.classList.remove("auth-pending");
  subscribe(collections, () => {
    render();
    setSourceBadge(hasErrors());
  });
}
