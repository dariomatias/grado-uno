# Setlist de Worship — Transponible

Web estática para consultar cuatro setlists de worship (28 canciones), con vista
Setlist por fecha y vista Escenario: acordes transponibles, letras aportadas
localmente, video oficial de YouTube bajo demanda y metrónomo.

El producto distribuible es **un único `index.html`** sin backend, sin build y
sin dependencias de runtime. Node sólo se usa para pruebas y verificación.

## Abrir

- Doble clic en `index.html`, o
- servidor local opcional: `python3 -m http.server 8080` y abrir
  `http://localhost:8080/`.

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
