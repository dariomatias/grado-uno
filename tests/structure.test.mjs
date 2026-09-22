import test from "node:test";
import assert from "node:assert/strict";
import { extractInlineModule, indexHtmlUrl } from "./helpers/extract-inline-module.mjs";

const { songStructure, structureSummary, chunkMeasures, BARS_PER_LINE_OPTIONS } = await extractInlineModule(indexHtmlUrl, "structure-module");
const { setlists } = await extractInlineModule(indexHtmlUrl, "content-module");

const song = (title) => setlists.flatMap((s) => s.songs).find((s) => s.title === title);

test("identical chord sequences collapse into one block that lists every section using it", () => {
  const sections = [
    { type: "verse", label: "Verso 1", repeats: 1, measures: [["G"], ["D"]] },
    { type: "verse", label: "Verso 2", repeats: 1, measures: [["G"], ["D"]] },
    { type: "chorus", label: "Coro", repeats: 2, measures: [["C"], ["G"]] },
    { type: "chorus", label: "Coro", repeats: 1, measures: [["C"], ["G"]] }
  ];
  const s = songStructure(sections);
  assert.equal(s.blocks.length, 2);
  assert.deepEqual(s.blocks[0].labels, ["Verso 1", "Verso 2"]);
  assert.equal(s.blocks[0].title, "Verso 1 · Verso 2");
  assert.deepEqual(s.blocks[1].labels, ["Coro"]);
  assert.deepEqual(s.blocks[1].occurrences, [2, 3]);
  // El recorrido conserva orden y repeticiones.
  assert.deepEqual(s.roadmap.map((r) => [r.displayLabel, r.repeats, r.blockId]), [
    ["Verso 1", 1, 0], ["Verso 2", 1, 0], ["Coro", 2, 1], ["Coro", 1, 1]
  ]);
});

test("same label with different chords is disambiguated (A), (B) in blocks and roadmap alike", () => {
  const s = songStructure([
    { type: "chorus", label: "Coro", repeats: 1, measures: [["C"]] },
    { type: "verse", label: "Verso", repeats: 1, measures: [["G"]] },
    { type: "chorus", label: "Coro", repeats: 1, measures: [["D"]] },
    { type: "chorus", label: "Coro", repeats: 1, measures: [["C"]] }
  ]);
  assert.equal(s.blocks.length, 3);
  assert.equal(s.blocks[0].title, "Coro (A)");
  assert.equal(s.blocks[2].title, "Coro (B)");
  assert.deepEqual(s.roadmap.map((r) => r.displayLabel), ["Coro (A)", "Verso", "Coro (B)", "Coro (A)"]);
});

test("summary counts distinct sections per type in order of first appearance", () => {
  const s = songStructure([
    { type: "intro", label: "Intro", measures: [["G"]] },
    { type: "verse", label: "Verso 1", measures: [["G"]] },
    { type: "chorus", label: "Coro", measures: [["C"]] },
    { type: "verse", label: "Verso 2", measures: [["D"]] },
    { type: "chorus", label: "Coro", measures: [["C"]] },
    { type: "bridge", label: "Puente", measures: [["Em"]] }
  ]);
  assert.equal(structureSummary(s.typeSummary), "Intro · 2 versos · Coro · Puente");
});

test("cues travel with the roadmap steps", () => {
  const s = songStructure([{ type: "verse", label: "Verso 1", measures: [["G"]], cue: "entra acústica" }]);
  assert.equal(s.roadmap[0].cue, "entra acústica");
});

test("empty song yields an empty structure", () => {
  assert.deepEqual(songStructure([]), { roadmap: [], blocks: [], typeSummary: [] });
});

test("Lavado: four verses collapse into one block, Intro appears 3 times with different repeats, Coro 3 times", () => {
  const s = songStructure(song("Lavado").sections);
  const titles = s.blocks.map((b) => b.title);
  assert.deepEqual(titles, ["Intro", "Verso 1 · Verso 2 · Verso 3 · Verso 4", "Coro", "Puente"]);
  assert.equal(s.blocks.find((b) => b.title === "Coro").occurrences.length, 3);
  const intro = s.blocks.find((b) => b.title === "Intro");
  assert.equal(intro.occurrences.length, 3);
  // El recorrido conserva las repeticiones distintas de cada Intro (×2, ×4, ×3).
  assert.deepEqual(s.roadmap.filter((r) => r.label === "Intro").map((r) => r.repeats), [2, 4, 3]);
  assert.equal(structureSummary(s.typeSummary), "Intro · 4 versos · Coro · Puente");
});

test("A Jesús seguiré: Coro and Coro (final) share chords → one block; Tag once", () => {
  const s = songStructure(song("A Jesús seguiré").sections);
  const coro = s.blocks.find((b) => b.labels.includes("Coro"));
  assert.deepEqual(coro.labels, ["Coro", "Coro (final)"]);
  const tag = s.blocks.find((b) => b.labels.includes("Tag"));
  assert.equal(tag.occurrences.length, 5);
  assert.equal(s.blocks.length, 5); // Coro(+final), Tag, Verso 1, Pre-coro, Verso 2
});

test("Jehová: band structure — four identical verses in one block, one Coro (×3), two distinct bridges", () => {
  const s = songStructure(song("Jehová").sections);
  assert.deepEqual(s.blocks.map((b) => b.title), [
    "Intro", "Verso 1 · Verso 2 · Verso 3 · Verso 4", "Coro", "Interludio · Outro", "Puente", "Puente (final)"
  ]);
  assert.equal(s.blocks.find((b) => b.title === "Coro").occurrences.length, 3);
  assert.deepEqual(s.roadmap.map((r) => r.displayLabel + (r.repeats > 1 ? ` ×${r.repeats}` : "")), [
    "Intro", "Verso 1", "Verso 2", "Coro", "Interludio", "Verso 3", "Verso 4", "Coro ×2", "Interludio",
    "Puente ×4", "Coro ×2", "Puente (final) ×2", "Outro"
  ]);
  assert.equal(structureSummary(s.typeSummary), "Intro · 4 versos · Coro · Interludio · 2 puentes · Outro");
});

test("chunkMeasures cuts a section into rows of 2/4/8 bars; never 6+2", () => {
  const eight = Array.from({ length: 8 }, (_, i) => [String(i)]);
  assert.deepEqual(chunkMeasures(eight, 4).map((r) => r.length), [4, 4]);
  assert.deepEqual(chunkMeasures(eight, 2).map((r) => r.length), [2, 2, 2, 2]);
  assert.deepEqual(chunkMeasures(eight, 8).map((r) => r.length), [8]);
  assert.deepEqual(chunkMeasures(eight.slice(0, 7), 4).map((r) => r.length), [4, 3]);
  assert.deepEqual(chunkMeasures(eight.slice(0, 1), 4).map((r) => r.length), [1]);
  assert.deepEqual(chunkMeasures([], 4), []);
  assert.deepEqual(chunkMeasures(eight, 6).map((r) => r.length), [4, 4]); // valor inválido → 4
  assert.deepEqual(BARS_PER_LINE_OPTIONS, [2, 4, 8]);
});

test("every song defaults to 4 bars per line", () => {
  for (const s of setlists.flatMap((sl) => sl.songs)) assert.equal(s.barsPerLine, 4, s.title);
});
