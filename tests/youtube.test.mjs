import test from "node:test";
import assert from "node:assert/strict";
import { extractInlineModule, indexHtmlUrl } from "./helpers/extract-inline-module.mjs";

const { extractYouTubeId, isValidYouTubeId, buildYouTubeEmbedUrl } =
  await extractInlineModule(indexHtmlUrl, "youtube-module");

test("extracts ids from watch and short urls", () => {
  assert.equal(extractYouTubeId("https://www.youtube.com/watch?v=CBbSkDUrZds"), "CBbSkDUrZds");
  assert.equal(extractYouTubeId("https://youtu.be/CBbSkDUrZds"), "CBbSkDUrZds");
  assert.equal(extractYouTubeId("https://m.youtube.com/watch?v=CBbSkDUrZds"), "CBbSkDUrZds");
  assert.equal(extractYouTubeId("https://www.youtube.com/embed/CBbSkDUrZds"), "CBbSkDUrZds");
});

test("rejects non-youtube hosts and malformed ids", () => {
  assert.equal(extractYouTubeId("https://example.com/watch?v=CBbSkDUrZds"), null);
  assert.equal(extractYouTubeId("not a url"), null);
  assert.equal(extractYouTubeId("https://www.youtube.com/watch?v=short"), null);
});

test("isValidYouTubeId", () => {
  assert.equal(isValidYouTubeId("CBbSkDUrZds"), true);
  assert.equal(isValidYouTubeId("bad"), false);
  assert.equal(isValidYouTubeId(null), false);
});

test("buildYouTubeEmbedUrl uses nocookie and validates", () => {
  assert.equal(buildYouTubeEmbedUrl("CBbSkDUrZds"), "https://www.youtube-nocookie.com/embed/CBbSkDUrZds");
  assert.throws(() => buildYouTubeEmbedUrl("bad"), TypeError);
});
