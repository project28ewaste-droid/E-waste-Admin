// Working test · step 3 (test-sensors.html?id=<MAC>&type=<waste id>).
// The ESP32 sees Operations/sensor = "updates" and, 5 s apart, writes
// Operations/weight_g → temp_c → wet → proximity, then sensor = "done".
// This page shows each check in order: waiting → countdown → value.
// As soon as the checks are complete it sends Operations/Tray = 1 (once).
import { startPage } from "../app.js";
import { $, safe } from "../utils/dom.js";
import { pill } from "../components/pill.js";
import { state, binName } from "../store.js";
import { setOperation } from "../devices.js";
import { pageUrl, isReload } from "../utils/paths.js";
import { WASTE_TYPES, OPERATIONS, TEST_PAGE } from "../config/app-config.js";

const params = new URLSearchParams(location.search);
const binId = params.get("id");
const waste = WASTE_TYPES.find(w => w.id === params.get("type"));

// Countdown for the check currently running: restarts each time the previous value arrives.
let activeIndex = -1;
let activeSince = Date.now();

// Tray command after the checks: null → "sending" → "sent" | "error"
let trayState = null;

const hasValue = v => v !== undefined && v !== null && v !== "";

function formatResult(check, value) {
  if (String(value).toLowerCase() === "error") return '<span class="pill bad">Sensor error</span>';
  if (check.values) return pill(check.values[Number(value)] ?? String(value));
  return `<b>${safe(value)}</b>${check.unit ? ` <span class="sub">${safe(check.unit)}</span>` : ""}`;
}

// deviceDone = ESP32 already said sensor: "done", so a missing value will never arrive.
function stepHtml(check, index, value, deviceDone) {
  const done = hasValue(value);
  const active = index === activeIndex && !deviceDone;
  let right = '<span class="sub">Waiting…</span>';
  let progress = "";

  if (done) right = formatResult(check, value);
  else if (deviceDone) right = '<span class="pill bad">No reading</span>';
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

// Sends Operations/Tray = 1 once the checks are complete.
async function sendTray() {
  trayState = "sending";
  try {
    await setOperation(binId, OPERATIONS.trayField, OPERATIONS.trayValue);
    trayState = "sent";
  } catch (err) {
    console.error(err);
    trayState = "error";
  }
  renderTestSensors();
}

// The tray command is sent silently; only a failure is shown (with Retry).
function trayHtml() {
  if (trayState === "error") return '<p><span class="pill bad">Could not send tray command</span> <button class="secondary small-btn" id="retryTray">Retry</button></p>';
  return "";
}

function renderTestSensors() {
  const bin = state.bins.find(b => b.id === binId);
  $("testBinInfo").innerHTML = bin
    ? `Dustbin: <b>${safe(binName(bin))}</b> · ${pill(bin.status)}`
    : `Dustbin <b>${safe(binId || "—")}</b> not found.`;
  $("testWaste").innerHTML = waste ? `${waste.icon} ${safe(waste.label)}` : "—";

  const ops = bin?.live?.[OPERATIONS.node] || {};
  const values = OPERATIONS.checks.map(c => ops[c.field]);
  const deviceDone = ops[OPERATIONS.sensorField] === OPERATIONS.sensorDone;

  const nextIndex = values.findIndex(v => !hasValue(v));
  if (nextIndex !== activeIndex) {
    activeIndex = nextIndex;
    activeSince = Date.now();
  }

  $("checkSteps").innerHTML = OPERATIONS.checks.map((c, i) => stepHtml(c, i, values[i], deviceDone)).join("");

  const allValues = nextIndex === -1;
  const finished = allValues || deviceDone;
  if (finished && bin && trayState === null) sendTray();

  let status = `<span class="sub">Device status: <b>${safe(ops[OPERATIONS.sensorField] ?? "—")}</b></span>`;
  if (allValues) status = '<span class="pill">✓ All checks complete</span>';
  else if (deviceDone) status = '<span class="pill warn">Checks finished — some sensors gave no reading</span>';
  $("checkStatus").innerHTML = status + trayHtml();
}

function initTestSensors() {
  // Re-draw a few times a second so the countdown moves between Firebase updates.
  setInterval(() => state.bins.length && renderTestSensors(), 250);
  $("checkStatus").addEventListener("click", e => {
    if (e.target.id === "retryTray") sendTray();
  });
}

// Refreshing any test step starts the test again from "Choose a dustbin".
if (isReload()) location.replace(pageUrl(TEST_PAGE));
else startPage({ page: "testSensors", collections: ["bins"], init: initTestSensors, render: renderTestSensors, bare: true });
