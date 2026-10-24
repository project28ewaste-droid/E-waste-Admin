// ESP32 online check over Realtime Database.
//
// Every key under DEVICE_CHECK.path (e.g. "bins/3076F5064CD0") is one bin.
// For each bin we write Question = "Hi" and clear Answer, then wait for the ESP32
// to write Answer = "am there". Reply in time → "Online", otherwise "Offline".
// Afterwards Question is cleared again, so the next "Hi" is always a fresh change.
import { rtdb, ref, onValue, update } from "./firebase.js";
import { DEVICE_CHECK as C } from "./config/app-config.js";

// mac -> { status: "Checking…" | "Online" | "Offline", lastSeen: ms | null, data: {...other RTDB fields}, pinging }
export const devices = {};

// Realtime Database read error, if any (e.g. permission denied).
export let deviceError = null;

const isExpectedAnswer = v => String(v ?? "").trim().toLowerCase() === C.answer.trim().toLowerCase();

function waitForAnswer(mac) {
  return new Promise(resolve => {
    let done = false;
    let stop = null;
    const finish = ok => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      if (stop) stop();
      resolve(ok);
    };
    const timer = setTimeout(() => finish(false), C.timeoutSeconds * 1000);
    stop = onValue(ref(rtdb, `${C.path}/${mac}/${C.answerField}`), snap => {
      if (isExpectedAnswer(snap.val())) finish(true);
    });
    // The listener may have answered before `stop` was assigned.
    if (done) stop();
  });
}

async function ping(mac, onChange) {
  const device = devices[mac];
  if (!device || device.pinging) return;
  device.pinging = true;
  const node = ref(rtdb, `${C.path}/${mac}`);

  try {
    await update(node, { [C.answerField]: "", [C.questionField]: C.question });
    const online = await waitForAnswer(mac);
    device.status = online ? "Online" : "Offline";
    if (online) device.lastSeen = Date.now();
    // Only touch the node if the bin still exists (avoid re-creating a deleted MAC).
    if (devices[mac]) await update(node, { [C.questionField]: "" });
  } catch (err) {
    console.error(`Online check failed for ${mac}:`, err);
    device.status = "Offline";
  }

  device.pinging = false;
  onChange();
}

// Starts watching the bin list and checking each bin. `onChange` runs on every update.
export function watchDevices(onChange) {
  onValue(
    ref(rtdb, C.path),
    snap => {
      deviceError = null;
      const all = snap.val() || {};
      const newMacs = [];

      for (const mac of Object.keys(devices)) if (!(mac in all)) delete devices[mac];

      for (const [mac, value] of Object.entries(all)) {
        const { [C.questionField]: _q, [C.answerField]: _a, ...data } = value && typeof value === "object" ? value : {};
        if (devices[mac]) devices[mac].data = data;
        else {
          devices[mac] = { status: "Checking…", lastSeen: null, data, pinging: false };
          newMacs.push(mac);
        }
      }

      onChange();
      newMacs.forEach(mac => ping(mac, onChange));
    },
    err => {
      console.error(`Realtime Database read failed for "${C.path}":`, err);
      deviceError = err;
      onChange();
    }
  );

  setInterval(() => Object.keys(devices).forEach(mac => ping(mac, onChange)), C.intervalSeconds * 1000);
}
