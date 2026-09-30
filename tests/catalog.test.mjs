import test from "node:test";
import assert from "node:assert/strict";
import { extractInlineModule, indexHtmlUrl } from "./helpers/extract-inline-module.mjs";
const { buildCatalog, filterCatalog, catalogKeys, normalizeText } = await extractInlineModule(indexHtmlUrl, "catalog-module");
const { setlists } = await extractInlineModule(indexHtmlUrl, "content-module");
const catalog = buildCatalog(setlists);

test("normalizeText ignores accents and case", () => {
  assert.equal(normalizeText("  JÚBILO "), "jubilo");
  assert.equal(normalizeText("Señor"), "senor");
});

test("catalog lists every song once, alphabetically, with its appearances", () => {
  assert.equal(catalog.length, 29);
  assert.equal(catalog.reduce((n, it) => n + it.appearances.length, 0), 29);
  const titles = catalog.map((it) => it.title);
  assert.deepEqual(titles, [...titles].sort((a, b) => a.localeCompare(b, "es", { sensitivity: "base" })));
  const jubilo = catalog.find((it) => it.id === "jubilo");
  assert.deepEqual(jubilo.appearances.map((a) => [a.setlistId, a.label, a.songIndex, a.assignedKey]), [["2026-09-27", "Dom 27", 0, "D"]]);
  assert.equal(jubilo.hasChart, true);
});

test("groups a song that appears in two setlists into one entry", () => {
  const twice = buildCatalog([
    { id: "a", shortLabel: "A", date: "2026-01-01", songs: [{ id: "x", title: "X", artist: "", assignedKey: "G", sections: [] }] },
    { id: "b", shortLabel: "B", date: "2026-01-08", songs: [{ id: "x", title: "X", artist: "", assignedKey: "A", sections: [[]] }] }
  ]);
  assert.equal(twice.length, 1);
  assert.equal(twice[0].appearances.length, 2);
  assert.equal(twice[0].hasChart, true);
  assert.deepEqual(catalogKeys(twice), ["G", "A"]);
});

test("search matches title or artist without accents or case", () => {
  assert.deepEqual(filterCatalog(catalog, { query: "jubilo" }).map((it) => it.title), ["Júbilo"]);
  assert.deepEqual(filterCatalog(catalog, { query: "JÚBILO" }).map((it) => it.title), ["Júbilo"]);
  assert.ok(filterCatalog(catalog, { query: "elevation" }).length >= 3);
  assert.equal(filterCatalog(catalog, { query: "zzz" }).length, 0);
  assert.equal(filterCatalog(catalog, {}).length, 29);
});

test("filters by key, setlist and chart availability, combined", () => {
  assert.equal(filterCatalog(catalog, { setlistId: "2026-09-27" }).length, 7);
  assert.deepEqual(filterCatalog(catalog, { status: "pending" }).map((it) => it.title), ["Clamo a Dios"]);
  assert.equal(filterCatalog(catalog, { status: "chart" }).length, 28);
  const inD = filterCatalog(catalog, { key: "D" });
  assert.ok(inD.every((it) => it.appearances.some((a) => a.assignedKey === "D")));
  assert.ok(inD.some((it) => it.title === "Júbilo"));
  assert.deepEqual(filterCatalog(catalog, { key: "D", setlistId: "2026-09-27", query: "glor" }).map((it) => it.title), ["Glorioso Día (Remix)"]);
  assert.deepEqual(catalogKeys(catalog), [...catalogKeys(catalog)].sort((a, b) => ["C","C#","Db","D","D#","Eb","E","F","F#","Gb","G","G#","Ab","A","A#","Bb","B"].indexOf(a) - ["C","C#","Db","D","D#","Eb","E","F","F#","Gb","G","G#","Ab","A","A#","Bb","B"].indexOf(b)));
});
