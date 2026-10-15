import test from "node:test";
import assert from "node:assert/strict";
import { extractInlineModule, indexHtmlUrl } from "./helpers/extract-inline-module.mjs";

const { setlists, songs, appearanceKey, validateSetlists, allAppearanceKeys } =
  await extractInlineModule(indexHtmlUrl, "content-module");
const { transposeSections, semitoneDistance, degreesToSections, transposeChord } =
  await extractInlineModule(indexHtmlUrl, "transposer-module");
const { suggestCapo } = await extractInlineModule(indexHtmlUrl, "voicings-module");

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
    ["Júbilo", "D"], ["Glorioso Día (Remix)", "D"], ["Adiós al ayer", "Ab"], ["Clamo a Dios", "D"],
    ["Es Él", "Bb"], ["Vida nueva", "B"], ["De gracia en gracia", "B"]
  ]],
  ["2026-10-09", [
    ["Alabar", "C"], ["Toda lengua y toda nación", "G"], ["Lavado", "Bb"], ["Amor es como fuego", "Bb"],
    ["Quién Más", "G"], ["Quiero conocer a Jesús", "G"], ["El Nombre de Jesús", "C"],
    ["Dios de avivamiento", "Bb"], ["Digno de Adorar (Worthy of It All)", "D"]
  ]],
  ["2026-10-16", [
    ["Confía en Dios (Trust In God)", "C"], ["Ruido!", "Eb"], ["En tu mover", "G"]
  ]],
  ["ensayo-general", [
    ["Mover tu corazón", "Eb"]
  ]]
];

test("setlists in order and key (septiembre, octubre y Ensayo general)", () => {
  assert.equal(setlists.length, 7);
  assert.equal(setlists.flatMap((item) => item.songs).length, 41);
  assert.deepEqual(
    setlists.map((item) => [item.id, item.songs.map((s) => [s.title, s.assignedKey])]),
    expected
  );
});

test("short labels are exact", () => {
  assert.deepEqual(setlists.map((s) => s.shortLabel), [
    "04/09/2026", "13/09/2026", "18/09/2026",
    "27/09/2026", "09/10/2026", "16/10/2026", "Ensayo"
  ]);
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
      assert.equal(s.lyrics, null, `${s.id}: lyrics stay empty until pasted in the app`);
      assert.ok(s.dates.some((d) => d.id === sl.id), `${s.id}: date tag must include ${sl.id}`);
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
  assert.ok(confirmed.length >= 14, "expected all of Vie 4 and Dom 13 to have charts");
  // Vie 4 y Dom 13 completos.
  for (const sl of [setlists[0], setlists[1]]) {
    for (const s of sl.songs) assert.equal(s.sourceStatus, "confirmed", `${s.id} should have a chart`);
  }
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

test("Jehová: Elevation chart (C shapes, capo 1 = Db) normalized to E, on the band's structure", () => {
  const song = setlists[1].songs[0];
  assert.equal(song.title, "Jehová");
  assert.equal(song.sourceKey, "Db"); // tono que suena en la fuente (capo 1 sobre formas de C)
  assert.equal(song.capo, 2);         // arreglo de la banda: formas de D (E − 2)
  assert.equal(song.assignedKey, "E");
  assert.equal(song.tempoBpm, null); // la fuente no indica BPM
  assert.equal(song.sourceStatus, "confirmed");
  // Formas escritas +4 (C→E) equivale al tono sonante +3 (Db→E).
  assert.equal(semitoneDistance("Db", "E"), 3);
  assert.equal(semitoneDistance("C", "E"), 4);

  // Bloques del chart en sus formas escritas (C), +4 → E. V1–V4 son las dos
  // mitades de cada verso del chart; el Coro es el que remata en Csus.
  const c = (measures) => transposeSections([{ measures }], semitoneDistance("C", "E"), "sharp")[0].measures;
  const byLabel = (l) => song.sections.find((s) => s.label === l).measures;
  assert.deepEqual(byLabel("Intro"), c([["C", "Csus"], ["C", "Csus"], ["C", "Csus"], ["C", "Csus"]]));
  // Los cuatro versos son iguales (Darío): la progresión de la primera mitad del chart.
  for (const v of ["Verso 1", "Verso 2", "Verso 3", "Verso 4"]) {
    assert.deepEqual(byLabel(v), c([["C", "Csus"], ["C", "Csus"], ["Am", "F", "C"], ["G"]]), v);
  }
  assert.deepEqual(byLabel("Coro"), c([["C", "F"], ["C"], ["Am"], ["F", "C"], ["F"], ["C"], ["Am"], ["F", "C", "Csus"]]));
  assert.deepEqual(byLabel("Puente"), c([["C", "Fsus2"], ["C", "Fsus2", "F"]]));
  // El puente del final es el de bajo caminante del chart.
  assert.deepEqual(byLabel("Puente (final)"), c([["C/E", "F"], ["C/G", "F"]]));
  assert.deepEqual(byLabel("Interludio"), c([["C", "Csus"], ["C", "Csus"]]));
  assert.deepEqual(byLabel("Outro"), byLabel("Interludio"));
  // Estructura dictada por Darío, en orden y con repeticiones.
  assert.deepEqual(song.sections.map((s) => [s.label, s.repeats]), [
    ["Intro", 1], ["Verso 1", 1], ["Verso 2", 1], ["Coro", 1], ["Interludio", 1], ["Verso 3", 1], ["Verso 4", 1],
    ["Coro", 2], ["Interludio", 1], ["Puente", 4], ["Coro", 2], ["Puente (final)", 2], ["Outro", 1]
  ]);
});

test("Lavado: the band's arrangement — A shapes at capo 2 sound in B; verse = intro ×3 + 4th pass", () => {
  const song = setlists[1].songs[1];
  assert.equal(song.title, "Lavado");
  assert.equal(song.assignedKey, "B"); // formas de A con capo 2 → suena en B (tono del setlist)
  assert.equal(song.sourceKey, "A");   // formas de A…
  assert.equal(song.capo, 2);          // …con capo 2
  assert.equal(song.tempoBpm, null);
  assert.equal(song.sourceStatus, "confirmed");

  // Formas tal como las dictó Darío (A, capo 2): subirlas 2 semitonos = acordes reales.
  const shapesIntro = [["A"], ["A5"], ["E"], ["F#m"]];
  const shapesVerso = [...shapesIntro, ...shapesIntro, ...shapesIntro, ["B"], ["D"]]; // intro ×3, 4ª vuelta B D
  const shapesCoro = [["A5"], ["D2"], ["F#"], ["E"]]; // dictado 2026-09-09 (F# mayor, tal cual)
  const toB = (measures) => transposeSections([{ measures }], 2, "sharp")[0].measures;
  assert.deepEqual(toB(shapesCoro), [["B5"], ["E2"], ["G#"], ["F#"]]);
  const byLabel = (l) => song.sections.find((s) => s.label === l).measures;
  assert.deepEqual(byLabel("Intro"), toB(shapesIntro));
  assert.deepEqual(toB(shapesIntro), [["B"], ["B5"], ["F#"], ["G#m"]]);
  for (const v of ["Verso 1", "Verso 2", "Verso 3", "Verso 4"]) assert.deepEqual(byLabel(v), toB(shapesVerso), v);
  assert.deepEqual(byLabel("Coro"), toB(shapesCoro));
  // Puente: 1 4 6m 4 del chart oficial, convertido a B (formas A D F#m D). Sin Tag.
  const puenteB = degreesToSections([{ measures: [["1"], ["4"], ["6m"], ["4"]] }], "B")[0].measures;
  assert.deepEqual(byLabel("Puente"), puenteB);
  assert.deepEqual(puenteB, [["B"], ["E"], ["G#m"], ["E"]]);
  assert.ok(!song.sections.some((s) => s.label === "Tag"));
  // Estructura dictada por Darío, en orden y con repeticiones.
  assert.deepEqual(song.sections.map((s) => [s.label, s.repeats]), [
    ["Intro", 2], ["Verso 1", 1], ["Verso 2", 1], ["Coro", 1], ["Verso 3", 1], ["Verso 4", 1],
    ["Coro", 2], ["Puente", 1], ["Intro", 4], ["Intro", 3], ["Coro", 1]
  ]);
  // La heurística sola preferiría capo 4 (formas de G, cero cejillas); la banda
  // usa capo 2 (formas de A, con cejillas en F#m, B y Bm). Por eso el capo del
  // arreglo es un dato de la canción y manda sobre la sugerencia.
  const chords = [...new Set(song.sections.flatMap((s) => s.measures.flat()))];
  const heuristic = suggestCapo("B", transposeChord, chords);
  assert.equal(heuristic.capo, 4);
  assert.equal(heuristic.shapeRoot, "G");
  assert.notEqual(heuristic.capo, song.capo, "el arreglo difiere de la heurística: song.capo debe mandar");
  // Con el capo del arreglo (2) las formas mostradas son exactamente las que tipeó Darío.
  const shown = (l) => transposeSections([{ measures: byLabel(l) }], -song.capo, "sharp")[0].measures;
  assert.deepEqual(shown("Intro"), shapesIntro);
  assert.deepEqual(shown("Verso 1"), shapesVerso);
  assert.deepEqual(shown("Coro"), shapesCoro);
  assert.deepEqual(shown("Puente"), [["A"], ["D"], ["F#m"], ["D"]]);
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

test("Canta al Señor: Ingrid Rosario chart in A normalized to G via the transposer", () => {
  const song = setlists[1].songs[4];
  assert.equal(song.title, "Canta al Señor");
  assert.equal(song.artist, "Ingrid Rosario");
  assert.equal(song.sourceKey, "A");
  assert.equal(song.assignedKey, "G");
  assert.equal(song.tempoBpm, null);
  assert.equal(song.sourceStatus, "confirmed");

  // Transcripción del chart en su tono original (sólo acordes).
  const versoA = [["A", "E"], ["F#m", "E", "D"], ["A", "D", "A"], ["G", "D", "E"]];
  const sourceA = [
    { label: "Verso 1", measures: versoA },
    { label: "Verso 2", measures: versoA },
    { label: "Coro", measures: [
      ["A", "F#m", "D", "E"], ["A", "F#m", "D", "E"], ["F#m", "D", "A", "E"], ["E", "D", "E"],
      ["A", "F#m", "D", "E"], ["A", "F#m", "D", "E"], ["F#m", "D", "A", "E"], ["F#m", "D", "A", "E", "A"]
    ] }
  ];

  const shift = semitoneDistance("A", "G");
  assert.equal(shift, -2);
  const normalized = transposeSections(sourceA, shift, "sharp");
  assert.deepEqual(song.sections.map((s) => s.label), sourceA.map((s) => s.label));
  assert.deepEqual(song.sections.map((s) => s.measures), normalized.map((s) => s.measures));
  // El G del chart original (bVII prestado) es F en G; todo abierto, sin cejillas.
  const chords = new Set(song.sections.flatMap((s) => s.measures.flat()));
  assert.deepEqual([...chords].sort(), ["C", "D", "Em", "F", "G"]);
});

test("Santo una cosa: TOMATULUGAR chart in G normalized to A via the transposer", () => {
  const song = setlists[0].songs[3];
  assert.equal(song.title, "Santo una cosa");
  assert.equal(song.sourceKey, "G");
  assert.equal(song.assignedKey, "A");
  assert.equal(song.sourceStatus, "confirmed");
  const sourceG = [
    { label: "Verso 1", measures: [["G"], ["C9"], ["Em", "C9"], ["D", "C9"]] },
    { label: "Verso 2", measures: [["G"], ["C9"], ["Em"], ["C9", "D", "C9"]] },
    { label: "Pre-coro", measures: [["G"], ["C9"], ["G"], ["C9"], ["Bm", "A"], ["G"], ["Bm", "A", "G"]] },
    { label: "Coro", measures: [["G", "C9"], ["Em"], ["C9"], ["Em"], ["D"]] },
    { label: "Puente", measures: [["Am", "F#m", "G"], ["A"]] }
  ];
  const shift = semitoneDistance("G", "A");
  assert.equal(shift, 2);
  const normalized = transposeSections(sourceG, shift, "sharp");
  assert.deepEqual(song.sections.map((s) => s.label), sourceG.map((s) => s.label));
  assert.deepEqual(song.sections.map((s) => s.measures), normalized.map((s) => s.measures));
  // El "C9" del chart se conserva como sufijo 9 (D9) y se digita como Dadd9.
  assert.ok(song.sections.flatMap((s) => s.measures.flat()).includes("D9"));
});

test("Al que está sentado: Marcos Brunet chart in A stored as-is", () => {
  const song = setlists[0].songs[4];
  assert.equal(song.title, "Al que está sentado");
  assert.equal(song.sourceKey, "A");
  assert.equal(song.assignedKey, "A");
  assert.equal(song.sourceStatus, "confirmed");
  assert.deepEqual(song.sections.map((s) => s.label), [
    "Intro", "Verso", "Coro", "Interludio", "Verso", "Coro 2", "Interludio 2", "Puente", "Coro final", "Tag"
  ]);
  assert.equal(song.sections.at(-1).repeats, 4);
  const chords = new Set(song.sections.flatMap((s) => s.measures.flat()));
  for (const c of ["A2", "D9", "E4", "F#m", "Bm", "A/C#", "E/G#", "C#m7", "C#m", "D11+"]) {
    assert.ok(chords.has(c), `missing ${c}`);
  }
});

test("Digno de alabar: Worthy Of It All chart in D stored as-is", () => {
  const song = setlists[0].songs[5];
  assert.equal(song.title, "Digno de alabar");
  assert.equal(song.sourceKey, "D");
  assert.equal(song.assignedKey, "D");
  assert.equal(song.sourceStatus, "confirmed");
  assert.equal(song.youtubeVideoId, "JzZSrOPeolc"); // el video que eligió Darío sigue
  assert.deepEqual(song.sections.map((s) => [s.label, s.repeats]), [
    ["Intro", 1], ["Verso 1", 1], ["Coro", 1], ["Interludio", 1], ["Verso 2", 1],
    ["Coro", 2], ["Interludio 2", 1], ["Puente", 2], ["Coro final", 2]
  ]);
  const chords = new Set(song.sections.flatMap((s) => s.measures.flat()));
  assert.deepEqual([...chords].sort(), ["A", "Bm", "D", "D/A#", "D/F#", "Em", "F#m/C#", "G"]);
});

test("Dios de avivamiento: God Of Revival PDF chart stored in C", () => {
  const song = setlists[0].songs[6];
  assert.equal(song.title, "Dios de avivamiento");
  assert.equal(song.artist, "Bethel Music, Brian Johnson, Phil Wickham");
  assert.equal(song.sourceKey, "C");
  assert.equal(song.assignedKey, "C");
  assert.equal(song.sourceStatus, "confirmed");
  assert.deepEqual(song.sections.map((s) => [s.label, s.measures]), [
    ["Verso 1", [["C4", "C"], ["Am"], ["G"], ["C4", "C"], ["Am"], ["G"]]],
    ["Pre-coro", [["F"], ["Am"], ["C"], ["G"], ["F"], ["Am"], ["C"], ["G"]]],
    ["Coro", [["F", "G/B"], ["Am"], ["G/B", "C", "G"], ["F", "G/B", "Am"], ["G/B", "C", "G"]]],
    ["Verso 2", [["C4", "C"], ["Am"], ["G"], ["F", "C"], ["Am"], ["G"]]],
    ["Puente", [["C"], ["Am"], ["G"], ["C"], ["Am"], ["G"]]]
  ]);
  const friday = setlists.find((sl) => sl.id === "2026-10-09").songs.find((s) => s.id === "dios-de-avivamiento");
  assert.equal(friday.assignedKey, "Bb");
  assert.equal(friday.chartKey, "C");
});

test("section cues (arrangement notes), when present, are short non-empty strings", () => {
  for (const sl of setlists) {
    for (const s of sl.songs) {
      for (const section of s.sections) {
        if ("cue" in section) {
          assert.equal(typeof section.cue, "string", `${s.id}/${section.label}: cue must be a string`);
          assert.ok(section.cue.trim().length > 0 && section.cue.length <= 40, `${s.id}/${section.label}: cue length`);
        }
      }
    }
  }
});

test("chartUrl, when present, is a Cifra Club song page and unique per song", () => {
  const seen = new Map();
  for (const sl of setlists) {
    for (const s of sl.songs) {
      if (s.chartUrl === null) continue;
      assert.match(s.chartUrl, /^https:\/\/www\.cifraclub\.com\/[a-z0-9-]+\/[a-z0-9-]+\/$/, `${s.id}: bad chartUrl`);
      const owner = seen.get(s.chartUrl);
      assert.ok(owner === undefined || owner === s.id, `${s.id}: duplicate chartUrl`);
      seen.set(s.chartUrl, s.id);
    }
  }
});

test("No Hay Otro Nombre: Cifra Club chart (Hillsong Worship, G) — full verses, real chorus, Verso 3, Final", () => {
  const song = setlists[1].songs[5];
  assert.equal(song.title, "No Hay Otro Nombre");
  assert.equal(song.assignedKey, "G");
  assert.equal(song.sourceKey, "G");
  assert.equal(song.sourceStatus, "confirmed");
  assert.deepEqual(song.sections.map((s) => s.label), ["Intro", "Verso 1", "Verso 2", "Coro", "Verso 3", "Puente", "Final"]);
  const byLabel = (l) => song.sections.find((s) => s.label === l).measures;
  assert.deepEqual(byLabel("Verso 1"), byLabel("Verso 2"));
  assert.equal(byLabel("Verso 1").length, 17);
  assert.deepEqual(byLabel("Coro"), [["G"], ["Em"], ["Bm"], ["C"], ["Em", "C"], ["G"], ["Em"], ["Bm"], ["C"], ["Em", "C"]]);
  assert.deepEqual(byLabel("Puente"), [["G"], ["Em"], ["C"], ["Em", "C"]]);
  assert.deepEqual(byLabel("Final"), [["G"], ["Em"], ["C"], ["Em"], ["C"], ["G"]]);
  const chords = new Set(song.sections.flatMap((s) => s.measures.flat()));
  assert.deepEqual([...chords].sort(), ["Am", "Bm", "C", "D", "D/F#", "Em", "G", "G/B"]);
});

test("Amor es como fuego is charted and plays in Bb on 9 de octubre", () => {
  const fuego = songs.find((s) => s.id === "amor-es-como-fuego");
  assert.equal(fuego.chartKey, "E");
  assert.equal(fuego.sourceKey, "E");
  assert.equal(fuego.artist, "Hillsong UNITED");
  assert.equal(fuego.chartUrl, "https://www.cifraclub.com/hillsong-united/amor-como-fuego/");
  assert.equal(fuego.youtubeUrl, "https://www.youtube.com/watch?v=FwGftfqZ1NQ");
  assert.equal(fuego.youtubeVideoId, "FwGftfqZ1NQ");
  assert.equal(fuego.lyrics, null);
  assert.equal(fuego.sourceStatus, "confirmed");
  assert.deepEqual(fuego.sections.find((s) => s.label === "First Part").measures, [["E"], ["C#m"], ["B"], ["A", "E"]]);
  assert.deepEqual(fuego.sections.find((s) => s.label === "Pre-Chorus").measures, [["C#m"], ["A", "E", "B"], ["C#m"], ["A", "E"], ["B", "E"]]);
  assert.deepEqual(fuego.sections.find((s) => s.label === "Chorus").measures, [["E", "B"], ["C#m"], ["A", "E"], ["E", "B"], ["C#m"], ["A", "E"]]);

  const oct = setlists.find((sl) => sl.id === "2026-10-09").songs;
  assert.equal(oct.find((s) => s.id === "amor-es-como-fuego").assignedKey, "Bb");
});

test("Encuéntrame otra vez stays charted in D and on no setlist", () => {
  const otra = songs.find((s) => s.id === "encuentreme-otra-vez");
  assert.equal(otra.title, "Encuéntrame otra vez");
  assert.equal(otra.chartKey, "D");
  assert.equal(otra.sourceKey, "D");
  assert.equal(otra.artist, "Elevation Worship");
  assert.equal(otra.chartUrl, "https://www.cifraclub.com/elevation-worship/encuentrame-otra-vez/");
  assert.equal(otra.youtubeUrl, "https://www.youtube.com/watch?v=J9UG-tbdLKw");
  assert.equal(otra.youtubeVideoId, "J9UG-tbdLKw");
  assert.equal(otra.lyrics, null);
  assert.equal(otra.sourceStatus, "confirmed");
  assert.deepEqual(otra.dates, []);
  assert.deepEqual(otra.sections.find((s) => s.label === "Chorus").measures, [["D", "A"], ["Bm", "G"], ["D", "A"], ["Bm", "G"]]);
  assert.deepEqual(otra.sections.find((s) => s.label === "Bridge").measures, [["D", "A/C#"], ["Bm"], ["A", "G"], ["D", "A/C#"], ["Bm"], ["A", "G"]]);
  assert.equal(setlists.some((sl) => sl.songs.some((s) => s.id === "encuentreme-otra-vez")), false);
});

test("Rey de Reyes is charted in D and on no setlist", () => {
  const rey = songs.find((s) => s.id === "rey-de-reyes");
  assert.equal(rey.title, "Rey de Reyes");
  assert.equal(rey.artist, "Hillsong UNITED");
  assert.equal(rey.chartKey, "D");
  assert.equal(rey.sourceKey, "D");
  assert.equal(rey.chartUrl, null);
  assert.equal(rey.lyrics, null);
  assert.equal(rey.sourceStatus, "confirmed");
  assert.deepEqual(rey.dates, []);
  assert.deepEqual(rey.sections.find((s) => s.label === "Intro").measures, [["D"]]);
  assert.deepEqual(rey.sections.find((s) => s.label === "Coro").measures, [["D", "G"], ["Bm", "D/A", "A"], ["D", "G"], ["Bm", "G", "A", "D"]]);
  assert.deepEqual(rey.sections.find((s) => s.label === "Puente").measures.at(-1), ["D"]);
  assert.deepEqual(rey.sections.at(-1).measures.at(-1), ["D/F#", "G", "A", "D"]);
  assert.equal(setlists.some((sl) => sl.songs.some((s) => s.id === "rey-de-reyes")), false);
});

test("Digno de Adorar (Worthy of It All) is the CCINT chart in D on 09/10", () => {
  const song = songs.find((s) => s.id === "worthy-of-it-all");
  assert.equal(song.title, "Digno de Adorar (Worthy of It All)");
  assert.equal(song.artist, "CCINT MUSIC");
  assert.equal(song.chartKey, "D");
  assert.equal(song.sourceKey, "D");
  assert.equal(song.chartUrl, "https://www.cifraclub.com/ccint-music/digno-de-adorar-worthy-of-it-all/");
  assert.equal(song.youtubeUrl, null);
  assert.equal(song.capo, null);
  assert.equal(song.lyrics, null);
  assert.equal(song.sourceStatus, "confirmed");
  assert.notEqual(song.id, "digno-de-alabar");
  assert.deepEqual(song.dates, [{ id: "2026-10-09", key: "D" }]);
  assert.deepEqual(song.sections.find((s) => s.label === "Verso").measures, [["G", "A", "G", "A/F#"], ["G", "A", "Bm"], ["G", "A", "D"]]);
  assert.deepEqual(song.sections.find((s) => s.label === "Chorus").measures, [["D"], ["A"], ["G"], ["A", "D"]]);
  assert.deepEqual(song.sections.find((s) => s.label === "Bridge").measures, [["D"], ["A"], ["Bm"], ["G"], ["D", "A", "G", "A", "D"]]);
  const oct = setlists.find((sl) => sl.id === "2026-10-09").songs;
  assert.equal(oct.at(-1).id, "worthy-of-it-all");
  assert.equal(oct.at(-1).assignedKey, "D");
  assert.equal(oct.at(-1).chartKey, "D");
  const cece = songs.find((s) => s.id === "digno-de-alabar");
  assert.equal(cece.chartUrl, "https://www.cifraclub.com/cece-winans/worthy-of-it-all/");
  assert.deepEqual(cece.dates.map((d) => d.id), ["2026-09-04"]);
});

test("Quiero conocer a Jesús is charted in G for 09/10/2026", () => {
  const song = songs.find((s) => s.id === "quiero-conocer-a-jesus");
  assert.equal(song.title, "Quiero conocer a Jesús");
  assert.equal(song.artist, "Generación 12");
  assert.equal(song.chartUrl, "https://www.cifraclub.com/generacion-12/quiero-conocer-a-jesus-yeshua-nuestro-dios-part-sofia-mancipe/");
  assert.equal(song.chartKey, "G");
  assert.equal(song.lyrics, null);
  assert.equal(song.sourceStatus, "confirmed");
  assert.deepEqual(song.dates, [{ id: "2026-10-09", key: "G" }]);
  assert.deepEqual(song.sections.find((s) => s.label === "Intro").measures, [["C", "D", "Em", "Bm6-"]]);
  assert.deepEqual(song.sections.find((s) => s.label === "Pre-Chorus").measures, [["C", "D"], ["Em", "Bm6-"], ["C", "D"], ["Em", "Bm6-"]]);
  assert.equal(song.sections.find((s) => s.label === "Bridge").measures.length, 18);
  assert.deepEqual(song.sections.at(-1).measures.at(-1), ["G"]);
  const oct = setlists.find((sl) => sl.id === "2026-10-09").songs;
  assert.equal(oct[5].id, "quiero-conocer-a-jesus");
  assert.equal(oct[5].assignedKey, "G");
});

test("Toda lengua y toda nación replaces Adiós al ayer on 09/10 and is charted in G", () => {
  const song = songs.find((s) => s.id === "toda-lengua-y-toda-nacion");
  assert.equal(song.title, "Toda lengua y toda nación");
  assert.equal(song.artist, "Marcos Brunet");
  assert.equal(song.chartKey, "G");
  assert.equal(song.sourceKey, "G");
  assert.equal(song.chartUrl, "https://www.cifraclub.com/marcos-brunet/toda-lengua-y-toda-nacion/");
  assert.equal(song.youtubeUrl, null);
  assert.equal(song.capo, null);
  assert.equal(song.lyrics, null);
  assert.equal(song.sourceStatus, "confirmed");
  assert.deepEqual(song.dates, [{ id: "2026-10-09", key: "G" }]);
  assert.deepEqual(song.sections.find((s) => s.label === "First Part").measures.slice(0, 2), [["C9"], ["Am7", "G"]]);
  assert.deepEqual(song.sections.find((s) => s.label === "Bridge").measures, [["Em7", "D/F#", "G"], ["G/B", "C9"]]);
  assert.deepEqual(song.sections.at(-1).measures.at(-1), ["G/B", "C9", "G/B", "G", "D/F#", "G"]);
  assert.deepEqual(song.sections.map((s) => s.label), [
    "First Part", "Pre-Chorus", "Chorus", "Bridge", "First Part", "Pre-Chorus",
    "Chorus", "Interlúdio 1", "Second Part", "Chorus", "Second Part", "Ending"
  ]);

  const oct = setlists.find((sl) => sl.id === "2026-10-09").songs;
  assert.equal(oct[1].id, "toda-lengua-y-toda-nacion");
  assert.equal(oct[1].assignedKey, "G");
  assert.equal(oct.some((s) => s.id === "adios-al-ayer"), false);
  const sept = setlists.find((sl) => sl.id === "2026-09-27").songs.find((s) => s.id === "adios-al-ayer");
  assert.equal(sept.title, "Adiós al ayer");
  assert.equal(sept.assignedKey, "Ab");
  assert.deepEqual(sept.dates.map((d) => d.id), ["2026-09-27"]);
});

test("Praise is charted in C and plays as Alabar on 9 de octubre", () => {
  assert.equal(songs.length, 39);
  const praise = songs.find((s) => s.id === "praise");
  assert.equal(praise.title, "Praise");
  assert.equal(praise.chartKey, "C");
  assert.equal(praise.assignedKey, "C");
  assert.equal(praise.chartUrl, "https://www.cifraclub.com/elevation-worship/praise-feat-brandon-lake-chris-brown-chandler-moore/");
  assert.deepEqual(praise.dates, [{ id: "2026-10-09", key: "C", title: "Alabar" }]);
  assert.equal(praise.lyrics, null);
  const oct = setlists.find((sl) => sl.id === "2026-10-09").songs[0];
  assert.equal(oct.id, "praise");
  assert.equal(oct.title, "Alabar");
  assert.equal(oct.assignedKey, "C");
  assert.equal(oct.chartKey, "C");
  assert.deepEqual(oct.sections.find((s) => s.label === "Chorus 1").measures, [["Am", "F", "C"], ["G"]]);
  assert.deepEqual(oct.sections.find((s) => s.label === "Third Part").measures, [["C", "F2"], ["G", "C"], ["G/B", "F2"], ["C"]]);
  assert.deepEqual(oct.sections.find((s) => s.label === "I won't be quiet").measures, [["Am"], ["F"], ["C", "G"]]);
  assert.deepEqual(oct.sections.find((s) => s.label === "Bridge").measures, [["C"], ["Dm"], ["Am", "F"]]);
  assert.deepEqual(oct.sections.at(-1).measures, [["Am", "F", "C"], ["G"]]);
});

test("Viernes 16/10: Confía, Ruido y En tu mover quedan en la nota del PDF", () => {
  const friday = setlists.find((sl) => sl.id === "2026-10-16");
  assert.deepEqual(friday.songs.map((s) => [s.id, s.assignedKey, s.chartKey]), [
    ["confia-en-dios", "C", "C"],
    ["ruido", "Eb", "Eb"],
    ["en-tu-mover", "G", "G"]
  ]);
  const confia = friday.songs[0];
  assert.equal(confia.chartUrl, "https://www.cifraclub.com/elevation-worship/confia-en-dios-trust-in-god-original/");
  assert.deepEqual(confia.sections.map((s) => s.label), ["Intro", "First Part", "Chorus", "Second Part", "Chorus", "Interludio", "Puente"]);
  assert.deepEqual(confia.sections[0].measures, [["C", "Am", "F", "Dm", "F"], ["C", "Am", "F", "Dm", "F"]]);
  assert.equal(confia.sections[4].repeats, 2);
  const ruido = friday.songs[1];
  assert.equal(ruido.chartUrl, "https://www.cifraclub.com/elevation-worship/ruido/");
  assert.deepEqual(ruido.sections.map((s) => s.label), ["Intro", "First Part", "Chorus", "Second Part", "Chorus", "Puente", "Chorus 2"]);
  assert.deepEqual(ruido.sections[0].measures, [["Eb"], ["Ab", "Eb/G", "Eb"]]);
  assert.equal(ruido.sections.at(-1).measures.at(-1)[0], "Ab");
  const mover = friday.songs[2];
  assert.equal(mover.chartUrl, null);
  assert.equal(mover.artist, "Nemuel");
  assert.deepEqual(mover.sections[3].measures.at(-1), ["G", "D", "Daj7/F#"]);
  assert.deepEqual(mover.sections.at(-1).measures, [["G"], ["D"], ["Bm"], ["G", "A", "G"]]);
});

test("appearanceKey composes setlist and song ids", () => {
  assert.equal(appearanceKey("2026-09-13", "jehova"), "2026-09-13:jehova");
  assert.equal(allAppearanceKeys().length, 41);
});

test("Ensayo general is a general reunion, exempt from the 7-song rule, with Mover tu corazón (confirmed, original key Eb)", () => {
  const ensayo = setlists.find((s) => s.id === "ensayo-general");
  assert.ok(ensayo, "ensayo-general reunion must exist");
  assert.equal(ensayo.general, true);
  assert.equal(ensayo.date, null);
  assert.equal(ensayo.songs.length, 1);
  const song = ensayo.songs[0];
  assert.equal(song.id, "mover-tu-corazon");
  assert.equal(song.title, "Mover tu corazón");
  assert.equal(song.assignedKey, "Eb");
  assert.equal(song.sourceStatus, "confirmed");
  assert.ok(song.sections.length > 0, "chords loaded (Eb)");
  // exenta de la regla de 7: no debe generar error de validación
  assert.deepEqual(validateSetlists([ensayo]), []);
});
