# Pendientes

Lista viva de lo que falta. Cuando Darío pregunte "¿qué necesitamos hacer?",
esta es la respuesta. Se actualiza a medida que se resuelven ítems.

**Última actualización:** 2026-09-06
**Sitio publicado:** https://grado-uno-app.web.app (worship en `/`, Grado Uno en `/grado-uno/`)
**Fuente de verdad de versiones:** playlist Spotify "Secuencia A" — 18 de 28 validadas (17 por la playlist + *Digno de alabar* por video de Darío).

## Lo que Darío me debe (bloquea contenido)

1. **Confirmar la versión de 1 canción** que no cerró con la playlist:
   - *Señor eres fiel* → ¿es *Eres Fiel* de Israel Houghton?
2. **Versión de las 9 que no están en "Secuencia A"** (otra playlist o
   `canción — artista`): Lavado · Nadie · Canta al Señor · El Nombre de Jesús ·
   Para siempre Cristo · Agnus Dei · Eres libre · Adiós al ayer · Clamo a Dios.
3. **Revisar musicalmente los 3 charts borrador** del Dom 13 antes de usarlos en
   vivo: Nadie (además, versión sin validar), Quién Más, No Hay Otro Nombre.
   Capturados de worshiptogether y normalizados a G con el motor de transposición.
4. **Elegir un video por canción** del Dom 13 entre los candidatos de
   `docs/song-sources.md` (hoy muestran "Video no disponible"). *Digno de
   alabar* (Vie 4) ya tiene el suyo fijado.
5. **Acordes** (pegados o `.txt`) de todo lo que sigue `pending`: las 4 del
   Dom 13 sin chart (Jehová, Lavado, El Nombre de Jesús, Canta al Señor) y las
   21 de Vie 4 / Vie 18 / Dom 27. Con la versión ya confirmada para 17, puedo
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
- **`pending` gobierna sólo los acordes.** Artista, video y enlaces se
  confirman por separado y pueden existir sin chart; lo que falta dice
  "no disponible". Lo único prohibido es inventar secciones.
