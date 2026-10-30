// "Live data" panel: shows everything the ESP32 writes under bins/<MAC> in Realtime Database
// (sensors, servos, wifi, uptime, …) and refreshes whenever the values change.
// New fields the ESP32 adds show up automatically; add them to LABELS for a nicer name/unit.
import { $, safe } from "../utils/dom.js";
import { timeAgo } from "../utils/format.js";
import { pill } from "./pill.js";

// Matches what the ESP32 firmware sends (E-waste-bin/src/firebase.cpp → firebaseSend()).
// field name -> [label, unit or formatter]. Tiles are shown in this order; unknown fields go last.
const yesNo = (yes, no, alertOnYes = false) => v =>
  Number(v) ? (alertOnYes ? '<span class="pill bad">' : '<span class="pill">') + yes + "</span>" : pill(no);

const LABELS = {
  // Device (top level)
  mode: ["Mode", v => (String(v) === "test" ? '<span class="pill warn">TEST</span>' : pill(String(v || "—").toUpperCase()))],
  lastUpdate: ["Last update", v => `${new Date(Number(v)).toLocaleString()}<br><span class="sub">${timeAgo(Number(v))}</span>`],
  uptime_s: ["Uptime", v => formatDuration(v)],

  // sensors/
  weight_g: ["Weight (load cell)", "g"],
  distance_cm: ["Distance (ultrasonic)", "cm"],
  temp_c: ["Temperature", "°C"],
  gas: ["Gas level", "/ 4095"],
  gasAlert: ["Gas alert", v => (v ? '<span class="pill bad">⚠ ALERT</span>' : pill("Normal"))],
  proximity: ["Proximity", yesNo("Object detected", "Clear")],
  wet: ["Wet Sensor", yesNo("Not okay", "Okay", true)], // 0 = okay, 1 = not okay
  rain: ["Wet Sensor", yesNo("Not okay", "Okay", true)],
  ir_R: ["IR right", yesNo("Blocked", "Clear")],
  ir_L: ["IR left", yesNo("Blocked", "Clear")],

  // servos/
  ch0_cylinder_position: ["Cylinder (CH0)", v => (Number(v) ? `<b>Position ${safe(v)}</b>` : '<span class="pill warn">Between</span>')],
  ch7_tray: ["Tray (CH7)", v => pill(String(v))],
  ch12_tray: ["Tray door (CH12)", v => (String(v) === "open" ? '<span class="pill warn">open</span>' : pill(String(v)))],

  // Operations/ (commands sent by the dashboard)
  Door: ["Door command", v => (Number(v) === 1 ? '<span class="pill warn">1 · OPEN</span>' : pill(`${v}`))],
  sensor: ["Sensor check", v => (String(v) === "updates" ? '<span class="pill warn">updates</span>' : pill(String(v)))],

  // wifi/
  ssid: ["Network", ""],
  ip: ["IP address", ""],
  rssi: ["Signal", v => `<b>${safe(v)}</b> <span class="sub">dBm · ${signalQuality(v)}</span>`],

  // Older firmware fields that may still be in the database
  ir1: ["IR sensor 1 (old)", ""],
  ir2: ["IR sensor 2 (old)", ""],
  servo180: ["Servo 180° (old)", ""],
  servo360_1: ["Servo 360° #1 (old)", ""],
  servo360_2: ["Servo 360° #2 (old)", ""],
};

const ORDER = Object.keys(LABELS);
const byOrder = ([a], [b]) => (ORDER.indexOf(a) + 1 || 999) - (ORDER.indexOf(b) + 1 || 999);

function signalQuality(rssi) {
  const r = Number(rssi);
  if (r >= -55) return "excellent";
  if (r >= -67) return "good";
  if (r >= -80) return "weak";
  return "very weak";
}

// Section titles for nested objects (bins/<MAC>/sensors, servos, wifi).
const SECTIONS = { sensors: "🌡️ Sensors", servos: "⚙️ Servos", Operations: "🛠️ Operations (commands)", wifi: "📶 Wi-Fi" };

function formatDuration(seconds) {
  let s = Math.floor(Number(seconds) || 0);
  const d = Math.floor(s / 86400); s %= 86400;
  const h = Math.floor(s / 3600); s %= 3600;
  const m = Math.floor(s / 60); s %= 60;
  return [d && `${d}d`, (d || h) && `${h}h`, (d || h || m) && `${m}m`, `${s}s`].filter(Boolean).join(" ");
}

function formatValue(key, value) {
  const [, fmt] = LABELS[key] || [];
  if (typeof fmt === "function") return fmt(value);
  if (typeof value === "boolean") return pill(value ? "Yes" : "No");
  if (typeof value === "string" && value.toLowerCase() === "error") return '<span class="pill bad">error</span>';
  if (value !== null && typeof value === "object") return `<code>${safe(JSON.stringify(value))}</code>`;
  return `<b>${safe(value)}</b>${fmt ? ` <span class="sub">${safe(fmt)}</span>` : ""}`;
}

const tile = (key, value) => `
  <div class="sensor-tile">
    <div class="sub">${safe(LABELS[key]?.[0] || key)}</div>
    <div class="sensor-value">${formatValue(key, value)}</div>
  </div>`;

const section = (title, entries) =>
  entries.length
    ? `<h3 class="sensor-head">${title}</h3><div class="sensor-grid">${[...entries].sort(byOrder).map(([k, v]) => tile(k, v)).join("")}</div>`
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
  return section("📟 Device", top) + groups.map(([k, v]) => section(SECTIONS[k] || safe(k), Object.entries(v))).join("");
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
