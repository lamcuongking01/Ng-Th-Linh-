import test from 'node:test';
import assert from 'node:assert/strict';
import {
  AMBIENT_CONVERGE_SECONDS,
  AMBIENT_BEAT_HOLD_SECONDS,
  AMBIENT_DISSOLVE_SECONDS,
  AMBIENT_CYCLE_SECONDS,
  FINALE_EMERGE_SECONDS,
  FINALE_ASSEMBLED_AT_SECONDS,
  computeHeartbeatScale,
  evaluateAmbientHeartState,
  evaluateFinaleHeartState,
  sampleHeartPoint3D,
  getActiveLyricLine,
} from './heartTimeline';
import {
  STUDENT_NAMES,
  LEFT_COLUMN_STUDENTS,
  RIGHT_COLUMN_STUDENTS,
  GALLERY_PHOTOS,
  MUSIC_TRACKS,
} from '../data/tributeData';

test('ambient 3D heart converges over 10s, holds/beats for 4s, and dissolves over 4s', () => {
  const atStart = evaluateAmbientHeartState(0);
  assert.equal(atStart.phase, 'converging');
  assert.equal(atStart.convergeProgress, 0);

  const atMidConverge = evaluateAmbientHeartState(AMBIENT_CONVERGE_SECONDS / 2);
  assert.equal(atMidConverge.phase, 'converging');
  assert.ok(atMidConverge.convergeProgress > 0.4 && atMidConverge.convergeProgress < 0.6);

  const atTenSeconds = evaluateAmbientHeartState(AMBIENT_CONVERGE_SECONDS);
  assert.equal(atTenSeconds.phase, 'beating');
  assert.equal(atTenSeconds.convergeProgress, 1);

  const atFourteenSeconds = evaluateAmbientHeartState(
    AMBIENT_CONVERGE_SECONDS + AMBIENT_BEAT_HOLD_SECONDS
  );
  assert.equal(atFourteenSeconds.phase, 'dissolving');
  assert.equal(atFourteenSeconds.convergeProgress, 1);

  const nearEnd = evaluateAmbientHeartState(AMBIENT_CYCLE_SECONDS - 0.05);
  assert.equal(nearEnd.phase, 'dissolving');
  assert.ok(nearEnd.convergeProgress < 0.05);

  const looped = evaluateAmbientHeartState(AMBIENT_CYCLE_SECONDS);
  assert.equal(looped.phase, 'converging');
  assert.equal(looped.convergeProgress, 0);
  assert.equal(AMBIENT_DISSOLVE_SECONDS, 4);
});

test('finale giant 3D heart emerges over 6s and converges over 15s (total 21s)', () => {
  const atZero = evaluateFinaleHeartState(0);
  assert.equal(atZero.phase, 'emerging');
  assert.equal(atZero.emergeProgress, 0);

  const atThreeSeconds = evaluateFinaleHeartState(3);
  assert.equal(atThreeSeconds.phase, 'emerging');
  assert.ok(atThreeSeconds.emergeProgress > 0.8);

  const atSixSeconds = evaluateFinaleHeartState(FINALE_EMERGE_SECONDS);
  assert.equal(atSixSeconds.phase, 'converging');
  assert.equal(atSixSeconds.emergeProgress, 1);
  assert.ok(atSixSeconds.convergeProgress < 0.15);

  const atMidAssembly = evaluateFinaleHeartState(FINALE_EMERGE_SECONDS + 7.5);
  assert.equal(atMidAssembly.phase, 'converging');
  assert.ok(atMidAssembly.convergeProgress > 0.45 && atMidAssembly.convergeProgress < 0.65);

  const atTwentyOneSeconds = evaluateFinaleHeartState(FINALE_ASSEMBLED_AT_SECONDS);
  assert.equal(atTwentyOneSeconds.phase, 'beating');
  assert.equal(atTwentyOneSeconds.convergeProgress, 1);
  assert.equal(atTwentyOneSeconds.emergeProgress, 1);
});

test('heartbeat scale pulses above 1.0 during lub-dub peaks', () => {
  const lubPeak = computeHeartbeatScale(0.16, 1);
  const rest = computeHeartbeatScale(0.85, 1);
  assert.ok(lubPeak > 1.08);
  assert.ok(rest < 1.01);
});

test('sampleHeartPoint3D generates symmetric, finite 3D coordinates', () => {
  const right = sampleHeartPoint3D(Math.PI / 2, 0, 1, 0.15);
  const left = sampleHeartPoint3D((3 * Math.PI) / 2, 0, 1, 0.15);
  assert.ok(Number.isFinite(right.x) && Number.isFinite(right.y) && Number.isFinite(right.z));
  assert.ok(Math.abs(right.x + left.x) < 1e-6);
  assert.ok(Math.abs(right.y - left.y) < 1e-6);
});

test('all 45 student names are present and split cleanly into left and right columns', () => {
  assert.equal(STUDENT_NAMES.length, 45);
  assert.equal(STUDENT_NAMES[0].name, 'Nguyễn Thị Lan Anh');
  assert.equal(STUDENT_NAMES[44].name, 'Phạm Trọng Vương');
  assert.equal(LEFT_COLUMN_STUDENTS.length + RIGHT_COLUMN_STUDENTS.length, 45);
});

test('gallery photos each have a dedicated wish underneath and valid URLs', () => {
  assert.ok(GALLERY_PHOTOS.length >= 4);
  for (const photo of GALLERY_PHOTOS) {
    assert.ok(photo.wishText.trim().length > 10);
    assert.ok(photo.imageSrc.length > 0);
    assert.ok(photo.fallbackSrc.length > 0);
  }
});

test('music tracks map to ./bai1.mp3 and ./bai2.mp3 and resolve active lyrics', () => {
  assert.equal(MUSIC_TRACKS[0].src, './bai1.mp3');
  assert.equal(MUSIC_TRACKS[1].src, './bai2.mp3');
  const line0 = getActiveLyricLine(MUSIC_TRACKS[0].lyrics, 1, MUSIC_TRACKS[0].durationSeconds);
  const line2 = getActiveLyricLine(MUSIC_TRACKS[0].lyrics, 13, MUSIC_TRACKS[0].durationSeconds);
  assert.equal(line0?.text, MUSIC_TRACKS[0].lyrics[0].text);
  assert.equal(line2?.text, MUSIC_TRACKS[0].lyrics[2].text);
});
