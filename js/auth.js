// Login / logout helpers built on Firebase Authentication (email + password).
import {
  auth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
} from "./firebase.js";
import { DASHBOARD_PAGE, LOGIN_PAGE } from "./config/app-config.js";
import { pageUrl } from "./utils/paths.js";

// Resolves with the first auth state Firebase reports (user or null).
function currentUser() {
  return new Promise(resolve => {
    const stop = onAuthStateChanged(auth, user => {
      stop();
      resolve(user);
    });
  });
}

// Use on protected pages: returns the user, or sends them to the login page.
export async function requireAuth() {
  const user = await currentUser();
  if (!user) location.replace(pageUrl(LOGIN_PAGE));
  return user;
}

// Use on the login page: skip the form if already signed in.
export async function redirectIfLoggedIn() {
  if (await currentUser()) location.replace(pageUrl(DASHBOARD_PAGE));
}

export async function login(email, password, remember) {
  await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence);
  await signInWithEmailAndPassword(auth, email, password);
  location.replace(pageUrl(DASHBOARD_PAGE));
}

export async function logout() {
  await signOut(auth);
  location.replace(pageUrl(LOGIN_PAGE));
}

export function resetPassword(email) {
  return sendPasswordResetEmail(auth, email);
}

// Turns Firebase error codes into readable messages.
export function authErrorMessage(err) {
  const messages = {
    "auth/invalid-email": "That email address is not valid.",
    "auth/missing-password": "Please enter your password.",
    "auth/invalid-credential": "Incorrect email or password.",
    "auth/wrong-password": "Incorrect email or password.",
    "auth/user-not-found": "No admin account found for this email.",
    "auth/user-disabled": "This account has been disabled.",
    "auth/too-many-requests": "Too many attempts. Please wait a moment and try again.",
    "auth/network-request-failed": "Network error. Check your internet connection.",
    "auth/operation-not-allowed": "Email/password sign-in is not enabled in Firebase.",
  };
  return messages[err?.code] || err?.message || "Something went wrong. Please try again.";
}
