// Live data layer: listens to Firestore collections and keeps `state` up to date.
// The pages show exactly what is in Firestore — empty collections show empty tables.
// Exception: the list of bins and their Online/Offline status come from devices.js (Realtime Database).
import { db, collection, doc, onSnapshot, getDocs, setDoc } from "./firebase.js";
import { COLLECTIONS, DEVICE_CHECK } from "./config/app-config.js";
import { devices, deviceError, watchDevices } from "./devices.js";
import { num, formatDate } from "./utils/format.js";

// Current records for each collection (always arrays).
export const state = { bins: [], deposits: [], trips: [], recycling: [], rewards: [] };

// Firestore read errors per collection (e.g. permission denied).
export const errors = {};

const joinList = v => (Array.isArray(v) ? v.join(", ") : String(v ?? ""));
const byDateDesc = (a, b) => String(b.date ?? "").localeCompare(String(a.date ?? ""));

// Turns Firestore Timestamps into JS Dates.
const fromFirestore = data =>
  Object.fromEntries(Object.entries(data).map(([k, v]) => [k, typeof v?.toDate === "function" ? v.toDate() : v]));

// Cleans one document (numbers may arrive as strings from the ESP32).
const normalize = {
  bins: b => ({
    ...b,
    weight: num(b.weight),
    fill: num(b.fill),
    temp: b.temp == null || b.temp === "" ? null : num(b.temp),
    updated: b.updated instanceof Date ? b.updated.getTime() : b.updated,
  }),
  deposits: d => ({ ...d, weight: num(d.weight), date: formatDate(d.date) }),
  trips: t => ({ ...t, weight: num(t.weight), bins: joinList(t.bins), date: formatDate(t.date) }),
  recycling: r => ({ ...r, weight: num(r.weight), bin: joinList(r.bin), date: formatDate(r.date) }),
  rewards: r => ({ ...r, points: num(String(r.points ?? 0).replace("−", "-")), date: formatDate(r.date) }),
};

const sorters = {
  bins: (a, b) => String(a.id).localeCompare(String(b.id), undefined, { numeric: true }),
  deposits: byDateDesc,
  trips: byDateDesc,
  recycling: byDateDesc,
  rewards: byDateDesc,
};

// Firestore snapshot -> sorted list of records with `id` = document ID.
function toList(name, snapshot) {
  return snapshot.docs
    .map(d => normalize[name]({ ...fromFirestore(d.data()), id: d.id }))
    .sort(sorters[name]);
}

// ---------- Bins = ESP32 MACs (Realtime Database) + details (Firestore) ----------

let binDetails = {}; // Firestore bins docs by MAC

// One bin per MAC in Realtime Database; Firestore doc adds location etc.; status = online check.
function rebuildBins() {
  state.bins = Object.entries(devices)
    .map(([mac, d]) =>
      normalize.bins({
        loc: "Location not set",
        ...binDetails[mac],
        ...d.data,
        id: mac,
        status: d.status,
        updated: d.lastSeen ?? undefined,
      })
    )
    .sort(sorters.bins);
}

function subscribeBins(onChange) {
  watchDevices(() => {
    rebuildBins();
    onChange();
  });
  onSnapshot(
    collection(db, COLLECTIONS.bins),
    snap => {
      binDetails = Object.fromEntries(snap.docs.map(d => [d.id, fromFirestore(d.data())]));
      delete errors.bins;
      rebuildBins();
      onChange();
    },
    err => {
      console.error(`Firestore read failed for "${COLLECTIONS.bins}":`, err);
      errors.bins = err;
      onChange();
    }
  );
}

// Starts listening to the given collections. `onChange` runs whenever any of them updates.
export function subscribe(names, onChange) {
  for (const name of names) {
    if (name === "bins") {
      subscribeBins(onChange);
      continue;
    }
    onSnapshot(
      collection(db, COLLECTIONS[name]),
      snap => {
        state[name] = toList(name, snap);
        delete errors[name];
        onChange();
      },
      err => {
        console.error(`Firestore read failed for "${COLLECTIONS[name]}":`, err);
        state[name] = [];
        errors[name] = err;
        onChange();
      }
    );
  }
}

export const hasErrors = () => Object.keys(errors).length > 0 || !!deviceError;

// Message for an empty table: says which Firestore collection to fill.
export function emptyMessage(name, filtered) {
  if (name === "bins" && !filtered) {
    if (deviceError) return `Could not read Realtime Database “${DEVICE_CHECK.path}”: ${deviceError.code || deviceError.message}`;
    return `No ESP32 bins (MAC addresses) under Realtime Database “${DEVICE_CHECK.path}” yet.`;
  }
  if (errors[name]) return `Could not read Firestore “${COLLECTIONS[name]}”: ${errors[name].code || errors[name].message}`;
  if (filtered) return "No records match your search.";
  return `No documents in Firestore collection “${COLLECTIONS[name]}” yet.`;
}

// Reads a collection once (used by CSV export on pages that don't subscribe to it).
export async function fetchCollection(name) {
  return toList(name, await getDocs(collection(db, COLLECTIONS[name])));
}

// Firestore document IDs cannot contain "/" or be "." / "..".
export const isValidKey = id => !!id && !id.includes("/") && id !== "." && id !== "..";

// Creates or replaces one document at <collection>/<id>. With merge, only the given fields change.
export function saveRecord(name, id, record, { merge = false } = {}) {
  return setDoc(doc(db, COLLECTIONS[name], id), record, { merge });
}

// Next readable id, e.g. nextId(state.trips, "TR") -> "TR001".
export function nextId(list, prefix, pad = 3) {
  const max = list.reduce((m, r) => {
    const n = parseInt(String(r.id).slice(prefix.length), 10);
    return String(r.id).startsWith(prefix) && n > m ? n : m;
  }, 0);
  return prefix + String(max + 1).padStart(pad, "0");
}
