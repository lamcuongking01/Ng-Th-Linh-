import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  evaluateHeartState,
  sampleHeartPoint3D,
  type HeartMode,
} from '../utils/heartTimeline';

interface Heart3DCanvasProps {
  mode: HeartMode;
}

const PARTICLE_COUNT = 1800;

function detectSoftwareGl(): boolean {
  try {
    const probeCanvas = document.createElement('canvas');
    const gl = probeCanvas.getContext('webgl2') || probeCanvas.getContext('webgl');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) ?? '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

export default function Heart3DCanvas({ mode }: Heart3DCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const modeRef = useRef<HeartMode>(mode);
  const modeStartElapsedRef = useRef<number>(0);
  const lastElapsedRef = useRef<number>(0);

  useEffect(() => {
    if (modeRef.current !== mode) {
      modeRef.current = mode;
      modeStartElapsedRef.current = lastElapsedRef.current;
    }
  }, [mode]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    const isSoftwareGl = detectSoftwareGl();

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        alpha: true,
        powerPreference: 'high-performance',
      });
    } catch {
      return;
    }

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth || window.innerWidth, container.clientHeight || window.innerHeight);
    renderer.setClearColor(0x000000, 0);

    const canvas = renderer.domElement;
    canvas.style.display = 'block';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    container.appendChild(canvas);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      45,
      (container.clientWidth || window.innerWidth) /
        Math.max(1, container.clientHeight || window.innerHeight),
      0.1,
      100
    );
    camera.position.set(0, 0.2, 11.5);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // Warm key light + cool fill for metallic accent dust
    const keyLight = new THREE.DirectionalLight(0xffe4e6, 1.4);
    keyLight.position.set(4, 6, 5);
    scene.add(keyLight);

    const hemiLight = new THREE.HemisphereLight(0xfbcfe8, 0x831843, 0.8);
    scene.add(hemiLight);

    // Build particle buffers
    const heartPositions = new Float32Array(PARTICLE_COUNT * 3);
    const scatterPositions = new Float32Array(PARTICLE_COUNT * 3);
    const colors = new Float32Array(PARTICLE_COUNT * 3);
    const sizes = new Float32Array(PARTICLE_COUNT);
    const phases = new Float32Array(PARTICLE_COUNT);

    const paletteAmbient = [
      new THREE.Color('#be185d'),
      new THREE.Color('#e11d48'),
      new THREE.Color('#f43f5e'),
      new THREE.Color('#fb7185'),
      new THREE.Color('#fda4af'),
      new THREE.Color('#f59e0b'),
    ];

    // Deterministic seeded PRNG so snapshots & visuals are consistent
    let seed = 20112026;
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const u = rand() * Math.PI * 2;
      const depthRatio = rand() * 2 - 1;
      const shellBias = 0.25 + 0.75 * Math.pow(rand(), 0.45);
      const pt = sampleHeartPoint3D(u, depthRatio, shellBias, 0.145);

      heartPositions[i * 3] = pt.x;
      heartPositions[i * 3 + 1] = pt.y;
      heartPositions[i * 3 + 2] = pt.z;

      // Wide spherical / spiral cloud scatter positions
      const theta = rand() * Math.PI * 2;
      const phi = Math.acos(2 * rand() - 1);
      const radius = 3.2 + rand() * 5.2;
      scatterPositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      scatterPositions[i * 3 + 1] = radius * Math.cos(phi) * 0.85;
      scatterPositions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);

      const c = paletteAmbient[Math.floor(rand() * paletteAmbient.length)];
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;

      sizes[i] = 0.7 + rand() * 1.45;
      phases[i] = rand() * Math.PI * 2;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(heartPositions, 3));
    geometry.setAttribute('aScatterPos', new THREE.BufferAttribute(scatterPositions, 3));
    geometry.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));

    const uniforms = {
      uTime: { value: 0 },
      uConverge: { value: 0 },
      uEmerge: { value: 1 },
      uBeat: { value: 1 },
      uScale: { value: 1 },
      uPixelRatio: { value: isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2) },
      uFinaleBoost: { value: 0 },
    };

    const material = new THREE.ShaderMaterial({
      uniforms,
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
      vertexShader: `
        attribute vec3 aScatterPos;
        attribute vec3 aColor;
        attribute float aSize;
        attribute float aPhase;

        uniform float uTime;
        uniform float uConverge;
        uniform float uEmerge;
        uniform float uBeat;
        uniform float uScale;
        uniform float uPixelRatio;

        varying vec3 vColor;
        varying float vAlpha;

        void main() {
          // Gentle orbital swirl while scattered, settling smoothly into the 3D heart
          float swirlAngle = (1.0 - uConverge) * (0.65 * sin(uTime * 0.45 + aPhase) + aPhase * 0.25);
          float s = sin(swirlAngle);
          float c = cos(swirlAngle);
          vec3 rotatedScatter = vec3(
            aScatterPos.x * c - aScatterPos.z * s,
            aScatterPos.y + sin(uTime * 0.9 + aPhase) * 0.28 * (1.0 - uConverge),
            aScatterPos.x * s + aScatterPos.z * c
          );

          vec3 heartTarget = position * uBeat;
          vec3 mixedPos = mix(rotatedScatter, heartTarget, uConverge) * uScale;

          // Subtle micro-shimmer on the assembled heart
          mixedPos += normalize(position + vec3(0.0001)) * sin(uTime * 2.2 + aPhase) * 0.025 * uConverge;

          vec4 mvPosition = modelViewMatrix * vec4(mixedPos, 1.0);
          gl_Position = projectionMatrix * mvPosition;

          float pulseSize = 1.0 + 0.14 * sin(uTime * 3.0 + aPhase);
          gl_PointSize = (aSize * 28.0 * uPixelRatio * pulseSize * uScale) / max(1.5, -mvPosition.z);

          vColor = aColor;
          vAlpha = uEmerge * (0.45 + 0.55 * uConverge);
        }
      `,
      fragmentShader: `
        uniform float uFinaleBoost;
        varying vec3 vColor;
        varying float vAlpha;

        void main() {
          vec2 uv = gl_PointCoord - vec2(0.5);
          float dist = length(uv);
          if (dist > 0.5) discard;

          float softEdge = smoothstep(0.5, 0.08, dist);
          float core = smoothstep(0.24, 0.0, dist);
          vec3 finalColor = mix(vColor, vec3(1.0, 0.88, 0.94), core * (0.35 + 0.35 * uFinaleBoost));
          float alpha = softEdge * vAlpha * (0.85 + 0.15 * uFinaleBoost);

          gl_FragColor = vec4(finalColor, alpha);
        }
      `,
    });

    const heartPoints = new THREE.Points(geometry, material);
    scene.add(heartPoints);

    // Rose-gold floating sparkles (composite accent ring)
    const sparkleGeom = new THREE.OctahedronGeometry(0.06, 0);
    const sparkleMat = new THREE.MeshStandardMaterial({
      color: 0xfde68a,
      metalness: 0.85,
      roughness: 0.2,
      emissive: 0xf43f5e,
      emissiveIntensity: 0.25,
    });
    const sparkleCount = 28;
    const sparkles = new THREE.InstancedMesh(sparkleGeom, sparkleMat, sparkleCount);
    const dummy = new THREE.Object3D();
    for (let i = 0; i < sparkleCount; i++) {
      const angle = (i / sparkleCount) * Math.PI * 2;
      const r = 3.2 + (i % 4) * 0.7;
      dummy.position.set(
        Math.cos(angle) * r,
        ((i % 7) - 3) * 0.75,
        Math.sin(angle) * r * 0.6 - 1.0
      );
      dummy.scale.setScalar(0.6 + (i % 3) * 0.35);
      dummy.updateMatrix();
      sparkles.setMatrixAt(i, dummy.matrix);
    }
    sparkles.computeBoundingSphere();
    scene.add(sparkles);

    let frameId = 0;
    let disposed = false;
    let lastDomSync = -1;
    const clock = new THREE.Clock();

    const handleContextLost = (e: Event) => {
      e.preventDefault();
    };
    canvas.addEventListener('webglcontextlost', handleContextLost);

    const handleResize = () => {
      if (disposed || !container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = Math.max(1, container.clientHeight || window.innerHeight);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync?.(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      if (!sync) {
        frameId = window.setTimeout(cb, 80);
        return;
      }
      gl.flush();
      const poll = () => {
        if (disposed) {
          gl.deleteSync(sync);
          return;
        }
        const state = gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    function tick() {
      if (disposed) return;

      const totalElapsed = clock.getElapsedTime();
      lastElapsedRef.current = totalElapsed;
      const localElapsed = Math.max(0, totalElapsed - modeStartElapsedRef.current);

      const currentMode = modeRef.current;
      const state = prefersReducedMotion
        ? {
            mode: currentMode,
            phase: 'beating' as const,
            emergeProgress: 1,
            convergeProgress: 1,
            beatScale: 1,
            phaseProgress: 1,
          }
        : evaluateHeartState(currentMode, localElapsed);

      uniforms.uTime.value = totalElapsed;
      uniforms.uConverge.value = state.convergeProgress;
      uniforms.uEmerge.value = state.emergeProgress;
      uniforms.uBeat.value = state.beatScale;
      uniforms.uScale.value = currentMode === 'finale' ? 1.58 : 0.98;
      uniforms.uFinaleBoost.value = currentMode === 'finale' ? 1 : 0;

      // Gentle 3D rotation so the heart reveals its volumetric thickness
      if (!prefersReducedMotion) {
        heartPoints.rotation.y = Math.sin(totalElapsed * 0.38) * 0.34;
        heartPoints.rotation.x = Math.cos(totalElapsed * 0.25) * 0.08;
        sparkles.rotation.y = totalElapsed * 0.08;
      }

      if (totalElapsed - lastDomSync > 0.25 && containerRef.current) {
        lastDomSync = totalElapsed;
        containerRef.current.dataset.heartMode = state.mode;
        containerRef.current.dataset.heartPhase = state.phase;
        containerRef.current.dataset.heartConverge = state.convergeProgress.toFixed(2);
      }

      renderer.render(scene, camera);

      if (prefersReducedMotion) return;

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    }

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }
    tick();

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('webglcontextlost', handleContextLost);
      geometry.dispose();
      material.dispose();
      sparkleGeom.dispose();
      sparkleMat.dispose();
      scene.environment?.dispose();
      renderer.dispose();
      if (canvas.parentNode === container) {
        container.removeChild(canvas);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      data-testid="heart-3d-canvas"
      data-heart-mode={mode}
      aria-hidden="true"
      className="fixed inset-0 z-0 pointer-events-none"
    />
  );
}
