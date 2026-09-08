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

test("date tablist is present with four tabs", () => {
  assert.match(html, /role="tablist"/);
  for (const label of ["Vie 4", "Dom 13", "Vie 18", "Dom 27"]) {
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

test("measure grid layout (4 bars per row) with a list fallback is wired", () => {
  assert.match(html, /\.bars\s*\{[\s\S]*?repeat\(4, minmax\(0, 1fr\)\)/);
  assert.match(html, /\.bar:nth-child\(4n\)/);
  assert.match(html, /chartLayout: "grid"/);
  assert.match(html, /Vista: grilla/);
  assert.match(html, /Vista: lista/);
});

test("section arrangement cues are wired", () => {
  assert.match(html, /\.section \.cue/);
  assert.match(html, /section\.cue/);
});

test("degree subscripts and manual capo are wired", () => {
  assert.match(html, /chordToDegree/);
  assert.match(html, /sub\.deg/);
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
