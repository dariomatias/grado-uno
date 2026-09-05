# Grado Uno — Product and Technical Design

**Date:** 2026-09-01  
**Status:** Approved design, pending user review of this written specification  
**Product type:** Mobile-first Progressive Web Application  
**Primary platform:** iPhone in portrait orientation  
**Primary audience:** Beginner-to-intermediate guitarists, especially worship musicians

## 1. Product vision

Grado Uno helps a guitarist move from a song key to practical musical decisions:

> Choose a key, understand its degrees, build a progression, and know which notes are safe to land on while playing guitar.

The product is not intended to be a general-purpose music encyclopedia. Its first release prioritizes immediate usability while the guitarist is holding the instrument.

The two principal success promises are:

- A user can identify the seven degrees of a selected key in under five seconds.
- A user can create a useful progression and reach practical target-note guidance in under fifteen seconds.

## 2. Scope and iteration boundaries

### 2.1 MVP scope

The MVP includes:

- Major keys and natural minor keys.
- The seven diatonic triads in each key.
- American chord notation as the primary notation.
- Latin note names as secondary supporting notation.
- Harmonic-function explanations in plain language.
- Chord tones and target notes for each degree.
- A compact interactive guitar-fretboard view.
- Note-name and interval display modes.
- Progressions containing between two and eight chords.
- Automatic transposition while preserving scale degrees.
- Capo-aware separation between concert chords and played shapes.
- Worship-oriented movement and resolution tips.
- Basic chord playback with play, pause, looping, tempo, and mute.
- Local preferences, current session state, and saved favorite progressions.
- Installable PWA behavior and offline operation after the initial load.
- Light and dark appearance.

### 2.2 Explicit non-goals for the MVP

The MVP does not include:

- User accounts or cloud synchronization.
- Song lyrics.
- Song sections such as verse, chorus, or bridge.
- Song search or ingestion.
- Cifra Club scraping or other unlicensed external extraction.
- Microphone-based pitch detection.
- MIDI.
- Recording or audio export.
- Drums or rhythm-pattern libraries.
- Alternate guitar tunings.
- CAGED lessons.
- Greek modes, harmonic minor, or melodic minor.
- Seventh, suspended, added-tone, or extended chords in the user interface.
- Social, sharing, or collaboration features.

### 2.3 Second-iteration direction

A later song-analysis iteration may accept chords and named sections without full lyrics. It may support manual entry, pasted user-provided chord sheets, and authorized providers. Cifra Club integration requires an official API, license, or partnership and must not depend on scraping its HTML.

## 3. Primary user and context

The primary user:

- Can play common guitar chords.
- Can follow chord symbols such as `G`, `D`, `Em`, and `C`.
- Does not yet think fluently in Roman-numeral degrees, intervals, or chord tones.
- Wants immediate guidance during individual practice, rehearsal, or worship-band preparation.
- Frequently needs to transpose for a vocalist or use a capo.

The MVP is optimized for an iPhone held vertically and operated with one hand. Desktop compatibility is required, but desktop-specific functionality is not.

## 4. Entry points and navigation

The broader product has three intended entry points:

1. Explore a key.
2. Analyze a song.
3. Create a progression and improvise.

The MVP implements the first and third experiences. `Explore a key` is the default landing state. Song analysis remains a second-iteration expansion.

The MVP uses one primary workspace rather than separate tools. It avoids mandatory onboarding and provides a usable initial state immediately.

## 5. Main-screen design

The approved interface direction is **Map view**.

The screen contains, from top to bottom:

1. A compact `Grado Uno` header and preferences entry point.
2. Key and mode selectors.
3. Seven degree cards visible at the same time.
4. A detail area for the selected degree.
5. A compact fretboard window.
6. An explicit `Add to progression` action.
7. A collapsible progression tray, visible after the first degree is added.

### 5.1 Degree-card interaction

Tapping a degree card selects and explains it. Selection does not modify the progression.

The detail area shows:

- Roman-numeral degree.
- American chord symbol.
- Latin chord name.
- Plain-language harmonic function.
- Chord-tone target notes.
- Compact fretboard view.

Adding the selected degree to the progression always requires the explicit `Add to progression` action. This prevents accidental changes during exploration.

### 5.2 Notation

American notation is primary. Latin naming is secondary.

Example:

```text
V
D
Re mayor
Dominant · tension
Safe notes: D · F# · A
```

The MVP exposes twelve practical tonic spellings per mode to avoid double accidentals:

- Major: `C`, `Db`, `D`, `Eb`, `E`, `F`, `F#`, `G`, `Ab`, `A`, `Bb`, `B`.
- Natural minor: `C`, `C#`, `D`, `Eb`, `E`, `F`, `F#`, `G`, `G#`, `A`, `Bb`, `B`.

The selected key spelling controls all generated note and chord spellings. The engine must never mix enharmonic systems inside one key.

## 6. Music-domain model

### 6.1 Scales and diatonic degrees

The MVP supports:

- Major scale interval pattern: `W–W–H–W–W–W–H`.
- Natural minor interval pattern: `W–H–W–W–H–W–W`.

Major-key triad qualities:

```text
I major · ii minor · iii minor · IV major · V major · vi minor · vii diminished
```

Natural-minor triad qualities:

```text
i minor · ii diminished · III major · iv minor · v minor · VI major · VII major
```

The natural-minor fifth degree remains minor in the MVP. A raised leading tone and major dominant belong to the future harmonic-minor expansion.

### 6.2 Chord construction

The user interface exposes only triads:

```text
Major:      1–3–5
Minor:      1–b3–5
Diminished: 1–b3–b5
```

Internally, a chord is represented by an identifier, root pitch spelling, and interval formula. It is not represented by a closed three-value enum. This supports future formulas such as:

```text
sus2:  1–2–5
sus4:  1–4–5
add9:  1–3–5–9
maj7:  1–3–5–7
m7:    1–b3–5–b7
```

Future formulas are outside the MVP user interface but must not require restructuring the key, progression, capo, or fretboard modules.

### 6.3 Harmonic function

Each degree has a concise plain-language label. Technical terminology may appear secondarily, but the primary copy explains behavior:

- Rest or home.
- Preparation.
- Movement away from home.
- Tension that wants to resolve.
- Softer relative rest.

Descriptions must not imply that harmony has only one legal destination. They describe common tendencies rather than hard rules.

### 6.4 Target notes

For a selected chord, its root, third, and fifth are safe landing notes:

- Root: strongest chord identity and stability.
- Third: defines major or minor quality.
- Fifth: stable and comparatively neutral.

When a progression contains a following chord, the engine also calculates:

- Notes shared by the current and next chord.
- The nearest diatonic movement from each current chord tone to a next-chord tone.
- Semitone movements, when present, as high-value resolution options.

Suggestions use language such as `hold`, `move`, or `try resolving`. They are recommendations, not correctness judgments.

## 7. Guitar and worship experience

### 7.1 Fretboard assumptions

The MVP supports six-string guitar in standard tuning only:

```text
E2 · A2 · D3 · G3 · B3 · E4
```

The fretboard engine is independent of the music-theory engine. It receives a tuning, visible fret range, scale pitches, and selected chord pitches, and returns display-ready note positions.

### 7.2 Compact fretboard window

The main view shows a four-to-five-fret window rather than the full neck.

The initial window is selected automatically to provide a comfortable occurrence of the tonic and usable notes on the top strings. The automatic choice prefers a window whose first fret is between zero and seven. The user may move the window one fret lower or higher with explicit controls. The chosen window remains stable when changing chords so that short movements remain visually apparent.

Visual hierarchy:

- All scale notes appear with low emphasis.
- Chord tones appear with high emphasis.
- The chord root receives the strongest emphasis.
- Meaning is conveyed by label and weight as well as color.

The default labels are note names. A `Notes / Intervals` selector changes labels without changing the visible positions.

### 7.3 Worship guidance

The product prioritizes:

- Common worship progressions, including `I–V–vi–IV`, `vi–IV–I–V`, and `IV–I–V–vi`.
- Sustained notes and intentional resolution.
- Shared notes between adjacent chords.
- Short melodic movements.
- Chord tones on the upper strings.
- Rapid transposition for singers.
- Capo-aware chord shapes.

The MVP does not present genre-specific rhythm patterns. `Worship` affects tips and prioritized templates, not audio styling or claims that one musical vocabulary is mandatory.

## 8. Capo model

The application distinguishes:

- Concert key and sounding chords.
- Capo fret.
- Guitar shapes played relative to the capo.
- Scale degrees, which remain attached to the concert key.

Example:

```text
Concert key: B major
Capo:        4
Sounding:    B – F# – G#m – E
Shapes:      G – D  – Em  – C
Degrees:     I – V  – vi  – IV
```

Capo range is `0–12`. Shape calculation transposes sounding chords down by the capo interval and chooses spellings appropriate for familiar guitar shapes. Changing capo never changes the Roman-numeral progression.

## 9. Progression builder

### 9.1 Tray behavior

After the first degree is added, a compact lower tray appears:

```text
Progression
I → V → vi → IV
```

The tray expands into an editor. It shows:

- Degree.
- Sounding chord.
- Played shape when capo is active.
- Active playback position.

Available actions:

- Add the selected degree.
- Reorder by touch drag.
- Duplicate.
- Delete.
- Clear, with confirmation when the progression contains more than one chord.
- Save as a favorite.

A progression may temporarily contain one chord while it is being built. Playback and transition tips require at least two chords. The saved and playable length is two to eight chords.

Changing key or mode preserves the degree sequence and recalculates chords, spellings, target notes, capo shapes, and fretboard positions.

### 9.2 Playback

Playback is basic and intentionally neutral:

- Explicit play/pause control.
- Loop enabled by default.
- One chord per four-beat bar in `4/4`.
- Default tempo: `72 BPM`.
- Supported tempo range: `40–180 BPM`.
- Neutral sustained triad timbre.
- Persistent mute control.
- Visual operation remains complete when muted.

Playback never begins automatically. It starts only after an explicit user action. During playback, the active chord updates the selected degree, detail panel, fretboard highlights, and transition tip.

The audio module uses the Web Audio API behind a narrow internal interface. UI and domain modules do not create audio nodes directly.

## 10. Persistence and offline behavior

### 10.1 Local state

No account is required. The application stores locally:

- Last key and mode.
- Notation preference.
- Capo fret.
- Fretboard window and label mode.
- Tempo.
- Mute state.
- In-progress progression.
- Named favorite progressions.

A favorite stores its degree sequence rather than only rendered chord names. It also stores the selected key, mode, capo, name, and schema version.

### 10.2 Offline

After the first successful load, the application must support its full MVP behavior without network access:

- Music calculations.
- Fretboard.
- Capo.
- Progressions.
- Worship tips.
- Audio playback.
- Favorites.

The PWA manifest provides standalone display metadata and iPhone home-screen assets. A service worker caches the application shell and required local audio assets.

### 10.3 Degradation and recovery

- If persistent storage is unavailable, the application continues for the current session and displays a non-blocking notice.
- If audio initialization fails or the browser suspends audio, visual functionality continues and the user may retry playback.
- A reset-preferences action does not remove favorites.
- Deleting all favorites is a distinct confirmed action.
- Stored data uses schema versions and explicit migrations.

## 11. Technical architecture

The approved architecture is a client-only React and TypeScript PWA built with Vite. The MVP has no application backend.

Modules:

```text
ui
├── key-map
├── degree-detail
├── fretboard-view
├── progression-tray
└── preferences

application
├── session-state
├── playback-coordinator
└── persistence-coordinator

domain
├── music-core
├── capo
├── fretboard
├── progression
└── worship-tips

infrastructure
├── web-audio
├── local-storage
└── pwa
```

Boundary rules:

- Domain modules are pure TypeScript and do not import React, browser storage, DOM, or Web Audio APIs.
- UI components consume typed application services and view models.
- The audio adapter receives scheduled chord events from the playback coordinator.
- Persistence stores versioned serializable state and never stores rendered UI fragments.
- PWA caching is independent of user-state persistence.
- External song providers are absent from the MVP and may later connect through an adapter boundary without entering `music-core`.

Data flow:

```text
User selection
  → application state
  → pure domain calculations
  → typed view model
  → React rendering

Playback tick
  → active progression index
  → selected chord and transition
  → audio adapter + updated view model
```

## 12. Accessibility and mobile usability

Requirements:

- Portrait-first layouts support widths from `320px` upward.
- Interactive targets have an effective size of at least `44 × 44px`.
- Editable fields use at least `16px` text to avoid unwanted iPhone zoom.
- Essential actions do not require hover.
- The interface supports increased text size without clipping.
- Color is never the only carrier of musical meaning.
- Selected degrees expose programmatic selected state.
- Dynamic detail and playback changes use restrained accessible announcements.
- The fretboard has a concise textual equivalent listing selected chord tones and visible fret range.
- Light and dark modes meet WCAG AA contrast for normal text and controls.
- Motion respects reduced-motion preferences.

The main experience remains usable with one thumb. Key and mode controls remain near the top; progression playback and mute remain reachable in the lower tray.

## 13. Testing strategy

### 13.1 Domain tests

Automated tests cover every supported key and mode:

- Scale spelling.
- Degree and chord quality.
- Triad notes.
- Transposition.
- Capo conversion.
- Target notes.
- Shared notes and nearest movement.
- Fretboard positions in standard tuning.

Required invariants:

- Transposing by twelve semitones preserves musical identity.
- Every MVP triad contains three distinct pitch classes.
- A degree progression remains unchanged when its key changes.
- Applying and then removing the same capo interval restores the sounding chords.
- Fret twelve repeats each open-string pitch class.
- Every generated chord tone belongs to its generated chord formula.

### 13.2 Application tests

- Add, duplicate, reorder, and delete progression items.
- Enforce playable and saved length of two to eight chords.
- Preserve degree sequence during key, mode, and capo changes.
- Persist and migrate preferences and favorites.
- Keep reset preferences separate from favorite deletion.
- Coordinate active playback index with visual state.

### 13.3 Audio tests

- Play, pause, loop, tempo, and mute state transitions.
- Scheduling with a controllable test clock.
- Recovery after a suspended or failed audio context.
- No audio begins before explicit user interaction.
- Mute does not stop visual playback state.

### 13.4 UI and end-to-end tests

Automated browser coverage includes:

- `320px`, `375px`, `390px`, and `430px` portrait widths.
- WebKit-compatible browser execution.
- Light and dark appearance.
- Keyboard navigation.
- Accessible labels and selected states.
- Offline reload after initial caching.
- Enlarged text.

Manual release verification includes at least one real iPhone in Safari and as an installed home-screen app. It verifies audio activation, persistence, offline startup, safe-area layout, touch reordering, mute, and home-screen launch.

## 14. Acceptance criteria

The MVP is accepted when a first-time user can:

1. Open the application without creating an account.
2. Select a supported major or natural-minor key.
3. See and identify all seven degrees without navigating away.
4. Tap a degree and view its American symbol, Latin name, function, triad notes, and fretboard targets.
5. Switch the fretboard between notes and intervals.
6. Add between two and eight degrees to a progression.
7. Reorder, duplicate, delete, and clear progression items.
8. Change key while preserving the Roman-numeral progression.
9. Select capo `0–12` and see both sounding chords and played shapes.
10. Play, pause, loop, change tempo, and mute the progression.
11. Watch chord detail and fretboard targets follow playback.
12. Save and reopen a favorite without a network connection.
13. Install and use the application from an iPhone home screen.

The implementation is not complete until automated tests pass and the real-iPhone release verification checklist has evidence.

## 15. Risks and mitigations

### Enharmonic spelling

**Risk:** Correct pitch classes with incorrect written names undermine trust.  
**Mitigation:** Use explicit key spellings and exhaustive golden tests for every supported key.

### iPhone audio lifecycle

**Risk:** Browser audio may remain suspended until user interaction or after interruption.  
**Mitigation:** Start only from explicit play, expose retry state, and preserve visual playback independently.

### Offline updates

**Risk:** A stale service worker may present an older UI against newer stored data.  
**Mitigation:** Version caches and stored schemas independently, with tested migrations.

### Fretboard information density

**Risk:** Displaying scale notes and chord tones together may overwhelm small screens.  
**Mitigation:** Use a small fret window, clear visual hierarchy, and a note/interval toggle.

### Worship scope becoming prescriptive

**Risk:** Genre-specific tips may imply that only a few progressions or techniques are valid.  
**Mitigation:** Present worship templates as shortcuts, keep all diatonic degrees available, and phrase tips as suggestions.

### External song-content licensing

**Risk:** Future song ingestion may violate provider terms or copyright.  
**Mitigation:** Keep it outside the MVP and require user-provided content or an authorized provider contract.

## 16. Research references

- Tonaly: https://tonaly.app/
- Solo fretboard trainer: https://www.solotrainer.app/
- FretBud App Store listing: https://apps.apple.com/us/app/fretbud-chord-scales-auv3/id1234224249
- Oolimo: https://www.oolimo.com/en/
- Cifra Club terms: https://www.cifraclub.com.br/aviso-legal.html
- React and TypeScript: https://react.dev/learn/typescript
- Vite: https://vite.dev/guide/
- PWA installation behavior: https://web.dev/learn/pwa/installation/
- Web Audio API: https://www.w3.org/TR/webaudio/

