# Worship Setlist Transponible — Diseño

**Fecha:** 2026-09-04  
**Estado:** Aprobado para implementación  
**Audiencia:** Implementación mediante Claude Code

## 1. Objetivo

Crear una página web estática y desplegable para consultar cuatro setlists de siete canciones de worship cada uno. La página debe ofrecer dos modos integrados: un listado compacto organizado mediante pestañas por fecha y un visor de escenario para leer secciones y acordes, transponerlos, consultar letras aportadas por el usuario, reproducir el video oficial y usar un metrónomo.

El resultado principal debe poder funcionar como un único archivo `index.html`, sin backend. La navegación, los acordes, la transposición, las letras guardadas localmente y el metrónomo funcionan sin conexión; los enlaces externos y YouTube requieren conexión.

## 2. Repertorios iniciales

Las fechas corresponden a septiembre de 2026 y se presentan cronológicamente.

### Viernes 4 — 2026-09-04

| Orden | Canción | Tonalidad asignada |
|---:|---|:---:|
| 1 | Todo es posible | D |
| 2 | A Jesús seguiré | G |
| 3 | Creeré | A |
| 4 | Santo una cosa | A |
| 5 | Al que está sentado | A |
| 6 | Digno de alabar | D |
| 7 | Dios de avivamiento | C |

### Domingo 13 — 2026-09-13

| Orden | Canción | Artista o versión conocida | Tonalidad asignada |
|---:|---|---|:---:|
| 1 | Jehová | Elevation Español | E |
| 2 | Lavado | Elevation Español | B |
| 3 | Nadie | Elevation Worship | G |
| 4 | Quién Más | Gateway Worship Español feat. Waleska Morales | G |
| 5 | Canta al Señor | Versión de Ingrid Rosario | G |
| 6 | No Hay Otro Nombre | Hillsong Worship | G |
| 7 | El Nombre de Jesús | Elevation Español | D |

### Viernes 18 — 2026-09-18

| Orden | Canción | Tonalidad asignada |
|---:|---|:---:|
| 1 | Señor eres fiel | C |
| 2 | En el nombre de Jesús | C |
| 3 | Clamo a Cristo | E |
| 4 | Cómo no voy a creer | E |
| 5 | Para siempre Cristo | E |
| 6 | Agnus Dei | E |
| 7 | Alabaré al Señor | D |

### Domingo 27 — 2026-09-27

| Orden | Canción | Tonalidad asignada |
|---:|---|:---:|
| 1 | Júbilo | C |
| 2 | Eres libre | G |
| 3 | Adiós al ayer | F |
| 4 | Clamo a Dios | D |
| 5 | Es Él | A |
| 6 | Vida nueva | A |
| 7 | De gracia en gracia | Eb |

Cada registro debe contener todas las secciones musicales necesarias para ejecutar la canción: Intro, Verso, Pre-coro, Coro, Instrumental, Puente, Vamp, Tag y Final, utilizando únicamente las que correspondan a esa canción. Para los títulos sin artista indicado, la implementación debe investigar la versión exacta y aplicar el proceso de identificación definido en la sección 8.

## 3. Alcance

### Incluido

- Modo Setlist como pantalla inicial, con cuatro pestañas por fecha.
- Veintiocho apariciones de canciones, siete en cada reunión.
- Conservación del orden independiente de cada reunión.
- Modo Escenario para una canción seleccionada.
- Navegación entre ambos modos sin recargar la página.
- Navegación Anterior/Siguiente respetando el orden del setlist activo y sin saltar automáticamente a otra fecha.
- Transposición por semitonos dentro del visor.
- Selector directo entre las doce tonalidades cromáticas.
- Preferencia entre nombres con bemoles o sostenidos cuando corresponda.
- Restauración del tono asignado originalmente.
- Conservación temporal del tono elegido para cada aparición de una canción durante la sesión.
- Enlaces externos a letra/cifra completa y al video oficial de YouTube.
- Reproducción embebida y bajo demanda del video oficial de YouTube.
- Metrónomo interno con tempo, compás, volumen y silencio configurables.
- Carga opcional de letras aportadas o autorizadas por el usuario mediante pegado o archivo `.txt`.
- Persistencia local de las letras por aparición y respaldo mediante exportación/importación JSON.
- Diseño responsive para celular, tablet y escritorio.
- Modo de pantalla completa para el visor de escenario cuando el navegador lo permita.
- Funcionamiento offline para la interfaz, los acordes y la transposición.

### Excluido

- Letras completas precargadas o distribuidas dentro del HTML.
- Archivos PDF con letras protegidas.
- Login, usuarios, base de datos o backend.
- Edición permanente del repertorio desde la interfaz.
- Sincronización con Cifra Club, Setlist Helper u otras plataformas.
- Archivos de audio, pistas multipista o integración con proveedores de stems.
- Sincronización de letras o preferencias entre dispositivos mediante servidor.

## 4. Experiencia de usuario

### 4.1 Modo Setlist

Debe ser la vista inicial. En la parte superior muestra cuatro pestañas accesibles con estas etiquetas y este orden: `Vie 4`, `Dom 13`, `Vie 18` y `Dom 27`. La pestaña inicial es `Vie 4`. Al cambiar de pestaña se muestran únicamente las siete canciones de esa reunión.

Cada fila o tarjeta presenta:

- número dentro del setlist;
- título;
- artista o versión;
- tonalidad asignada;
- tonalidad de sesión, cuando haya sido transpuesta;
- botón principal `Abrir partitura`;
- acción `Agregar letra` o `Editar letra`, disponible incluso si la fuente musical sigue pendiente;
- enlace `Letra completa`;
- enlace `YouTube`.

Al seleccionar una canción, queda resaltada dentro de su reunión. `Abrir partitura` cambia al Modo Escenario manteniendo la fecha y la canción seleccionadas. Volver al setlist restaura la misma pestaña y el mismo punto de lectura.

### 4.2 Modo Escenario

Debe priorizar legibilidad, alto contraste y controles grandes. Muestra:

- botón `Volver al setlist`;
- posición actual, por ejemplo `3 de 7`;
- título y artista;
- tonalidad asignada y tonalidad actual;
- controles `−½`, `+½` y selector de tonalidad;
- control para elegir bemoles o sostenidos;
- botón `Restablecer tono`;
- secciones musicales en el orden de ejecución;
- acordes distribuidos por compás;
- cantidad de repeticiones cuando corresponda;
- panel opcional de letra con acciones `Agregar letra`, `Editar letra` y `Eliminar letra`;
- importación de letra mediante pegado o archivo `.txt`;
- reproductor de YouTube cargado sólo al solicitarlo;
- metrónomo con BPM, compás, iniciar/detener, volumen y silencio;
- botones `Anterior` y `Siguiente`;
- enlaces `Letra completa` y `YouTube`;
- botón `Pantalla completa`.

Al usar Anterior o Siguiente, el visor carga la canción vecina de la reunión activa y recupera la tonalidad que esa aparición tenga guardada durante la sesión. `Anterior` queda deshabilitado en la primera canción y `Siguiente` queda deshabilitado en la última; nunca se cambia de reunión automáticamente.

## 5. Arquitectura

La solución será una aplicación estática contenida en `index.html`, con HTML semántico, CSS y JavaScript sin dependencias. La información del repertorio vivirá en una constante `setlists` dentro del mismo archivo. Cada setlist contiene sus datos de fecha y un arreglo ordenado de siete canciones.

La interfaz tendrá dos contenedores principales:

- `setlistView`: listado y acciones generales;
- `stageView`: visor de secciones, acordes y controles de tonalidad.

Un estado de sesión en memoria mantendrá:

```js
{
  view: "setlist" | "stage",
  activeSetlistIndex: number,
  selectedSongIndex: number,
  transpositions: Record<string, number>,
  tempoOverrides: Record<string, number>,
  meterOverrides: Record<string, number>,
  accidentalMode: "flat" | "sharp",
  metronomeRunning: boolean
}
```

Las claves de `transpositions`, `tempoOverrides` y `meterOverrides` usan el formato `${setlistId}:${songId}`. Así, dos apariciones de una misma canción pueden mantener configuraciones distintas durante la sesión.

Las tonalidades y ajustes del metrónomo permanecen en memoria y vuelven a sus valores iniciales al recargar. Sólo las letras agregadas por el usuario persisten en `localStorage`, bajo la clave versionada `worship-setlist:lyrics:v1`. La exportación genera un archivo JSON con versión de esquema y la importación combina registros válidos, solicitando confirmación antes de sobrescribir una letra existente.

## 6. Modelo de datos

Cada reunión y cada canción deben respetar esta forma lógica:

```js
{
  id: "2026-09-13",
  label: "Domingo 13",
  shortLabel: "Dom 13",
  date: "2026-09-13",
  songs: [
    {
      id: "jehova",
      title: "Jehová",
      artist: "Elevation Español",
      assignedKey: "E",
      sourceKey: "C#",
      sourceStatus: "confirmed",
      lyricsUrl: "https://www.e-chords.com/es/acordes/elevation-worship/jehovah-feat-chris-brown",
      youtubeUrl: "https://www.youtube.com/watch?v=CBbSkDUrZds",
      youtubeVideoId: "CBbSkDUrZds",
      tempoBpm: null,
      beatsPerMeasure: 4,
      sections: [
        {
          type: "intro",
          label: "Intro",
          repeats: 4,
          measures: [["E"], ["Esus4"]]
        }
      ]
    }
  ]
}
```

`sourceKey` representa el tono de la fuente usada para capturar la progresión. Antes de publicar, todos los acordes almacenados deben quedar normalizados a `assignedKey`, de modo que el desplazamiento inicial de cada canción sea cero.

`sourceStatus` admite `confirmed` o `pending`. Una canción `pending` conserva su lugar en el listado, pero no incluye acordes inventados ni permite abrir el visor hasta que Darío confirme la versión.

`measures` es una matriz: cada elemento representa un compás y puede contener uno o más acordes. Esto permite representar cambios dentro del mismo compás sin mezclar presentación y datos.

## 7. Transposición

La lógica debe:

1. reconocer raíces entre A y G con alteración opcional;
2. transponer de forma independiente el acorde principal y el bajo de acordes invertidos;
3. conservar intactos los sufijos armónicos;
4. soportar, como mínimo, mayores, menores, séptimas, `maj7`, `m7`, `sus2`, `sus4`, `add9`, disminuidos, aumentados y acordes con bajo;
5. envolver correctamente desplazamientos mayores o menores a una octava;
6. mostrar equivalentes con bemoles o sostenidos según la preferencia activa;
7. mantener un desplazamiento entero entre −11 y +11 semitonos por aparición;
8. restaurar exactamente los acordes del tono asignado al utilizar `Restablecer tono`.

Ejemplos obligatorios:

| Entrada | Desplazamiento | Salida esperada |
|---|---:|---|
| G | +2 | A |
| Em7 | +2 | F#m7 |
| D/F# | +2 | E/G# |
| Cadd9 | −1 | Badd9 |
| Bbsus4 | +2 | Csus4 |
| Db/F | +1 | D/F# |

## 8. Identificación y fuentes externas

### 8.1 Proceso de identificación

Antes de cargar acordes, secciones o enlaces de una canción cuyo artista no esté confirmado, la implementación debe:

1. buscar el título exacto junto con términos como `acordes`, `worship` y la tonalidad asignada;
2. priorizar publicaciones oficiales del artista o ministerio y fuentes de acordes reconocidas;
3. comparar el comienzo, la estructura y el coro de las versiones candidatas sin copiar letras dentro de la aplicación;
4. verificar que la progresión encontrada pueda transponerse coherentemente a la tonalidad asignada;
5. registrar el artista o ministerio, la URL de letra/cifra, la URL de YouTube y la tonalidad de la fuente;
6. si permanecen dos o más versiones plausibles, detener únicamente la carga de esa canción, presentar las candidatas a Darío y mostrar `Partitura no disponible` hasta recibir confirmación.

No se debe elegir una versión sólo porque comparte el título. Las demás canciones confirmadas deben poder implementarse y probarse sin quedar bloqueadas por una identificación pendiente.

### 8.2 Fuentes ya identificadas para Domingo 13

Los enlaces de letra completa deben abrir en una pestaña nueva y utilizar estas fuentes iniciales:

| Canción | Fuente de letra/cifra |
|---|---|
| Jehová | https://www.e-chords.com/es/acordes/elevation-worship/jehovah-feat-chris-brown |
| Lavado | https://www.e-chords.com/es/acordes/elevation-espanol/lavado |
| Nadie | https://www.worshiptogether.com/es/canciones/nadie-elevation-worship/ |
| Quién Más | https://www.worshiptogether.com/es/canciones/quien-mas-gateway-worship-espanol/ |
| Canta al Señor | https://acordesweb.com/cancion/ingrid-rosario/canta-al-senor |
| No Hay Otro Nombre | https://www.worshiptogether.com/es/canciones/no-hay-otro-nombre-hillsong-worship/ |
| El Nombre de Jesús | https://www.e-chords.com/es/acordes/elevation-worship/el-nombre-de-jesus |

### 8.3 Criterios para los enlaces

Para YouTube se debe elegir un video oficial del artista o ministerio. La implementación debe validar que el título y el canal correspondan a la canción antes de guardar cada URL. Si no existe una publicación oficial, debe utilizarse el video público de mejor calidad del canal del ministerio que interpreta la versión seleccionada.

Todos los enlaces externos deben usar `target="_blank"` y `rel="noopener noreferrer"`.

## 9. Contenido, letras aportadas y derechos

El HTML distribuido no debe copiar, extraer ni publicar letras completas. El contenido inicial del visor contiene sólo:

- nombres de secciones;
- progresiones armónicas;
- compases;
- repeticiones;
- indicaciones instrumentales breves que no reproduzcan versos.

`Letra completa` dirige a una fuente externa mientras no exista una letra local. El usuario puede agregar una letra que haya aportado o para la que tenga autorización; la aplicación debe renderizarla como texto, nunca como HTML, y no debe incluirla automáticamente al compartir el archivo `index.html`.

La carga admite pegado directo y archivos `.txt` UTF-8 de hasta 200 KiB. El respaldo JSON usa esta forma:

```js
{
  schemaVersion: 1,
  exportedAt: "2026-09-04T15:00:00.000Z",
  lyrics: {
    "2026-09-13:jehova": {
      text: "Texto aportado por el usuario",
      updatedAt: "2026-09-04T15:00:00.000Z"
    }
  }
}
```

La importación debe rechazar esquemas desconocidos, claves que no correspondan al repertorio y valores que no sean texto. No se deben descargar, redistribuir ni convertir letras ajenas a PDF.

### 9.1 YouTube embebido

El video se carga sólo cuando el usuario presiona `Cargar video`, usando `https://www.youtube-nocookie.com/embed/{youtubeVideoId}`. El iframe debe tener título accesible, `loading="lazy"`, permisos mínimos necesarios y una alternativa para abrir el video en YouTube. Al cambiar de canción se elimina el iframe anterior para detener la reproducción.

### 9.2 Metrónomo

El metrónomo se implementa con Web Audio API y no depende de muestras ni archivos externos. Debe aceptar entre 40 y 240 BPM, compases de 2, 3, 4 o 6 pulsos, acentuar el primer pulso, permitir iniciar/detener, ajustar volumen y silenciar. Si una canción no tiene tempo confirmado, el control comienza en 120 BPM con la etiqueta `Tempo sin configurar` hasta que el usuario lo modifique.

El metrónomo se detiene al cambiar de canción, volver al setlist o perder la disponibilidad del contexto de audio. Si Web Audio API no está disponible, se muestra `Metrónomo no disponible` sin afectar el resto del visor.

## 10. Diseño visual

- Estética oscura, sobria y musical.
- Alto contraste para escenarios con poca iluminación.
- Acento dorado cálido para tonalidades, selección y acciones principales.
- Las pestañas de fecha deben mostrar con texto y estilo visual cuál está activa, además de usar los atributos ARIA correspondientes.
- Tamaño de texto mínimo de 16 px para contenido principal.
- Controles interactivos de al menos 44 × 44 px en pantallas táctiles.
- Sin hero, presentación comercial ni contenido decorativo antes del setlist.
- En escritorio, el listado puede aprovechar dos columnas si mejora la lectura.
- En celular, todo se presenta en una sola columna sin desplazamiento horizontal.
- En Modo Escenario, los acordes tienen mayor jerarquía que metadatos y enlaces.
- Debe respetarse `prefers-reduced-motion`.

## 11. Accesibilidad

- Usar `header`, `main`, `nav`, `section`, `ol`, `li`, `button` y `a` de forma semántica.
- Toda acción debe poder usarse con teclado.
- Mantener indicadores de foco visibles.
- Los cambios de tonalidad deben anunciarse mediante una región `aria-live="polite"`.
- Los controles de transposición deben tener nombres accesibles explícitos.
- La vista oculta debe usar el atributo `hidden`, no quedar navegable fuera de pantalla.
- No depender sólo del color para mostrar canción seleccionada o tonalidad modificada.

## 12. Manejo de errores

- Si una canción carece de URL externa, el botón correspondiente queda deshabilitado y muestra `Enlace no disponible`.
- Si YouTube no puede cargarse, se conserva el enlace externo y se muestra un aviso no bloqueante.
- Si `localStorage` no está disponible, las letras pueden visualizarse durante la sesión y exportarse, pero se informa que no quedarán guardadas al cerrar la página.
- Si un archivo de letra supera 200 KiB, no es UTF-8 legible o está vacío, se rechaza con un mensaje específico.
- Si el navegador no ofrece Web Audio API, el metrónomo queda deshabilitado y el resto de la partitura sigue funcionando.
- Si la API de pantalla completa no existe o rechaza la solicitud, el resto del visor continúa funcionando y se muestra un aviso no bloqueante.
- Datos inválidos de una canción no deben romper todo el setlist: la tarjeta debe mostrarse con su título y un mensaje `Partitura no disponible`.
- La función de transposición debe rechazar acordes cuyo formato no reconoce y conservar el texto original en lugar de eliminarlo o alterarlo parcialmente.

## 13. Verificación

La implementación se considera terminada cuando:

1. las cuatro pestañas muestran las veintiocho apariciones en la fecha, el orden y la tonalidad definidos;
2. cada canción identificada abre su partitura en Modo Escenario y toda canción pendiente muestra `Partitura no disponible` sin afectar a las demás;
3. volver al setlist conserva la fecha activa, la canción seleccionada, el punto de lectura y el desplazamiento de tono;
4. Anterior y Siguiente permanecen dentro de la reunión activa, se deshabilitan en sus extremos y nunca saltan a otra fecha;
5. las doce tonalidades pueden seleccionarse;
6. los ejemplos de transposición de la sección 7 pasan pruebas automáticas;
7. los acordes con bajo y sufijos conservan su estructura;
8. cada aparición conserva y restaura su tono de forma independiente, incluso si una canción se repite en otra reunión;
9. los cincuenta y seis enlaces previstos —veintiocho de letra/cifra y veintiocho de YouTube— responden y coinciden con la versión confirmada, salvo los marcados explícitamente como pendientes de confirmación;
10. no existe ninguna letra completa precargada dentro del código fuente;
11. la página funciona al abrir `index.html` directamente;
12. no hay errores en la consola durante el flujo principal;
13. la interfaz es utilizable a 320, 768 y 1440 px de ancho;
14. teclado, foco visible y anuncios de tonalidad funcionan correctamente.
15. una letra puede pegarse o importarse desde `.txt`, se renderiza como texto y persiste tras recargar;
16. el respaldo JSON exporta las letras locales y una importación válida puede restaurarlas sin aceptar claves o esquemas inválidos;
17. el iframe de YouTube sólo se crea bajo demanda, usa el video confirmado y se destruye al cambiar de canción;
18. el metrónomo respeta el rango de 40–240 BPM, los compases 2, 3, 4 y 6, el acento inicial, el volumen y el silencio;
19. abandonar el Modo Escenario o cambiar de canción detiene el metrónomo.

## 14. Entregables

- `index.html`: aplicación completa y desplegable.
- `package.json`: comandos de prueba y verificación, sin dependencias de runtime.
- `tests/smoke.test.mjs`: validación estructural básica del HTML.
- `tests/transposer.test.mjs`: pruebas unitarias que leen y ejecutan la lógica marcada como `transposer-module` directamente desde `index.html`, para probar exactamente el código distribuido sin duplicarlo.
- `tests/content.test.mjs`: validación de cuatro reuniones, veintiocho apariciones, fechas, órdenes, tonalidades, secciones y ausencia de letras completas.
- `tests/navigation.test.mjs`: límites de navegación y aislamiento de estado por aparición.
- `tests/lyrics-store.test.mjs`: pruebas de validación, persistencia, combinación y respaldo de letras aportadas.
- `tests/youtube.test.mjs`: validación de IDs y URLs de reproducción embebida.
- `tests/metronome.test.mjs`: pruebas de límites de BPM, compases y avance de pulsos para la lógica pura del metrónomo.
- `scripts/check-links.mjs`: comprobación manual o automatizada de URLs externas.
- `docs/song-sources.md`: registro verificable de versiones y fuentes seleccionadas.
- `README.md`: instrucciones breves para abrir, probar y desplegar el HTML.

El producto distribuible para el usuario seguirá siendo `index.html`; los demás archivos son soporte de desarrollo y verificación.
