import test from "node:test";
import assert from "node:assert/strict";
import { extractInlineModule, indexHtmlUrl } from "./helpers/extract-inline-module.mjs";

const { initialState, selectSetlist, selectSong, moveSong, setTranspose } =
  await extractInlineModule(indexHtmlUrl, "navigation-module");

test("initialState shape", () => {
  assert.deepEqual(initialState(), {
    view: "setlist",
    activeSetlistIndex: 0,
    selectedSongIndex: 0,
    transpositions: {},
    tempoOverrides: {},
    meterOverrides: {},
    accidentalMode: "sharp",
    metronomeRunning: false
  });
});

test("moveSong clamps to 0..6 and never crosses setlists", () => {
  assert.equal(moveSong({ ...initialState(), selectedSongIndex: 0 }, -1).selectedSongIndex, 0);
  assert.equal(moveSong({ ...initialState(), selectedSongIndex: 6 }, 1).selectedSongIndex, 6);
  const atEnd = moveSong({ ...initialState(), activeSetlistIndex: 1, selectedSongIndex: 6 }, 1);
  assert.equal(atEnd.activeSetlistIndex, 1);
  assert.equal(atEnd.selectedSongIndex, 6);
});

test("selectSetlist clamps 0..3 and resets selection", () => {
  assert.equal(selectSetlist(initialState(), 9).activeSetlistIndex, 3);
  assert.equal(selectSetlist(initialState(), -2).activeSetlistIndex, 0);
  const s = selectSetlist({ ...initialState(), selectedSongIndex: 5 }, 2);
  assert.equal(s.selectedSongIndex, 0);
});

test("selectSong clamps 0..6", () => {
  assert.equal(selectSong(initialState(), 99).selectedSongIndex, 6);
  assert.equal(selectSong(initialState(), -3).selectedSongIndex, 0);
});

test("setTranspose is per-appearance and clamped to ±11", () => {
  let s = initialState();
  s = setTranspose(s, "2026-09-04", "todo-es-posible", 2);
  s = setTranspose(s, "2026-09-27", "todo-es-posible", -3); // different appearance, if it existed
  assert.equal(s.transpositions["2026-09-04:todo-es-posible"], 2);
  assert.equal(s.transpositions["2026-09-27:todo-es-posible"], -3);
  assert.equal(setTranspose(s, "x", "y", 50).transpositions["x:y"], 11);
  assert.equal(setTranspose(s, "x", "y", -50).transpositions["x:y"], -11);
});

test("state updates are immutable", () => {
  const base = initialState();
  const next = moveSong(base, 1);
  assert.notEqual(base, next);
  assert.equal(base.selectedSongIndex, 0);
});
