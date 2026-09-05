import test from "node:test";
import assert from "node:assert/strict";
import { extractInlineModule, indexHtmlUrl } from "./helpers/extract-inline-module.mjs";

const {
  MAX_LYRIC_BYTES, validateLyricText, parseLyricsBackup, mergeLyrics, serializeLyricsBackup
} = await extractInlineModule(indexHtmlUrl, "lyrics-store-module");

const VALID_KEYS = ["2026-09-13:jehova", "2026-09-13:lavado"];

test("validateLyricText basic cases", () => {
  assert.deepEqual(validateLyricText("Mi letra autorizada"), { ok: true });
  assert.equal(validateLyricText("   ").ok, false);
  assert.equal(validateLyricText("").ok, false);
  assert.equal(validateLyricText(42).ok, false);
});

test("byte-size boundary at 200 KiB", () => {
  const exact = "a".repeat(MAX_LYRIC_BYTES);
  assert.equal(validateLyricText(exact).ok, true);
  assert.equal(validateLyricText(exact + "a").ok, false);
});

test("serializeLyricsBackup produces schemaVersion 1", () => {
  const backup = serializeLyricsBackup(
    { "2026-09-13:jehova": { text: "Mi texto", updatedAt: "2026-09-04T15:00:00.000Z" } },
    "2026-09-04T16:00:00.000Z"
  );
  const parsed = JSON.parse(backup);
  assert.equal(parsed.schemaVersion, 1);
  assert.equal(parsed.exportedAt, "2026-09-04T16:00:00.000Z");
  assert.equal(parsed.lyrics["2026-09-13:jehova"].text, "Mi texto");
});

test("parseLyricsBackup accepts valid keys only", () => {
  const good = serializeLyricsBackup({ "2026-09-13:jehova": { text: "Hola", updatedAt: "x" } });
  const res = parseLyricsBackup(good, VALID_KEYS);
  assert.equal(res.ok, true);
  assert.equal(res.lyrics["2026-09-13:jehova"].text, "Hola");
});

test("parseLyricsBackup rejects unknown schema, bad keys, non-text values", () => {
  assert.equal(parseLyricsBackup('{"schemaVersion":2,"lyrics":{}}', VALID_KEYS).ok, false);
  assert.equal(parseLyricsBackup("not json", VALID_KEYS).ok, false);

  const badKey = parseLyricsBackup(
    serializeLyricsBackup({ "2026-01-01:ghost": { text: "x", updatedAt: "y" } }),
    VALID_KEYS
  );
  assert.equal(Object.keys(badKey.lyrics).length, 0);
  assert.ok(badKey.errors.length > 0);

  const badValue = parseLyricsBackup(
    JSON.stringify({ schemaVersion: 1, lyrics: { "2026-09-13:jehova": { text: 5 } } }),
    VALID_KEYS
  );
  assert.equal(Object.keys(badValue.lyrics).length, 0);
});

test("mergeLyrics reports collisions and overwrites incoming", () => {
  const current = { "2026-09-13:jehova": { text: "viejo", updatedAt: "1" } };
  const incoming = {
    "2026-09-13:jehova": { text: "nuevo", updatedAt: "2" },
    "2026-09-13:lavado": { text: "otro", updatedAt: "2" }
  };
  const { merged, collisions } = mergeLyrics(current, incoming);
  assert.deepEqual(collisions, ["2026-09-13:jehova"]);
  assert.equal(merged["2026-09-13:jehova"].text, "nuevo");
  assert.equal(merged["2026-09-13:lavado"].text, "otro");
});
