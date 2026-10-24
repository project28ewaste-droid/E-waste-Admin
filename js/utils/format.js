// Number, weight and time formatting.

export const num = v => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

export const kg = (v, digits = 1) => `${num(v).toFixed(digits)} kg`;

export const sum = (list, key) => list.reduce((total, r) => total + num(r[key]), 0);

// Accepts "2 min ago" strings or a timestamp (seconds or milliseconds) from the ESP32.
export function timeAgo(value) {
  if (typeof value !== "number") return value ?? "—";
  const ms = value < 1e12 ? value * 1000 : value;
  const mins = Math.round((Date.now() - ms) / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  if (mins < 1440) return `${Math.round(mins / 60)} hours ago`;
  return new Date(ms).toLocaleString();
}

// Dates (e.g. Firestore timestamps) -> "2026-10-24 09:30"; strings are kept as typed.
export function formatDate(value) {
  if (!(value instanceof Date)) return value ?? "";
  const pad = n => String(n).padStart(2, "0");
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())} ${pad(value.getHours())}:${pad(value.getMinutes())}`;
}

// Splits "B01, B02" into ["B01", "B02"].
export const splitIds = s => String(s ?? "").split(",").map(x => x.trim()).filter(Boolean);
