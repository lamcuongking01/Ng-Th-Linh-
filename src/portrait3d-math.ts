export type PortraitPhase =
  | 'outer'
  | 'holding'
  | 'diving'
  | 'inner'
  | 'photo-zoom'
  | 'exiting';

export interface HeartParticleDatum {
  hx: number;
  hy: number;
  hz: number;
  dx: number;
  dy: number;
  dz: number;
  colorIdx: number;
  size: number;
  phase: number;
  twinkleSpeed: number;
  isRim: boolean;
}

export interface RingCardSlot {
  index: number;
  angleRad: number;
  x: number;
  y: number;
  z: number;
  rotY: number;
}

export interface HoldGateState {
  phase: PortraitPhase;
  holdSeconds: number;
  holdProgress: number;
  pointerDownOnHeart: boolean;
  dragDistancePx: number;
  outerZoomDist: number;
  innerZoomDist: number;
}

export interface HoldGateInput {
  dtSeconds: number;
  pointerDownOnHeart?: boolean;
  dragDistancePx?: number;
  zoomDelta?: number;
  innerZoomDelta?: number;
  cancelHold?: boolean;
  diveComplete?: boolean;
  exitRequested?: boolean;
  exitComplete?: boolean;
  openPhoto?: boolean;
  closePhoto?: boolean;
}

export const HOLD_REQUIRED_SECONDS = 3.0;
export const HOLD_DRAG_CANCEL_PX = 14;
export const OUTER_ZOOM_MIN = 2.4;
export const OUTER_ZOOM_MAX = 14.2;
export const OUTER_ZOOM_DEFAULT = 6.9;
export const INNER_ZOOM_MIN = 6.8;
export const INNER_ZOOM_MAX = 23.6;
export const INNER_ZOOM_DEFAULT = 14.2;

/**
 * Implicit 2D heart boundary matching a plump rounded cushion silhouette.
 * Values <= 0 are inside the heart contour.
 */
export function implicitRoundedHeart(x: number, y: number): number {
  const u = x / 1.14;
  let v = y * 1.04 - 0.05;
  if (v < -0.66) {
    v = -0.66 + (v + 0.66) * 0.82;
  }
  const a = u * u + v * v - 1.0;
  return a * a * a - u * u * v * v * v;
}

/**
 * Dual-pulse natural heartbeat scale multiplier.
 */
export function heartbeatImpulse(timeSec: number, intensity = 1.0): number {
  const cycle = ((timeSec % 1.15) + 1.15) % 1.15;
  const p1 = Math.exp(-Math.pow((cycle - 0.14) / 0.068, 2));
  const p2 = 0.62 * Math.exp(-Math.pow((cycle - 0.34) / 0.082, 2));
  return 1 + intensity * 0.068 * (p1 + p2);
}

/**
 * Deterministic 3D volumetric + surface glitter particle cloud matching the
 * dusty-rose / pearl-pink / magenta stardust heart silhouette.
 * When inside (aDomePos), particles expand into a grand beating 3D Heart Shell
 * behind and around the circular gallery without blocking front portraits.
 */
export function generateHeartParticles(
  count = 4400,
  seedInit = 20261120
): HeartParticleDatum[] {
  let seed = seedInit >>> 0;
  function rand(): number {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  }

  const particles: HeartParticleDatum[] = [];
  const rimTarget = Math.floor(count * 0.38);
  const volTarget = count - rimTarget;

  // 1. Volumetric cushion fill (upper lobes bright pearl/blush, lower tip deep magenta)
  let attempts = 0;
  while (particles.length < volTarget && attempts < volTarget * 16) {
    attempts++;
    const ux = (rand() * 2 - 1) * 1.3;
    const uy = -1.16 + rand() * 2.52;
    const val = implicitRoundedHeart(ux, uy);
    if (val > -0.012) continue;

    // Cushion thickness tapers smoothly to the heart boundary
    const insideDepth = Math.pow(Math.min(1, -val * 1.85), 0.38);
    const shellBias = rand() < 0.68 ? (0.45 + 0.55 * rand()) : rand();
    const zSign = rand() < 0.5 ? -1 : 1;
    const hz = zSign * insideDepth * shellBias * 0.62;
    const hx = ux * 1.48;
    const hy = uy * 1.48;

    // Expanded interior 3D Heart Shell: surrounds & frames the central column + 26-card ring cleanly in frame
    const dx = hx * 4.15 + (rand() - 0.5) * 0.24;
    const dy = hy * 3.82 + 0.96 + (rand() - 0.5) * 0.24;
    const dz = -2.35 - Math.abs(hz) * 4.2 - rand() * 0.8;

    const heightNorm = Math.max(0, Math.min(1, (hy + 1.5) / 3.0));
    const colorRoll = rand() * 0.68 + (1 - heightNorm) * 0.42;
    let colorIdx = 0;
    if (colorRoll > 0.86) colorIdx = 4;
    else if (colorRoll > 0.68) colorIdx = 3;
    else if (colorRoll > 0.44) colorIdx = 2;
    else if (colorRoll > 0.22) colorIdx = 1;
    else colorIdx = 0;

    particles.push({
      hx,
      hy,
      hz,
      dx,
      dy,
      dz,
      colorIdx,
      size: 0.62 + Math.pow(rand(), 1.45) * 1.25,
      phase: rand() * Math.PI * 2,
      twinkleSpeed: 1.6 + rand() * 3.4,
      isRim: false,
    });
  }

  // 2. Crisp glowing outer contour glitter halo (unmistakable beating heart silhouette inside)
  for (let i = 0; i < rimTarget; i++) {
    const theta = (Math.PI * 2 * i) / rimTarget + (rand() - 0.5) * 0.02;
    const ca = Math.cos(theta);
    const sa = Math.sin(theta);
    let lo = 0.08;
    let hi = 1.75;
    for (let s = 0; s < 16; s++) {
      const mid = (lo + hi) * 0.5;
      if (implicitRoundedHeart(mid * ca, mid * sa) <= 0) lo = mid;
      else hi = mid;
    }

    const rScale = 0.92 + rand() * 0.09;
    const hx = lo * ca * rScale * 1.48;
    const hy = lo * sa * rScale * 1.48;
    const hz = (rand() * 2 - 1) * 0.26;

    const dx = hx * 4.28 + (rand() - 0.5) * 0.16;
    const dy = hy * 3.96 + 0.96 + (rand() - 0.5) * 0.16;
    const dz = -1.95 + hz * 1.1;

    const heightNorm = Math.max(0, Math.min(1, (hy + 1.5) / 3.0));
    const colorIdx = heightNorm > 0.48 ? (rand() < 0.55 ? 0 : 1) : (rand() < 0.5 ? 2 : 3);

    particles.push({
      hx,
      hy,
      hz,
      dx,
      dy,
      dz,
      colorIdx,
      size: 0.78 + rand() * 1.15,
      phase: rand() * Math.PI * 2,
      twinkleSpeed: 2.0 + rand() * 3.6,
      isRim: true,
    });
  }

  return particles;
}

/**
 * Arranges all student portraits evenly around a single circular ring
 * with individual spacing (no pairing, no connecting bars) below the central column.
 */
export function computeCircleRingLayout(
  totalItems: number,
  ringRadius = 5.85,
  ringY = -0.82
): RingCardSlot[] {
  if (totalItems <= 0) return [];
  const stepRad = (Math.PI * 2) / totalItems;
  const slots: RingCardSlot[] = [];

  for (let i = 0; i < totalItems; i++) {
    const angleRad = i * stepRad;
    // Angle = 0 points straight toward +Z (front of ring toward viewer)
    const x = Math.sin(angleRad) * ringRadius;
    const z = Math.cos(angleRad) * ringRadius;

    slots.push({
      index: i,
      angleRad,
      x,
      y: ringY,
      z,
      rotY: angleRad,
    });
  }

  return slots;
}

/**
 * Returns shortest signed angular difference (target - current) in [-PI, PI].
 */
export function shortestAngleDiff(targetRad: number, currentRad: number): number {
  let diff = (targetRad - currentRad) % (Math.PI * 2);
  if (diff > Math.PI) diff -= Math.PI * 2;
  if (diff < -Math.PI) diff += Math.PI * 2;
  return diff;
}

export function getNeighborIndices(
  activeIdx: number,
  total: number
): { prev: number; active: number; next: number } {
  if (total <= 0) return { prev: 0, active: 0, next: 0 };
  const active = ((activeIdx % total) + total) % total;
  const prev = (active - 1 + total) % total;
  const next = (active + 1) % total;
  return { prev, active, next };
}

export function computeResponsiveFov(aspect: number): number {
  if (!aspect || aspect >= 1.0) return 46;
  // Widen vertical FOV gently on tall portrait mobile screens so horizontal ring trios frame cleanly
  const t = Math.max(0, Math.min(1, (1.0 - aspect) / 0.55));
  return 46 + t * 16;
}

/**
 * Computes camera distance from the front-most active portrait card so that
 * the center card AND both left/right adjacent neighbor cards stay visible inside
 * the camera horizontal frustum on both wide desktop and narrow mobile screens.
 */
export function computeZoomCameraDistance(
  aspect: number,
  fovDeg?: number,
  trioHalfWidth = 2.04
): number {
  const safeAspect = Math.max(0.42, Math.min(2.4, aspect || 1.6));
  const effFov = fovDeg !== undefined ? fovDeg : computeResponsiveFov(safeAspect);
  const halfFovRad = (effFov * Math.PI) / 360;
  const tanHalfV = Math.tan(halfFovRad);
  const tanHalfH = tanHalfV * safeAspect;
  // Minimum distance to frame [-trioHalfWidth, +trioHalfWidth] horizontally with comfortable margin
  const minDistForTrio = (trioHalfWidth * 1.06) / tanHalfH;
  return Math.max(3.85, Math.min(10.0, minDistForTrio));
}

export function createInitialHoldGateState(): HoldGateState {
  return {
    phase: 'outer',
    holdSeconds: 0,
    holdProgress: 0,
    pointerDownOnHeart: false,
    dragDistancePx: 0,
    outerZoomDist: OUTER_ZOOM_DEFAULT,
    innerZoomDist: INNER_ZOOM_DEFAULT,
  };
}

/**
 * Pure state transition for the 3-second hold-to-enter rule and zoom isolation.
 * Zooming closer/farther while outside NEVER reveals or enters the interior.
 */
export function stepHoldGate(
  prev: HoldGateState,
  input: HoldGateInput
): HoldGateState {
  const dt = Math.max(0, input.dtSeconds);
  let phase = prev.phase;
  let holdSeconds = prev.holdSeconds;
  let pointerDownOnHeart =
    input.pointerDownOnHeart !== undefined
      ? input.pointerDownOnHeart
      : prev.pointerDownOnHeart;
  let dragDistancePx =
    input.dragDistancePx !== undefined
      ? input.dragDistancePx
      : prev.dragDistancePx;

  let outerZoomDist = prev.outerZoomDist;
  if (
    (phase === 'outer' || phase === 'holding') &&
    typeof input.zoomDelta === 'number' &&
    input.zoomDelta !== 0
  ) {
    outerZoomDist = Math.max(
      OUTER_ZOOM_MIN,
      Math.min(OUTER_ZOOM_MAX, outerZoomDist + input.zoomDelta)
    );
  }

  let innerZoomDist = prev.innerZoomDist;
  if (
    phase === 'inner' &&
    typeof input.innerZoomDelta === 'number' &&
    input.innerZoomDelta !== 0
  ) {
    innerZoomDist = Math.max(
      INNER_ZOOM_MIN,
      Math.min(INNER_ZOOM_MAX, innerZoomDist + input.innerZoomDelta)
    );
  }

  if (input.cancelHold) {
    pointerDownOnHeart = false;
  }

  if (phase === 'outer' || phase === 'holding') {
    const dragExceeded = dragDistancePx > HOLD_DRAG_CANCEL_PX;
    if (pointerDownOnHeart && !dragExceeded && !input.cancelHold) {
      phase = 'holding';
      holdSeconds = Math.min(HOLD_REQUIRED_SECONDS, holdSeconds + dt);
      if (holdSeconds >= HOLD_REQUIRED_SECONDS) {
        phase = 'diving';
        pointerDownOnHeart = false;
      }
    } else {
      phase = 'outer';
      // Smoothly decay hold charge back to 0 when released early or dragged
      holdSeconds = Math.max(0, holdSeconds - dt * 3.8);
      if (dragExceeded) {
        pointerDownOnHeart = false;
      }
    }
  } else if (phase === 'diving') {
    if (input.diveComplete) {
      phase = 'inner';
      holdSeconds = 0;
    }
  } else if (phase === 'inner') {
    if (input.openPhoto) {
      phase = 'photo-zoom';
    } else if (input.exitRequested) {
      phase = 'exiting';
    }
  } else if (phase === 'photo-zoom') {
    if (input.closePhoto) {
      phase = 'inner';
    } else if (input.exitRequested) {
      phase = 'exiting';
    }
  } else if (phase === 'exiting') {
    if (input.exitComplete) {
      phase = 'outer';
      holdSeconds = 0;
      dragDistancePx = 0;
      pointerDownOnHeart = false;
    }
  }

  const holdProgress = Math.max(
    0,
    Math.min(1, holdSeconds / HOLD_REQUIRED_SECONDS)
  );

  return {
    phase,
    holdSeconds,
    holdProgress,
    pointerDownOnHeart,
    dragDistancePx,
    outerZoomDist,
    innerZoomDist,
  };
}

export interface BubbleSpec {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  baseRadius: number;
  wobblePhase: number;
  wobbleSpeed: number;
  hueShift: number;
  isForeground: boolean;
}

/**
 * Computes real-life optical/draft swell for transparent bubbles passing across
 * the center of the portrait gallery: smaller near edges, inflating smoothly
 * larger (~1.92x) through the center focal corridor.
 */
export function computeBubbleCenterSwell(
  normX: number,
  normY: number,
  baseRadius: number
): number {
  const safeBase = Math.max(0.01, baseRadius);
  const d2 = normX * normX * 0.85 + normY * normY * 0.65;
  const swell = 1.0 + 0.92 * Math.exp(-d2 * 1.45);
  return safeBase * swell;
}

/**
 * Generates deterministic 3D + foreground passing iridescent soap bubbles
 * inside the portrait exhibition gallery.
 */
export function generateBubbleSpecs(
  count = 24,
  seedInit = 11202026
): BubbleSpec[] {
  let seed = seedInit >>> 0;
  function rand(): number {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  }

  const fgTarget = Math.max(1, Math.round(count * 0.42));
  const specs: BubbleSpec[] = [];

  for (let i = 0; i < count; i++) {
    const isForeground = i < fgTarget;
    if (isForeground) {
      const dir = i % 2 === 0 ? 1 : -1;
      specs.push({
        x: (rand() * 2 - 1) * 7.2,
        y: -1.4 + rand() * 4.2,
        z: 6.35 + rand() * 2.1,
        vx: dir * (0.42 + rand() * 0.45),
        vy: 0.14 + rand() * 0.22,
        baseRadius: 0.24 + rand() * 0.18,
        wobblePhase: rand() * Math.PI * 2,
        wobbleSpeed: 1.5 + rand() * 1.4,
        hueShift: rand(),
        isForeground: true,
      });
    } else {
      const ang = rand() * Math.PI * 2;
      const rad = 1.5 + rand() * 4.9;
      specs.push({
        x: Math.cos(ang) * rad,
        y: -1.6 + rand() * 4.6,
        z: Math.sin(ang) * rad,
        vx: (rand() - 0.5) * 0.36,
        vy: 0.22 + rand() * 0.28,
        baseRadius: 0.2 + rand() * 0.22,
        wobblePhase: rand() * Math.PI * 2,
        wobbleSpeed: 1.4 + rand() * 1.6,
        hueShift: rand(),
        isForeground: false,
      });
    }
  }

  return specs;
}

/**
 * Generates closed heart contour vertices for expanding heartbeat ripple halos.
 */
export function generateHeartContourLoop(
  segments = 96
): Array<{ x: number; y: number }> {
  const safeSegs = Math.max(16, segments);
  const pts: Array<{ x: number; y: number }> = [];
  for (let i = 0; i < safeSegs; i++) {
    const t = (i / safeSegs) * Math.PI * 2;
    const x = 16 * Math.pow(Math.sin(t), 3) * 0.118;
    const y =
      (13 * Math.cos(t) -
        5 * Math.cos(2 * t) -
        2 * Math.cos(3 * t) -
        Math.cos(4 * t)) *
        0.114 +
      0.24;
    pts.push({ x, y });
  }
  return pts;
}

/**
 * Computes smooth dimensional portal warp progress [0..1] during the dive
 * into the inner Cosmic Sanctuary Dimension: peaks mid-transition for vortex/FOV feel.
 */
export function computeDimensionWarpPeak(diveAmount: number): number {
  const clamped = Math.max(0, Math.min(1, diveAmount));
  return Math.sin(clamped * Math.PI);
}

/**
 * Computes gentle harmonic 3D elevation offset for each floating portrait
 * inside the Cosmic Sanctuary Dimension so the gallery forms a living celestial wave.
 */
export function computeDimensionWaveY(
  index: number,
  totalItems: number,
  timeSec: number,
  amplitude = 0.28
): number {
  if (totalItems <= 0) return 0;
  const phase = (index / totalItems) * Math.PI * 4 + timeSec * 1.15;
  return Math.sin(phase) * amplitude;
}

export interface PortalRingSpec {
  radius: number;
  tubeRadius: number;
  y: number;
  tiltX: number;
  tiltZ: number;
  spinSpeed: number;
  colorHex: number;
}

/**
 * Generates deterministic concentric astral portal rings framing the inner dimension.
 */
export function generatePortalRingSpecs(): PortalRingSpec[] {
  return [
    { radius: 8.8, tubeRadius: 0.022, y: -2.14, tiltX: Math.PI * 0.5, tiltZ: 0.03, spinSpeed: 0.14, colorHex: 0xf472b6 },
    { radius: 9.8, tubeRadius: 0.018, y: 3.85, tiltX: Math.PI * 0.5 - 0.12, tiltZ: -0.08, spinSpeed: -0.11, colorHex: 0xfde68a },
    { radius: 11.4, tubeRadius: 0.016, y: 4.35, tiltX: Math.PI * 0.5 - 0.08, tiltZ: 0.1, spinSpeed: 0.08, colorHex: 0xc084fc },
    { radius: 4.4, tubeRadius: 0.018, y: 3.62, tiltX: Math.PI * 0.5 - 0.06, tiltZ: 0.0, spinSpeed: -0.18, colorHex: 0xfbcfe8 },
  ];
}
