import type { LyricLine } from '../data/tributeData';

export type HeartMode = 'ambient' | 'finale';

export type AmbientPhase = 'converging' | 'beating' | 'dissolving';
export type FinalePhase = 'emerging' | 'converging' | 'beating';

export interface HeartState {
  mode: HeartMode;
  phase: AmbientPhase | FinalePhase;
  /** 0..1 visibility/emergence of particles */
  emergeProgress: number;
  /** 0 = scattered cloud, 1 = assembled 3D heart */
  convergeProgress: number;
  /** Heartbeat scale multiplier (>= 1.0 during systole pulse) */
  beatScale: number;
  /** Normalized progress within the current phase (0..1) */
  phaseProgress: number;
}

export const AMBIENT_CONVERGE_SECONDS = 10;
export const AMBIENT_BEAT_HOLD_SECONDS = 4;
export const AMBIENT_DISSOLVE_SECONDS = 4;
export const AMBIENT_CYCLE_SECONDS =
  AMBIENT_CONVERGE_SECONDS + AMBIENT_BEAT_HOLD_SECONDS + AMBIENT_DISSOLVE_SECONDS;

export const FINALE_EMERGE_SECONDS = 6;
export const FINALE_CONVERGE_SECONDS = 15;
export const FINALE_ASSEMBLED_AT_SECONDS =
  FINALE_EMERGE_SECONDS + FINALE_CONVERGE_SECONDS;

export function clamp01(value: number): number {
  if (value <= 0) return 0;
  if (value >= 1) return 1;
  return value;
}

export function easeInOutCubic(t: number): number {
  const x = clamp01(t);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

export function easeOutCubic(t: number): number {
  const x = clamp01(t);
  return 1 - Math.pow(1 - x, 3);
}

/**
 * Computes a realistic double-pulse cardiac beat (lub-dub) scale around 1.0.
 */
export function computeHeartbeatScale(timeSeconds: number, intensity = 1): number {
  const cycle = ((timeSeconds % 1.15) + 1.15) % 1.15;
  const lub = Math.exp(-Math.pow((cycle - 0.16) / 0.065, 2)) * 0.11;
  const dub = Math.exp(-Math.pow((cycle - 0.36) / 0.08, 2)) * 0.065;
  return 1 + (lub + dub) * clamp01(intensity);
}

/**
 * Evaluates the ambient 3D heart state:
 * - 0..10s: particles converge into the 3D heart ("hợp lại sau 10s")
 * - 10..14s: 3D heart holds and beats ("trái tim đập")
 * - 14..18s: dissolves outward ("tan sau 4s") and repeats seamlessly
 */
export function evaluateAmbientHeartState(elapsedSeconds: number): HeartState {
  const safeElapsed = Math.max(0, elapsedSeconds);
  const t = safeElapsed % AMBIENT_CYCLE_SECONDS;

  if (t < AMBIENT_CONVERGE_SECONDS) {
    const raw = t / AMBIENT_CONVERGE_SECONDS;
    const convergeProgress = easeInOutCubic(raw);
    return {
      mode: 'ambient',
      phase: 'converging',
      emergeProgress: clamp01(0.45 + 0.55 * convergeProgress),
      convergeProgress,
      beatScale: computeHeartbeatScale(safeElapsed, 0.25 + 0.75 * convergeProgress),
      phaseProgress: clamp01(raw),
    };
  }

  if (t < AMBIENT_CONVERGE_SECONDS + AMBIENT_BEAT_HOLD_SECONDS) {
    const raw = (t - AMBIENT_CONVERGE_SECONDS) / AMBIENT_BEAT_HOLD_SECONDS;
    return {
      mode: 'ambient',
      phase: 'beating',
      emergeProgress: 1,
      convergeProgress: 1,
      beatScale: computeHeartbeatScale(safeElapsed, 1),
      phaseProgress: clamp01(raw),
    };
  }

  const raw =
    (t - AMBIENT_CONVERGE_SECONDS - AMBIENT_BEAT_HOLD_SECONDS) /
    AMBIENT_DISSOLVE_SECONDS;
  const dissolve = easeInOutCubic(raw);
  return {
    mode: 'ambient',
    phase: 'dissolving',
    emergeProgress: clamp01(1 - 0.45 * dissolve),
    convergeProgress: clamp01(1 - dissolve),
    beatScale: computeHeartbeatScale(safeElapsed, 1 - dissolve),
    phaseProgress: clamp01(raw),
  };
}

/**
 * Evaluates the finale giant 3D particle heart state:
 * - 0..6s: luminous particles emerge & swirl across the screen ("xuất hiện suốt 6s")
 * - 6..21s: particles converge over 15s into a giant centered 3D heart ("hợp sau 15s")
 * - 21s+: giant heart beats warmly in the center
 */
export function evaluateFinaleHeartState(elapsedSeconds: number): HeartState {
  const t = Math.max(0, elapsedSeconds);

  if (t < FINALE_EMERGE_SECONDS) {
    const raw = t / FINALE_EMERGE_SECONDS;
    return {
      mode: 'finale',
      phase: 'emerging',
      emergeProgress: easeOutCubic(raw),
      convergeProgress: easeInOutCubic(raw) * 0.08,
      beatScale: 1,
      phaseProgress: clamp01(raw),
    };
  }

  if (t < FINALE_ASSEMBLED_AT_SECONDS) {
    const raw = (t - FINALE_EMERGE_SECONDS) / FINALE_CONVERGE_SECONDS;
    const convergeProgress = 0.08 + 0.92 * easeInOutCubic(raw);
    return {
      mode: 'finale',
      phase: 'converging',
      emergeProgress: 1,
      convergeProgress,
      beatScale: computeHeartbeatScale(t, 0.25 + 0.75 * clamp01(raw)),
      phaseProgress: clamp01(raw),
    };
  }

  return {
    mode: 'finale',
    phase: 'beating',
    emergeProgress: 1,
    convergeProgress: 1,
    beatScale: computeHeartbeatScale(t, 1),
    phaseProgress: 1,
  };
}

export function evaluateHeartState(mode: HeartMode, elapsedSeconds: number): HeartState {
  return mode === 'finale'
    ? evaluateFinaleHeartState(elapsedSeconds)
    : evaluateAmbientHeartState(elapsedSeconds);
}

/**
 * Generates a volumetric 3D heart point from parametric angle u in [0, 2π] and
 * radial/depth parameters v in [-1, 1], shellBias in [0, 1].
 */
export function sampleHeartPoint3D(
  u: number,
  depthRatio: number,
  shellRadius = 1,
  scale = 0.14
): { x: number; y: number; z: number } {
  const sinU = Math.sin(u);
  const cosU = Math.cos(u);

  const rawX = 16 * Math.pow(sinU, 3);
  const rawY =
    13 * cosU -
    5 * Math.cos(2 * u) -
    2 * Math.cos(3 * u) -
    Math.cos(4 * u);

  // Taper thickness near the bottom tip and center cleft for natural 3D volume
  const thicknessProfile = Math.max(0.18, Math.abs(sinU)) * (0.65 + 0.35 * shellRadius);
  const rawZ = depthRatio * 6.5 * thicknessProfile;

  const r = Math.cbrt(Math.max(0.08, shellRadius));
  return {
    x: rawX * r * scale,
    y: (rawY + 1.5) * r * scale,
    z: rawZ * r * scale,
  };
}

/**
 * Returns the active lyric line for a given playback timestamp (looping modulo duration).
 */
export function getActiveLyricLine(
  lyrics: readonly LyricLine[],
  currentTimeSeconds: number,
  durationSeconds: number
): LyricLine | null {
  if (lyrics.length === 0) return null;
  const safeDuration = Math.max(1, durationSeconds);
  const wrappedTime = ((currentTimeSeconds % safeDuration) + safeDuration) % safeDuration;

  let active = lyrics[0];
  for (let i = 0; i < lyrics.length; i++) {
    if (lyrics[i].time <= wrappedTime) {
      active = lyrics[i];
    } else {
      break;
    }
  }
  return active;
}
