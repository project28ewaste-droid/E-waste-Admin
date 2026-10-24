// Short message in the bottom-right corner.
import { $ } from "../utils/dom.js";

let timer;

export function toast(message) {
  const el = $("toast");
  el.textContent = message;
  el.classList.remove("hidden");
  clearTimeout(timer);
  timer = setTimeout(() => el.classList.add("hidden"), 2800);
}
