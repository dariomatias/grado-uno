import test from "node:test";
import assert from "node:assert/strict";
import { extractInlineModule, indexHtmlUrl } from "./helpers/extract-inline-module.mjs";
const { simplifyChord, simplifyMeasure, simplifySections, SIMPLIFY_LEVELS } = await extractInlineModule(indexHtmlUrl, "simplify-module");
const { songStructure } = await extractInlineModule(indexHtmlUrl, "structure-module");
const { setlists } = await extractInlineModule(indexHtmlUrl, "content-module");

test("simplifyChord reduces every chord to its triad, dropping bass and extensions", () => {
  const cases = {
    "D/F#": "D", "B/D#": "B", "G/B": "G", "C/E": "C", "A/E": "A", "F#m7/E": "F#m",
    "Esus": "E", "Esus4": "E", "Dsus2": "D", "Cadd9": "C", "D2": "D", "C9": "C", "A5": "A", "B5": "B",
    "Em7": "Em", "Bm7": "Bm", "C#m7": "C#m", "Am": "Am", "F#m": "F#m", "Dm": "Dm",
    "Gmaj7": "G", "C7M/E": "C", "CM7": "C", "G7": "G", "E7#9": "E", "D11+": "D", "G11": "G", "G4": "G", "C4": "C",
    "Bdim": "Bdim", "B°": "Bdim", "Caug": "Caug", "N.C.": "N.C."
  };
  for (const [input, expected] of Object.entries(cases)) assert.equal(simplifyChord(input), expected, input);
});

test("simplifyMeasure collapses consecutive duplicates (basic) and keeps one chord per bar (minimal)", () => {
  assert.deepEqual(simplifyMeasure(["G", "G/B", "C"], "basic"), ["G", "C"]);
  assert.deepEqual(simplifyMeasure(["D", "Dsus", "D"], "basic"), ["D"]);
  assert.deepEqual(simplifyMeasure(["Am", "G", "C", "C/E", "G", "D"], "basic"), ["Am", "G", "C", "G", "D"]);
  assert.deepEqual(simplifyMeasure(["F#m", "E", "A"], "minimal"), ["F#m"]);
  assert.deepEqual(simplifyMeasure(["G", "D/F#"], "none"), ["G", "D/F#"]);
  assert.deepEqual(simplifyMeasure(["N.C."], "basic"), ["N.C."]);
});

test("simplifySections keeps structure metadata and level none is identity", () => {
  const sections = [{ type: "verse", label: "Verso", repeats: 2, cue: "entra acústica", measures: [["E", "Esus"], ["C#m", "A", "E"], ["B/D#"]] }];
  assert.equal(simplifySections(sections, "none"), sections);
  const basic = simplifySections(sections, "basic");
  assert.deepEqual(basic[0].measures, [["E"], ["C#m", "A", "E"], ["B"]]);
  assert.equal(basic[0].repeats, 2);
  assert.equal(basic[0].cue, "entra acústica");
  assert.deepEqual(simplifySections(sections, "minimal")[0].measures, [["E"], ["C#m"], ["B"]]);
  assert.deepEqual(SIMPLIFY_LEVELS, ["none", "basic", "minimal"]);
});

test("simplification never adds blocks and reduces Para siempre Cristo's intro as expected (real data)", () => {
  for (const s of setlists.flatMap((sl) => sl.songs).filter((s) => s.sections.length)) {
    const full = songStructure(s.sections).blocks.length;
    assert.ok(songStructure(simplifySections(s.sections, "basic")).blocks.length <= full, s.title);
    assert.ok(songStructure(simplifySections(s.sections, "minimal")).blocks.length <= full, s.title);
  }
  const psc = setlists[2].songs.find((s) => s.title === "Para siempre Cristo");
  assert.deepEqual(simplifySections(psc.sections, "basic")[0].measures, [["A", "E"], ["C#m"], ["F#m", "E", "A"], ["A", "E", "B"]]);
  assert.deepEqual(simplifySections(psc.sections, "minimal")[0].measures, [["A"], ["C#m"], ["F#m"], ["A"]]);
});
