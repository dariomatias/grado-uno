import test from "node:test";
import assert from "node:assert/strict";
import { extractInlineModule, indexHtmlUrl } from "./helpers/extract-inline-module.mjs";

const { clampBpm, normalizeMeter, advanceBeat, secondsPerBeat } =
  await extractInlineModule(indexHtmlUrl, "metronome-module");

test("clampBpm rounds and limits 40..240", () => {
  assert.equal(clampBpm(39), 40);
  assert.equal(clampBpm(241), 240);
  assert.equal(clampBpm(127.6), 128);
  assert.equal(clampBpm("abc"), 120);
});

test("normalizeMeter accepts 2,3,4,6 else 4", () => {
  assert.equal(normalizeMeter(5), 4);
  assert.equal(normalizeMeter(6), 6);
  assert.equal(normalizeMeter(2), 2);
  assert.equal(normalizeMeter(3), 3);
  assert.equal(normalizeMeter(0), 4);
});

test("advanceBeat wraps and accents the downbeat", () => {
  assert.deepEqual(advanceBeat(3, 4), { beat: 0, accented: true });
  assert.deepEqual(advanceBeat(0, 4), { beat: 1, accented: false });
  assert.deepEqual(advanceBeat(-1, 4), { beat: 0, accented: true });
  assert.deepEqual(advanceBeat(2, 3), { beat: 0, accented: true });
});

test("secondsPerBeat", () => {
  assert.equal(secondsPerBeat(120), 0.5);
  assert.equal(secondsPerBeat(60), 1);
});
