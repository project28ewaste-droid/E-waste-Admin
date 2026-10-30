// Working test · step 3 (test-sensors.html?id=<MAC>&type=<waste id>).
// The ESP32 sees Operations/sensor = "updates" and, 5 s apart, writes
// Operations/weight → Operations/temperature → Operations/rain, then sensor = "done".
// This page shows each check in order: waiting → countdown → value.
import { startPage } from "../app.js";
import { $, safe } from "../utils/dom.js";
import { pill } from "../components/pill.js";
import { state, binName } from "../store.js";
import { pageUrl, isReload } from "../utils/paths.js";
import { WASTE_TYPES, OPERATIONS, TEST_PAGE } from "../config/app-config.js";

const params = new URLSearchParams(location.search);
const binId = params.get("id");
const waste = WASTE_TYPES.find(w => w.id === params.get("type"));

// Countdown for the check currently running: restarts each time the previous value arrives.
let activeIndex = -1;
let activeSince = Date.now();

const hasValue = v => v !== undefined && v !== null && v !== "";

function formatResult(check, value) {
  if (String(value).toLowerCase() === "error") return '<span class="pill bad">Sensor error</span>';
  if (check.values) return pill(check.values[Number(value)] ?? String(value));
  return `<b>${safe(value)}</b>${check.unit ? ` <span class="sub">${safe(check.unit)}</span>` : ""}`;
}

function stepHtml(check, index, value) {
  const done = hasValue(value);
  const active = index === activeIndex;
  let right = '<span class="sub">Waiting…</span>';
  let progress = "";

  if (done) right = formatResult(check, value);
  else if (active) {
    const elapsed = Date.now() - activeSince;
    const left = Math.ceil((OPERATIONS.stepDelayMs - elapsed) / 1000);
    right = left > 0 ? `<span class="pill warn">Checking in ${left}s</span>` : '<span class="pill warn">Reading…</span>';
    const pct = Math.min(100, (elapsed / OPERATIONS.stepDelayMs) * 100);
    progress = `<div class="bar"><span style="width:${pct}%"></span></div>`;
  }

  return `
    <div class="check-step ${done ? "done" : active ? "active" : ""}">
      <div class="check-num">${done ? "✓" : index + 1}</div>
      <div class="check-body">
        <div class="check-row">
          <div class="check-label">${check.icon} ${safe(check.label)}</div>
          <div>${right}</div>
        </div>
        ${progress}
      </div>
    </div>`;
}

function renderTestSensors() {
  const bin = state.bins.find(b => b.id === binId);
  $("testBinInfo").innerHTML = bin
    ? `Dustbin: <b>${safe(binName(bin))}</b> · ${pill(bin.status)}`
    : `Dustbin <b>${safe(binId || "—")}</b> not found.`;
  $("testWaste").innerHTML = waste ? `${waste.icon} ${safe(waste.label)}` : "—";

  const ops = bin?.live?.[OPERATIONS.node] || {};
  const values = OPERATIONS.checks.map(c => ops[c.field]);

  const nextIndex = values.findIndex(v => !hasValue(v));
  if (nextIndex !== activeIndex) {
    activeIndex = nextIndex;
    activeSince = Date.now();
  }

  $("checkSteps").innerHTML = OPERATIONS.checks.map((c, i) => stepHtml(c, i, values[i])).join("");

  const finished = nextIndex === -1 || ops[OPERATIONS.sensorField] === OPERATIONS.sensorDone;
  $("checkStatus").innerHTML = finished
    ? '<span class="pill">✓ All checks complete</span>'
    : `<span class="sub">Device status: <b>${safe(ops[OPERATIONS.sensorField] ?? "—")}</b></span>`;
}

// Re-draw a few times a second so the countdown moves between Firebase updates.
function initTestSensors() {
  setInterval(() => state.bins.length && renderTestSensors(), 250);
}

// Refreshing any test step starts the test again from "Choose a dustbin".
if (isReload()) location.replace(pageUrl(TEST_PAGE));
else startPage({ page: "testSensors", collections: ["bins"], init: initTestSensors, render: renderTestSensors, bare: true });
