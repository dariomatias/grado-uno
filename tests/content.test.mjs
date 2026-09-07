import test from "node:test";
import assert from "node:assert/strict";
import { extractInlineModule, indexHtmlUrl } from "./helpers/extract-inline-module.mjs";

const { setlists, appearanceKey, validateSetlists, allAppearanceKeys } =
  await extractInlineModule(indexHtmlUrl, "content-module");
const { transposeSections, semitoneDistance, degreesToSections } =
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
  assert.ok(confirmed.length >= 9, "expected the Dom 13 drafts plus Todo es posible, A Jesús seguiré, Creeré, Jehová, Lavado and El Nombre de Jesús");
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

test("A Jesús seguiré: TWICE chart already in G, stored without transposition, G/D/A only", () => {
  const song = setlists[0].songs[1];
  assert.equal(song.title, "A Jesús seguiré");
  assert.equal(song.sourceKey, "G");
  assert.equal(song.assignedKey, "G");
  assert.equal(song.sourceStatus, "confirmed");
  assert.equal(song.tempoBpm, null); // la fuente no indica BPM

  const chords = new Set(song.sections.flatMap((s) => s.measures.flat()));
  assert.deepEqual([...chords].sort(), ["A", "D", "G"]);

  // Orden de ejecución del chart, con el final construido por pre-coros y tags.
  assert.equal(song.sections.length, 15);
  assert.equal(song.sections[0].label, "Coro");
  assert.equal(song.sections.at(-2).label, "Coro (final)");
  assert.equal(song.sections.at(-1).label, "Tag");
  assert.equal(song.sections.filter((s) => s.label === "Tag" && s.repeats === 2).length, 2);
  assert.equal(song.sections.filter((s) => s.label === "Pre-coro").length, 4);
  for (const s of song.sections) assert.ok(s.measures.every((m) => m.length > 0));
});

test("Creeré: official Bethel chart (Bb, 72 BPM) normalized to A via the transposer", () => {
  const song = setlists[0].songs[2];
  assert.equal(song.title, "Creeré");
  assert.equal(song.sourceKey, "Bb");
  assert.equal(song.assignedKey, "A");
  assert.equal(song.tempoBpm, 72);
  assert.equal(song.sourceStatus, "confirmed");

  // Transcripción del chart oficial en su tono original (sólo acordes).
  const coroBb = [["Bb", "Bbsus", "Bb"], ["Gm", "F", "Eb", "F"], ["Bb", "Bbsus", "Bb"], ["Gm", "F", "Eb", "Bb"]];
  const puenteBb = [["Bb", "F/A"], ["Gm", "F", "Eb"], ["Bb", "F/A"], ["Gm", "F", "Eb"], ["Bb"], ["Gm", "Eb"], ["Bb/F", "Gm", "F"], ["Eb"], ["Eb"]];
  const sourceBb = [
    { label: "Intro", measures: [["Eb"], ["Bb", "Eb"], ["Bb", "Eb"], ["Bb", "Eb"], ["Bb", "Eb"]] },
    { label: "Verso 1", measures: [["Bb", "Bbsus", "Bb"], ["Bbsus", "Bb"], ["Gm"], ["Eb", "Bb", "Gm", "F", "Eb"]] },
    { label: "Coro 1", measures: coroBb },
    { label: "Transición 1", measures: [["Bb", "Eb"], ["Bb", "Eb"]] },
    { label: "Verso 2", measures: [["Bb"], ["Bbsus", "Bb"], ["Bb", "Bbsus", "Bb"], ["Gm"], ["Eb", "Bb", "Gm", "F", "Eb"]] },
    { label: "Coro", measures: coroBb },
    { label: "Transición 2", measures: [["Bb", "F/A"], ["Gm", "F"], ["Eb"]] },
    { label: "Puente", measures: puenteBb },
    { label: "Coro 2", measures: [["Bb"], ["Bbsus", "Bb"], ["Gm", "F"], ["Eb", "F"], ["Bb"], ["Bbsus", "Bb"], ["Gm", "F"], ["Eb", "F"]] },
    { label: "Coro 1", measures: coroBb },
    { label: "Tag", measures: [["Bb"]] },
    { label: "Puente", measures: puenteBb },
    { label: "Coro", measures: coroBb }
  ];

  const shift = semitoneDistance("Bb", "A");
  assert.equal(shift, -1);
  const normalized = transposeSections(sourceBb, shift, "sharp");
  assert.deepEqual(song.sections.map((s) => s.label), sourceBb.map((s) => s.label));
  assert.deepEqual(song.sections.map((s) => s.measures), normalized.map((s) => s.measures));
  assert.equal(song.sections.find((s) => s.label === "Tag").repeats, 3);
  // Los acordes con bajo del chart llegan como formas abiertas en A.
  const chords = new Set(song.sections.flatMap((s) => s.measures.flat()));
  assert.ok(chords.has("E/G#") && chords.has("A/E") && chords.has("Asus"));
});

test("Jehová: Elevation chart written in C shapes with capo 1 (Db), normalized to E via the transposer", () => {
  const song = setlists[1].songs[0];
  assert.equal(song.title, "Jehová");
  assert.equal(song.sourceKey, "Db"); // tono que suena en la fuente (capo 1 sobre formas de C)
  assert.equal(song.assignedKey, "E");
  assert.equal(song.tempoBpm, null); // la fuente no indica BPM
  assert.equal(song.sourceStatus, "confirmed");
  // Formas escritas +4 (C→E) equivale al tono sonante +3 (Db→E).
  assert.equal(semitoneDistance("Db", "E"), 3);
  assert.equal(semitoneDistance("C", "E"), 4);

  // Transcripción de las formas escritas en el chart (sólo acordes).
  const coroA = [["C", "F"], ["C"], ["Am"], ["F", "C"], ["F"], ["C"], ["Am"], ["F", "C"]];
  const coroB = [["C", "F"], ["C"], ["Am"], ["F", "C"], ["F"], ["C"], ["Am"], ["F", "C", "Csus"]];
  const puenteBajo = [["C/E", "F"], ["C/G", "F"]];
  const writtenC = [
    { label: "Intro", measures: [["C", "Csus"]] },
    { label: "Verso 1", measures: [["C", "Csus"], ["C", "Csus"], ["Am", "F", "C"], ["G"], ["C", "F"], ["C", "F"], ["Am", "F", "C"], ["G"]] },
    { label: "Coro", measures: coroB },
    { label: "Interludio", measures: [["C", "Csus"]] },
    { label: "Verso 2", measures: [["C", "Csus"], ["C", "F"], ["Am", "F", "C"], ["G"], ["C", "F"], ["C", "F"], ["Am", "F", "Dm", "C"], ["F", "G"]] },
    { label: "Coro", measures: coroA },
    { label: "Coro", measures: coroB },
    { label: "Interludio", measures: [["C", "Csus"]] },
    { label: "Puente", measures: [["C", "Fsus2"], ["C", "Fsus2", "F"]] },
    { label: "Puente (bajo)", measures: puenteBajo },
    { label: "Puente (cierre)", measures: [["C/E", "F"], ["C/G", "G"]] },
    { label: "Coro (variación)", measures: [["C", "F"], ["C"], ["Am"], ["F", "C"], ["F"], ["C/E"], ["Am"], ["F", "C"]] },
    { label: "Coro (variación 2)", measures: [["F"], ["C"], ["Am"], ["F", "C"], ["F"], ["C"], ["Am"], ["F"]] },
    { label: "Puente (bajo)", measures: puenteBajo },
    { label: "Outro", measures: [["C", "Csus"]] }
  ];

  const normalized = transposeSections(writtenC, semitoneDistance("C", "E"), "sharp");
  assert.deepEqual(song.sections.map((s) => s.label), writtenC.map((s) => s.label));
  assert.deepEqual(song.sections.map((s) => s.measures), normalized.map((s) => s.measures));
  // Repeticiones según el chart.
  const reps = Object.fromEntries(song.sections.map((s, i) => [`${i}:${s.label}`, s.repeats]));
  assert.equal(reps["0:Intro"], 4);
  assert.equal(reps["7:Interludio"], 2);
  assert.equal(reps["8:Puente"], 4);
  assert.equal(reps["9:Puente (bajo)"], 3);
  assert.equal(reps["13:Puente (bajo)"], 4);
  assert.equal(reps["14:Outro"], 2);
});

test("Lavado: official Elevation Español number chart converted to B via degreeToChord", () => {
  const song = setlists[1].songs[1];
  assert.equal(song.title, "Lavado");
  assert.equal(song.assignedKey, "B");
  assert.equal(song.sourceKey, null); // chart en números: no tiene tono de fuente
  assert.equal(song.tempoBpm, null);
  assert.equal(song.sourceStatus, "confirmed");

  // Transcripción del chart oficial en números (sólo grados).
  const prog = [["1/3", "4"], ["5", "6m"]];
  const verso = [["1/3", "4"], ["5", "6m", "1/3", "4"], ["5", "6m", "1/3", "4"], ["5", "6m", "2m"], ["4"]];
  const coro = [["1"], ["4"], ["6m"], ["5"], ["1"], ["4"], ["6m"], ["5"]];
  const puente = [["1"], ["4"], ["6m"], ["4"]];
  const numbers = [
    { label: "Intro", measures: prog },
    { label: "Verso 1", measures: verso },
    { label: "Coro", measures: coro },
    { label: "Verso 2", measures: verso },
    { label: "Coro", measures: coro },
    { label: "Vamp", measures: [["1"], ["1"]] },
    { label: "Puente", measures: puente },
    { label: "Tag", measures: puente },
    { label: "Instrumental", measures: [...prog, ...prog, ...prog, ["2m"], ["4"]] },
    { label: "Coro", measures: coro }
  ];

  const converted = degreesToSections(numbers, "B");
  assert.deepEqual(song.sections.map((s) => s.label), numbers.map((s) => s.label));
  assert.deepEqual(song.sections.map((s) => s.measures), converted.map((s) => s.measures));
  // Repeticiones según el chart: Intro 2x, versos 2x, segundo Coro 2x, Puente 4x, Instrumental 2x.
  const reps = song.sections.map((s) => s.repeats);
  assert.deepEqual(reps, [2, 2, 1, 2, 2, 1, 4, 1, 2, 1]);
  // Sólo los seis acordes del chart.
  const chords = new Set(song.sections.flatMap((s) => s.measures.flat()));
  assert.deepEqual([...chords].sort(), ["B", "B/D#", "C#m", "E", "F#", "G#m"]);
});

test("El Nombre de Jesús: chart in Db normalized to D via the transposer", () => {
  const song = setlists[1].songs[6];
  assert.equal(song.title, "El Nombre de Jesús");
  assert.equal(song.sourceKey, "Db");
  assert.equal(song.assignedKey, "D");
  assert.equal(song.tempoBpm, null);
  assert.equal(song.sourceStatus, "confirmed");

  // Transcripción del chart en su tono original (sólo acordes).
  const instr1 = [["Ebm"], ["Gb"], ["Ebm"], ["Gb"], ["Bbm"], ["Ab"], ["Bbm"], ["Ab"]];
  const coro3 = [["Ebm", "Gb"], ["Db", "Bbm", "Ab"], ["Ebm", "Gb"], ["Db", "Bbm", "Ab"]];
  const sourceDb = [
    { label: "Intro", measures: [["Db", "Ab/C"], ["Gb"], ["Db", "Ab/C"], ["Gb"]] },
    { label: "Verso 1", measures: [["Db", "Ab/C", "Gb"], ["Db", "Ab/C", "Gb"], ["Bbm", "Ab", "Gb"], ["Bbm", "Ab", "Gb"]] },
    { label: "Coro 1", measures: [["Ebm"], ["Gb"], ["Db"], ["Bbm", "Ab"], ["Ebm", "Gb"], ["Db", "Bbm", "Ab"]] },
    { label: "Verso 2", measures: [["Db", "Ab/C", "Ebm", "Gb"], ["Db", "Ab/C", "Ebm", "Gb"], ["Bbm", "Ab", "Gb"], ["Bbm", "Ab", "Gb"]] },
    { label: "Coro 2", measures: [["Ebm"], ["Gb"], ["Db"], ["Ab"], ["Ebm", "Gb"], ["Db", "Ab"]] },
    { label: "Instrumental 1", measures: instr1 },
    { label: "Puente", measures: [["Ebm"], ["Gb"], ["Bbm", "Ab"], ["Ebm"], ["Gb"], ["Bbm", "Ab"], ["Ebm"], ["Gb"], ["Bbm", "Ab"], ["Ebm"], ["Gb"], ["Db"], ["Ebm"], ["Gb"], ["Bbm", "Ab"], ["Ab"], ["Ebm"], ["Gb"], ["Db"], ["Ab"]] },
    { label: "Coro 3", measures: coro3 },
    { label: "Instrumental 1", measures: instr1 },
    { label: "Coro 3", measures: coro3 },
    { label: "Instrumental 2", measures: [["Ebm"], ["Gb"], ["Ebm"], ["Gb"], ["Db", "Bbm"], ["Db", "Bbm"], ["Ab"], ["Ab"]] },
    { label: "Coro final", measures: [["Ebm"], ["Gb"], ["Db"], ["Ab"], ["Ebm"], ["Gb"], ["Db"], ["Ab", "Gb"]] }
  ];

  const shift = semitoneDistance("Db", "D");
  assert.equal(shift, 1);
  const normalized = transposeSections(sourceDb, shift, "sharp");
  assert.deepEqual(song.sections.map((s) => s.label), sourceDb.map((s) => s.label));
  assert.deepEqual(song.sections.map((s) => s.measures), normalized.map((s) => s.measures));
  assert.deepEqual(song.sections.map((s) => s.repeats), [1, 1, 1, 1, 2, 1, 1, 2, 1, 1, 1, 2]);
  // Seis acordes, todos en D; la única cejilla es Bm.
  const chords = new Set(song.sections.flatMap((s) => s.measures.flat()));
  assert.deepEqual([...chords].sort(), ["A", "A/C#", "Bm", "D", "Em", "G"]);
});

test("appearanceKey composes setlist and song ids", () => {
  assert.equal(appearanceKey("2026-09-13", "jehova"), "2026-09-13:jehova");
  assert.equal(allAppearanceKeys().length, 28);
});
