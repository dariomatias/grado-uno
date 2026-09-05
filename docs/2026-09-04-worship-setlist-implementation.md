# Worship Setlist Transponible Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir una web estática para 28 canciones distribuidas en cuatro reuniones, con vistas Setlist y Escenario, transposición de acordes, letras aportadas localmente, YouTube embebido bajo demanda y metrónomo.

**Architecture:** El producto distribuible es un único `index.html` con HTML, CSS y un `<script type="module">` sin dependencias de runtime. El script se divide mediante marcadores de módulos puros para que `node:test` pueda extraer y probar exactamente el código entregado; el DOM consume esas funciones dentro del mismo módulo. Las letras se guardan en `localStorage`, mientras que tonos y parámetros del metrónomo permanecen sólo durante la sesión.

**Tech Stack:** HTML5 semántico, CSS responsive, JavaScript ES2022, Web Audio API, Fullscreen API, YouTube privacy-enhanced embed, `localStorage`, Node.js 20+ y `node:test`.

**Spec:** `docs/superpowers/specs/2026-09-04-worship-setlist-design.md`

## Global Constraints

- El producto funciona al abrir `index.html` directamente y no requiere backend ni proceso de build.
- No agregar frameworks, paquetes de runtime, CDN, fuentes remotas ni analítica.
- No copiar letras completas desde Internet ni incluir letras completas precargadas en el repositorio.
- Sólo aceptar letras aportadas o autorizadas por el usuario; renderizarlas con `textContent`, nunca con `innerHTML`.
- Los acordes internos contienen secciones, compases y repeticiones, pero no fragmentos de versos.
- Cada fuente ambigua permanece con `sourceStatus: "pending"`; no inventar artista, acordes, BPM ni URL.
- La transposición y los ajustes de metrónomo se guardan por aparición mediante `${setlistId}:${songId}`.
- Las letras persisten bajo `worship-setlist:lyrics:v1` y se pueden exportar/importar como JSON con `schemaVersion: 1`.
- YouTube se carga sólo tras interacción del usuario mediante `youtube-nocookie.com`.
- El metrónomo acepta 40–240 BPM y compases de 2, 3, 4 o 6 pulsos.
- Todos los controles táctiles miden al menos 44 × 44 px y el flujo completo funciona con teclado.
- Usar español en etiquetas, mensajes y documentación visible.
- No realizar scraping automatizado ni descargar PDFs, letras, audio o video.

---

## File Map

| Archivo | Responsabilidad |
|---|---|
| `index.html` | Aplicación completa, datos, lógica, estilos y vistas Setlist/Escenario. |
| `package.json` | Comandos de prueba sin dependencias externas. |
| `tests/helpers/extract-inline-module.mjs` | Extraer un bloque marcado del `<script type="module">` e importarlo en pruebas. |
| `tests/content.test.mjs` | Validar reuniones, canciones, estados de fuente y ausencia de letras precargadas. |
| `tests/transposer.test.mjs` | Probar análisis, transposición y preferencia de alteraciones. |
| `tests/navigation.test.mjs` | Probar claves por aparición y límites Anterior/Siguiente. |
| `tests/lyrics-store.test.mjs` | Probar validación, persistencia y respaldo de letras. |
| `tests/youtube.test.mjs` | Probar extracción/validación de IDs y URL de embed. |
| `tests/metronome.test.mjs` | Probar BPM, compás, pulso y configuración del metrónomo. |
| `scripts/check-links.mjs` | Comprobar URLs externas y producir un reporte legible. |
| `docs/song-sources.md` | Evidencia de versión, artista, fuente de acordes y video por canción. |
| `README.md` | Apertura, pruebas, despliegue, letras locales y limitaciones. |

## Inline Module Contract

Dentro del único `<script type="module">`, envolver cada bloque puro así:

```js
/* transposer-module:start */
export const TRANSPOSE_LIMIT = 11;
/* transposer-module:end */
```

Los nombres de marcadores requeridos son:

- `content-module`
- `navigation-module`
- `transposer-module`
- `lyrics-store-module`
- `youtube-module`
- `metronome-module`

El código con acceso a `document`, `window`, `localStorage`, `AudioContext` o `FileReader` queda fuera de los bloques puros y llama a las interfaces exportadas.

---

### Task 1: Crear el shell ejecutable y el arnés de pruebas

**Files:**
- Create: `index.html`
- Create: `package.json`
- Create: `tests/helpers/extract-inline-module.mjs`
- Create: `tests/smoke.test.mjs`
- Create: `README.md`

**Interfaces:**
- Consumes: ninguna.
- Produces: `extractInlineModule(filePath, marker): Promise<Record<string, unknown>>`, los nodos `#setlistView`, `#stageView`, `#statusMessage` y el comando `npm test`.

- [ ] **Step 1: Crear el test fallido del shell**

```js
// tests/smoke.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("index contains the two application views", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  assert.match(html, /id="setlistView"/);
  assert.match(html, /id="stageView"[^>]*hidden/);
  assert.match(html, /id="statusMessage"[^>]*aria-live="polite"/);
  assert.match(html, /<script type="module">/);
});
```

- [ ] **Step 2: Ejecutar el test y confirmar el fallo inicial**

Run: `node --test tests/smoke.test.mjs`

Expected: FAIL porque `index.html` todavía no existe.

- [ ] **Step 3: Crear el documento base**

Crear `index.html` con `lang="es"`, viewport, enlace de salto, `header`, `main`, `section#setlistView`, `section#stageView hidden`, `p#statusMessage[aria-live="polite"]`, títulos descriptivos y un `<script type="module">`. No agregar contenido decorativo antes del setlist.

Crear `package.json`:

```json
{
  "name": "worship-setlist-transponible",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "node --test",
    "check:links": "node scripts/check-links.mjs"
  },
  "engines": {
    "node": ">=20"
  }
}
```

- [ ] **Step 4: Crear el extractor de módulos inline**

```js
// tests/helpers/extract-inline-module.mjs
import { readFile } from "node:fs/promises";

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
```

- [ ] **Step 5: Ejecutar pruebas**

Run: `npm test`

Expected: PASS, 1 test.

- [ ] **Step 6: Documentar apertura y pruebas**

En `README.md`, indicar `open index.html`, `npm test` y `npm run check:links`. Aclarar que Node sólo se usa para verificar; la aplicación no tiene build.

- [ ] **Step 7: Commit**

```bash
git add index.html package.json tests/helpers/extract-inline-module.mjs tests/smoke.test.mjs README.md
git commit -m "chore: scaffold static worship setlist"
```

Si no existe un repositorio Git, registrar el checkpoint en la salida y continuar sin inicializar uno salvo pedido expreso del usuario.

---

### Task 2: Modelar las cuatro reuniones y validar las 28 apariciones

**Files:**
- Modify: `index.html`
- Create: `tests/content.test.mjs`

**Interfaces:**
- Consumes: `extractInlineModule()` de Task 1.
- Produces: `setlists`, `appearanceKey(setlistId, songId)` y `validateSetlists(setlists)` desde `content-module`.

- [ ] **Step 1: Escribir la prueba fallida del contenido**

La prueba debe importar `content-module` y afirmar:

```js
const expected = [
  ["2026-09-04", [["Todo es posible", "D"], ["A Jesús seguiré", "G"], ["Creeré", "A"], ["Santo una cosa", "A"], ["Al que está sentado", "A"], ["Digno de alabar", "D"], ["Dios de avivamiento", "C"]]],
  ["2026-09-13", [["Jehová", "E"], ["Lavado", "B"], ["Nadie", "G"], ["Quién Más", "G"], ["Canta al Señor", "G"], ["No Hay Otro Nombre", "G"], ["El Nombre de Jesús", "D"]]],
  ["2026-09-18", [["Señor eres fiel", "C"], ["En el nombre de Jesús", "C"], ["Clamo a Cristo", "E"], ["Cómo no voy a creer", "E"], ["Para siempre Cristo", "E"], ["Agnus Dei", "E"], ["Alabaré al Señor", "D"]]],
  ["2026-09-27", [["Júbilo", "C"], ["Eres libre", "G"], ["Adiós al ayer", "F"], ["Clamo a Dios", "D"], ["Es Él", "A"], ["Vida nueva", "A"], ["De gracia en gracia", "Eb"]]]
];

assert.equal(setlists.length, 4);
assert.equal(setlists.flatMap(item => item.songs).length, 28);
assert.deepEqual(
  setlists.map(item => [item.id, item.songs.map(song => [song.title, song.assignedKey])]),
  expected
);
assert.deepEqual(validateSetlists(setlists), []);
```

También verificar IDs únicos dentro de cada reunión, etiquetas cortas exactas `Vie 4`, `Dom 13`, `Vie 18`, `Dom 27`, `lyricsText` ausente y `sections` vacío cuando `sourceStatus === "pending"`.

- [ ] **Step 2: Confirmar el fallo**

Run: `node --test tests/content.test.mjs`

Expected: FAIL por ausencia de `content-module`.

- [ ] **Step 3: Implementar el contrato de datos**

Cada canción usa:

```js
{
  id: "todo-es-posible",
  title: "Todo es posible",
  artist: "Versión por confirmar",
  assignedKey: "D",
  sourceKey: null,
  sourceStatus: "pending",
  lyricsUrl: null,
  youtubeUrl: null,
  youtubeVideoId: null,
  tempoBpm: null,
  beatsPerMeasure: 4,
  sections: []
}
```

Usar slugs ASCII estables y no incluir letra completa. Cargar las siete fuentes ya confirmadas de Domingo 13 según la especificación; una fuente de acordes conocida no confirma por sí sola el `youtubeVideoId` ni el BPM.

Implementar:

```js
export const appearanceKey = (setlistId, songId) => `${setlistId}:${songId}`;

export function validateSetlists(items) {
  const errors = [];
  for (const setlist of items) {
    if (setlist.songs.length !== 7) errors.push(`${setlist.id}: expected 7 songs`);
    const ids = new Set();
    for (const song of setlist.songs) {
      if (ids.has(song.id)) errors.push(`${setlist.id}: duplicate ${song.id}`);
      ids.add(song.id);
      if (!/^[A-G](?:#|b)?$/.test(song.assignedKey)) errors.push(`${setlist.id}:${song.id}: invalid key`);
      if (song.sourceStatus === "pending" && song.sections.length) errors.push(`${setlist.id}:${song.id}: pending source has sections`);
    }
  }
  return errors;
}
```

- [ ] **Step 4: Ejecutar pruebas**

Run: `node --test tests/content.test.mjs`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add index.html tests/content.test.mjs
git commit -m "feat: add four dated worship setlists"
```

---

### Task 3: Investigar y registrar versiones sin copiar letras

**Files:**
- Create: `docs/song-sources.md`
- Modify: `index.html`
- Modify: `tests/content.test.mjs`

**Interfaces:**
- Consumes: modelo `Song` de Task 2.
- Produces: metadatos confirmados por canción: `artist`, `sourceKey`, `lyricsUrl`, `youtubeUrl`, `youtubeVideoId`, `tempoBpm`, `beatsPerMeasure`, `sections`.

- [ ] **Step 1: Crear la matriz de investigación**

En `docs/song-sources.md`, crear una fila para cada una de las 28 apariciones con columnas: fecha, orden, título, tono asignado, artista/ministerio, fuente de acordes, tono fuente, video oficial, ID de YouTube, BPM, compás, estado y evidencia breve.

- [ ] **Step 2: Verificar las siete canciones conocidas**

Usar las fuentes indicadas en la sección 8.2 de la especificación. Para cada una, buscar el video oficial del artista/ministerio y comparar título, comienzo, estructura y coro sin copiar el texto al documento. Registrar `confirmed` sólo cuando la versión sea inequívoca.

- [ ] **Step 3: Investigar las otras 21 canciones una por una**

Para cada título, buscar título exacto + `acordes` + `worship` + tono asignado. Priorizar sitio oficial, canal oficial y fuentes reconocidas. Confirmar que estructura y progresión correspondan a la misma versión. No inferir que dos canciones homónimas son equivalentes.

- [ ] **Step 4: Detener sólo las canciones ambiguas**

Si quedan dos o más versiones plausibles, conservar esa canción con `sourceStatus: "pending"`, `artist: "Versión por confirmar"`, campos de fuente en `null` y `sections: []`. Presentar al usuario una tabla de candidatas con artista, enlace de acordes y video; continuar con las canciones inequívocas.

- [ ] **Step 5: Normalizar acordes confirmados al tono asignado**

Registrar progresiones únicamente como secciones, compases, acordes y repeticiones. Convertir desde `sourceKey` hacia `assignedKey` y comprobar manualmente al menos intro, primer verso musical, coro, puente y final cuando existan. No agregar fragmentos líricos.

- [ ] **Step 6: Fortalecer la prueba de contenido**

Para canciones confirmadas, exigir artista real, URL HTTP(S), `youtubeVideoId` de 11 caracteres, al menos una sección y acordes no vacíos. Para canciones pendientes, exigir campos externos nulos y secciones vacías.

- [ ] **Step 7: Ejecutar pruebas**

Run: `node --test tests/content.test.mjs`

Expected: PASS; la salida debe identificar cero registros inconsistentes.

- [ ] **Step 8: Checkpoint de revisión humana**

Entregar `docs/song-sources.md` al usuario. Las canciones marcadas `pending` requieren selección explícita antes de recibir acordes; no bloquean las tareas siguientes.

- [ ] **Step 9: Commit**

```bash
git add docs/song-sources.md index.html tests/content.test.mjs
git commit -m "content: document verified song sources"
```

---

### Task 4: Implementar el motor de transposición

**Files:**
- Modify: `index.html`
- Create: `tests/transposer.test.mjs`

**Interfaces:**
- Consumes: acordes almacenados en `Song.sections[].measures`.
- Produces: `parseChord(chord)`, `transposeChord(chord, semitones, accidentalMode)`, `keyToPitchClass(key)`, `semitoneDistance(from, to)` y `transposeSections(sections, semitones, accidentalMode)`.

- [ ] **Step 1: Escribir pruebas fallidas**

Incluir exactamente estos casos:

```js
assert.equal(transposeChord("G", 2, "sharp"), "A");
assert.equal(transposeChord("Em7", 2, "sharp"), "F#m7");
assert.equal(transposeChord("D/F#", 2, "sharp"), "E/G#");
assert.equal(transposeChord("Cadd9", -1, "sharp"), "Badd9");
assert.equal(transposeChord("Bbsus4", 2, "flat"), "Csus4");
assert.equal(transposeChord("Db/F", 1, "sharp"), "D/F#");
assert.equal(transposeChord("N.C.", 4, "sharp"), "N.C.");
assert.equal(semitoneDistance("E", "G"), 3);
assert.equal(semitoneDistance("B", "Bb"), -1);
```

Agregar casos para `m`, `7`, `maj7`, `m7`, `sus2`, `sus4`, `add9`, `dim`, `aug`, bemoles, sostenidos, bajo invertido y desplazamientos ±12/±13.

- [ ] **Step 2: Confirmar el fallo**

Run: `node --test tests/transposer.test.mjs`

Expected: FAIL por ausencia de exports.

- [ ] **Step 3: Implementar tablas y parser**

Usar:

```js
const SHARP_NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const FLAT_NOTES = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];
const ROOT_PATTERN = /^([A-G](?:#|b)?)([^/]*)(?:\/([A-G](?:#|b)?))?$/;
```

`parseChord()` devuelve `{ root, suffix, bass }` o `null`. `transposeChord()` devuelve el texto original si el parser falla.

- [ ] **Step 4: Implementar transposición de secciones sin mutación**

`transposeSections()` debe crear nuevos arrays y preservar `type`, `label`, `repeats` e indicaciones breves. Cada acorde dentro de cada compás pasa por `transposeChord()`.

- [ ] **Step 5: Ejecutar pruebas**

Run: `node --test tests/transposer.test.mjs`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add index.html tests/transposer.test.mjs
git commit -m "feat: add chord transposition engine"
```

---

### Task 5: Construir navegación por fechas y Modo Escenario

**Files:**
- Modify: `index.html`
- Create: `tests/navigation.test.mjs`

**Interfaces:**
- Consumes: `setlists`, `appearanceKey()`, `transposeSections()`.
- Produces: `initialState()`, `selectSetlist(state, index)`, `selectSong(state, index)`, `moveSong(state, delta)`, `setTranspose(state, setlistId, songId, semitones)` y renderers DOM.

- [ ] **Step 1: Escribir pruebas fallidas de estado**

Probar que:

```js
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
assert.equal(moveSong({ ...initialState(), selectedSongIndex: 0 }, -1).selectedSongIndex, 0);
assert.equal(moveSong({ ...initialState(), selectedSongIndex: 6 }, 1).selectedSongIndex, 6);
assert.equal(moveSong({ ...initialState(), activeSetlistIndex: 1, selectedSongIndex: 6 }, 1).activeSetlistIndex, 1);
```

Probar que la transposición guardada para `2026-09-04:todo-es-posible` no modifica otra aparición con distinta clave.

- [ ] **Step 2: Ejecutar y confirmar el fallo**

Run: `node --test tests/navigation.test.mjs`

Expected: FAIL por ausencia de `navigation-module`.

- [ ] **Step 3: Implementar funciones puras de estado**

Cada función devuelve un objeto nuevo. `selectSetlist()` limita 0–3, establece la reunión activa y conserva una selección válida. `moveSong()` limita 0–6 y nunca modifica `activeSetlistIndex`. `setTranspose()` limita −11–11 y usa `appearanceKey()`.

```js
export function moveSong(state, delta) {
  return {
    ...state,
    selectedSongIndex: Math.max(0, Math.min(6, state.selectedSongIndex + delta)),
    metronomeRunning: false
  };
}

export function setTranspose(state, setlistId, songId, semitones) {
  const key = `${setlistId}:${songId}`;
  return {
    ...state,
    transpositions: {
      ...state.transpositions,
      [key]: Math.max(-11, Math.min(11, Math.trunc(semitones)))
    }
  };
}
```

- [ ] **Step 4: Renderizar tabs accesibles**

Usar `role="tablist"`, cuatro botones `role="tab"`, `aria-selected`, `aria-controls` y roving `tabindex`. Flechas izquierda/derecha cambian tab; Home/End seleccionan primero/último. El panel usa `role="tabpanel"`.

- [ ] **Step 5: Renderizar las siete tarjetas activas**

Cada tarjeta muestra orden, título, artista/versión, tono asignado y tono de sesión. `Abrir partitura` queda deshabilitado y muestra `Partitura no disponible` si la fuente sigue pendiente; los enlaces ausentes muestran `Enlace no disponible`. La acción `Agregar letra` o `Editar letra` permanece disponible aun cuando la partitura esté pendiente.

- [ ] **Step 6: Renderizar el visor**

Mostrar posición, título, artista, tono asignado/actual, secciones transpuestas y controles `−½`, `+½`, selector cromático, alteraciones y `Restablecer tono`. Representar compases con listas semánticas y repeticiones mediante texto visible.

- [ ] **Step 7: Conectar navegación y restauración visual**

Guardar `scrollY` por reunión antes de abrir el visor. Al volver, reactivar tab y tarjeta, restaurar desplazamiento y enfocar el botón que abrió la canción. Anterior/Siguiente cargan sólo vecinos y se deshabilitan en extremos.

- [ ] **Step 8: Ejecutar pruebas**

Run: `node --test tests/navigation.test.mjs tests/transposer.test.mjs tests/content.test.mjs`

Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add index.html tests/navigation.test.mjs
git commit -m "feat: add setlist and stage navigation"
```

---

### Task 6: Agregar letras locales, TXT y respaldo JSON

**Files:**
- Modify: `index.html`
- Create: `tests/lyrics-store.test.mjs`

**Interfaces:**
- Consumes: `appearanceKey()` y claves válidas derivadas de `setlists`.
- Produces: `validateLyricText(text)`, `parseLyricsBackup(json, validKeys)`, `mergeLyrics(current, incoming)`, `serializeLyricsBackup(lyrics, now)` y adaptador DOM de `localStorage`.

- [ ] **Step 1: Escribir pruebas fallidas de validación y respaldo**

Cubrir texto vacío, 200 KiB exactos, 200 KiB + 1 byte, schema desconocido, clave inexistente, valor no textual, combinación sin colisión y colisión sobrescrita tras confirmación.

Ejemplo:

```js
assert.deepEqual(validateLyricText("Mi letra autorizada"), { ok: true });
assert.equal(validateLyricText("   ").ok, false);
assert.equal(validateLyricText("á".repeat(102401)).ok, false);

const backup = serializeLyricsBackup({
  "2026-09-13:jehova": { text: "Mi texto", updatedAt: "2026-09-04T15:00:00.000Z" }
}, "2026-09-04T16:00:00.000Z");
assert.equal(JSON.parse(backup).schemaVersion, 1);
```

- [ ] **Step 2: Confirmar el fallo**

Run: `node --test tests/lyrics-store.test.mjs`

Expected: FAIL por ausencia de `lyrics-store-module`.

- [ ] **Step 3: Implementar funciones puras**

Medir límite con `new TextEncoder().encode(text).byteLength`. `parseLyricsBackup()` devuelve `{ ok, lyrics, errors, collisions }`; sólo admite claves existentes y objetos `{ text, updatedAt }`. `serializeLyricsBackup()` produce JSON UTF-8 indentado con dos espacios.

```js
export const MAX_LYRIC_BYTES = 200 * 1024;

export function validateLyricText(text) {
  if (typeof text !== "string" || !text.trim()) return { ok: false, error: "La letra está vacía" };
  if (text.includes("\uFFFD")) return { ok: false, error: "El archivo no contiene texto UTF-8 legible" };
  if (new TextEncoder().encode(text).byteLength > MAX_LYRIC_BYTES) {
    return { ok: false, error: "La letra supera 200 KiB" };
  }
  return { ok: true };
}

export function serializeLyricsBackup(lyrics, now = new Date().toISOString()) {
  return JSON.stringify({ schemaVersion: 1, exportedAt: now, lyrics }, null, 2);
}
```

- [ ] **Step 4: Implementar persistencia defensiva**

Crear adaptador que lea/escriba `worship-setlist:lyrics:v1` dentro de `try/catch`. Si escribir falla, conservar el mapa en memoria, mostrar `La letra estará disponible sólo durante esta sesión` y mantener habilitada la exportación.

- [ ] **Step 5: Implementar el diálogo de letra**

Agregar `<dialog>` con textarea, selector `.txt`, `Guardar`, `Cancelar` y mensajes asociados mediante `aria-describedby`. Leer archivos como UTF-8, validar tamaño antes de guardar y renderizar la letra con `element.textContent = text` y `white-space: pre-wrap`.

- [ ] **Step 6: Implementar edición, eliminación, exportación e importación**

`Agregar letra` cambia a `Editar letra` cuando existe un registro. Eliminar requiere confirmación. Exportar crea un `Blob` `application/json` y descarga `worship-setlist-lyrics-YYYY-MM-DD.json`. Importar valida y muestra colisiones; sólo sobrescribe después de confirmación explícita.

- [ ] **Step 7: Ejecutar pruebas**

Run: `node --test tests/lyrics-store.test.mjs`

Expected: PASS.

- [ ] **Step 8: Verificación manual de seguridad**

Pegar `<img src=x onerror=alert(1)>` como letra. Expected: se muestra literalmente; no se crea una imagen ni se ejecuta JavaScript. Recargar y confirmar persistencia. Exportar, eliminar e importar para confirmar restauración.

- [ ] **Step 9: Commit**

```bash
git add index.html tests/lyrics-store.test.mjs
git commit -m "feat: add local user-provided lyrics"
```

---

### Task 7: Incorporar YouTube bajo demanda

**Files:**
- Modify: `index.html`
- Create: `tests/youtube.test.mjs`

**Interfaces:**
- Consumes: `Song.youtubeUrl`, `Song.youtubeVideoId`.
- Produces: `extractYouTubeId(url)`, `isValidYouTubeId(id)`, `buildYouTubeEmbedUrl(id)` y controlador DOM `loadVideo(song)`.

- [ ] **Step 1: Escribir pruebas fallidas**

```js
assert.equal(extractYouTubeId("https://www.youtube.com/watch?v=CBbSkDUrZds"), "CBbSkDUrZds");
assert.equal(extractYouTubeId("https://youtu.be/CBbSkDUrZds"), "CBbSkDUrZds");
assert.equal(extractYouTubeId("https://example.com/watch?v=CBbSkDUrZds"), null);
assert.equal(buildYouTubeEmbedUrl("CBbSkDUrZds"), "https://www.youtube-nocookie.com/embed/CBbSkDUrZds");
assert.equal(isValidYouTubeId("bad"), false);
```

- [ ] **Step 2: Confirmar el fallo**

Run: `node --test tests/youtube.test.mjs`

Expected: FAIL por ausencia de `youtube-module`.

- [ ] **Step 3: Implementar validación y URL privacy-enhanced**

Aceptar hosts `youtube.com`, `www.youtube.com`, `m.youtube.com` y `youtu.be`; exigir ID `/^[A-Za-z0-9_-]{11}$/`. Construir únicamente URLs `youtube-nocookie.com/embed/` a partir del ID validado, nunca interpolar una URL completa aportada.

```js
export const isValidYouTubeId = id => /^[A-Za-z0-9_-]{11}$/.test(id ?? "");

export function buildYouTubeEmbedUrl(id) {
  if (!isValidYouTubeId(id)) throw new TypeError("Invalid YouTube video id");
  return `https://www.youtube-nocookie.com/embed/${id}`;
}
```

- [ ] **Step 4: Crear el contenedor bajo demanda**

Antes de presionar `Cargar video`, no debe existir ningún iframe. Al cargar, crear uno con `title="Video oficial de {título}"`, `loading="lazy"`, `referrerpolicy="strict-origin-when-cross-origin"`, `allow="accelerometer; autoplay; encrypted-media; picture-in-picture"` y `allowfullscreen`.

- [ ] **Step 5: Limpiar reproducción**

Al cambiar canción o volver al setlist, reemplazar los hijos del contenedor para destruir el iframe. Si falla, mostrar aviso y mantener el enlace `Abrir en YouTube`.

- [ ] **Step 6: Ejecutar pruebas y comprobación manual**

Run: `node --test tests/youtube.test.mjs`

Expected: PASS. En navegador, confirmar en DevTools que no existe iframe antes del clic y que desaparece al navegar.

- [ ] **Step 7: Commit**

```bash
git add index.html tests/youtube.test.mjs
git commit -m "feat: embed official YouTube videos on demand"
```

---

### Task 8: Implementar el metrónomo Web Audio

**Files:**
- Modify: `index.html`
- Create: `tests/metronome.test.mjs`

**Interfaces:**
- Consumes: `Song.tempoBpm`, `Song.beatsPerMeasure`, `appearanceKey()` y estado de sesión.
- Produces: `clampBpm(value)`, `normalizeMeter(value)`, `advanceBeat(currentBeat, beatsPerMeasure)`, `secondsPerBeat(bpm)` y clase DOM `MetronomeController`.

- [ ] **Step 1: Escribir pruebas fallidas de lógica temporal**

```js
assert.equal(clampBpm(39), 40);
assert.equal(clampBpm(241), 240);
assert.equal(clampBpm(127.6), 128);
assert.equal(normalizeMeter(5), 4);
assert.equal(normalizeMeter(6), 6);
assert.deepEqual(advanceBeat(3, 4), { beat: 0, accented: true });
assert.deepEqual(advanceBeat(0, 4), { beat: 1, accented: false });
assert.equal(secondsPerBeat(120), 0.5);
```

- [ ] **Step 2: Confirmar el fallo**

Run: `node --test tests/metronome.test.mjs`

Expected: FAIL por ausencia de `metronome-module`.

- [ ] **Step 3: Implementar las funciones puras**

`clampBpm()` redondea y limita 40–240. `normalizeMeter()` admite `[2, 3, 4, 6]` y devuelve 4 para entradas inválidas. `advanceBeat()` usa índice cero y marca el primer pulso como acentuado.

```js
export const clampBpm = value => Math.max(40, Math.min(240, Math.round(Number(value) || 120)));
export const normalizeMeter = value => [2, 3, 4, 6].includes(Number(value)) ? Number(value) : 4;
export const secondsPerBeat = bpm => 60 / clampBpm(bpm);
export function advanceBeat(currentBeat, beatsPerMeasure) {
  const beat = (currentBeat + 1) % normalizeMeter(beatsPerMeasure);
  return { beat, accented: beat === 0 };
}
```

- [ ] **Step 4: Implementar el scheduler de audio**

`MetronomeController` crea `AudioContext` sólo en `start()` tras clic del usuario. Usar ventana de programación de 100 ms y revisar cada 25 ms. Cada clic usa un `OscillatorNode` breve: 1200 Hz para el primer pulso y 800 Hz para los demás, conectado a un `GainNode`; detener el oscilador después de 30 ms.

La clase expone:

```js
start({ bpm, beatsPerMeasure, volume, onBeat });
stop();
setBpm(bpm);
setMeter(beatsPerMeasure);
setVolume(value); // 0.0–1.0
setMuted(muted);
get running();
```

- [ ] **Step 5: Construir controles accesibles**

Agregar BPM numérico, botones −1/+1, selector de compás, iniciar/detener, slider de volumen y botón silenciar. Mostrar `Tempo sin configurar` cuando `tempoBpm === null`. Anunciar inicio, detención y BPM mediante `#statusMessage` sin anunciar cada pulso.

- [ ] **Step 6: Integrar ciclo de vida**

Guardar BPM y compás modificados en `tempoOverrides` y `meterOverrides` por aparición. Ejecutar `stop()` antes de cambiar canción, volver al listado y en `pagehide`. Si `AudioContext` falla o no existe, deshabilitar sólo el panel de metrónomo.

- [ ] **Step 7: Ejecutar pruebas y medir comportamiento**

Run: `node --test tests/metronome.test.mjs`

Expected: PASS. En navegador, probar 40, 120 y 240 BPM; confirmar acento en primer pulso, mute inmediato y detención al navegar.

- [ ] **Step 8: Commit**

```bash
git add index.html tests/metronome.test.mjs
git commit -m "feat: add web audio metronome"
```

---

### Task 9: Completar diseño responsive, accesibilidad y pantalla completa

**Files:**
- Modify: `index.html`
- Modify: `tests/smoke.test.mjs`

**Interfaces:**
- Consumes: todas las vistas y controles anteriores.
- Produces: experiencia responsive final y controlador `toggleFullscreen()`.

- [ ] **Step 1: Ampliar smoke tests estructurales**

Verificar skip link, landmarks, `role="tablist"`, `aria-live`, `<dialog>`, botón de pantalla completa, botón de carga de video y controles del metrónomo. Verificar que ningún `button` carezca de texto o `aria-label` mediante una inspección simple del HTML fuente.

- [ ] **Step 2: Confirmar que las nuevas afirmaciones fallen**

Run: `node --test tests/smoke.test.mjs`

Expected: FAIL hasta completar atributos/nodos faltantes.

- [ ] **Step 3: Aplicar el sistema visual**

Definir variables CSS para fondo carbón, panel, texto, texto secundario, dorado, error, foco y borde. Usar fuente del sistema. En 320 px: una columna; desde 768 px: tarjetas amplias; desde 1100 px: hasta dos columnas en Setlist. Stage siempre prioriza acordes con tamaño fluido mediante `clamp()`.

- [ ] **Step 4: Completar estados accesibles**

Mantener foco visible con `:focus-visible`, contraste AA, texto además de color para selección/tono modificado, targets mínimos de 44 px y vistas ocultas mediante `hidden`. Respetar `prefers-reduced-motion: reduce`.

- [ ] **Step 5: Implementar Fullscreen API defensiva**

`toggleFullscreen()` solicita pantalla completa sobre `#stageView`; si ya está activa llama `document.exitFullscreen()`. Capturar rechazos y anunciar `No se pudo activar pantalla completa`. Actualizar el label entre `Pantalla completa` y `Salir de pantalla completa` con `fullscreenchange`.

```js
async function toggleFullscreen() {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else if (stageView.requestFullscreen) await stageView.requestFullscreen();
    else throw new Error("Fullscreen API unavailable");
  } catch {
    announce("No se pudo activar pantalla completa");
  }
}
```

- [ ] **Step 6: Ejecutar pruebas**

Run: `npm test`

Expected: PASS para toda la suite.

- [ ] **Step 7: Verificación manual responsive y teclado**

Probar anchos 320, 768 y 1440 px. Recorrer tabs, tarjetas, visor, transposición, diálogo, YouTube, metrónomo y retorno usando sólo teclado. Confirmar que no hay scroll horizontal ni controles tapados.

- [ ] **Step 8: Commit**

```bash
git add index.html tests/smoke.test.mjs
git commit -m "feat: finish accessible responsive stage UI"
```

---

### Task 10: Automatizar enlaces y cerrar documentación

**Files:**
- Create: `scripts/check-links.mjs`
- Modify: `README.md`
- Modify: `tests/content.test.mjs`

**Interfaces:**
- Consumes: URLs exportadas por `content-module`.
- Produces: comando `npm run check:links` con estados `OK`, `REDIRECT`, `BLOCKED`, `FAILED`, y documentación operativa final.

- [ ] **Step 1: Crear una prueba de inventario de enlaces**

Para cada canción `confirmed`, exigir `lyricsUrl`, `youtubeUrl` y coincidencia entre `youtubeVideoId` y `extractYouTubeId(youtubeUrl)`. Para cada canción `pending`, exigir que la UI pueda mostrar enlaces deshabilitados sin excepción.

- [ ] **Step 2: Implementar el verificador**

`scripts/check-links.mjs` lee `content-module`, reúne URLs únicas y ejecuta `fetch(url, { method: "GET", redirect: "manual", headers: { "user-agent": "Mozilla/5.0 link-check" } })` con timeout de 10 segundos mediante `AbortSignal.timeout(10000)`. Clasificar 200–299 como `OK`, 300–399 como `REDIRECT`, 401/403/429 como `BLOCKED` y el resto como `FAILED`. Salir con código 1 sólo si existe `FAILED`; `BLOCKED` exige revisión manual.

- [ ] **Step 3: Ejecutar el verificador**

Run: `npm run check:links`

Expected: ninguna URL `FAILED`. Revisar manualmente las marcadas `BLOCKED` o `REDIRECT` y registrar resultado en `docs/song-sources.md`.

- [ ] **Step 4: Completar README**

Documentar:

- apertura directa y servidor local opcional `python3 -m http.server 8080`;
- pruebas `npm test` y enlaces `npm run check:links`;
- despliegue estático en GitHub Pages, Netlify, Cloudflare Pages o Vercel sin build;
- funcionamiento de letras locales y riesgo de borrarlas al limpiar datos del navegador;
- exportación/importación del respaldo JSON;
- ausencia intencional de letras precargadas, audio y multipistas;
- requisitos de red para YouTube y enlaces externos;
- comportamiento de canciones pendientes de confirmación.

- [ ] **Step 5: Ejecutar verificación completa**

Run: `npm test`

Expected: todos los tests PASS y cero warnings inesperados.

Run: `npm run check:links`

Expected: cero `FAILED`.

- [ ] **Step 6: QA final en navegador**

Abrir `index.html` directamente y mediante servidor local. En ambos casos recorrer las cuatro fechas, abrir primera/última canción disponible, transponer acordes con bajo, restablecer tono, cambiar alteraciones, agregar/exportar/importar una letra, cargar video, iniciar/detener metrónomo y entrar/salir de pantalla completa. Confirmar consola sin errores.

- [ ] **Step 7: Verificar derechos y contenido distribuido**

Buscar texto sospechoso y confirmar que el repositorio sólo contiene títulos, artistas, secciones, acordes, compases, repeticiones e instrucciones breves:

```bash
rg -n "lyricsText|userLyrics|<p class=\"lyrics" index.html docs tests README.md
```

Expected: ninguna letra precargada; las coincidencias permitidas corresponden únicamente a nombres de variables del almacenamiento local o pruebas con textos ficticios breves.

- [ ] **Step 8: Commit final**

```bash
git add index.html package.json tests scripts docs/song-sources.md README.md
git commit -m "docs: finalize worship setlist delivery"
```

Si no hay repositorio Git, omitir el commit y entregar una lista exacta de archivos creados y comandos ejecutados.

---

## Definition of Done

- Las cuatro pestañas muestran 28 apariciones en el orden y tono asignados.
- Canciones confirmadas abren Stage; canciones ambiguas permanecen visibles y claramente pendientes.
- Transposición, alteraciones, acordes invertidos y restauración pasan tests.
- Anterior/Siguiente nunca cruzan de fecha.
- Letras aportadas se cargan por pegado o `.txt`, se guardan localmente y se respaldan/restauran mediante JSON.
- No existe ninguna letra completa precargada o descargada desde terceros.
- YouTube se carga bajo demanda y se destruye al navegar.
- El metrónomo cubre 40–240 BPM, compases 2/3/4/6, acento, volumen y mute.
- La interfaz funciona a 320, 768 y 1440 px, con teclado y foco visible.
- `npm test` pasa por completo; `npm run check:links` no informa `FAILED`.
- `index.html` abre directamente sin backend, build ni dependencias de runtime.

## Claude Code Execution Prompt

```text
Implementá el plan docs/superpowers/plans/2026-09-04-worship-setlist-implementation.md siguiendo la especificación docs/superpowers/specs/2026-09-04-worship-setlist-design.md.

Usá superpowers:subagent-driven-development o superpowers:executing-plans. Ejecutá cada task en orden, aplicá TDD y detenete en los checkpoints indicados. No copies letras completas ni inventes versiones de canciones: si un título es ambiguo, dejá únicamente esa canción en sourceStatus "pending", presentame las candidatas y continuá con las demás. El producto final debe seguir siendo un index.html estático sin dependencias de runtime.
```
