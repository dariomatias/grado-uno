# Pendientes

Lista viva de lo que falta. Cuando Darío pregunte "¿qué necesitamos hacer?",
esta es la respuesta. Se actualiza a medida que se resuelven ítems.

**Última actualización:** 2026-09-06
**Sitio publicado:** https://grado-uno-app.web.app (worship en `/`, Grado Uno en `/grado-uno/`)
**Fuente de verdad de versiones:** playlist Spotify "Secuencia A" — 22 de 28 validadas (17 por la playlist + 4 por videos oficiales que pasó Darío: Digno de alabar, Lavado, Nadie, El Nombre de Jesús; + Canta al Señor por el chart de Ingrid Rosario que indicó). **Dom 13: las 7 con chart.**

## Lo que Darío me debe (bloquea contenido)

1. **Confirmar la versión de 1 canción** que no cerró con la playlist:
   - *Señor eres fiel* → ¿es *Eres Fiel* de Israel Houghton?
2. **Versión de las 5 que siguen sin confirmar** (link de YouTube, otra playlist
   o `canción — artista`): Para siempre Cristo · Agnus Dei · Eres libre ·
   Adiós al ayer · Clamo a Dios.
3. **Revisar musicalmente los 4 charts borrador** del Dom 13 antes de usarlos en
   vivo: Nadie, Quién Más, No Hay Otro Nombre (worshiptogether) y Canta al
   Señor (Cifra Club vía web, A→G). Vinieron por extracción web, no por PDF
   renderizado, así que conviene un vistazo; están normalizados a G con el
   motor de transposición.
4. **Videos que faltan:** *Canta al Señor* y las 21 canciones de Vie 4 /
   Vie 18 / Dom 27 salvo *Digno de alabar*. Los 6 del Dom 13 con link ya están
   fijados (el de *Quién Más* es un cover elegido a sabiendas por Darío).
5. **Acordes** (pegados, `.txt` o **PDF de chart oficial**, como el de *Todo es
   posible*, o **chart en números** como el de *Lavado*) de todo lo que sigue
   `pending`: las 18 de Vie 4 / Vie 18 / Dom 27 sin chart. El Dom 13 ya está
   completo; de las otras fechas tienen chart Todo es posible, A Jesús seguiré
   y Creeré.
   Sólo se cargan acordes; la letra nunca. Con la versión ya confirmada para 17, puedo
   intentar buscar los charts con precisión si preferís.

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
- **Grado como subíndice** (2026-09-08): cada acorde del escenario lleva su
  grado en la escala del tono **real** en números estilo Nashville (`G₁ D₅ Em₆
  C₄`), con alteración en los prestados (`b7`, `#4`) y `1/3` en los acordes con
  bajo. Es invariante al capo y a la transposición.
- **Capo manual y lectura por formas** (2026-09-08): el capo se elige por
  aparición (o se deja en automático). Con capo, la partitura muestra las
  **formas que se digitan** (en B con capo 4 se lee G, C, D, Em); el popover
  dice "digitás X, suena Y, grado N".
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
