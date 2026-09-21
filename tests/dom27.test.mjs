import test from "node:test";
import assert from "node:assert/strict";
import { extractInlineModule, indexHtmlUrl } from "./helpers/extract-inline-module.mjs";
const { setlists } = await extractInlineModule(indexHtmlUrl, "content-module");
const { degreesToSections } = await extractInlineModule(indexHtmlUrl, "transposer-module");
const { songStructure } = await extractInlineModule(indexHtmlUrl, "structure-module");
const dom27 = setlists.find((s) => s.id === "2026-09-27");
const song = (title) => dom27.songs.find((s) => s.title === title);

test("Júbilo: Darío's degree chart (2026-09-21) rendered in the original key D, one chord per bar", () => {
  const s = song("Júbilo");
  assert.equal(s.assignedKey, "D");
  assert.equal(s.sourceKey, "D");
  assert.equal(s.sourceStatus, "confirmed");
  const A = ["1", "2m", "1/3", "4"];
  const verso = [...A, "6m", "3m", "4"];
  const puente = ["6m", "4", "1", "2m"];
  const bars = (d) => d.map((x) => [x]);
  const expected = degreesToSections([
    { type: "verse", label: "Verso 1", repeats: 1, measures: bars(verso) },
    { type: "verse", label: "Verso 2", repeats: 1, measures: bars(verso) },
    { type: "chorus", label: "Coro", repeats: 1, measures: bars([...A, ...A]) },
    { type: "instrumental", label: "Interludio", repeats: 1, measures: bars(A) },
    { type: "bridge", label: "Puente", repeats: 1, measures: bars([...puente, ...puente]) },
    { type: "chorus", label: "Coro", repeats: 1, measures: bars([...A, ...A]) }
  ], "D");
  assert.deepEqual(s.sections, expected);
  assert.deepEqual(s.sections[0].measures.flat(), ["D", "Em", "D/F#", "G", "Bm", "F#m", "G"]);
  assert.deepEqual(s.sections[4].measures.flat().slice(0, 4), ["Bm", "G", "D", "Em"]);
  const st = songStructure(s.sections);
  assert.deepEqual(st.blocks.map((b) => b.title), ["Verso 1 · Verso 2", "Coro", "Interludio", "Puente"]);
  assert.equal(st.blocks.find((b) => b.title === "Coro").occurrences.length, 2);
});
