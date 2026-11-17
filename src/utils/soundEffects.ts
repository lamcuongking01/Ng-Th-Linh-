let sharedCtx: AudioContext | null = null;

function getAudioCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioContextClass =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return null;
  if (!sharedCtx || sharedCtx.state === 'closed') {
    sharedCtx = new AudioContextClass();
  }
  if (sharedCtx.state === 'suspended') {
    void sharedCtx.resume();
  }
  return sharedCtx;
}

export function playChimeNotes(frequencies: number[], stepGap = 0.09, gainPeak = 0.045): void {
  try {
    const ctx = getAudioCtx();
    if (!ctx) return;
    const base = ctx.currentTime;
    frequencies.forEach((freq, idx) => {
      const start = base + idx * stepGap;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(gainPeak, start + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.65);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.7);
    });
  } catch {
    // Ignore autoplay restriction errors cleanly
  }
}

export function playOpenLetterSound(): void {
  playChimeNotes([523.25, 659.25, 783.99, 1046.5], 0.08, 0.045);
}

export function playTransitionSound(): void {
  playChimeNotes([587.33, 739.99, 880.0], 0.07, 0.035);
}

export function playFinaleCelebrationSound(): void {
  playChimeNotes([523.25, 659.25, 783.99, 987.77, 1046.5, 1318.5], 0.075, 0.05);
}
