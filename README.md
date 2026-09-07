# Setlist de Worship — Transponible

Web estática para consultar cuatro setlists de worship (28 canciones), con vista
Setlist por fecha y vista Escenario: acordes transponibles, letras aportadas
localmente, video oficial de YouTube bajo demanda y metrónomo.

El producto distribuible es **un único `index.html`** sin backend, sin build y
sin dependencias de runtime. Node sólo se usa para pruebas y verificación.

## Correr localmente

**Worship setlist (principal, estático, sin build):**

```bash
python3 -m http.server 8080      # → http://localhost:8080/
```

También abre con doble clic en `index.html`, pero sobre `http://` YouTube y
`localStorage` se comportan mejor que sobre `file://`.

**Grado Uno (React + Vite, con recarga en caliente):**

```bash
cd grado-uno && npm run dev      # → http://localhost:5173/grado-uno/
```

Ojo con la ruta **`/grado-uno/`**: Vite tiene `base: '/grado-uno/'` porque la
app se sirve como sub-app, así que el dev server la expone ahí y no en `/`.

**Ambas juntas, igual que producción** (worship en `/`, Grado Uno en
`/grado-uno/`, con los headers reales de Firebase):

```bash
npm run build:hosting && npx firebase serve --only hosting
# → http://localhost:5000/  y  http://localhost:5000/grado-uno/
```

## Pruebas

```bash
npm test            # lógica pura (contenido, transposición, navegación, letras, YouTube, metrónomo)
npm run check:links # verifica las URLs externas confirmadas
```

Las pruebas leen los módulos marcados dentro del `<script type="module">` de
`index.html` (ver marcadores `/* *-module:start|end */`) y ejecutan exactamente
el código distribuido, sin duplicarlo.

## Estado del contenido

Todas las canciones están en `sourceStatus: "pending"`: tienen título, fecha,
orden y tonalidad asignada correctos, pero **no** traen acordes, letras, BPM ni
enlaces todavía. La identificación de versiones y la captura de acordes/fuentes
(Task 3 del plan) es una fase separada, con revisión manual, para no inventar
versiones ni copiar letras.

## Digitaciones (worship)

En el Modo Escenario, **tocar o hacer clic** sobre un acorde (no al pasar el
mouse) muestra cómo tocarlo en guitarra con **formas de worship** (G 320033, Cadd9, Em7 022033,
Bm7 sin cejilla, D/F#, F compacta…), no digitaciones clásicas. Para tonalidades
no abiertas se sugiere **capo** automáticamente y el diagrama muestra la forma
que se digita con ese capo. Lo que no tiene digitación dice "no disponible".

Los compases se muestran en una **grilla de 4 por fila** (ancho fijo, barras
como separadores; los acordes de un compás se reparten en tiempos parejos), con
un botón *Vista: grilla / lista* para volver a los recuadros.

Cada acorde lleva como **subíndice su grado** en la escala del tono real
(`G₁ D₅ Em₆ C₄`; prestados con alteración, `b7`; acordes con bajo, `1/3`). El
**capo se puede fijar a mano** por canción; con capo puesto la partitura muestra
las **formas que se digitan** y el grado no cambia.

## Letras locales

- Se agregan por pegado o archivo `.txt` (UTF-8, máx. 200 KiB) y se renderizan
  como **texto**, nunca como HTML.
- Persisten en `localStorage` bajo `worship-setlist:lyrics:v1`.
- Se pueden exportar/importar como JSON (`schemaVersion: 1`). La importación
  rechaza esquemas o claves inválidas y pide confirmación antes de sobrescribir.
- Si limpiás los datos del navegador, se borran. No se distribuyen dentro del
  `index.html`.

## Despliegue

Sitio estático: sirve `index.html` tal cual (GitHub Pages, Netlify, Cloudflare
Pages, Vercel o Firebase Hosting), sin paso de build.

## Grado Uno (feature)

La herramienta **Grado Uno** (explorador de tonalidades/grados y progresiones)
vive como sub-app en [`./grado-uno/`](./grado-uno/). Es una PWA React + Vite con
su propio `package.json`, build y pruebas (`cd grado-uno && npm run dev`).

## Limitaciones (intencionales)

- Sin login, backend ni sincronización entre dispositivos.
- Sin letras precargadas, audio, multipistas ni scraping.
- YouTube y los enlaces externos requieren conexión; el resto funciona offline.
