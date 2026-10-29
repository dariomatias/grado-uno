import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const html = await readFile(new URL("../index.html", import.meta.url), "utf8");

test("index contains the two application views", () => {
  assert.match(html, /id="setlistView"/);
  assert.match(html, /id="stageView"[^>]*hidden/);
  assert.match(html, /id="statusMessage"[^>]*aria-live="polite"/);
  assert.match(html, /<script type="module">/);
});

test("index has semantic landmarks and a skip link", () => {
  assert.match(html, /<html[^>]*lang="es"/);
  assert.match(html, /class="skip-link"|href="#mainContent"/);
  assert.match(html, /<header/);
  assert.match(html, /<main/);
});

test("the date picker is a calendar with the service dates", () => {
  assert.match(html, /id="meetingSelect"/);
  assert.match(html, /aria-label="Elegir fecha"/);
  assert.match(html, /id="datePicker"/);
  assert.match(html, /Grupo A/);
  assert.match(html, /Grupo B/);
  assert.match(html, /Grupo C/);
  assert.doesNotMatch(html, /role="tablist"/);
  for (const label of [
    "04/09/2026", "13/09/2026", "18/09/2026",
    "27/09/2026", "09/10/2026", "18/10/2026"
  ]) {
    assert.ok(html.includes(label), `missing tab label: ${label}`);
  }
});

test("stage controls are present", () => {
  assert.match(html, /Pantalla completa/);
  assert.match(html, /Cargar video/);
  assert.match(html, /Metrónomo/);
});

test("chord voicing popover is wired", () => {
  assert.match(html, /id="chordPopover"[^>]*role="dialog"/);
  assert.match(html, /Capo sugerido/);
  assert.match(html, /Digitación no disponible/);
  assert.match(html, /voicings-module:start/);
});

test("fullscreen stage scrolls on its own and has a pseudo-fullscreen fallback", () => {
  assert.match(html, /#stageView:fullscreen[\s\S]*?overflow-y:\s*auto/);
  assert.match(html, /#stageView\.pseudo-fullscreen/);
  assert.match(html, /webkitRequestFullscreen/);
  assert.match(html, /setPseudoFullscreen\(true\)/);
});

test("measure rows (2/4/8 bars per line, never flowing) with a list fallback are wired", () => {
  assert.match(html, /\.bars\s*\{[\s\S]*?repeat\(var\(--per-line, 4\), minmax\(0, 1fr\)\)/);
  assert.doesNotMatch(html, /\.bar:nth-child\(4n\)/);
  assert.match(html, /\.measures \{ display: flex; flex-wrap: nowrap;/);
  assert.match(html, /setAttribute\("aria-label", "Compases por línea"\)/);
  assert.match(html, /repeatedPatternSpans\(section\.measures\)/);
  assert.match(html, /chunkMeasures\(slice, perLine\)/);
  assert.match(html, /chartLayout: "grid"/);
  assert.match(html, /Vista: grilla/);
  assert.match(html, /Vista: lista/);
});

test("song structure (roadmap + unique chord blocks) is wired", () => {
  assert.match(html, /structure-module:start/);
  assert.match(html, /renderRoadmap\(structure\)/);
  assert.match(html, /aria-label", "Estructura de la canción"/);
  assert.match(html, /aparece \$\{block\.occurrences\.length\} veces/);
});

test("Cifra Club chart links are wired (card and stage)", () => {
  assert.ok((html.match(/externalLink\("Cifra Club", song\.chartUrl\)/g) ?? []).length >= 2);
  assert.match(html, /chartUrl: null/);
});

test("Home index with search and filters is wired", () => {
  assert.match(html, /catalog-module:start/);
  assert.match(html, /label: "Home", home: true/);
  assert.match(html, /placeholder = "Buscar por título o artista"/);
  for (const id of ["homeSearch", "homeKey", "homeMonth", "homeSetlist", "homeStatus", "homeGroup", "homeCount"]) assert.ok(html.includes(`"${id}"`), id);
  assert.match(html, /worship-setlist:order:v1/);
  assert.match(html, /className = "move"/);
  assert.match(html, /classList.add\("lifting"\)/);
  assert.match(html, /const ASSIGNMENTS_STORAGE_KEY = "worship-setlist:assignments:v1"/);
  assert.match(html, /worship-setlist:keys:v1/);
  assert.match(html, /writeKeyOverrides\(state\.transpositions\)/);
});

test("chord simplification selector is wired", () => {
  assert.match(html, /simplify-module:start/);
  assert.match(html, /setAttribute\("aria-label", "Simplificar acordes"\)/);
  assert.match(html, /simplifySections\(/);
});

test("section arrangement cues are wired", () => {
  assert.match(html, /\.section \.cue/);
  assert.match(html, /section\.cue/);
});

test("degree subscripts and manual capo are wired", () => {
  assert.match(html, /chordToDegree/);
  assert.match(html, /sub\.deg/);
  assert.match(html, /chordLabel: "note"/);
  assert.match(html, /Mostrar el grado y la nota como subíndice/);
  assert.match(html, /setAttribute\("aria-label", "Capo"\)/);
  assert.match(html, /Capo automático/);
  assert.match(html, /capoOverrides/);
});

test("no button is left without an accessible name", () => {
  // Rough source-level check: every <button ...> has text or aria-label.
  const buttons = html.match(/<button\b[^>]*>[\s\S]*?<\/button>/g) ?? [];
  for (const btn of buttons) {
    const hasAria = /aria-label="[^"]+"/.test(btn);
    const inner = btn.replace(/<button\b[^>]*>/, "").replace(/<\/button>/, "");
    const hasText = inner.replace(/<[^>]*>/g, "").trim().length > 0;
    assert.ok(hasAria || hasText, `button without accessible name: ${btn.slice(0, 80)}`);
  }
});
