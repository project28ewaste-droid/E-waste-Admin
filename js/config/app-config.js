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

// Commands for the ESP32, written to Realtime Database bins/<MAC>/<node>/...
//   Working test step 1 "Open"         → Operations = { Door: 1 }  (all other values deleted)
//   Step 2 waste type chosen           → Operations/cylinder = 1 (board) / 2 (battery) / 3 (wires)
//   Step 2, 2 s later                  → Operations/Door = 0, Operations/sensor = "updates"
//   ESP32 then, 5 s apart              → Operations/weight_g, Operations/temp_c, Operations/wet, Operations/proximity,
//                                        finally Operations/sensor = "done"
//   Step 3, checks complete            → Operations/Tray = 1
export const OPERATIONS = {
  node: "Operations",
  doorField: "Door",
  doorOpen: 1,
  doorClose: 0,
  sensorField: "sensor",
  sensorUpdates: "updates",
  sensorDone: "done",
  cylinderField: "cylinder", // step 2: sent the moment a waste type is selected (1 / 2 / 3, see WASTE_TYPES)
  trayField: "Tray", // step 3: sent as soon as all checks are complete → Operations/Tray = 1
  trayValue: 1,
  closeDelayMs: 2000, // wait after choosing the waste type before closing the door
  stepDelayMs: 5000,  // ESP32 waits this long before each check (used for the countdown)

  // Checks done by the ESP32, in order. `field` = key it writes under Operations/.
  checks: [
    { field: "weight_g", label: "Weight", icon: "⚖️", unit: "g" },
    { field: "temp_c", label: "Temperature", icon: "🌡️", unit: "°C" },
    { field: "wet", label: "Wet Sensor", icon: "💧", values: { 0: "Okay", 1: "Not okay" } }, // 0 = okay, 1 = not okay
    { field: "proximity", label: "Proximity Sensor", icon: "📡", values: { 0: "Not detected", 1: "Detected" } },
  ],
};

// Dustbin height in cm (ultrasonic sensor to bottom). Turns sensors/distance_cm into fill %:
//   distance ≥ 9 cm → 0% filled (empty),  distance 0 cm → 100% filled (full).
export const BIN_DEPTH_CM = 9;

// Fill % at which a bin's bar turns orange (and counts as "needs collection").
export const FILL_ALERT_LEVEL = 80;

// Where to send people after login / logout (paths from the project root).
export const DASHBOARD_PAGE = "index.html";
export const LOGIN_PAGE = "html/login.html";
export const BIN_DETAIL_PAGE = "html/bin-detail.html";

// "Working test" demo screens (what a user sees at the bin).
export const TEST_PAGE = "html/test.html";              // step 1: choose a dustbin
export const TEST_WASTE_PAGE = "html/test-waste.html";  // step 2: choose the waste type
export const TEST_SENSORS_PAGE = "html/test-sensors.html"; // step 3: sensor values

// Waste types shown on step 2. `cylinder` is sent to Operations/cylinder when the type is selected.
export const WASTE_TYPES = [
  { id: "board", label: "BOARD", icon: "🖥️", hint: "Circuit boards, PCBs, motherboards", cylinder: 1 },
  { id: "battery", label: "BATTERY", icon: "🔋", hint: "Cells, power banks, phone batteries", cylinder: 2 },
  { id: "wires", label: "WIRES & others", icon: "🔌", hint: "Cables, chargers, small parts", cylinder: 3 },
];
