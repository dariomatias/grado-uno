import { extractInlineModule, indexHtmlUrl } from "../tests/helpers/extract-inline-module.mjs";

/**
 * Comprueba las URLs externas declaradas en content-module (letra y YouTube).
 * Clasifica: OK (2xx), REDIRECT (3xx), BLOCKED (401/403/429) y FAILED (resto o
 * error de red). Sale con código 1 sólo si hay FAILED; BLOCKED/REDIRECT quedan
 * para revisión manual.
 */
const { setlists } = await extractInlineModule(indexHtmlUrl, "content-module");

const urls = new Set();
for (const sl of setlists) {
  for (const s of sl.songs) {
    if (s.lyricsUrl) urls.add(s.lyricsUrl);
    if (s.chartUrl) urls.add(s.chartUrl);
    if (s.youtubeUrl) urls.add(s.youtubeUrl);
  }
}

if (urls.size === 0) {
  console.log("No hay enlaces confirmados todavía (todas las canciones están 'pending').");
  process.exit(0);
}

const classify = (status) => {
  if (status >= 200 && status < 300) return "OK";
  if (status >= 300 && status < 400) return "REDIRECT";
  if ([401, 403, 429].includes(status)) return "BLOCKED";
  return "FAILED";
};

let failed = 0;
for (const url of urls) {
  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "manual",
      headers: { "user-agent": "Mozilla/5.0 link-check" },
      signal: AbortSignal.timeout(10000)
    });
    const label = classify(res.status);
    if (label === "FAILED") failed += 1;
    console.log(`${label.padEnd(9)} ${res.status}  ${url}`);
  } catch (err) {
    failed += 1;
    console.log(`FAILED    ---  ${url}  (${err.name})`);
  }
}

console.log(`\n${urls.size} enlace(s) revisados, ${failed} con estado FAILED.`);
process.exit(failed > 0 ? 1 : 0);
