// Login page logic.
import { login, resetPassword, redirectIfLoggedIn, authErrorMessage } from "./auth.js";
import { $ } from "./utils/dom.js";

redirectIfLoggedIn();

function showMessage(text, type = "error") {
  const box = $("loginMsg");
  box.textContent = text;
  box.className = `form-msg ${type}`;
}

$("togglePass").onclick = () => {
  const input = $("password");
  const show = input.type === "password";
  input.type = show ? "text" : "password";
  $("togglePass").textContent = show ? "Hide" : "Show";
};

$("loginForm").onsubmit = async e => {
  e.preventDefault();
  const email = $("email").value.trim();
  const password = $("password").value;
  if (!email || !password) return showMessage("Please enter your email and password.");

  const btn = $("loginBtn");
  btn.disabled = true;
  btn.textContent = "Signing in…";
  try {
    await login(email, password, $("remember").checked);
  } catch (err) {
    showMessage(authErrorMessage(err));
    btn.disabled = false;
    btn.textContent = "Sign in";
  }
};

$("forgotPass").onclick = async () => {
  const email = $("email").value.trim();
  if (!email) return showMessage("Enter your email above, then click “Forgot password?”.");
  try {
    await resetPassword(email);
    showMessage(`Password reset link sent to ${email}.`, "ok");
  } catch (err) {
    showMessage(authErrorMessage(err));
  }
};
