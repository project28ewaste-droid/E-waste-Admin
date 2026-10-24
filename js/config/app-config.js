// App-wide settings. Edit these instead of hunting through the code.

// Firestore collection used by each page. Change the value (right side) to rename a collection.
// The document ID is used as the record ID (e.g. bins/B01). Fields each document should have:
export const COLLECTIONS = {
  // bins.html (+ overview, bin detail) — extra details for each ESP32 bin.
  // Document ID = the bin's MAC address (e.g. bins/3076F5064CD0).
  //   loc: string, weight: number (kg), fill: number (%), temp: number (°C)
  // Which bins exist and Online/Offline come from Realtime Database (see DEVICE_CHECK).
  bins: "bins",

  // recycling.html
  //   bin: "B01, B02", facility: string, weight: number, date: string/timestamp,
  //   stage: "Awaiting pickup" | "Sent to recycler" | "Recycled confirmed"
  recycling: "recycling",

  // vehicles.html
  //   vehicle: string, driver: string, bins: "B01, B02", weight: number,
  //   date: string/timestamp, status: "Scheduled" | "Completed" | "Cancelled"
  trips: "trips",

  // users.html (+ overview)
  //   user: string, bin: "B01", weight: number, type: string,
  //   date: string/timestamp, status: "Accepted" | "Pending review" | "Rejected"
  deposits: "deposits",

  // rewards.html
  //   user: string, activity: string, points: number (negative = redeemed),
  //   date: string/timestamp, status: "Completed" | "Pending"
  rewards: "rewards",
};

// ESP32 online check (Realtime Database). Every key under `path` is one bin (its MAC address):
//   bins/3076F5064CD0/Question = "Hi"        ← dashboard writes this
//   bins/3076F5064CD0/Answer   = "am there"  ← ESP32 must reply with this
// Reply within `timeoutSeconds` → Online, otherwise Offline. Repeats every `intervalSeconds`.
// Nothing else is saved to Realtime Database; all other records go to Firestore.
export const DEVICE_CHECK = {
  path: "bins",
  questionField: "Question",
  answerField: "Answer",
  question: "Hi",
  answer: "am there", // compared ignoring case and extra spaces
  timeoutSeconds: 10,
  intervalSeconds: 30,
};

// Fill % at which a bin's bar turns orange (and counts as "needs collection").
export const FILL_ALERT_LEVEL = 80;

// Where to send people after login / logout (paths from the project root).
export const DASHBOARD_PAGE = "index.html";
export const LOGIN_PAGE = "html/login.html";
export const BIN_DETAIL_PAGE = "html/bin-detail.html";
