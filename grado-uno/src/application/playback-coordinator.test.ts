import { describe, expect, it, vi } from 'vitest';
import {
  PlaybackCoordinator,
  barDurationMs,
  type AudioPort,
  type AudioState,
  type IntervalTimer,
} from './playback-coordinator.ts';

/** A controllable timer: `flush()` fires the registered callback once. */
function manualTimer() {
  let cb: (() => void) | null = null;
  let lastMs = 0;
  const timer: IntervalTimer = {
    setInterval: (callback, ms) => {
      cb = callback;
      lastMs = ms;
      return 1;
    },
    clearInterval: () => {
      cb = null;
    },
  };
  return {
    timer,
    tick: () => cb?.(),
    get running() {
      return cb !== null;
    },
    get intervalMs() {
      return lastMs;
    },
  };
}

function fakeAudio(initial: AudioState = 'suspended') {
  const played: number[][] = [];
  let state: AudioState = initial;
  const audio: AudioPort = {
    get state() {
      return state;
    },
    resume: vi.fn(async () => {
      if (state !== 'unavailable') state = 'running';
      return state;
    }),
    playChord: vi.fn((pcs) => void played.push([...pcs])),
    stop: vi.fn(),
  };
  return {
    audio,
    played,
    setState: (s: AudioState) => {
      state = s;
    },
  };
}

const CHORDS = [
  [0, 4, 7],
  [7, 11, 2],
  [9, 0, 4],
  [5, 9, 0],
];

function makeCoordinator(over: Partial<Parameters<PlaybackCoordinator['configure']>[0]> = {}) {
  const clock = manualTimer();
  const audio = fakeAudio();
  const changes: (number | null)[] = [];
  const coord = new PlaybackCoordinator({
    audio: audio.audio,
    timer: clock.timer,
    getChordPitchClasses: (i) => CHORDS[i] ?? null,
    onActiveIndexChange: (i) => void changes.push(i),
  });
  coord.configure({ tempo: 120, length: 4, loop: true, muted: false, ...over });
  return { coord, clock, audio, changes };
}

describe('bar duration', () => {
  it('is four beats at the given tempo', () => {
    expect(barDurationMs(120)).toBe(2000); // 500ms/beat * 4
    expect(barDurationMs(60)).toBe(4000);
  });
});

describe('no audio before explicit play', () => {
  it('does not resume or sound on configure', () => {
    const { audio } = makeCoordinator();
    expect(audio.audio.resume).not.toHaveBeenCalled();
    expect(audio.played).toHaveLength(0);
  });
});

describe('play / advance / loop', () => {
  it('starts at index 0, resumes audio, and sounds the first chord', async () => {
    const { coord, audio, changes } = makeCoordinator();
    const ok = await coord.play();
    expect(ok).toBe(true);
    expect(audio.audio.resume).toHaveBeenCalledOnce();
    expect(coord.activeIndex).toBe(0);
    expect(changes).toEqual([0]);
    expect(audio.played[0]).toEqual(CHORDS[0]);
  });

  it('advances one chord per bar and loops back to 0', async () => {
    const { coord, clock } = makeCoordinator();
    await coord.play();
    clock.tick(); // -> 1
    clock.tick(); // -> 2
    clock.tick(); // -> 3
    expect(coord.activeIndex).toBe(3);
    clock.tick(); // -> loop to 0
    expect(coord.activeIndex).toBe(0);
  });

  it('stops at the end when loop is disabled', async () => {
    const { coord, clock } = makeCoordinator({ loop: false });
    await coord.play();
    clock.tick();
    clock.tick();
    clock.tick(); // at index 3
    clock.tick(); // past end -> stop
    expect(coord.isPlaying).toBe(false);
    expect(coord.activeIndex).toBeNull();
  });

  it('refuses to play a progression shorter than two chords', async () => {
    const { coord } = makeCoordinator({ length: 1 });
    expect(await coord.play()).toBe(false);
    expect(coord.isPlaying).toBe(false);
  });
});

describe('tempo change mid-playback', () => {
  it('restarts the interval at the new bar duration', async () => {
    const { coord, clock } = makeCoordinator();
    await coord.play();
    expect(clock.intervalMs).toBe(2000);
    coord.configure({ tempo: 60 });
    expect(clock.intervalMs).toBe(4000);
    expect(coord.isPlaying).toBe(true);
  });
});

describe('mute keeps visual playback', () => {
  it('advances the index but plays no audio when muted', async () => {
    const { coord, clock, audio } = makeCoordinator({ muted: true });
    await coord.play();
    clock.tick();
    expect(coord.activeIndex).toBe(1); // visual state advances
    expect(audio.played).toHaveLength(0); // but nothing sounds
  });

  it('unmuting resumes audio on the next chord', async () => {
    const { coord, clock, audio } = makeCoordinator({ muted: true });
    await coord.play();
    coord.setMuted(false);
    clock.tick();
    expect(audio.played).toHaveLength(1);
  });
});

describe('pause and resume', () => {
  it('pause stops the timer and audio but keeps the index', async () => {
    const { coord, clock, audio } = makeCoordinator();
    await coord.play();
    clock.tick(); // index 1
    coord.pause();
    expect(coord.isPlaying).toBe(false);
    expect(coord.activeIndex).toBe(1);
    expect(audio.audio.stop).toHaveBeenCalled();
    expect(clock.running).toBe(false);
  });
});

describe('recovery after unavailable audio', () => {
  it('still advances visually when audio is unavailable', async () => {
    const clock = manualTimer();
    const audio = fakeAudio('unavailable');
    const changes: (number | null)[] = [];
    const coord = new PlaybackCoordinator({
      audio: audio.audio,
      timer: clock.timer,
      getChordPitchClasses: (i) => CHORDS[i] ?? null,
      onActiveIndexChange: (i) => void changes.push(i),
    });
    coord.configure({ tempo: 120, length: 4, loop: true, muted: false });
    await coord.play();
    clock.tick();
    expect(coord.activeIndex).toBe(1);
    expect(audio.played).toHaveLength(0);
  });
});
