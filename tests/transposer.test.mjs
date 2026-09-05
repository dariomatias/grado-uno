import test from "node:test";
import assert from "node:assert/strict";
import { extractInlineModule, indexHtmlUrl } from "./helpers/extract-inline-module.mjs";

const { transposeChord, semitoneDistance, parseChord, transposeSections } =
  await extractInlineModule(indexHtmlUrl, "transposer-module");

test("mandatory examples from the spec", () => {
  assert.equal(transposeChord("G", 2, "sharp"), "A");
  assert.equal(transposeChord("Em7", 2, "sharp"), "F#m7");
  assert.equal(transposeChord("D/F#", 2, "sharp"), "E/G#");
  assert.equal(transposeChord("Cadd9", -1, "sharp"), "Badd9");
  assert.equal(transposeChord("Bbsus4", 2, "flat"), "Csus4");
  assert.equal(transposeChord("Db/F", 1, "sharp"), "D/F#");
});

test("suffix families are preserved", () => {
  assert.equal(transposeChord("Am", 3, "sharp"), "Cm");
  assert.equal(transposeChord("G7", 5, "sharp"), "C7");
  assert.equal(transposeChord("Cmaj7", 2, "sharp"), "Dmaj7");
  assert.equal(transposeChord("Dm7", 2, "sharp"), "Em7");
  assert.equal(transposeChord("Dsus2", 2, "sharp"), "Esus2");
  assert.equal(transposeChord("Bdim", 1, "sharp"), "Cdim");
  assert.equal(transposeChord("Caug", 2, "sharp"), "Daug");
});

test("accidental preference", () => {
  assert.equal(transposeChord("A", 1, "sharp"), "A#");
  assert.equal(transposeChord("A", 1, "flat"), "Bb");
});

test("N.C. and unknown tokens are returned unchanged", () => {
  assert.equal(transposeChord("N.C.", 4, "sharp"), "N.C.");
  assert.equal(transposeChord("%%%", 3, "sharp"), "%%%");
});

test("octave wrap: ±12 is identity, ±13 shifts by one", () => {
  assert.equal(transposeChord("G", 12, "sharp"), "G");
  assert.equal(transposeChord("G", -12, "sharp"), "G");
  assert.equal(transposeChord("G", 13, "sharp"), "G#");
  assert.equal(transposeChord("G", -13, "sharp"), "F#");
});

test("semitoneDistance is signed nearest", () => {
  assert.equal(semitoneDistance("E", "G"), 3);
  assert.equal(semitoneDistance("B", "Bb"), -1);
  assert.equal(semitoneDistance("C", "C"), 0);
});

test("parseChord splits root, suffix, bass", () => {
  assert.deepEqual(parseChord("D/F#"), { root: "D", suffix: "", bass: "F#" });
  assert.deepEqual(parseChord("Em7"), { root: "E", suffix: "m7", bass: null });
  assert.equal(parseChord("N.C."), null);
});

test("transposeSections is non-mutating and preserves metadata", () => {
  const sections = [
    { type: "verse", label: "Verso", repeats: 2, measures: [["G", "D"], ["Em7"]] }
  ];
  const out = transposeSections(sections, 2, "sharp");
  assert.deepEqual(out[0].measures, [["A", "E"], ["F#m7"]]);
  assert.equal(out[0].label, "Verso");
  assert.equal(out[0].repeats, 2);
  // original untouched
  assert.deepEqual(sections[0].measures, [["G", "D"], ["Em7"]]);
});
