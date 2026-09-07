import test from "node:test";
import assert from "node:assert/strict";
import { extractInlineModule, indexHtmlUrl } from "./helpers/extract-inline-module.mjs";

const { setlists, appearanceKey, validateSetlists, allAppearanceKeys } =
  await extractInlineModule(indexHtmlUrl, "content-module");

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

test("confirmed songs have a real artist, sections, and a lyrics url", () => {
  const confirmed = setlists.flatMap((sl) => sl.songs).filter((s) => s.sourceStatus === "confirmed");
  assert.ok(confirmed.length >= 3, "expected at least the Dom 13 drafts confirmed");
  for (const s of confirmed) {
    assert.notEqual(s.artist, "Versión por confirmar", `${s.id}: needs real artist`);
    assert.ok(s.sections.length > 0, `${s.id}: needs sections`);
    assert.ok(typeof s.lyricsUrl === "string" && /^https?:\/\//.test(s.lyricsUrl), `${s.id}: needs lyrics url`);
    for (const section of s.sections) {
      assert.ok(section.measures.length > 0, `${s.id}: empty section ${section.label}`);
      for (const measure of section.measures) {
        assert.ok(measure.length > 0, `${s.id}: empty measure in ${section.label}`);
      }
    }
  }
});

test("appearanceKey composes setlist and song ids", () => {
  assert.equal(appearanceKey("2026-09-13", "jehova"), "2026-09-13:jehova");
  assert.equal(allAppearanceKeys().length, 28);
});
