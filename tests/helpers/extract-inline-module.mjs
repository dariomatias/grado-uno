import { readFile } from "node:fs/promises";

/**
 * Extrae un bloque puro marcado del `<script type="module">` de index.html y lo
 * importa como módulo aislado. Permite que node:test ejecute exactamente el
 * código distribuido, sin duplicarlo.
 */
export async function extractInlineModule(filePath, marker) {
  const html = await readFile(filePath, "utf8");
  const start = `/* ${marker}:start */`;
  const end = `/* ${marker}:end */`;
  const from = html.indexOf(start);
  const to = html.indexOf(end);
  if (from < 0 || to < 0 || to <= from) {
    throw new Error(`Missing or invalid inline module marker: ${marker}`);
  }
  const source = html.slice(from + start.length, to);
  return import(`data:text/javascript;base64,${Buffer.from(source).toString("base64")}`);
}

/** Ruta absoluta a index.html desde la carpeta tests. */
export const indexHtmlUrl = new URL("../../index.html", import.meta.url);
