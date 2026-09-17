import test from "node:test";
import assert from "node:assert/strict";
import { extractInlineModule, indexHtmlUrl } from "./helpers/extract-inline-module.mjs";
const { setlists } = await extractInlineModule(indexHtmlUrl, "content-module");
const { transposeChord, semitoneDistance } = await extractInlineModule(indexHtmlUrl, "transposer-module");
const vie18 = setlists[2];
const by = (t) => vie18.songs.find((s) => s.title === t);

test("Vie 18: six of seven songs have charts; Para siempre Cristo has its version but no chart yet", () => {
  const withChart = vie18.songs.filter((s) => s.sourceStatus === "confirmed").map((s) => s.title);
  assert.deepEqual(withChart, ["Señor eres fiel", "En el nombre de Jesús", "Clamo a Cristo", "Cómo no voy a creer", "Agnus Dei", "Alabaré al Señor"]);
  const psc = by("Para siempre Cristo");
  assert.equal(psc.sourceStatus, "pending");
  assert.match(psc.artist, /Siempre YHWH/);
  for (const s of vie18.songs) assert.notEqual(s.artist, "Versión por confirmar", `${s.id}: version should be confirmed`);
});

test("Vie 18: every chart is normalized to its assigned key (sourceKey → assignedKey)", () => {
  const expect = { "Señor eres fiel": ["E", "C"], "En el nombre de Jesús": ["D", "C"], "Clamo a Cristo": ["F", "E"],
    "Cómo no voy a creer": ["C", "E"], "Agnus Dei": ["A", "E"], "Alabaré al Señor": ["C", "D"] };
  for (const [title, [from, to]] of Object.entries(expect)) {
    const s = by(title);
    assert.equal(s.sourceKey, from, title);
    assert.equal(s.assignedKey, to, title);
  }
  // Muestras doradas: el primer acorde del chart transpuesto = primer acorde almacenado.
  assert.equal(by("Clamo a Cristo").sections[0].measures[0][0], transposeChord("C", semitoneDistance("F", "E"), "sharp")); // B
  assert.equal(by("Alabaré al Señor").sections[0].measures[0][0], transposeChord("C", semitoneDistance("C", "D"), "sharp")); // D
  assert.equal(by("Agnus Dei").sections[0].measures[0][0], "E");
  assert.equal(by("Cómo no voy a creer").sections[0].measures[0][0], "A");
  assert.equal(by("En el nombre de Jesús").sections[0].measures[0][0], "C");
  assert.equal(by("Señor eres fiel").sections[0].measures[0][0], "C");
});

test("Vie 18: flat keys are spelled with flats, sharp keys with sharps", () => {
  const chords = (t) => new Set(by(t).sections.flatMap((s) => s.measures.flat()));
  assert.ok(chords("Señor eres fiel").has("Bb/C") && chords("Señor eres fiel").has("F/C"));
  assert.ok(chords("En el nombre de Jesús").has("Bb"));
  assert.ok(chords("Clamo a Cristo").has("F#m"));
  assert.ok(chords("Cómo no voy a creer").has("C#m") && chords("Cómo no voy a creer").has("B/D#"));
  assert.ok(chords("Agnus Dei").has("C#m7") && chords("Agnus Dei").has("E/G#"));
  assert.ok(chords("Alabaré al Señor").has("D7M/F#") && chords("Alabaré al Señor").has("Bm"));
});

test("Vie 18: Cifra Club links are the ones Darío gave", () => {
  assert.equal(by("Señor eres fiel").chartUrl, "https://www.cifraclub.com/israel-houghton/you-are-good/");
  assert.equal(by("Agnus Dei").chartUrl, "https://www.cifraclub.com/michael-w-smith-musicas/agnus-dei/");
  assert.equal(by("Alabaré al Señor").chartUrl, "https://www.cifraclub.com/hillsong-united/alabare-al-senor-anastasis/");
  assert.deepEqual(vie18.songs.map((s) => s.youtubeVideoId), ["5KiQDoWo5t4", "qehwr2MMTqg", "KTxfFEB8gAI", "1REIaIcLDFo", "y7GlaEinjeM", "har4itYxlBg", "bggLFqnXygs"]);
});
