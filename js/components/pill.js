// Status pill and fill bar used in tables and cards.
import { safe } from "../utils/dom.js";
import { FILL_ALERT_LEVEL } from "../config/app-config.js";

// Statuses shown in orange / red. Anything else is green.
const WARN_STATUSES = ["Checking…", "Needs pickup", "Scheduled", "Pending review", "Pending", "Sent to recycler", "Awaiting pickup"];
const BAD_STATUSES = ["Offline", "Rejected", "Cancelled"];

export function pill(status) {
  const tone = WARN_STATUSES.includes(status) ? "warn" : BAD_STATUSES.includes(status) ? "bad" : "";
  return `<span class="pill ${tone}">${safe(status ?? "—")}</span>`;
}

export function fillBar(fill) {
  const pct = Math.max(0, Math.min(100, Number(fill) || 0));
  return `<div class="bar"><span class="${pct >= FILL_ALERT_LEVEL ? "hot" : ""}" style="width:${pct}%"></span></div>`;
}
