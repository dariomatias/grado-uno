import test from "node:test";
import assert from "node:assert/strict";
import { extractInlineModule, indexHtmlUrl } from "./helpers/extract-inline-module.mjs";
const { setlists } = await extractInlineModule(indexHtmlUrl, "content-module");
const { degreesToSections } = await extractInlineModule(indexHtmlUrl, "transposer-module");
const { songStructure } = await extractInlineModule(indexHtmlUrl, "structure-module");
const dom27 = setlists.find((s) => s.id === "2026-09-27");
const song = (title) => dom27.songs.find((s) => s.title === title);

test("Júbilo: Darío's degree chart (2026-09-21) rendered in the original key D, one chord per bar", () => {
  const s = song("Júbilo");
  assert.equal(s.assignedKey, "D");
  assert.equal(s.sourceKey, "D");
  assert.equal(s.sourceStatus, "confirmed");
  const A = ["1", "2m", "1/3", "4"];
  const verso = [...A, "6m", "3m", "4"];
  const puente = ["6m", "4", "1", "2m"];
  const bars = (d) => d.map((x) => [x]);
  const expected = degreesToSections([
    { type: "verse", label: "Verso 1", repeats: 1, measures: bars(verso) },
    { type: "verse", label: "Verso 2", repeats: 1, measures: bars(verso) },
    { type: "chorus", label: "Coro", repeats: 1, measures: bars([...A, ...A]) },
    { type: "instrumental", label: "Interludio", repeats: 1, measures: bars(A) },
    { type: "bridge", label: "Puente", repeats: 1, measures: bars([...puente, ...puente]) },
    { type: "chorus", label: "Coro", repeats: 1, measures: bars([...A, ...A]) }
  ], "D");
  const chords = (sections) => sections.map(({ cue, ...section }) => section);
  assert.deepEqual(chords(s.sections), chords(expected));
  assert.deepEqual(s.sections[0].measures.flat(), ["D", "Em", "D/F#", "G", "Bm", "F#m", "G"]);
  assert.deepEqual(s.sections[4].measures.flat().slice(0, 4), ["Bm", "G", "D", "Em"]);
  const st = songStructure(s.sections);
  assert.deepEqual(st.blocks.map((b) => b.title), ["Verso 1 · Verso 2", "Coro", "Interludio", "Puente"]);
  assert.equal(st.blocks.find((b) => b.title === "Coro").occurrences.length, 2);
});

// Grados dictados por Darío (2026-09-21) para el resto del Dom 27; cada chart
// debe ser exactamente su conversión al tono original de la grabación.
const DOM27_DEGREES = {
  "glorioso-dia": {
    "key": "D",
    "sections": [
      {
        "type": "intro",
        "label": "Intro",
        "repeats": 1,
        "measures": [
          [
            "4"
          ],
          [
            "5"
          ],
          [
            "6m"
          ]
        ]
      },
      {
        "type": "verse",
        "label": "Verso",
        "repeats": 1,
        "measures": [
          [
            "4"
          ],
          [
            "5"
          ],
          [
            "6m"
          ]
        ]
      },
      {
        "type": "prechorus",
        "label": "Pre-coro",
        "repeats": 1,
        "measures": [
          [
            "4"
          ]
        ]
      },
      {
        "type": "chorus",
        "label": "Coro",
        "repeats": 1,
        "measures": [
          [
            "6m"
          ],
          [
            "4"
          ],
          [
            "5"
          ]
        ]
      },
      {
        "type": "instrumental",
        "label": "Instrumental",
        "repeats": 1,
        "measures": [
          [
            "4"
          ],
          [
            "5"
          ],
          [
            "6m"
          ],
          [
            "1"
          ],
          [
            "4"
          ],
          [
            "5"
          ],
          [
            "6m"
          ],
          [
            "3m"
          ],
          [
            "4"
          ]
        ]
      }
    ]
  },
  "adios-al-ayer": {
    "key": "Ab",
    "sections": [
      {
        "type": "intro",
        "label": "Intro",
        "repeats": 1,
        "measures": [
          [
            "1"
          ],
          [
            "4"
          ]
        ]
      },
      {
        "type": "verse",
        "label": "Verso 1",
        "repeats": 1,
        "measures": [
          [
            "1"
          ],
          [
            "4"
          ],
          [
            "1"
          ],
          [
            "4"
          ]
        ]
      },
      {
        "type": "verse",
        "label": "Verso 2",
        "repeats": 1,
        "measures": [
          [
            "1"
          ],
          [
            "4"
          ],
          [
            "1"
          ],
          [
            "4"
          ]
        ]
      },
      {
        "type": "prechorus",
        "label": "He decidido…",
        "repeats": 1,
        "measures": [
          [
            "1"
          ],
          [
            "2m"
          ],
          [
            "1"
          ],
          [
            "2m"
          ],
          [
            "1"
          ],
          [
            "2m"
          ],
          [
            "6m"
          ],
          [
            "5"
          ],
          [
            "4"
          ]
        ]
      },
      {
        "type": "chorus",
        "label": "Otra vez…",
        "repeats": 1,
        "measures": [
          [
            "4"
          ],
          [
            "5"
          ],
          [
            "6m"
          ],
          [
            "4"
          ],
          [
            "4"
          ],
          [
            "5"
          ],
          [
            "6m"
          ]
        ]
      },
      {
        "type": "bridge",
        "label": "Puente",
        "repeats": 1,
        "measures": [
          [
            "1"
          ],
          [
            "2m"
          ],
          [
            "3m"
          ],
          [
            "5"
          ],
          [
            "1"
          ],
          [
            "2m"
          ],
          [
            "6m"
          ],
          [
            "5"
          ]
        ]
      },
      {
        "type": "chorus",
        "label": "Otra vez…",
        "repeats": 1,
        "measures": [
          [
            "4"
          ],
          [
            "5"
          ],
          [
            "6m"
          ],
          [
            "4"
          ],
          [
            "4"
          ],
          [
            "5"
          ],
          [
            "6m"
          ]
        ]
      }
    ]
  },
  "es-el": {
    "key": "Bb",
    "sections": [
      {
        "type": "intro",
        "label": "Intro",
        "repeats": 1,
        "measures": [
          [
            "4"
          ],
          [
            "5"
          ],
          [
            "6m"
          ],
          [
            "3m"
          ],
          [
            "4"
          ],
          [
            "5"
          ]
        ]
      },
      {
        "type": "verse",
        "label": "Verso 1",
        "repeats": 1,
        "measures": [
          [
            "1"
          ],
          [
            "6m"
          ],
          [
            "4"
          ],
          [
            "1"
          ]
        ]
      },
      {
        "type": "prechorus",
        "label": "Pre-coro",
        "repeats": 1,
        "measures": [
          [
            "4"
          ],
          [
            "6m"
          ],
          [
            "1"
          ],
          [
            "5"
          ],
          [
            "4"
          ],
          [
            "6m"
          ],
          [
            "1"
          ],
          [
            "5"
          ]
        ]
      },
      {
        "type": "chorus",
        "label": "Coro",
        "repeats": 1,
        "measures": [
          [
            "4"
          ],
          [
            "5"
          ],
          [
            "6m"
          ],
          [
            "3m"
          ],
          [
            "4"
          ],
          [
            "5"
          ]
        ]
      },
      {
        "type": "verse",
        "label": "Verso 2",
        "repeats": 1,
        "measures": [
          [
            "1"
          ],
          [
            "6m"
          ],
          [
            "5m"
          ],
          [
            "4m"
          ],
          [
            "4"
          ],
          [
            "1"
          ],
          [
            "6m"
          ],
          [
            "5m"
          ],
          [
            "4m"
          ],
          [
            "4"
          ]
        ]
      },
      {
        "type": "prechorus",
        "label": "Pre-coro",
        "repeats": 1,
        "measures": [
          [
            "4"
          ],
          [
            "6m"
          ],
          [
            "1"
          ],
          [
            "5"
          ],
          [
            "4"
          ],
          [
            "6m"
          ],
          [
            "1"
          ],
          [
            "5"
          ]
        ]
      },
      {
        "type": "chorus",
        "label": "Coro",
        "repeats": 1,
        "measures": [
          [
            "4"
          ],
          [
            "5"
          ],
          [
            "6m"
          ],
          [
            "3m"
          ],
          [
            "4"
          ],
          [
            "5"
          ]
        ]
      },
      {
        "type": "bridge",
        "label": "Puente 1",
        "repeats": 1,
        "measures": [
          [
            "1"
          ],
          [
            "6m"
          ],
          [
            "4"
          ],
          [
            "5"
          ],
          [
            "1"
          ],
          [
            "6m"
          ],
          [
            "4"
          ],
          [
            "5"
          ]
        ]
      },
      {
        "type": "chorus",
        "label": "Coro",
        "repeats": 1,
        "measures": [
          [
            "4"
          ],
          [
            "5"
          ],
          [
            "6m"
          ],
          [
            "3m"
          ],
          [
            "4"
          ],
          [
            "5"
          ]
        ]
      },
      {
        "type": "instrumental",
        "label": "Solo",
        "repeats": 1,
        "measures": [
          [
            "2m"
          ],
          [
            "5"
          ],
          [
            "6m"
          ],
          [
            "5/7"
          ],
          [
            "1"
          ],
          [
            "2m"
          ],
          [
            "5"
          ]
        ]
      },
      {
        "type": "bridge",
        "label": "Puente 2",
        "repeats": 1,
        "measures": [
          [
            "6m"
          ],
          [
            "5/7"
          ],
          [
            "1"
          ],
          [
            "2m"
          ],
          [
            "4"
          ],
          [
            "5"
          ],
          [
            "6m"
          ],
          [
            "5/7"
          ],
          [
            "1"
          ],
          [
            "2m"
          ],
          [
            "4"
          ],
          [
            "5"
          ]
        ]
      },
      {
        "type": "chorus",
        "label": "Coro (final)",
        "repeats": 1,
        "measures": [
          [
            "4"
          ],
          [
            "5"
          ],
          [
            "6m"
          ],
          [
            "3m"
          ],
          [
            "4"
          ],
          [
            "5"
          ]
        ]
      },
      {
        "type": "instrumental",
        "label": "Instrumental",
        "repeats": 1,
        "measures": [
          [
            "4"
          ],
          [
            "5"
          ],
          [
            "6m"
          ],
          [
            "3m"
          ]
        ],
        "cue": "repite varias veces · vale la pena"
      },
      {
        "type": "instrumental",
        "label": "Instrumental (última parte)",
        "repeats": 1,
        "measures": [
          [
            "2m"
          ],
          [
            "5"
          ],
          [
            "6m"
          ],
          [
            "5"
          ]
        ]
      },
      {
        "type": "chorus",
        "label": "Coro",
        "repeats": 1,
        "measures": [
          [
            "4"
          ],
          [
            "5"
          ],
          [
            "6m"
          ],
          [
            "3m"
          ],
          [
            "4"
          ],
          [
            "5"
          ]
        ]
      }
    ]
  },
  "vida-nueva": {
    "key": "B",
    "sections": [
      {
        "type": "chorus",
        "label": "Coro",
        "repeats": 1,
        "measures": [
          [
            "4"
          ],
          [
            "1"
          ],
          [
            "5"
          ],
          [
            "6m"
          ],
          [
            "4"
          ],
          [
            "1"
          ],
          [
            "5"
          ],
          [
            "6m"
          ],
          [
            "4"
          ],
          [
            "1"
          ],
          [
            "5"
          ],
          [
            "6m"
          ],
          [
            "4"
          ],
          [
            "5"
          ],
          [
            "1"
          ]
        ]
      },
      {
        "type": "verse",
        "label": "Verso 1",
        "repeats": 1,
        "measures": [
          [
            "1"
          ],
          [
            "5"
          ],
          [
            "1/3"
          ],
          [
            "4"
          ]
        ]
      },
      {
        "type": "verse",
        "label": "Verso 2",
        "repeats": 1,
        "measures": [
          [
            "1"
          ],
          [
            "5"
          ],
          [
            "1/3"
          ],
          [
            "4"
          ]
        ]
      },
      {
        "type": "chorus",
        "label": "Coro",
        "repeats": 1,
        "measures": [
          [
            "4"
          ],
          [
            "1"
          ],
          [
            "5"
          ],
          [
            "6m"
          ],
          [
            "4"
          ],
          [
            "1"
          ],
          [
            "5"
          ],
          [
            "6m"
          ],
          [
            "4"
          ],
          [
            "1"
          ],
          [
            "5"
          ],
          [
            "6m"
          ],
          [
            "4"
          ],
          [
            "5"
          ],
          [
            "1"
          ]
        ]
      },
      {
        "type": "verse",
        "label": "Verso 3",
        "repeats": 1,
        "measures": [
          [
            "1"
          ],
          [
            "5"
          ],
          [
            "1/3"
          ],
          [
            "4"
          ]
        ]
      },
      {
        "type": "bridge",
        "label": "Puente",
        "repeats": 1,
        "measures": [
          [
            "4"
          ],
          [
            "1"
          ],
          [
            "5"
          ],
          [
            "6m"
          ]
        ],
        "cue": "seguido del verso"
      },
      {
        "type": "bridge",
        "label": "Puente (última vuelta)",
        "repeats": 1,
        "measures": [
          [
            "4"
          ],
          [
            "1"
          ],
          [
            "5"
          ]
        ]
      },
      {
        "type": "chorus",
        "label": "Coro",
        "repeats": 1,
        "measures": [
          [
            "4"
          ],
          [
            "1"
          ],
          [
            "5"
          ],
          [
            "6m"
          ],
          [
            "4"
          ],
          [
            "1"
          ],
          [
            "5"
          ],
          [
            "6m"
          ],
          [
            "4"
          ],
          [
            "1"
          ],
          [
            "5"
          ],
          [
            "6m"
          ],
          [
            "4"
          ],
          [
            "5"
          ],
          [
            "1"
          ]
        ]
      },
      {
        "type": "bridge",
        "label": "Puente 2 · Si el enemigo…",
        "repeats": 3,
        "measures": [
          [
            "1"
          ],
          [
            "1"
          ],
          [
            "1"
          ],
          [
            "1"
          ]
        ]
      },
      {
        "type": "bridge",
        "label": "Puente 2 (b)",
        "repeats": 4,
        "measures": [
          [
            "1"
          ],
          [
            "6m"
          ],
          [
            "4"
          ]
        ]
      },
      {
        "type": "bridge",
        "label": "Puente 2 (cierre)",
        "repeats": 1,
        "measures": [
          [
            "1"
          ],
          [
            "6m"
          ],
          [
            "5"
          ]
        ]
      },
      {
        "type": "chorus",
        "label": "Coro (final)",
        "repeats": 1,
        "measures": [
          [
            "4"
          ],
          [
            "1"
          ],
          [
            "5"
          ],
          [
            "6m"
          ],
          [
            "4"
          ],
          [
            "1"
          ],
          [
            "5"
          ],
          [
            "6m"
          ],
          [
            "4"
          ],
          [
            "1"
          ],
          [
            "5"
          ],
          [
            "6m"
          ],
          [
            "4"
          ],
          [
            "5"
          ],
          [
            "1"
          ]
        ]
      }
    ]
  },
  "de-gracia-en-gracia": {
    "key": "B",
    "sections": [
      {
        "type": "intro",
        "label": "Intro",
        "repeats": 1,
        "measures": [
          [
            "1"
          ],
          [
            "5"
          ],
          [
            "6m"
          ],
          [
            "4"
          ],
          [
            "1"
          ],
          [
            "5"
          ],
          [
            "6m"
          ],
          [
            "4"
          ]
        ]
      },
      {
        "type": "verse",
        "label": "Verso 1",
        "repeats": 1,
        "measures": [
          [
            "1"
          ],
          [
            "5"
          ],
          [
            "6m"
          ],
          [
            "4"
          ],
          [
            "1"
          ],
          [
            "5"
          ],
          [
            "6m"
          ],
          [
            "4"
          ],
          [
            "1"
          ],
          [
            "5"
          ],
          [
            "6m"
          ],
          [
            "4"
          ],
          [
            "1"
          ],
          [
            "5"
          ],
          [
            "6m"
          ]
        ]
      },
      {
        "type": "prechorus",
        "label": "Pre-coro",
        "repeats": 1,
        "measures": [
          [
            "4"
          ],
          [
            "5"
          ],
          [
            "4"
          ],
          [
            "5"
          ],
          [
            "3m"
          ],
          [
            "4"
          ],
          [
            "6m"
          ],
          [
            "5"
          ]
        ]
      },
      {
        "type": "chorus",
        "label": "Coro",
        "repeats": 1,
        "measures": [
          [
            "1"
          ],
          [
            "5"
          ],
          [
            "6m"
          ],
          [
            "4"
          ],
          [
            "1"
          ],
          [
            "5"
          ],
          [
            "6m"
          ],
          [
            "4"
          ],
          [
            "5"
          ],
          [
            "6m"
          ],
          [
            "4"
          ],
          [
            "5"
          ]
        ]
      },
      {
        "type": "interlude",
        "label": "Interludio",
        "repeats": 1,
        "measures": [
          [
            "1"
          ],
          [
            "5"
          ],
          [
            "6m"
          ],
          [
            "4"
          ]
        ]
      },
      {
        "type": "verse",
        "label": "Verso 2",
        "repeats": 1,
        "measures": [
          [
            "1"
          ],
          [
            "5"
          ],
          [
            "6m"
          ],
          [
            "4"
          ],
          [
            "1"
          ],
          [
            "5"
          ],
          [
            "6m"
          ],
          [
            "4"
          ],
          [
            "1"
          ],
          [
            "5"
          ],
          [
            "6m"
          ],
          [
            "4"
          ],
          [
            "1"
          ],
          [
            "5"
          ],
          [
            "6m"
          ]
        ]
      },
      {
        "type": "prechorus",
        "label": "Pre-coro",
        "repeats": 1,
        "measures": [
          [
            "4"
          ],
          [
            "5"
          ],
          [
            "4"
          ],
          [
            "5"
          ],
          [
            "3m"
          ],
          [
            "4"
          ],
          [
            "6m"
          ],
          [
            "5"
          ]
        ]
      },
      {
        "type": "chorus",
        "label": "Coro",
        "repeats": 1,
        "measures": [
          [
            "1"
          ],
          [
            "5"
          ],
          [
            "6m"
          ],
          [
            "4"
          ],
          [
            "1"
          ],
          [
            "5"
          ],
          [
            "6m"
          ],
          [
            "4"
          ],
          [
            "5"
          ],
          [
            "6m"
          ],
          [
            "4"
          ],
          [
            "5"
          ]
        ]
      },
      {
        "type": "bridge",
        "label": "Puente",
        "repeats": 1,
        "measures": [
          [
            "4"
          ],
          [
            "6m"
          ],
          [
            "1"
          ],
          [
            "5"
          ],
          [
            "4"
          ],
          [
            "6m"
          ],
          [
            "1"
          ],
          [
            "5"
          ],
          [
            "4"
          ],
          [
            "5"
          ],
          [
            "6m"
          ],
          [
            "4"
          ],
          [
            "1"
          ],
          [
            "5"
          ]
        ]
      },
      {
        "type": "chorus",
        "label": "Coro",
        "repeats": 1,
        "measures": [
          [
            "1"
          ],
          [
            "5"
          ],
          [
            "6m"
          ],
          [
            "4"
          ],
          [
            "1"
          ],
          [
            "5"
          ],
          [
            "6m"
          ],
          [
            "4"
          ],
          [
            "5"
          ],
          [
            "6m"
          ],
          [
            "4"
          ],
          [
            "5"
          ]
        ]
      },
      {
        "type": "bridge",
        "label": "Puente",
        "repeats": 1,
        "measures": [
          [
            "4"
          ],
          [
            "6m"
          ],
          [
            "1"
          ],
          [
            "5"
          ],
          [
            "4"
          ],
          [
            "6m"
          ],
          [
            "1"
          ],
          [
            "5"
          ],
          [
            "4"
          ],
          [
            "5"
          ],
          [
            "6m"
          ],
          [
            "4"
          ],
          [
            "1"
          ],
          [
            "5"
          ]
        ]
      }
    ]
  }
};

for (const [id, spec] of Object.entries(DOM27_DEGREES)) {
  test(`${id}: chart equals Darío's degrees rendered in ${spec.key}`, () => {
    const s = dom27.songs.find((x) => x.id === id);
    assert.ok(s, id);
    assert.equal(s.assignedKey, spec.key);
    assert.equal(s.sourceKey, spec.key);
    assert.equal(s.sourceStatus, "confirmed");
    const chords = (sections) => sections.map(({ cue, ...section }) => section);
    assert.deepEqual(chords(s.sections), chords(degreesToSections(spec.sections, spec.key)));
  });
}

test("Dom 27 spot checks: spelling per key, slash chords, replaced slot", () => {
  assert.deepEqual(dom27.songs.map((s) => s.title), ["Júbilo", "Glorioso Día (Remix)", "Adiós al ayer", "Clamo a Dios", "Es Él", "Vida nueva", "De gracia en gracia"]);
  assert.deepEqual(song("Glorioso Día (Remix)").sections[3].measures.flat(), ["Bm", "G", "A"]);
  assert.deepEqual(song("Adiós al ayer").sections[3].measures.flat(), ["Ab", "Bbm", "Ab", "Bbm", "Ab", "Bbm", "Fm", "Eb", "Db"]);
  assert.deepEqual(song("Es Él").sections[9].measures.flat(), ["Cm", "F", "Gm", "F/A", "Bb", "Cm", "F"]);
  assert.deepEqual(song("Es Él").sections[4].measures.flat().slice(0, 5), ["Bb", "Gm", "Fm", "Ebm", "Eb"]);
  assert.deepEqual(song("Vida nueva").sections[1].measures.flat(), ["B", "F#", "B/D#", "E"]);
  assert.deepEqual(song("De gracia en gracia").sections[2].measures.flat(), ["E", "F#", "E", "F#", "D#m", "E", "G#m", "F#"]);
  assert.equal(dom27.songs.filter((s) => s.sections.length).length, 6);
  assert.equal(song("Clamo a Dios").sourceStatus, "pending");
});
