import test from 'node:test';
import assert from 'node:assert/strict';
import {
  HOLD_DRAG_CANCEL_PX,
  HOLD_REQUIRED_SECONDS,
  INNER_ZOOM_MAX,
  INNER_ZOOM_MIN,
  OUTER_ZOOM_MAX,
  OUTER_ZOOM_MIN,
  computeBubbleCenterSwell,
  computeCircleRingLayout,
  computeDimensionWarpPeak,
  computeDimensionWaveY,
  computeResponsiveFov,
  computeZoomCameraDistance,
  createInitialHoldGateState,
  generateBubbleSpecs,
  generateHeartContourLoop,
  generateHeartParticles,
  generatePortalRingSpecs,
  getNeighborIndices,
  heartbeatImpulse,
  implicitRoundedHeart,
  shortestAngleDiff,
  stepHoldGate,
} from './portrait3d-math.ts';

test('implicitRoundedHeart defines plump interior and outer boundary', () => {
  assert.ok(implicitRoundedHeart(0, 0.1) < 0, 'origin center is inside heart');
  assert.ok(implicitRoundedHeart(0.55, 0.45) < 0, 'upper lobe is inside heart');
  assert.ok(implicitRoundedHeart(2.0, 2.0) > 0, 'far point is outside heart');
});

test('heartbeatImpulse stays bounded and pulses above 1.0', () => {
  const peak = heartbeatImpulse(0.14, 1.0);
  const rest = heartbeatImpulse(0.85, 1.0);
  assert.ok(peak > 1.04 && peak < 1.1, `expected beat peak > 1.04, got ${peak}`);
  assert.ok(rest >= 1.0 && rest < 1.01, `expected rest near 1.0, got ${rest}`);
});

test('generateHeartParticles produces valid 3D coordinates and expanded beating outer-heart shell vectors', () => {
  const pts = generateHeartParticles(800, 12345);
  assert.equal(pts.length, 800);
  for (const p of pts) {
    assert.ok(Number.isFinite(p.hx) && Number.isFinite(p.hy) && Number.isFinite(p.hz));
    assert.ok(Number.isFinite(p.dx) && Number.isFinite(p.dy) && Number.isFinite(p.dz));
    const heartMag = Math.hypot(p.hx, p.hy, p.hz);
    const domeMag = Math.hypot(p.dx, p.dy, p.dz);
    assert.ok(
      domeMag > heartMag * 2.5,
      `expected expanded heart shell distance (${domeMag.toFixed(2)}) > 2.5x (${(heartMag * 2.5).toFixed(2)})`
    );
    assert.ok(p.dz < 0.5, `expected particles not to obstruct front portrait corridor, got dz=${p.dz}`);
  }
});

test('HoldGateMachine enforces strict 3s hold outside and allows near/far zoom in outer & inner', () => {
  let state = createInitialHoldGateState();

  // 1. Zooming closer and farther while NOT holding on heart must keep phase === outer
  state = stepHoldGate(state, { dtSeconds: 1.0, zoomDelta: -10 });
  assert.equal(state.phase, 'outer');
  assert.equal(state.outerZoomDist, OUTER_ZOOM_MIN);
  state = stepHoldGate(state, { dtSeconds: 1.0, zoomDelta: 20 });
  assert.equal(state.phase, 'outer');
  assert.equal(state.outerZoomDist, OUTER_ZOOM_MAX);

  // 2. Holding 2.4s then dragging > threshold cancels hold cleanly
  state = stepHoldGate(state, { dtSeconds: 2.4, pointerDownOnHeart: true, dragDistancePx: 2 });
  assert.equal(state.phase, 'holding');
  assert.ok(state.holdProgress > 0.75);

  state = stepHoldGate(state, { dtSeconds: 0.2, dragDistancePx: HOLD_DRAG_CANCEL_PX + 5 });
  assert.equal(state.phase, 'outer');

  // 3. Releasing at 2.5s decays back without entering
  state = createInitialHoldGateState();
  state = stepHoldGate(state, { dtSeconds: 2.5, pointerDownOnHeart: true, dragDistancePx: 0 });
  assert.equal(state.phase, 'holding');
  state = stepHoldGate(state, { dtSeconds: 0.1, pointerDownOnHeart: false });
  assert.equal(state.phase, 'outer');

  // 4. Holding straight on heart for full 3.0s triggers diving -> inner -> inner zoom near/far -> photo-zoom -> inner -> outer
  state = createInitialHoldGateState();
  state = stepHoldGate(state, {
    dtSeconds: HOLD_REQUIRED_SECONDS,
    pointerDownOnHeart: true,
    dragDistancePx: 3,
  });
  assert.equal(state.phase, 'diving');

  state = stepHoldGate(state, { dtSeconds: 0.1, diveComplete: true });
  assert.equal(state.phase, 'inner');

  state = stepHoldGate(state, { dtSeconds: 0.1, innerZoomDelta: -15 });
  assert.equal(state.innerZoomDist, INNER_ZOOM_MIN);
  state = stepHoldGate(state, { dtSeconds: 0.1, innerZoomDelta: 30 });
  assert.equal(state.innerZoomDist, INNER_ZOOM_MAX);

  state = stepHoldGate(state, { dtSeconds: 0.1, openPhoto: true });
  assert.equal(state.phase, 'photo-zoom');

  state = stepHoldGate(state, { dtSeconds: 0.1, closePhoto: true });
  assert.equal(state.phase, 'inner');

  state = stepHoldGate(state, { dtSeconds: 0.1, exitRequested: true });
  assert.equal(state.phase, 'exiting');

  state = stepHoldGate(state, { dtSeconds: 0.1, exitComplete: true });
  assert.equal(state.phase, 'outer');
});

test('computeCircleRingLayout places all 26 students evenly around a single circular ring with no pairing', () => {
  const ringY = -0.82;
  const ringR = 5.85;
  const slots = computeCircleRingLayout(26, ringR, ringY);
  assert.equal(slots.length, 26);

  for (const s of slots) {
    const r = Math.hypot(s.x, s.z);
    assert.ok(Math.abs(r - ringR) < 1e-6);
    assert.equal(s.y, ringY);
  }

  // Every adjacent distance must be uniform (no clustered pairs)
  const d01 = Math.hypot(slots[1].x - slots[0].x, slots[1].z - slots[0].z);
  const d12 = Math.hypot(slots[2].x - slots[1].x, slots[2].z - slots[1].z);
  const dWrap = Math.hypot(slots[0].x - slots[25].x, slots[0].z - slots[25].z);
  assert.ok(Math.abs(d01 - d12) < 1e-6, `expected uniform spacing (${d01} vs ${d12})`);
  assert.ok(Math.abs(d01 - dWrap) < 1e-6, `expected wrap spacing equal (${d01} vs ${dWrap})`);
});

test('shortestAngleDiff and getNeighborIndices wrap cleanly', () => {
  const diff = shortestAngleDiff(0.1, Math.PI * 2 - 0.1);
  assert.ok(Math.abs(diff - 0.2) < 1e-6);

  assert.deepEqual(getNeighborIndices(0, 26), { prev: 25, active: 0, next: 1 });
  assert.deepEqual(getNeighborIndices(25, 26), { prev: 24, active: 25, next: 0 });
});

test('computeZoomCameraDistance fits active photo plus 2 flanking neighbor photos on desktop & mobile', () => {
  const trioHalfWidth = 2.04;
  for (const aspect of [1440 / 900, 390 / 844]) {
    const fovDeg = computeResponsiveFov(aspect);
    const dist = computeZoomCameraDistance(aspect, fovDeg, trioHalfWidth);
    const halfFovRad = (fovDeg * Math.PI) / 360;
    const visibleHalfWidth = dist * Math.tan(halfFovRad) * aspect;
    assert.ok(
      visibleHalfWidth >= trioHalfWidth,
      `aspect ${aspect.toFixed(2)}: visibleHalfWidth ${visibleHalfWidth.toFixed(2)} < ${trioHalfWidth}`
    );
  }
});

test('computeBubbleCenterSwell inflates bubbles passing through center and tapers at edges', () => {
  const base = 0.3;
  const centerR = computeBubbleCenterSwell(0, 0, base);
  const midR = computeBubbleCenterSwell(0.7, 0.2, base);
  const edgeR = computeBubbleCenterSwell(1.5, 0.8, base);
  assert.ok(centerR > base * 1.85, `expected center swell > 1.85x, got ${centerR / base}`);
  assert.ok(centerR > midR && midR > edgeR, 'swell must decrease monotonically from center');
  assert.ok(edgeR >= base, 'edge size stays >= baseRadius');
});

test('generateBubbleSpecs and generateHeartContourLoop produce valid geometries', () => {
  const bubbles = generateBubbleSpecs(24, 11202026);
  assert.equal(bubbles.length, 24);
  const fgCount = bubbles.filter((b) => b.isForeground).length;
  const bgCount = bubbles.filter((b) => !b.isForeground).length;
  assert.ok(fgCount > 0 && bgCount > 0, 'includes both foreground and 3D interior bubbles');
  for (const b of bubbles) {
    assert.ok(Number.isFinite(b.x) && Number.isFinite(b.y) && Number.isFinite(b.z));
    assert.ok(b.baseRadius > 0);
  }

  const loop = generateHeartContourLoop(96);
  assert.equal(loop.length, 96);
  assert.ok(Math.abs(loop[0].x) < 1e-6 && loop[0].y > 0.5, 'starts at upper heart cleft');
});

test('Cosmic Sanctuary Dimension math: warp curve, harmonic wave elevation, and portal rings', () => {
  assert.equal(computeDimensionWarpPeak(0), 0);
  assert.ok(Math.abs(computeDimensionWarpPeak(0.5) - 1) < 1e-6);
  assert.ok(Math.abs(computeDimensionWarpPeak(1)) < 1e-6);

  const w0 = computeDimensionWaveY(0, 26, 0, 0.28);
  const w3 = computeDimensionWaveY(3, 26, 0, 0.28);
  assert.ok(Math.abs(w0) < 1e-6);
  assert.ok(Math.abs(w3) > 0.24 && Math.abs(w3) <= 0.28 + 1e-6);
  assert.equal(computeDimensionWaveY(0, 0, 1.0, 0.28), 0);

  const rings = generatePortalRingSpecs();
  assert.ok(rings.length >= 4);
  for (const r of rings) {
    assert.ok(r.radius > 0 && r.tubeRadius > 0);
    assert.ok(Number.isFinite(r.spinSpeed) && r.spinSpeed !== 0);
  }
});

