// Builds page links from the site root, so they work from index.html and from html/*.html.
const SITE_ROOT = new URL("../../", import.meta.url);

export const pageUrl = file => new URL(file, SITE_ROOT).href;
