import test from "node:test";
import assert from "node:assert/strict";
import { extractInlineModule, indexHtmlUrl } from "./helpers/extract-inline-module.mjs";

const { setlists, appearanceKey, validateSetlists, allAppearanceKeys } =
  await extractInlineModule(indexHtmlUrl, "content-module");
const { transposeSections, semitoneDistance } =
  await extractInlineModule(indexHtmlUrl, "transposer-module");

const expected = [
  ["2026-09-04", [
    ["Todo es posible", "D"], ["A Jesús seguiré", "G"], ["Creeré", "A"],
    ["Santo una cosa", "A"], ["Al que está sentado", "A"], ["Digno de alabar", "D"],
    ["Dios de avivamiento", "C"]
  ]],
  ["2026-09-13", [
    ["Jehová", "E"], ["Lavado", "B"], ["Nadie", "G"], ["Quién Más", "G"],
    ["Canta al Señor", "G"], ["No Hay Otro Nombre", "G"], ["El Nombre de Jesús", "D"]
  ]],
  ["2026-09-18", [
    ["Señor eres fiel", "C"], ["En el nombre de Jesús", "C"], ["Clamo a Cristo", "E"],
    ["Cómo no voy a creer", "E"], ["Para siempre Cristo", "E"], ["Agnus Dei", "E"],
    ["Alabaré al Señor", "D"]
  ]],
  ["2026-09-27", [
    ["Júbilo", "C"], ["Eres libre", "G"], ["Adiós al ayer", "F"], ["Clamo a Dios", "D"],
    ["Es Él", "A"], ["Vida nueva", "A"], ["De gracia en gracia", "Eb"]
  ]]
];

test("four setlists with 28 appearances in order and key", () => {
  assert.equal(setlists.length, 4);
  assert.equal(setlists.flatMap((item) => item.songs).length, 28);
  assert.deepEqual(
    setlists.map((item) => [item.id, item.songs.map((s) => [s.title, s.assignedKey])]),
    expected
  );
});

test("short labels are exact", () => {
  assert.deepEqual(setlists.map((s) => s.shortLabel), ["Vie 4", "Dom 13", "Vie 18", "Dom 27"]);
});

test("validateSetlists reports no errors", () => {
  assert.deepEqual(validateSetlists(setlists), []);
});

test("song ids are unique within each setlist", () => {
  for (const sl of setlists) {
    const ids = sl.songs.map((s) => s.id);
    assert.equal(new Set(ids).size, ids.length, `duplicate id in ${sl.id}`);
  }
});

test("pending songs have no invented chords and no preloaded lyrics", () => {
  // `pending` gobierna sólo los acordes. Artista/video/enlaces pueden estar
  // confirmados por separado, pero jamás se inventan secciones.
  for (const sl of setlists) {
    for (const s of sl.songs) {
      if (s.sourceStatus === "pending") {
        assert.equal(s.sections.length, 0, `${s.id}: pending song must not carry chords`);
      }
      assert.ok(!("lyricsText" in s), `${s.id}: must not carry lyricsText`);
    }
  }
});

test("every youtubeVideoId, when present, is a valid 11-char id matching its url", () => {
  for (const sl of setlists) {
    for (const s of sl.songs) {
      if (s.youtubeVideoId !== null) {
        assert.match(s.youtubeVideoId, /^[A-Za-z0-9_-]{11}$/, `${s.id}: bad video id`);
        assert.ok(s.youtubeUrl?.includes(s.youtubeVideoId), `${s.id}: url must contain the id`);
      }
    }
  }
});

test("confirmed songs have a real artist and sections; links, if any, are http(s)", () => {
  const confirmed = setlists.flatMap((sl) => sl.songs).filter((s) => s.sourceStatus === "confirmed");
  assert.ok(confirmed.length >= 4, "expected the Dom 13 drafts plus Todo es posible");
  for (const s of confirmed) {
    assert.notEqual(s.artist, "Versión por confirmar", `${s.id}: needs real artist`);
    assert.ok(s.sections.length > 0, `${s.id}: needs sections`);
    // Un chart puede venir de un PDF licenciado de Darío sin URL pública.
    if (s.lyricsUrl !== null) assert.match(s.lyricsUrl, /^https?:\/\//, `${s.id}: bad lyrics url`);
    for (const section of s.sections) {
      assert.ok(section.measures.length > 0, `${s.id}: empty section ${section.label}`);
      for (const measure of section.measures) {
        assert.ok(measure.length > 0, `${s.id}: empty measure in ${section.label}`);
      }
    }
  }
});

test("Todo es posible: official Bethel chart (Bb, 122 BPM) normalized to D via the transposer", () => {
  const song = setlists[0].songs[0];
  assert.equal(song.title, "Todo es posible");
  assert.equal(song.sourceKey, "Bb");
  assert.equal(song.assignedKey, "D");
  assert.equal(song.tempoBpm, 122);
  assert.equal(song.sourceStatus, "confirmed");

  // Transcripción del chart oficial en su tono original (sólo acordes).
  const coroBb = [["Eb"], ["Bb", "F"], ["Eb"], ["Bb", "F"], ["Eb"], ["Gm", "Bb"], ["Eb"], ["Bb", "F", "Bb"]];
  const versoBb = [["Bb"], ["Bb/D", "Eb"], ["Bb"], ["Bb/D", "Eb"], ["Gm", "F"], ["Bb/D", "Eb"], ["Bb"]];
  const sourceBb = [
    { label: "Verso 1", measures: [["Bb"], ["Bb"], ["Bb"], ["Bb"], ["Gm"], ["Eb"], ["Bb"]] },
    { label: "Verso 2", measures: versoBb },
    { label: "Coro", measures: coroBb },
    { label: "Verso 3", measures: versoBb },
    { label: "Coro", measures: coroBb },
    { label: "Canal", measures: [["Bb"], ["Bb"]] },
    { label: "Puente", measures: [["Bb"], ["Bb"], ["Bb"], ["Bb"]] },
    { label: "Puente (acordes alternos)", measures: [["Gm"], ["F"], ["Bb/D"], ["Eb"], ["Gm"], ["F"], ["Bb"], ["Eb"]] },
    { label: "Coro", measures: coroBb },
    { label: "Instrumental", measures: [["Eb"], ["Eb"], ["Bb"], ["F"], ["Eb"], ["Eb"], ["Bb"], ["F"], ["Eb"], ["Eb"], ["Gm"], ["Bb"], ["Eb"], ["Eb"], ["Bb"], ["F"]] }
  ];

  const shift = semitoneDistance("Bb", "D");
  assert.equal(shift, 4);
  const normalized = transposeSections(sourceBb, shift, "sharp");
  assert.deepEqual(song.sections.map((s) => s.label), sourceBb.map((s) => s.label));
  assert.deepEqual(song.sections.map((s) => s.measures), normalized.map((s) => s.measures));
  // Repeticiones según el chart: Canal ×2 y Puente alterno ×2.
  assert.equal(song.sections.find((s) => s.label === "Canal").repeats, 2);
  assert.equal(song.sections.find((s) => s.label === "Puente (acordes alternos)").repeats, 2);
});

test("appearanceKey composes setlist and song ids", () => {
  assert.equal(appearanceKey("2026-09-13", "jehova"), "2026-09-13:jehova");
  assert.equal(allAppearanceKeys().length, 28);
});
