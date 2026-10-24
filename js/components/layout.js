// Sidebar + page header shared by every dashboard page.
// To add a page: add an entry to NAV_PAGES and create the matching file in html/.
// `file` is the path from the project root.
import { $, safe } from "../utils/dom.js";
import { pageUrl } from "../utils/paths.js";

export const NAV_PAGES = [
  { id: "overview", file: "index.html", icon: "▦", label: "Overview", title: "Dashboard overview", desc: "Monitor collection activity and bin health." },
  { id: "bins", file: "html/bins.html", icon: "▤", label: "Dustbins", title: "Dustbin monitoring", desc: "Review weight, fill level, temperature and pickup needs." },
  { id: "recycling", file: "html/recycling.html", icon: "♻", label: "Recycling", title: "Recycling history", desc: "Track waste transfers and recycler confirmation." },
  { id: "vehicles", file: "html/vehicles.html", icon: "🚚", label: "Vehicles", title: "Vehicle collection history", desc: "Schedule pickups and count collection trips." },
  { id: "users", file: "html/users.html", icon: "♙", label: "Users & Deposits", title: "Users & deposits", desc: "Review who deposited waste, how much and when." },
  { id: "rewards", file: "html/rewards.html", icon: "✦", label: "Rewards", title: "Rewards & transactions", desc: "Review points and voucher records." },
];

// Pages that exist but are not in the sidebar menu.
const HIDDEN_PAGES = [
  { id: "binDetail", title: "Bin details", desc: "Detailed waste, sensor, deposit and collection history.", activeNav: "bins" },
];

function sidebarHtml(page, user) {
  const active = page.activeNav || page.id;
  const links = NAV_PAGES.map(
    p => `<a href="${pageUrl(p.file)}" class="${p.id === active ? "active" : ""}">${p.icon} ${safe(p.label)}</a>`
  ).join("");

  return `
    <div class="brand">♻ EcoVault</div>
    <div class="muted brand-tag">ADMIN OPERATIONS</div>
    <nav class="nav" id="nav">${links}</nav>
    <div class="sidebar-footer">
      <div>
        <div id="sourceBadge" class="source-badge">● Connecting…</div>
        <div>Signed in as</div>
        <div class="user-email">${safe(user.email)}</div>
      </div>
      <button class="logout" id="logoutBtn">⎋ Log out</button>
    </div>`;
}

function headerHtml(page) {
  return `
    <div>
      <div class="eyebrow">RECYCLE CENTER</div>
      <h1>${safe(page.title)}</h1>
      <div class="muted">${safe(page.desc)}</div>
    </div>
    <div class="top-actions">
      <button class="secondary" id="export">↓ Export CSV</button>
    </div>`;
}

// Fills <aside id="sidebar"> and <header id="pageHeader"> for the given page id.
export function renderLayout(pageId, user) {
  const page = [...NAV_PAGES, ...HIDDEN_PAGES].find(p => p.id === pageId);
  $("sidebar").innerHTML = sidebarHtml(page, user);
  $("pageHeader").innerHTML = headerHtml(page);
  document.title = `${page.title} | EcoVault Admin`;
}

export function setSourceBadge(hasError) {
  const badge = $("sourceBadge");
  badge.className = `source-badge ${hasError ? "error" : "live"}`;
  badge.textContent = hasError ? "● Firestore error (see console)" : "● Live Firestore data";
}
