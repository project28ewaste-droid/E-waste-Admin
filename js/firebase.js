// Initializes Firebase once and re-exports the SDK functions the app uses.
// To upgrade the SDK, change the version number in the URLs in this file only.
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
import { getAnalytics, isSupported } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-analytics.js";
import { firebaseConfig } from "./config/firebase-config.js";

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);     // all records
export const rtdb = getDatabase(app);    // ESP32 online check only

// Analytics only works on http(s) pages in supported browsers.
isSupported().then(ok => ok && getAnalytics(app)).catch(() => {});

export {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

export { collection, doc, onSnapshot, getDocs, setDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export { ref, onValue, update } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
