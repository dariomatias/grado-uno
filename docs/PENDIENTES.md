# Pendientes

Lista viva de lo que falta. Cuando Darío pregunte "¿qué necesitamos hacer?",
esta es la respuesta. Se actualiza a medida que se resuelven ítems.

**Última actualización:** 2026-09-17
**Sitio publicado:** https://grado-uno-app.web.app (worship en `/`, Grado Uno en `/grado-uno/`)
**Fuente de verdad de versiones:** playlist Spotify "Secuencia A" + links de Darío — 25 de 28 validadas. **Vie 4 y Dom 13 completos; Vie 18 7/7 con chart y video.**

## Lo que Darío me debe (bloquea contenido)

1. **Versión de las 3 que siguen sin confirmar** (Dom 27): Eres libre ·
   Adiós al ayer · Clamo a Dios.
2. **Revisar musicalmente los charts borrador** (extracción web, no PDF): Dom 13
   → Nadie, Quién Más, Canta al Señor; **Vie 18 → las siete cargadas el
   2026-09-17** (Señor eres fiel, En el nombre de Jesús, Clamo a Cristo, Cómo no
   voy a creer, Para siempre Cristo, Agnus Dei, Alabaré al Señor). Cifra Club omite coros repetidos:
   dictá los recorridos como en Jehová/Lavado. *No Hay Otro
   Nombre* ya fue re-transcrita desde Cifra Club (2026-09-10) tras el aviso de
   Darío; **dictar su recorrido** (el chart omite los coros repetidos).
   **Del Vie 4, dos detalles a revisar:** el `D11+` de *Al que está sentado*
   (notación rara del chart, quedó literal sin digitación) y que el chart de
   *Dios de avivamiento* omite los coros repetidos (se cargó tal cual; decime
   dónde vuelve el coro y lo agrego).
3. **Videos que faltan:** *Canta al Señor* (Dom 13), Vie 4 salvo *Digno de
   alabar* (6) y las 7 del Dom 27. Dom 13 y Vie 18 completos. **Dos videos de
   Vie 18 para que confirmes** (cargados tal cual, verificados por título):
   *En el nombre de Jesús* → "In Jesus Name" de **Israel Houghton** (el
   original en inglés, no la versión de Ingrid Rosario); *Agnus Dei* → **Passion
   / Kristian Stanfill (Live 2024)**, mientras que la cifra cargada es la de
   Michael W. Smith (misma canción; el tono de Passion puede diferir).
4. **Acordes** (pegados, `.txt` o **PDF de chart oficial**, como el de *Todo es
   posible*, o **chart en números** como el de *Lavado*) de todo lo que sigue
   `pending`: las 7 del Dom 27. **Vie 4, Dom 13 y Vie 18 completos (21/21 con
   chart).**
   Sólo se cargan acordes; la letra nunca. Con la versión ya confirmada para 17, puedo
   intentar buscar los charts con precisión si preferís.

5. **Indicaciones de arreglo por sección** (dónde entra/toca la acústica, piano
   solo, banda, build…): el campo `cue` ya existe y se muestra como etiqueta
   junto al nombre de la sección. **No se puede deducir de los charts ni de la
   web** (es dato de escuchar la grabación / del arreglo de la banda), así que
   sale de Darío. Formato: `Canción: Sección indicación · Sección indicación`.
   Hoy no hay ninguna cargada.

6. **Lavado, un solo detalle:** el Coro dictado es `A5 | D2 | F# | E` y quedó
   con **F# mayor** tal cual; si es **F#m** (como hace Elevation en esa posición),
   avisá y es un cambio de una letra. Ya confirmado: tono B, B mayor en la
   cuarta vuelta del verso, Puente ×1 de Elevation.
7. **Jehová, un solo detalle:** los cuatro versos quedaron con la progresión
   `D Dsus | D Dsus | Bm G D | A` (la de la primera mitad del chart). Si la que
   usan es `D G | D G | Bm G D | A`, avisá. Ya confirmado: Coro unificado y dos
   puentes (el del final es el de bajo caminante).
8. **Enlaces a Cifra Club que faltan:** 19 de 22 cargados y verificados. Sin
   cifra en Cifra Club: *A Jesús seguiré*, *Creeré*, *Lavado* (si conocés otra
   URL, la verifico). Las 6 sin versión confirmada se enlazan cuando confirmes
   el artista.

## Backlog técnico (mío, no bloquea publicar)

6. **Iconos PWA reales de Grado Uno** — placeholders de 1×1 px.
7. **Verificación en iPhone real** (Safari + instalado): audio, offline,
   safe-area; para Grado Uno el checklist §13.4 de su diseño.
8. **Playwright e2e** (diferido): anchos 320/375/390/430, WebKit, offline,
   teclado, texto ampliado.
9. **Reordenar por arrastre táctil** en el tray de Grado Uno (§9.1); hoy ↑/↓.
10. **Toggle notación americana/latina** en Grado Uno (estado existe, sin UI).
11. **Tap-target en 320 px** de Grado Uno (~40 px de ancho por tarjeta).
12. **`npm run check:links`** cobra sentido cuando haya URLs confirmadas.
13. **Digitaciones:** la tabla trae ~55 voicings de worship (formas abiertas,
    sus/add9, slash habituales, cejillas de B/Bm/Bb/F#m/C#m/G#m). Lo que no
    esté dice "Digitación no disponible": pasame los acordes que veas así y
    los agrego; también si preferís otra digitación para alguno (p. ej. G
    320003 en vez de 320033).
14. **Service worker propio para el worship app (offline):** el diseño pide que
    UI, acordes y transposición funcionen sin conexión; hoy sólo hay caché del
    navegador. Cuando se haga, reemplaza a `hosting/sw.js` (el SW "kamikaze"
    que purga el SW viejo de Grado Uno que quedó registrado en `/`).
15. ~~Capo manual~~ **Hecho (2026-09-08):** selector de capo por canción
    (Automático / Sin capo / Capo 1–11); con capo la partitura muestra las
    formas que se digitan. Queda por decidir si además querés un toggle para
    ver los acordes reales con el capo puesto (hoy están en el popover).

## Decisiones tomadas (no son pendientes)

- El **worship setlist es el producto principal**; **Grado Uno es una feature**
  servida en `/grado-uno/`.
- Proyecto Firebase `grado-uno-app`: **no se renombra** (Darío, 2026-09-05).
- Cuando falta chart, enlace o video la UI dice **"no disponible"**.
- **No se inventan acordes ni versiones**: sin fuente confiable → `pending`.
- **Versiones = playlist Spotify "Secuencia A"**. Donde la grabación tiene
  otro título (p. ej. en inglés), el artista se anota como
  `Artista (Título de la grabación · Live)` para dejar la versión explícita.
  Confirmado por Darío que *Todo es posible* y *Dios de avivamiento* usan las
  grabaciones en inglés de Bethel, *En el nombre de Jesús* es *En Tu Nombre*
  de Ingrid Rosario, y *Digno de alabar* es *Worthy of It All* de CeCe Winans
  (2026-09-06).
- **Indicaciones de arreglo (`cue`)** (2026-09-08): las secciones admiten una
  indicación corta de instrumentación/dinámica que se muestra como etiqueta.
  Sólo con dato de Darío; no se infiere de fuentes (sería inventar).
- **Grilla de compases** (2026-09-08): Darío no lograba ver los compases en los
  recuadros flotantes. Ahora el escenario muestra una **grilla de 4 compases
  por fila, ancho fijo, con barras** como separadores; dentro de cada compás
  los acordes se reparten en tiempos parejos. Botón **"Vista: grilla / lista"**
  en la barra para volver al formato anterior sin redeploy ("probemos, si no
  va, doy marcha atrás"). Salvedad: en charts de hoja de letra cada celda es un
  grupo por frase, no un 4/4 estricto.
- **Pantalla completa con scroll** (2026-09-08): Darío reportó que en fullscreen
  no se podía scrollear. `#stageView` ahora scrollea por sí mismo en ese modo,
  el popover de digitación se mueve adentro (fuera del elemento fullscreen no
  se ve), y si el navegador no tiene Fullscreen API (Safari en iPhone) se usa
  un modo pseudo equivalente (overlay fijo; Escape o el botón para salir).
  Detalle menor pendiente: el aviso `aria-live` del pie queda tapado
  visualmente en fullscreen (los lectores de pantalla sí lo leen).
- **Grado como subíndice** (2026-09-08): cada acorde del escenario lleva su
  grado en la escala del tono **real** en números estilo Nashville (`G₁ D₅ Em₆
  C₄`), con alteración en los prestados (`b7`, `#4`) y `1/3` en los acordes con
  bajo. Es invariante al capo y a la transposición.
- **Capo manual y lectura por formas** (2026-09-08): el capo se elige por
  aparición (o se deja en automático). Con capo, la partitura muestra las
  **formas que se digitan** (en B con capo 4 se lee G, C, D, Em); el popover
  dice "digitás X, suena Y, grado N".
- **El arreglo de la banda manda sobre el chart de la fuente** (2026-09-09):
  cuando Darío dicta cómo tocan una canción, eso reemplaza al chart cargado
  (Lavado: su verso/coro + Puente/Tag de Elevation). Si lo dicta en formas
  con capo, se guardan los acordes reales y el capo queda como dato del arreglo
  (`song.capo`), que el escenario usa por defecto ("Capo N (arreglo de la
  banda)") — sólo en el tono original; al transponer vuelve la sugerencia.
  Lavado pasó de B a **E** por esta vía.
- **Simplificar acordes** (2026-09-17, pedido de Darío): selector en la barra
  del escenario "Acordes: Completos / Básicos / Mínimos". Básicos = tríadas
  (sin bajo ni sus/add/7…, se conservan menores) con repeticiones colapsadas;
  Mínimos = además un acorde por compás (el del tiempo fuerte). Se aplica antes
  de armar la estructura, así los bloques que diferían por acordes de paso se
  unifican. Preferencia de sesión, vale para todas las canciones.
- **Estructura + bloques únicos** (2026-09-09, pedido de Darío): el escenario
  muestra primero la **estructura** ("Contiene: Intro · 2 versos · Coro · …" y
  el recorrido en orden con repeticiones e indicaciones, chips que llevan a su
  bloque) y después **cada secuencia de acordes una sola vez**, titulada con
  todas las secciones que la usan ("Verso 1 · Verso 2", "Coro · aparece 4
  veces"). Misma etiqueta con acordes distintos → "Coro (A)" / "Coro (B)",
  también en el recorrido.
- **Enlaces a Cifra Club** (2026-09-09): cada canción puede llevar `chartUrl`
  con link externo a su cifra ("Cifra Club" en la tarjeta y en el escenario).
  **Corrección** a lo que dije antes: el spec prohíbe *scrapear/integrar* Cifra
  Club, no *enlazar*; un link externo es lo mismo que los de e-chords o
  worshiptogether que el spec ya preveía. Sólo se cargan URLs verificadas
  (HTTP 200 + título de página de cifra, no de letra).
- **`pending` gobierna sólo los acordes.** Artista, video y enlaces se
  confirman por separado y pueden existir sin chart; lo que falta dice
  "no disponible". Lo único prohibido es inventar secciones.
- **Digitaciones orientadas a worship** (2026-09-07): **sólo tap/clic** sobre
  un acorde del escenario muestra cómo tocarlo (Darío: sin hover, para que no
  salte al mover el puntero en escenario), con formas abiertas y voicings del
  género, no clásicas. Para tonalidades no abiertas el escenario **sugiere
  capo automáticamente** (la menor cejilla que lleva a C/D/E/G/A) y el popover
  muestra la forma que se digita con ese capo y qué acorde suena. Si se
  transpone el tema, la sugerencia se recalcula.
