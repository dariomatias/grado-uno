import test from "node:test";
import assert from "node:assert/strict";
import { extractInlineModule, indexHtmlUrl } from "./helpers/extract-inline-module.mjs";
const { buildCatalog, filterCatalog, catalogKeys, homeFacets, monthLabel, normalizeText, sortByLineup } = await extractInlineModule(indexHtmlUrl, "catalog-module");
const { setlists, songs } = await extractInlineModule(indexHtmlUrl, "content-module");
const catalog = buildCatalog(setlists, songs.filter((s) => s.dates.length === 0));

test("normalizeText ignores accents and case", () => {
  assert.equal(normalizeText("  JÚBILO "), "jubilo");
  assert.equal(normalizeText("Señor"), "senor");
});

test("catalog lists every song once, alphabetically, with its appearances", () => {
  assert.equal(catalog.length, 96);
  assert.equal(catalog.reduce((n, it) => n + it.appearances.length, 0), 128);
  const titles = catalog.map((it) => it.title);
  assert.deepEqual(titles, [...titles].sort((a, b) => a.localeCompare(b, "es", { sensitivity: "base" })));
  const jubilo = catalog.find((it) => it.id === "jubilo");
  assert.deepEqual(jubilo.appearances.map((a) => [a.setlistId, a.label, a.songIndex, a.assignedKey]), [["2026-09-27", "27/09/2026", 0, "D"]]);
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
  assert.equal(filterCatalog(catalog, {}).length, 96);
});

test("an undated song is in the general catalog and on no meeting", () => {
  const withLibrary = buildCatalog(setlists, [{
    id: "sin-fecha", title: "Sin fecha", artist: "", assignedKey: "A", sections: [[]],
    chartUrl: null, lyricsUrl: null, youtubeUrl: null
  }]);
  const extra = withLibrary.find((it) => it.id === "sin-fecha");
  assert.deepEqual(extra.appearances, []);
  assert.equal(filterCatalog(withLibrary, { setlistId: "2026-10-09" }).some((it) => it.id === "sin-fecha"), false);
});

test("Encuéntrame otra vez is in the catalog and on no setlist", () => {
  const otra = catalog.find((it) => it.id === "encuentreme-otra-vez");
  assert.equal(otra.title, "Encuéntrame otra vez");
  assert.equal(otra.assignedKey, "D");
  assert.equal(otra.hasChart, true);
  assert.deepEqual(otra.appearances, []);
  assert.equal(setlists.some((sl) => sl.songs.some((s) => s.id === "encuentreme-otra-vez")), false);
  assert.equal(filterCatalog(catalog, { setlistId: "2026-10-09" }).some((it) => it.id === "encuentreme-otra-vez"), false);
});

test("Praise is listed once, as Alabar on 9 de octubre, and Lavado keeps both keys", () => {
  const praise = catalog.find((it) => it.id === "praise");
  assert.equal(praise.title, "Praise");
  assert.deepEqual(praise.aliases, ["Alabar"]);
  assert.ok(filterCatalog(catalog, { query: "alabar" }).some((it) => it.id === "praise"));
  assert.deepEqual(praise.appearances.map((a) => [a.setlistId, a.assignedKey]), [["2026-10-09", "C"]]);
  const lavado = catalog.find((it) => it.id === "lavado");
  assert.deepEqual(lavado.appearances.map((a) => [a.setlistId, a.assignedKey]), [
    ["2026-09-13", "B"],
    ["2026-10-09", "D"]
  ]);
});

test("reunion options stay in date order and follow the other filters", () => {
  const items = [
    {
      id: "a", title: "A", artist: "", groups: ["C"], hasChart: true, assignedKey: "D",
      appearances: [
        { setlistId: "2026-10-31", assignedKey: "D", date: "2026-10-31" },
        { setlistId: "2026-10-04", assignedKey: "E", date: "2026-10-04" }
      ]
    },
    {
      id: "b", title: "B", artist: "", groups: ["A"], hasChart: false, assignedKey: "G",
      appearances: [{ setlistId: "2026-09-04", assignedKey: "G", date: "2026-09-04" }]
    }
  ];
  const meetings = [
    { id: "2026-10-31", date: "2026-10-31", shortLabel: "31/10/2026", group: "C" },
    { id: "2026-09-04", date: "2026-09-04", shortLabel: "04/09/2026", group: "A" },
    { id: "2026-10-04", date: "2026-10-04", shortLabel: "04/10/2026", group: "C" },
    { id: "ensayo-general", date: null, shortLabel: "Ensayo", group: "A" }
  ];
  assert.deepEqual(homeFacets(items, meetings, {}).setlistIds, ["2026-09-04", "2026-10-04", "2026-10-31"]);
  assert.deepEqual(homeFacets(items, meetings, { group: "C" }).setlistIds, ["2026-10-04", "2026-10-31"]);
  assert.deepEqual(homeFacets(items, meetings, { group: "C" }).groups, ["A", "C"]);
  assert.equal(monthLabel("2026-10"), "Octubre 2026");
  assert.deepEqual(homeFacets(items, meetings, {}).months, ["2026-09", "2026-10"]);
  assert.deepEqual(homeFacets(items, meetings, { month: "2026-09" }).groups, ["A"]);
  assert.deepEqual(homeFacets(items, meetings, { month: "2026-09" }).setlistIds, ["2026-09-04"]);
  assert.deepEqual(homeFacets(items, meetings, { month: "2026-10" }).groups, ["C"]);
  assert.deepEqual(homeFacets(items, meetings, { month: "2026-10", group: "C" }).setlistIds, ["2026-10-04", "2026-10-31"]);
  const onOctober4 = items.filter((item) => item.appearances.some((appearance) => appearance.setlistId === "2026-10-04"));
  const ordered = sortByLineup(onOctober4, { setlistId: "2026-10-04" });
  assert.deepEqual(ordered.map((item) => item.id), ["a"]);
  const byMonth = sortByLineup(items, { allowedIds: new Set(["2026-09-04", "2026-10-31", "2026-10-04"]) });
  assert.deepEqual(byMonth.map((item) => item.id), ["b", "a"]);
});

test("filters by key, setlist and chart availability, combined", () => {
  assert.equal(filterCatalog(catalog, { setlistId: "2026-09-27" }).length, 7);
  const pending = filterCatalog(catalog, { status: "pending" }).map((it) => it.title);
  assert.equal(pending.length, 46);
  assert.ok(pending.includes("Clamo a Dios"));
  assert.ok(pending.includes("Nada es imposible"));
  assert.equal(filterCatalog(catalog, { status: "chart" }).length, 50);
  const inD = filterCatalog(catalog, { key: "D" });
  assert.ok(inD.every((it) => it.appearances.some((a) => a.assignedKey === "D") || (it.appearances.length === 0 && it.assignedKey === "D")));
  assert.ok(inD.some((it) => it.title === "Júbilo"));
  assert.deepEqual(filterCatalog(catalog, { key: "D", setlistId: "2026-09-27", query: "glor" }).map((it) => it.title), ["Glorioso Día (Remix)"]);
  assert.deepEqual(catalogKeys(catalog), [...catalogKeys(catalog)].sort((a, b) => ["C","C#","Db","D","D#","Eb","E","F","F#","Gb","G","G#","Ab","A","A#","Bb","B"].indexOf(a) - ["C","C#","Db","D","D#","Eb","E","F","F#","Gb","G","G#","Ab","A","A#","Bb","B"].indexOf(b)));
});
