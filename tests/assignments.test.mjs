import test from "node:test";
import assert from "node:assert/strict";
import { extractInlineModule, indexHtmlUrl } from "./helpers/extract-inline-module.mjs";

const {
  GROUPS, normalizeGroups, dateIdsOf, assignedDateIds, withDate, withoutDate,
  withGroup, withoutGroup, applyDateAssignments
} = await extractInlineModule(indexHtmlUrl, "catalog-module");
const { setlists, songs } = await extractInlineModule(indexHtmlUrl, "content-module");

test("groups stay inside A, B and C, in that order", () => {
  assert.deepEqual(GROUPS, ["A", "B", "C"]);
  assert.deepEqual(normalizeGroups(["C", "A", "Z", "A"]), ["A", "C"]);
  assert.deepEqual(withGroup(["C"], "A"), ["A", "C"]);
  assert.deepEqual(withoutGroup(["A", "B"], "A"), ["B"]);
});

test("a song can gain and lose dates without touching the bundled setlists", () => {
  const id = "encuentreme-otra-vez";
  assert.deepEqual(dateIdsOf(setlists, id), []);
  const added = withDate(dateIdsOf(setlists, id), "2026-10-09");
  assert.deepEqual(added, ["2026-10-09"]);
  const both = withDate(added, "2026-09-27");
  assert.deepEqual(both, ["2026-10-09", "2026-09-27"]);
  assert.deepEqual(withoutDate(both, "2026-10-09"), ["2026-09-27"]);

  const next = applyDateAssignments(setlists, songs, {
    [id]: { dateIds: both, groups: ["B"] }
  });
  assert.equal(setlists.find((sl) => sl.id === "2026-10-09").songs.some((s) => s.id === id), false);
  const oct = next.find((sl) => sl.id === "2026-10-09");
  const sep = next.find((sl) => sl.id === "2026-09-27");
  assert.equal(oct.songs.at(-1).id, id);
  assert.equal(oct.songs.at(-1).assignedKey, "D");
  assert.equal(sep.songs.some((s) => s.id === id), true);
  assert.equal(next.find((sl) => sl.id === "2026-09-04").songs.some((s) => s.id === id), false);
});

test("without an edit, assignments leave every meeting as it was", () => {
  const next = applyDateAssignments(setlists, songs, {});
  assert.deepEqual(
    next.map((sl) => [sl.id, sl.songs.map((s) => s.id)]),
    setlists.map((sl) => [sl.id, sl.songs.map((s) => s.id)])
  );
});

test("an edited date list replaces the bundled dates", () => {
  const id = "lavado";
  assert.deepEqual(assignedDateIds(setlists, id, undefined).sort(), ["2026-09-13", "2026-10-09"]);
  const onlyFriday = applyDateAssignments(setlists, songs, { [id]: { dateIds: ["2026-10-09"], groups: [] } });
  assert.equal(onlyFriday.find((sl) => sl.id === "2026-09-13").songs.some((s) => s.id === id), false);
  assert.equal(onlyFriday.find((sl) => sl.id === "2026-10-09").songs.some((s) => s.id === id), true);
});
