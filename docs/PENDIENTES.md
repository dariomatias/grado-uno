# Pendientes

Lista viva de lo que falta. Cuando Darío pregunte "¿qué necesitamos hacer?",
esta es la respuesta. Se actualiza a medida que se resuelven ítems.

**Última actualización:** 2026-09-05
**Sitio publicado:** https://grado-uno-app.web.app (worship en `/`, Grado Uno en `/grado-uno/`)

## Lo que Darío me debe (bloquea contenido)

1. **Revisar musicalmente los 3 charts borrador** del Dom 13 antes de usarlos en
   vivo: Nadie, Quién Más, No Hay Otro Nombre. Fueron capturados de
   worshiptogether y normalizados a G con el motor de transposición, pero un
   músico debe validar progresión y secciones.
2. **Elegir un video por canción** del Dom 13 entre los candidatos listados en
   `docs/song-sources.md`. Con el OK, los fijo (hoy muestran "Video no disponible").
3. **Pasar los acordes de las 4 canciones pendientes del Dom 13** (pegados o `.txt`):
   Jehová, Lavado, El Nombre de Jesús, Canta al Señor. Sus fuentes bloquean el
   fetch automático; no se inventaron acordes. El motor los normaliza al tono.
4. **Contenido de las otras 3 reuniones (21 canciones):** Vie 4, Vie 18, Dom 27.
   Para cada una: artista/versión exacta, acordes por sección, video oficial.
   Hoy todas están `pending` ("Partitura no disponible").

## Backlog técnico (mío, no bloquea publicar)

5. **Iconos PWA reales de Grado Uno** — siguen siendo placeholders de 1×1 px;
   el ícono en la pantalla de inicio del iPhone se ve mal.
6. **Verificación en iPhone real** (Safari + instalado en pantalla de inicio):
   audio, offline, safe-area, y para Grado Uno el checklist §13.4 de su diseño.
7. **Playwright e2e** (diferido a propósito): anchos 320/375/390/430, WebKit,
   recarga offline, teclado, texto ampliado.
8. **Reordenar por arrastre táctil** en el tray de Grado Uno (§9.1); hoy hay
   botones ↑/↓ accesibles.
9. **Toggle notación americana/latina** en Grado Uno: el estado existe pero no
   está expuesto en la UI (muestra ambas, americana primaria).
10. **Tap-target en 320 px** de Grado Uno: las 7 tarjetas de grado quedan ~40 px
    de ancho, algo bajo la guía de 44 px.
11. **`npm run check:links`** cobra sentido cuando haya URLs confirmadas; hoy
    reporta 0 enlaces.

## Decisiones tomadas (no son pendientes)

- El **worship setlist es el producto principal**; **Grado Uno es una feature**
  servida en `/grado-uno/`.
- El proyecto Firebase se llama `grado-uno-app` y **no se renombra** (decisión
  de Darío, 2026-09-05).
- Cuando falta un chart, enlace o video, la UI dice simplemente **"no disponible"**.
- No se inventan acordes ni versiones: si no hay fuente confiable, la canción
  queda `pending`.
