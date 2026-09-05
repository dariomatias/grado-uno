/**
 * Web Audio adapter (design §9.2, §11).
 *
 * The only place that touches the Web Audio API. Implements the application's
 * {@link AudioPort}. A neutral sustained triad is synthesised from three
 * oscillators through a shared gain envelope. The context is created lazily and
 * only resumed from an explicit user gesture; if construction fails the adapter
 * reports `unavailable` and the app continues visually.
 */

import type { AudioPort, AudioState } from '../../application/playback-coordinator.ts';

/** MIDI note for a pitch class placed in a comfortable middle octave (C4 = 60). */
function pitchClassToFrequency(pitchClass: number): number {
  const midi = 60 + ((pitchClass % 12) + 12) % 12;
  return 440 * Math.pow(2, (midi - 69) / 12);
}

type WindowWithWebkit = typeof globalThis & {
  webkitAudioContext?: typeof AudioContext;
};

export class WebAudioAdapter implements AudioPort {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private voices: OscillatorNode[] = [];
  private unavailable = false;

  get state(): AudioState {
    if (this.unavailable) return 'unavailable';
    if (!this.ctx) return 'suspended';
    return this.ctx.state === 'running' ? 'running' : 'suspended';
  }

  private ensureContext(): AudioContext | null {
    if (this.unavailable) return null;
    if (this.ctx) return this.ctx;
    try {
      const Ctor =
        window.AudioContext ?? (window as WindowWithWebkit).webkitAudioContext;
      if (!Ctor) {
        this.unavailable = true;
        return null;
      }
      this.ctx = new Ctor();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0;
      this.master.connect(this.ctx.destination);
      return this.ctx;
    } catch {
      this.unavailable = true;
      return null;
    }
  }

  async resume(): Promise<AudioState> {
    const ctx = this.ensureContext();
    if (!ctx) return 'unavailable';
    try {
      await ctx.resume();
    } catch {
      /* stay suspended; caller may retry */
    }
    return this.state;
  }

  playChord(pitchClasses: readonly number[], durationSec: number): void {
    const ctx = this.ctx;
    const master = this.master;
    if (!ctx || !master || ctx.state !== 'running') return;

    this.stop();

    const now = ctx.currentTime;
    const attack = 0.02;
    const release = Math.min(0.15, durationSec * 0.3);
    const sustainUntil = now + Math.max(0.05, durationSec - release);
    const peak = 0.18 / Math.max(1, pitchClasses.length); // headroom, avoid clipping

    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(0, now);
    master.gain.linearRampToValueAtTime(peak, now + attack);
    master.gain.setValueAtTime(peak, sustainUntil);
    master.gain.linearRampToValueAtTime(0, now + durationSec);

    this.voices = pitchClasses.map((pc) => {
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.value = pitchClassToFrequency(pc);
      osc.connect(master);
      osc.start(now);
      osc.stop(now + durationSec + 0.02);
      return osc;
    });
  }

  stop(): void {
    const ctx = this.ctx;
    if (!ctx || !this.master) return;
    try {
      this.master.gain.cancelScheduledValues(ctx.currentTime);
      this.master.gain.setValueAtTime(0, ctx.currentTime);
    } catch {
      /* ignore */
    }
    for (const osc of this.voices) {
      try {
        osc.stop();
        osc.disconnect();
      } catch {
        /* already stopped */
      }
    }
    this.voices = [];
  }
}
