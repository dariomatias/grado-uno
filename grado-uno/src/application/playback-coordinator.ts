/**
 * Playback coordinator (design §9.2, §11).
 *
 * Advances an active-chord index one chord per 4-beat bar in 4/4, looping by
 * default. It drives a narrow audio *port* and reports the active index to the
 * UI. It never starts on its own — `play()` must be called from an explicit
 * user gesture (which also resumes the audio context). Muting silences audio
 * but visual playback (index changes) continues.
 *
 * Both the timer and the audio port are injected so the coordinator is fully
 * testable with a controllable clock (§13.3).
 */

export type AudioState = 'suspended' | 'running' | 'unavailable';

/** Narrow audio boundary. UI/domain never create audio nodes directly (§9.2). */
export interface AudioPort {
  readonly state: AudioState;
  /** Resume/unlock the context from a user gesture. Resolves to running state. */
  resume(): Promise<AudioState>;
  /** Play a sustained triad for `durationSec`. */
  playChord(pitchClasses: readonly number[], durationSec: number): void;
  /** Immediately silence any sounding audio. */
  stop(): void;
}

export interface IntervalTimer {
  setInterval(callback: () => void, ms: number): number;
  clearInterval(handle: number): void;
}

/** Real timer backed by the host environment. */
export const realTimer: IntervalTimer = {
  setInterval: (cb, ms) => globalThis.setInterval(cb, ms) as unknown as number,
  clearInterval: (h) => globalThis.clearInterval(h),
};

export interface PlaybackConfig {
  tempo: number;
  length: number;
  loop: boolean;
  muted: boolean;
}

export interface PlaybackDeps {
  readonly audio: AudioPort;
  readonly timer: IntervalTimer;
  /** Pitch classes for a chord index, or null if unavailable. */
  readonly getChordPitchClasses: (index: number) => readonly number[] | null;
  readonly onActiveIndexChange: (index: number | null) => void;
}

/** Bar duration in ms for a tempo, one chord per 4-beat bar in 4/4. */
export function barDurationMs(tempo: number): number {
  return (60 / tempo) * 4 * 1000;
}

export class PlaybackCoordinator {
  private config: PlaybackConfig = { tempo: 72, length: 0, loop: true, muted: false };
  private handle: number | null = null;
  private index: number | null = null;
  private playing = false;

  constructor(private readonly deps: PlaybackDeps) {}

  get isPlaying(): boolean {
    return this.playing;
  }
  get activeIndex(): number | null {
    return this.index;
  }
  get audioState(): AudioState {
    return this.deps.audio.state;
  }

  configure(config: Partial<PlaybackConfig>): void {
    const prev = this.config;
    this.config = { ...prev, ...config };
    // If tempo changed mid-playback, restart the interval at the new rate.
    if (this.playing && config.tempo !== undefined && config.tempo !== prev.tempo) {
      this.restartInterval();
    }
    // If the progression shrank below the active index, wrap or stop.
    if (this.playing && this.index !== null && this.index >= this.config.length) {
      if (this.config.length < 2) {
        this.stop();
      } else {
        this.setIndex(0);
      }
    }
  }

  /** Start playback from an explicit user gesture. Returns whether it started. */
  async play(): Promise<boolean> {
    if (this.playing) return true;
    if (this.config.length < 2) return false;
    await this.deps.audio.resume();
    this.playing = true;
    this.setIndex(0);
    this.restartInterval();
    return true;
  }

  pause(): void {
    if (!this.playing) return;
    this.playing = false;
    this.clearTimer();
    this.deps.audio.stop();
  }

  stop(): void {
    this.playing = false;
    this.clearTimer();
    this.deps.audio.stop();
    this.index = null;
    this.deps.onActiveIndexChange(null);
  }

  setMuted(muted: boolean): void {
    this.config = { ...this.config, muted };
    if (muted) this.deps.audio.stop();
  }

  private advance(): void {
    if (this.index === null) return;
    const next = this.index + 1;
    if (next >= this.config.length) {
      if (this.config.loop) {
        this.setIndex(0);
      } else {
        this.stop();
      }
    } else {
      this.setIndex(next);
    }
  }

  private setIndex(index: number): void {
    this.index = index;
    this.deps.onActiveIndexChange(index);
    this.sound(index);
  }

  private sound(index: number): void {
    if (this.config.muted) return;
    if (this.deps.audio.state !== 'running') return;
    const pcs = this.deps.getChordPitchClasses(index);
    if (pcs && pcs.length > 0) {
      this.deps.audio.playChord(pcs, barDurationMs(this.config.tempo) / 1000);
    }
  }

  private restartInterval(): void {
    this.clearTimer();
    this.handle = this.deps.timer.setInterval(
      () => this.advance(),
      barDurationMs(this.config.tempo),
    );
  }

  private clearTimer(): void {
    if (this.handle !== null) {
      this.deps.timer.clearInterval(this.handle);
      this.handle = null;
    }
  }
}
