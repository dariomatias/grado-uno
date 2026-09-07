import test from "node:test";
import assert from "node:assert/strict";
import { extractInlineModule, indexHtmlUrl } from "./helpers/extract-inline-module.mjs";

const { transposeChord } = await extractInlineModule(indexHtmlUrl, "transposer-module");
const {
  OPEN_KEYS, WORSHIP_VOICINGS, findVoicing, normalizeChordSymbol,
  suggestCapo, shapeForCapo, voicingsIntegrity
} = await extractInlineModule(indexHtmlUrl, "voicings-module");

test("voicing table is internally consistent", () => {
  assert.deepEqual(voicingsIntegrity(), []);
  assert.ok(Object.keys(WORSHIP_VOICINGS).length >= 50);
});

test("worship-standard shapes are the ones served", () => {
  assert.deepEqual(findVoicing("G").frets, [3, 2, 0, 0, 3, 3]);       // "G de worship"
  assert.deepEqual(findVoicing("Em7").frets, [0, 2, 2, 0, 3, 3]);
  assert.deepEqual(findVoicing("Bm7").frets, ["x", 2, 0, 2, 0, 2]);  // sin cejilla
  assert.deepEqual(findVoicing("D/F#").frets, [2, 0, 0, 2, 3, 2]);
  assert.deepEqual(findVoicing("F").frets, ["x", "x", 3, 2, 1, 1]);  // F compacta
});

test("suffix aliases resolve (2 → add9, sus → sus4, M7 → maj7)", () => {
  assert.equal(normalizeChordSymbol("C2").symbol, "Cadd9");
  assert.deepEqual(findVoicing("C2").frets, ["x", 3, 2, 0, 3, 3]);
  assert.equal(findVoicing("Dsus").symbol, "Dsus4");
  assert.equal(findVoicing("CM7").symbol, "Cmaj7");
});

test("slash chord without a specific shape falls back to its base and says so", () => {
  const v = findVoicing("Em/B");
  assert.equal(v.symbol, "Em");
  assert.equal(v.exact, false);
  assert.match(v.note, /bajo B/);
});

test("unknown or non-chord tokens yield null", () => {
  assert.equal(findVoicing("N.C."), null);
  assert.equal(findVoicing("Xdim"), null);
  assert.equal(findVoicing("Cdim"), null); // no está en la tabla → "no disponible"
});

test("suggestCapo picks the lowest capo that lands on an open key", () => {
  const cases = {
    C: [0, "C"], D: [0, "D"], E: [0, "E"], G: [0, "G"], A: [0, "A"],
    Eb: [1, "D"], "D#": [1, "D"], F: [1, "E"], Bb: [1, "A"], Ab: [1, "G"], Db: [1, "C"], "G#": [1, "G"],
    B: [2, "A"], "F#": [2, "E"]
  };
  for (const [key, [capo, shapeRoot]] of Object.entries(cases)) {
    const got = suggestCapo(key, transposeChord);
    assert.equal(got.capo, capo, `key ${key}`);
    assert.equal(got.shapeRoot, shapeRoot, `key ${key}`);
  }
  for (const k of OPEN_KEYS) assert.equal(suggestCapo(k, transposeChord).capo, 0);
});

test("suggestCapo moves the capo only when it removes two or more barre chords", () => {
  // Jehová en E: C#m, B y F#m son cejillas en capo 0; con capo 4 son las
  // formas de C del chart original (C, Am, F, G…): cero cejillas.
  const jehova = ["E", "Esus", "C#m", "A", "B", "F#m", "Asus2", "E/G#", "E/B"];
  const j = suggestCapo("E", transposeChord, jehova);
  assert.equal(j.capo, 4);
  assert.equal(j.shapeRoot, "C");
  assert.equal(j.barres, 0);

  // Una sola cejilla no justifica mover el capo: Todo es posible (D, con Bm)
  // y Creeré (A, con F#m) se quedan abiertos.
  assert.equal(suggestCapo("D", transposeChord, ["D", "Bm", "G", "A", "D/F#"]).capo, 0);
  assert.equal(suggestCapo("A", transposeChord, ["A", "Asus", "F#m", "D", "E", "E/G#", "A/E"]).capo, 0);

  // Sin cejillas, capo 0 se mantiene (las tres del Dom 13 en G).
  assert.equal(suggestCapo("G", transposeChord, ["G", "D", "C", "Em", "G/B", "D/G", "D/C"]).capo, 0);

  // N.C. no cuenta.
  assert.equal(suggestCapo("G", transposeChord, ["G", "N.C."]).barres, 0);
});

test("shapes the Jehová chart needs at capo 4 all have a voicing", () => {
  for (const chord of ["E", "Esus", "C#m", "A", "B", "F#m", "Asus2", "E/G#", "E/B"]) {
    const shape = shapeForCapo(chord, 4, transposeChord);
    const v = findVoicing(shape);
    assert.ok(v, `${chord} → ${shape} needs a voicing`);
    assert.ok(!v.barre, `${shape} should be an open shape`);
  }
});

test("shapeForCapo transposes the sounding chord down by the capo", () => {
  assert.equal(shapeForCapo("Eb", 1, transposeChord), "D");
  assert.equal(shapeForCapo("Cm", 1, transposeChord), "Bm");
  assert.equal(shapeForCapo("Bb/D", 1, transposeChord), "A/C#");
  assert.equal(shapeForCapo("B", 2, transposeChord), "A");
  assert.equal(shapeForCapo("G", 0, transposeChord), "G");
});

test("an Eb-key chart resolves to playable D-key shapes at capo 1", () => {
  const { capo } = suggestCapo("Eb", transposeChord);
  for (const sounding of ["Eb", "Ab", "Bb", "Cm", "Gm", "Fm"]) {
    const shape = shapeForCapo(sounding, capo, transposeChord);
    assert.ok(findVoicing(shape), `${sounding} → ${shape} should have a voicing`);
  }
});
