// "Live data" panel: shows everything the ESP32 writes under bins/<MAC> in Realtime Database
// (sensors, servos, wifi, uptime, …) and refreshes whenever the values change.
// New fields the ESP32 adds show up automatically; add them to LABELS for a nicer name/unit.
import { $, safe } from "../utils/dom.js";
import { timeAgo, fillFromDistance } from "../utils/format.js";
import { pill, fillBar } from "./pill.js";

// Matches what the ESP32 firmware sends (E-waste-bin/src/firebase.cpp → firebaseSend()).
// field name -> [label, unit or formatter]. Tiles are shown in this order; unknown fields go last.
const yesNo = (yes, no, alertOnYes = false) => v =>
  Number(v) ? (alertOnYes ? '<span class="pill bad">' : '<span class="pill">') + yes + "</span>" : pill(no);

const wetHtml = yesNo("Not okay", "Okay", true); // 0 = okay, 1 = not okay

const LABELS = {
  // Device (top level)
  mode: ["Bin mode", v => (String(v) === "test" ? '<span class="pill warn">TEST</span>' : pill(String(v || "—").toUpperCase()))],
  lastUpdate: ["Last data received", v => `${new Date(Number(v)).toLocaleString()}<br><span class="sub">${timeAgo(Number(v))}</span>`],
  uptime_s: ["Bin running for", v => formatDuration(v)],

  // sensors/
  distance_cm: ["Bin fill level", v => fillHtml(v)],
  weight_g: ["Waste weight", "g"],
  temp_c: ["Inside temperature", "°C"],
  wet: ["Wet Sensor", wetHtml],
  rain: ["Wet Sensor", wetHtml],
  gas: ["Gas / smoke level", "/ 4095"],
  gasAlert: ["Gas alert", v => (v ? '<span class="pill bad">⚠ ALERT</span>' : pill("Normal"))],
  proximity: ["Proximity Sensor", yesNo("Detected", "Not detected")], // 1 = detected, 0 = none
  ir_R: ["Cylinder sensor (right)", yesNo("Blocked", "Clear")],
  ir_L: ["Cylinder sensor (left)", yesNo("Blocked", "Clear")],
  weight_raw: ["Weight sensor raw reading", ""],

  // servos/
  ch12_tray: ["Bin door", v => (String(v) === "open" ? '<span class="pill warn">Open</span>' : pill("Closed"))],
  ch7_tray: ["Drop tray", v => (String(v) === "down" ? '<span class="pill warn">Down</span>' : pill("Normal"))],
  ch0_cylinder_position: ["Sorting cylinder", v => (Number(v) ? `<b>Position ${safe(v)}</b>` : '<span class="pill warn">Moving</span>')],

  // Operations/ (commands sent by the dashboard + test results — see SECTION_LABELS)
  Door: ["Door command", v => (Number(v) === 1 ? '<span class="pill warn">Open</span>' : pill("Close"))],
  cylinder: ["Cylinder command", v => `<b>${safe(v)}</b> <span class="sub">${safe(["", "Board", "Battery", "Wires & others"][Number(v)] || "")}</span>`],
  Tray: ["Tray command", v => (Number(v) === 1 ? '<span class="pill warn">1 · Move tray</span>' : pill(String(v)))],
  sensor: ["Test status", v =>
    String(v) === "updates" ? '<span class="pill warn">Checking…</span>' : String(v) === "done" ? pill("Completed") : pill(String(v))],

  // wifi/
  ssid: ["Wi-Fi name", ""],
  ip: ["IP address", ""],
  rssi: ["Wi-Fi signal", v => `<b>${safe(v)}</b> <span class="sub">dBm · ${signalQuality(v)}</span>`],

  // Older firmware fields that may still be in the database
  ir1: ["IR sensor 1 (old)", ""],
  ir2: ["IR sensor 2 (old)", ""],
  servo180: ["Servo 180° (old)", ""],
  servo360_1: ["Servo 360° #1 (old)", ""],
  servo360_2: ["Servo 360° #2 (old)", ""],
};

// Same field, different name inside one section (e.g. Operations/weight_g is a test result).
const SECTION_LABELS = {
  Operations: {
    weight_g: ["Test result: weight", "g"],
    temp_c: ["Test result: temperature", "°C"],
    wet: ["Test result: Wet Sensor", wetHtml],
    proximity: ["Test result: Proximity Sensor", yesNo("Detected", "Not detected")],
  },
};

const labelFor = (section, key) => SECTION_LABELS[section]?.[key] || LABELS[key];

const ORDER = [...Object.keys(LABELS), "Door", "sensor"];
const byOrder = ([a], [b]) => (ORDER.indexOf(a) + 1 || 999) - (ORDER.indexOf(b) + 1 || 999);

// Ultrasonic distance shown as "% filled" (BIN_DEPTH_CM in app-config.js = empty).
function fillHtml(cm) {
  const pct = fillFromDistance(cm);
  if (pct === null) return '<span class="pill bad">error</span>';
  return `<b>${pct}%</b> <span class="sub">filled</span>${fillBar(pct)}<span class="sub">${safe(cm)} cm from sensor</span>`;
}

function signalQuality(rssi) {
  const r = Number(rssi);
  if (r >= -55) return "excellent";
  if (r >= -67) return "good";
  if (r >= -80) return "weak";
  return "very weak";
}

// Section titles for nested objects (bins/<MAC>/sensors, servos, wifi).
const SECTIONS = {
  sensors: "🌡️ Bin sensors",
  servos: "⚙️ Door & motors",
  Operations: "🧪 Working test (commands & results)",
  wifi: "📶 Connection",
};

function formatDuration(seconds) {
  let s = Math.floor(Number(seconds) || 0);
  const d = Math.floor(s / 86400); s %= 86400;
  const h = Math.floor(s / 3600); s %= 3600;
  const m = Math.floor(s / 60); s %= 60;
  return [d && `${d}d`, (d || h) && `${h}h`, (d || h || m) && `${m}m`, `${s}s`].filter(Boolean).join(" ");
}

function formatValue(section, key, value) {
  const [, fmt] = labelFor(section, key) || [];
  if (typeof fmt === "function") return fmt(value);
  if (typeof value === "boolean") return pill(value ? "Yes" : "No");
  if (typeof value === "string" && value.toLowerCase() === "error") return '<span class="pill bad">error</span>';
  if (value !== null && typeof value === "object") return `<code>${safe(JSON.stringify(value))}</code>`;
  return `<b>${safe(value)}</b>${fmt ? ` <span class="sub">${safe(fmt)}</span>` : ""}`;
}

// Unknown fields: "weight_raw" → "Weight raw"
const prettyKey = key => key.replace(/_/g, " ").replace(/^\w/, c => c.toUpperCase());

const tile = (sectionKey, key, value) => `
  <div class="sensor-tile">
    <div class="sub">${safe(labelFor(sectionKey, key)?.[0] || prettyKey(key))}</div>
    <div class="sensor-value">${formatValue(sectionKey, key, value)}</div>
  </div>`;

const section = (sectionKey, title, entries) =>
  entries.length
    ? `<h3 class="sensor-head">${title}</h3><div class="sensor-grid">${[...entries]
        .sort(byOrder)
        .map(([k, v]) => tile(sectionKey, k, v))
        .join("")}</div>`
    : "";

// Section order on screen; any other group the ESP32 adds is shown after these.
const SECTION_ORDER = ["sensors", "servos", "Operations", "wifi"];

// Live sensor HTML for one bin (also used on the bin detail page).
export function liveSensorsHtml(bin) {
  const data = bin?.live || {};
  const entries = Object.entries(data);
  if (!entries.length) return '<p class="muted">No data from this ESP32 yet.</p>';

  const top = entries.filter(([, v]) => v === null || typeof v !== "object");
  const groups = entries
    .filter(([, v]) => v !== null && typeof v === "object")
    .sort(([a], [b]) => (SECTION_ORDER.indexOf(a) + 1 || 99) - (SECTION_ORDER.indexOf(b) + 1 || 99));
  return (
    section("device", "📟 Dustbin", top) +
    groups.map(([k, v]) => section(k, SECTIONS[k] || safe(prettyKey(k)), Object.entries(v))).join("")
  );
}

// ---------- Modal ----------

let openMac = null;
let getBin = () => null;

export function openLivePanel(mac, findBin) {
  openMac = mac;
  getBin = findBin;
  $("modalHost").innerHTML = `
    <div class="modalbg" id="liveBg">
      <div class="modal live-modal">
        <div class="cardhead">
          <div>
            <h2>🗑️ ${safe(mac)} <span class="live-dot">● LIVE</span></h2>
            <div class="sub" id="liveSub"></div>
          </div>
          <button class="secondary" id="liveClose">✕</button>
        </div>
        <div id="liveBody"></div>
      </div>
    </div>`;
  $("liveClose").onclick = closeLivePanel;
  $("liveBg").onclick = e => e.target.id === "liveBg" && closeLivePanel();
  refreshLivePanel();
}

export function closeLivePanel() {
  openMac = null;
  $("modalHost").innerHTML = "";
}

// Call after every data update; does nothing when the panel is closed.
export function refreshLivePanel() {
  if (!openMac || !$("liveBody")) return;
  const bin = getBin(openMac);
  if (!bin) {
    $("liveBody").innerHTML = '<p class="muted">This bin was removed from Realtime Database.</p>';
    return;
  }
  $("liveSub").innerHTML = `${safe(bin.loc)} · ${pill(bin.status)}`;
  $("liveBody").innerHTML = liveSensorsHtml(bin);
}
