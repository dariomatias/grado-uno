import test from "node:test";
import assert from "node:assert/strict";
import { extractInlineModule, indexHtmlUrl } from "./helpers/extract-inline-module.mjs";

const { transposeChord, semitoneDistance, parseChord, transposeSections, degreeToChord, degreesToSections, chordToDegree } =
  await extractInlineModule(indexHtmlUrl, "transposer-module");

test("chordToDegree gives the Nashville degree of a chord in a key (quality excluded)", () => {
  assert.equal(chordToDegree("G", "G"), "1");
  assert.equal(chordToDegree("D", "G"), "5");
  assert.equal(chordToDegree("Em", "G"), "6");
  assert.equal(chordToDegree("C", "G"), "4");
  assert.equal(chordToDegree("Am7", "G"), "2");
  assert.equal(chordToDegree("Bm", "D"), "6");
  assert.equal(chordToDegree("C#m", "E"), "6");
  // Prestados / no diatónicos con alteración.
  assert.equal(chordToDegree("F", "G"), "b7");
  assert.equal(chordToDegree("Eb", "C"), "b3");
  assert.equal(chordToDegree("F#", "C"), "#4");
  assert.equal(chordToDegree("Ab", "C"), "b6");
  // Acordes con bajo: grado del acorde / grado del bajo.
  assert.equal(chordToDegree("D/F#", "D"), "1/3");
  assert.equal(chordToDegree("A/C#", "D"), "5/7");
  assert.equal(chordToDegree("B/D#", "B"), "1/3");
  // Enarmónicos y transposición: el grado no cambia con la escritura.
  assert.equal(chordToDegree("Db", "Db"), "1");
  assert.equal(chordToDegree("C#", "Db"), "1");
  // No acorde → vacío.
  assert.equal(chordToDegree("N.C.", "G"), "");
});

test("chordToDegree is the inverse of degreeToChord for diatonic degrees", () => {
  for (const key of ["C", "G", "D", "A", "E", "B", "F", "Bb", "Eb"]) {
    for (const d of ["1", "2m", "3m", "4", "5", "6m", "1/3", "4/5"]) {
      const chord = degreeToChord(d, key);
      assert.equal(chordToDegree(chord, key), d.replace(/m/g, ""), `${d} in ${key} → ${chord}`);
    }
  }
});

test("degree is invariant under capo (shape vs sounding) and transposition", () => {
  // En B con capo 4 se digita G, pero el grado del acorde real sigue siendo 1.
  assert.equal(chordToDegree("B", "B"), chordToDegree(transposeChord("B", 5), transposeChord("B", 5)));
  assert.equal(chordToDegree("G#m", "B"), "6");
  assert.equal(chordToDegree(transposeChord("G#m", -4), transposeChord("B", -4)), "6");
});

test("degreeToChord converts Nashville numbers into the key's natural spelling", () => {
  assert.equal(degreeToChord("1", "B"), "B");
  assert.equal(degreeToChord("1/3", "B"), "B/D#");
  assert.equal(degreeToChord("4", "B"), "E");
  assert.equal(degreeToChord("5", "B"), "F#");
  assert.equal(degreeToChord("6m", "B"), "G#m");
  assert.equal(degreeToChord("2m", "B"), "C#m");
  // Tonalidades con bemoles se escriben con bemoles.
  assert.equal(degreeToChord("4", "F"), "Bb");
  assert.equal(degreeToChord("5", "Eb"), "Bb");
  assert.equal(degreeToChord("6m", "Eb"), "Cm");
  // Sufijos se conservan; ° se normaliza a dim; lo que no es grado queda intacto.
  assert.equal(degreeToChord("4sus2", "G"), "Csus2");
  assert.equal(degreeToChord("7°", "C"), "Bdim");
  assert.equal(degreeToChord("N.C.", "B"), "N.C.");
});

test("degreesToSections maps every token and keeps metadata", () => {
  const out = degreesToSections([{ label: "Coro", repeats: 2, measures: [["1"], ["4", "6m"]] }], "B");
  assert.deepEqual(out[0].measures, [["B"], ["E", "G#m"]]);
  assert.equal(out[0].repeats, 2);
});

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
