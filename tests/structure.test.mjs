import test from "node:test";
import assert from "node:assert/strict";
import { extractInlineModule, indexHtmlUrl } from "./helpers/extract-inline-module.mjs";

const { songStructure, structureSummary } = await extractInlineModule(indexHtmlUrl, "structure-module");
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

test("Lavado: Verso 1/Verso 2 merge, Puente/Tag merge, Coro appears 3 times", () => {
  const s = songStructure(song("Lavado").sections);
  const titles = s.blocks.map((b) => b.title);
  assert.ok(titles.includes("Verso 1 · Verso 2"), titles.join(" | "));
  assert.ok(titles.includes("Puente · Tag"), titles.join(" | "));
  const coro = s.blocks.find((b) => b.title === "Coro");
  assert.equal(coro.occurrences.length, 3);
  assert.equal(s.blocks.length, 6); // Intro, Verso, Coro, Vamp, Puente·Tag, Instrumental
});

test("A Jesús seguiré: Coro and Coro (final) share chords → one block; Tag once", () => {
  const s = songStructure(song("A Jesús seguiré").sections);
  const coro = s.blocks.find((b) => b.labels.includes("Coro"));
  assert.deepEqual(coro.labels, ["Coro", "Coro (final)"]);
  const tag = s.blocks.find((b) => b.labels.includes("Tag"));
  assert.equal(tag.occurrences.length, 5);
  assert.equal(s.blocks.length, 5); // Coro(+final), Tag, Verso 1, Pre-coro, Verso 2
});

test("Jehová: two different 'Coro' sequences become Coro (A)/(B); Intro, Interludio and Outro share one block", () => {
  const s = songStructure(song("Jehová").sections);
  const titles = s.blocks.map((b) => b.title);
  assert.ok(titles.some((t) => t.includes("Coro (A)")) && titles.some((t) => t.includes("Coro (B)")), titles.join(" | "));
  const shared = s.blocks.find((b) => b.labels.includes("Intro"));
  assert.deepEqual(shared.labels, ["Intro", "Interludio", "Outro"]);
  // El recorrido usa los mismos nombres desambiguados.
  const coroSteps = s.roadmap.filter((r) => r.label === "Coro").map((r) => r.displayLabel);
  assert.deepEqual(coroSteps, ["Coro (A)", "Coro (B)", "Coro (A)"]);
});
