import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { CSS3DObject, CSS3DRenderer } from 'three/addons/renderers/CSS3DRenderer.js';
import {
  BubbleSpec,
  HOLD_DRAG_CANCEL_PX,
  HoldGateState,
  INNER_ZOOM_MAX,
  INNER_ZOOM_MIN,
  OUTER_ZOOM_MAX,
  OUTER_ZOOM_MIN,
  PortraitPhase,
  RingCardSlot,
  computeBubbleCenterSwell,
  computeCircleRingLayout,
  computeResponsiveFov,
  computeZoomCameraDistance,
  createInitialHoldGateState,
  generateBubbleSpecs,
  generateHeartContourLoop,
  generateHeartParticles,
  getNeighborIndices,
  heartbeatImpulse,
  shortestAngleDiff,
  stepHoldGate,
} from './portrait3d-math';

export interface PortraitStudentItem {
  name: string;
  subtitle: string;
  src: string;
  fallback: string;
}

export interface PortraitCrownItem {
  name: string;
  subtitle?: string;
  src: string;
  fallback: string;
}

export interface Portrait3DStateSnapshot {
  phase: PortraitPhase;
  holdProgress: number;
  holdSeconds: number;
  outerZoomDist: number;
  innerZoomDist: number;
  selectedIndex: number;
  totalItems: number;
  activeItem: PortraitStudentItem | null;
}

export interface Portrait3DMountOptions {
  container: HTMLElement;
  items: PortraitStudentItem[];
  crown: PortraitCrownItem;
  onStateChange?: (snapshot: Portrait3DStateSnapshot) => void;
  onEnterHeart?: () => void;
  onPhotoClickChime?: () => void;
}

const RING_RADIUS = 5.85;
const RING_Y = -0.82;
const CROWN_Y = 2.3;
const CARD_CSS_SCALE = 0.0056; // 196px CSS -> ~1.10 world units wide

function detectSoftwareWebGL(): boolean {
  try {
    const probeCanvas = document.createElement('canvas');
    const gl =
      (probeCanvas.getContext('webgl2') as WebGLRenderingContext | null) ||
      (probeCanvas.getContext('webgl') as WebGLRenderingContext | null);
    if (!gl) return true;
    const dbg = gl.getExtension('WEBGL_debug_renderer_info');
    const rendererStr = dbg
      ? String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) || '')
      : String(gl.getParameter(gl.RENDERER) || '');
    return /SwiftShader|llvmpipe|Software|Microsoft Basic Render/i.test(rendererStr);
  } catch {
    return false;
  }
}

function makeHeartHitShape(): THREE.Shape {
  const shape = new THREE.Shape();
  const steps = 64;
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * Math.PI * 2;
    const x = 16 * Math.pow(Math.sin(t), 3) * 0.115;
    const y =
      (13 * Math.cos(t) -
        5 * Math.cos(2 * t) -
        2 * Math.cos(3 * t) -
        Math.cos(4 * t)) *
        0.112 +
      0.22;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  return shape;
}

function createGlowSpriteTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 128;
  const ctx = c.getContext('2d')!;
  const grad = ctx.createRadialGradient(64, 64, 4, 64, 64, 64);
  grad.addColorStop(0, 'rgba(255, 196, 224, 0.55)');
  grad.addColorStop(0.35, 'rgba(236, 72, 153, 0.24)');
  grad.addColorStop(0.7, 'rgba(131, 24, 67, 0.08)');
  grad.addColorStop(1, 'rgba(20, 4, 14, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

class PortraitHeartScene {
  private container: HTMLElement;
  private items: PortraitStudentItem[];
  private crown: PortraitCrownItem;
  private onStateChange?: (snap: Portrait3DStateSnapshot) => void;
  private onEnterHeart?: () => void;
  private onPhotoClickChime?: () => void;

  private isSoftwareGl: boolean;
  private renderer: THREE.WebGLRenderer;
  private cssRenderer: CSS3DRenderer;
  private scene: THREE.Scene;
  private cssScene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private pmremGenerator: THREE.PMREMGenerator;
  private envRenderTarget: THREE.WebGLRenderTarget;

  private heartGroup: THREE.Group;
  private heartPoints!: THREE.Points;
  private heartMaterial!: THREE.ShaderMaterial;
  private heartHitMesh!: THREE.Mesh;
  private outerGlowSprite!: THREE.Sprite;
  private heartPulseRings: { line: THREE.LineLoop; mat: THREE.LineBasicMaterial; phaseOffset: number }[] = [];
  private orbitalStardustPoints!: THREE.Points;
  private orbitalStardustMat!: THREE.ShaderMaterial;
  private cosmosPoints!: THREE.Points;
  private cosmosMaterial!: THREE.ShaderMaterial;

  private interiorGroup: THREE.Group;
  private columnGroup: THREE.Group;
  private crownBackingMesh!: THREE.Mesh;
  private ringGroup: THREE.Group;
  private bubble3dGroup: THREE.Group;
  private bubble3dMats: THREE.ShaderMaterial[] = [];
  private bubbles: {
    spec: BubbleSpec;
    x: number;
    y: number;
    z: number;
    mesh?: THREE.Mesh;
  }[] = [];
  private bubbleCanvas: HTMLCanvasElement;
  private bubbleCtx: CanvasRenderingContext2D | null = null;
  private bubbleDpr = 1;

  private cssCrownRoot: THREE.Group;
  private cssCrownObj!: CSS3DObject;
  private cssRingRoot: THREE.Group;
  private cssCardRecords: {
    obj: CSS3DObject;
    el: HTMLDivElement;
    slot: RingCardSlot;
    worldOffsetZ: number;
    currentScale: number;
  }[] = [];

  private raycaster = new THREE.Raycaster();
  private pointerNdc = new THREE.Vector2();
  private scratchCamTarget = new THREE.Vector3();
  private scratchLookTarget = new THREE.Vector3();
  private scratchLookCurrent = new THREE.Vector3(0, 0.08, 0);
  private scratchVec = new THREE.Vector3();

  private gate: HoldGateState = createInitialHoldGateState();
  private diveAmount = 0; // 0 = outer heart, 1 = inside heart
  private heartYaw = 0.08;
  private targetHeartYaw = 0.08;
  private heartPitch = 0.05;
  private targetHeartPitch = 0.05;
  private selectedIndex = 0;
  private ringYaw = 0;
  private targetRingYaw = 0;
  private innerTiltY = 0;
  private targetInnerTiltY = 0;
  private activeCardLift = 0;

  private pointerDown = false;
  private pointerId = -1;
  private downX = 0;
  private downY = 0;
  private prevX = 0;
  private prevY = 0;
  private maxDragDist = 0;
  private pendingCardIdx: number | null = null;
  private pinchStartDist = 0;
  private pinchStartZoom = 6.9;
  private activeTouches = new Map<number, { x: number; y: number }>();

  private rafId: number | null = null;
  private timerId: number | null = null;
  private disposed = false;
  private lastTickMs = 0;
  private elapsedSec = 0;
  private lastNotifiedKey = '';
  private enterChimeFired = false;

  private disposableGeos: THREE.BufferGeometry[] = [];
  private disposableMats: THREE.Material[] = [];
  private disposableTexs: THREE.Texture[] = [];

  constructor(opts: Portrait3DMountOptions) {
    this.container = opts.container;
    this.items = opts.items;
    this.crown = opts.crown;
    this.onStateChange = opts.onStateChange;
    this.onEnterHeart = opts.onEnterHeart;
    this.onPhotoClickChime = opts.onPhotoClickChime;

    this.isSoftwareGl = detectSoftwareWebGL();
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;
    const aspect = width / Math.max(1, height);

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x130410, 0.0085);
    this.cssScene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(
      computeResponsiveFov(aspect),
      aspect,
      0.1,
      90
    );
    this.camera.position.set(0, 0.22, this.gate.outerZoomDist);
    this.camera.lookAt(this.scratchLookCurrent);

    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      alpha: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(
      this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2)
    );
    this.renderer.setSize(width, height);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;
    this.renderer.domElement.className = 'portrait-webgl-canvas';
    this.renderer.domElement.style.position = 'absolute';
    this.renderer.domElement.style.inset = '0';
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    this.renderer.domElement.style.zIndex = '1';

    this.cssRenderer = new CSS3DRenderer();
    this.cssRenderer.setSize(width, height);
    this.cssRenderer.domElement.className = 'portrait-css3d-layer';
    this.cssRenderer.domElement.style.position = 'absolute';
    this.cssRenderer.domElement.style.inset = '0';
    this.cssRenderer.domElement.style.zIndex = '2';
    this.cssRenderer.domElement.style.pointerEvents = 'none';
    this.cssRenderer.domElement.style.display = 'none';

    this.bubbleDpr = this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2);
    this.bubbleCanvas = document.createElement('canvas');
    this.bubbleCanvas.className = 'portrait-bubble-overlay';
    this.bubbleCanvas.style.position = 'absolute';
    this.bubbleCanvas.style.inset = '0';
    this.bubbleCanvas.style.width = '100%';
    this.bubbleCanvas.style.height = '100%';
    this.bubbleCanvas.style.zIndex = '3';
    this.bubbleCanvas.style.pointerEvents = 'none';
    this.bubbleCanvas.style.display = 'none';
    this.bubbleCanvas.width = Math.max(1, Math.round(width * this.bubbleDpr));
    this.bubbleCanvas.height = Math.max(1, Math.round(height * this.bubbleDpr));
    this.bubbleCtx = this.bubbleCanvas.getContext('2d');

    this.container.innerHTML = '';
    this.container.appendChild(this.renderer.domElement);
    this.container.appendChild(this.cssRenderer.domElement);
    this.container.appendChild(this.bubbleCanvas);

    // Environment map for subtle metallic rose-gold & marble sheen
    this.pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    const roomEnv = new RoomEnvironment();
    this.envRenderTarget = this.pmremGenerator.fromScene(roomEnv, 0.04);
    this.scene.environment = this.envRenderTarget.texture;
    roomEnv.dispose();

    this.heartGroup = new THREE.Group();
    this.heartGroup.position.set(0, 0.08, 0);
    this.scene.add(this.heartGroup);

    this.interiorGroup = new THREE.Group();
    this.interiorGroup.visible = false;
    this.scene.add(this.interiorGroup);

    this.columnGroup = new THREE.Group();
    this.interiorGroup.add(this.columnGroup);

    this.ringGroup = new THREE.Group();
    this.interiorGroup.add(this.ringGroup);

    this.bubble3dGroup = new THREE.Group();
    this.interiorGroup.add(this.bubble3dGroup);

    this.cssCrownRoot = new THREE.Group();
    this.cssScene.add(this.cssCrownRoot);

    this.cssRingRoot = new THREE.Group();
    this.cssScene.add(this.cssRingRoot);

    this.buildLights();
    this.buildCosmosBackground();
    this.buildOuterHeart();
    this.buildInteriorMonument();
    this.buildCircularStudentRing();
    this.buildSoapBubbles();

    this.bindEvents();
    this.notifyState(true);
    this.lastTickMs = performance.now();
    this.scheduleNextTick();
  }

  private buildLights(): void {
    const hemi = new THREE.HemisphereLight(0xffd6e8, 0x2a0818, 0.85);
    this.scene.add(hemi);

    const key = new THREE.DirectionalLight(0xfff1f6, 1.8);
    key.position.set(4.5, 8.5, 6.5);
    this.scene.add(key);

    const rim = new THREE.DirectionalLight(0xf472b6, 1.35);
    rim.position.set(-5.5, 4.0, -5.0);
    this.scene.add(rim);

    const columnGlow = new THREE.PointLight(0xffb3d1, 2.8, 14, 1.5);
    columnGlow.position.set(0, 2.4, 1.8);
    this.interiorGroup.add(columnGlow);

    const floorBounce = new THREE.PointLight(0xbe185d, 1.6, 13, 1.6);
    floorBounce.position.set(0, -1.6, 3.2);
    this.interiorGroup.add(floorBounce);
  }

  private buildCosmosBackground(): void {
    const starCount = this.isSoftwareGl ? 420 : 1080;
    const pos = new Float32Array(starCount * 3);
    const col = new Float32Array(starCount * 3);
    const sz = new Float32Array(starCount);
    const ph = new Float32Array(starCount);
    const isStar = new Float32Array(starCount);

    const palette = [
      new THREE.Color('#fff5f8'),
      new THREE.Color('#fbcfe8'),
      new THREE.Color('#f472b6'),
      new THREE.Color('#fda4af'),
      new THREE.Color('#e9d5ff'),
      new THREE.Color('#fde68a'),
    ];

    let s = 90122026;
    const rand = () => {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    };

    for (let i = 0; i < starCount; i++) {
      const r = 9.5 + rand() * 25.0;
      const theta = rand() * Math.PI * 2;
      const phi = Math.acos(2 * rand() - 1);
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = (rand() * 2 - 1) * 26.0;
      pos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);

      const c = palette[Math.floor(rand() * palette.length)];
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;

      const starRoll = rand();
      if (starRoll < 0.22) {
        isStar[i] = 1.0;
        sz[i] = 1.7 + rand() * 1.9;
      } else {
        isStar[i] = 0.0;
        sz[i] = rand() < 0.2 ? 3.0 + rand() * 4.6 : 0.75 + rand() * 1.5;
      }
      ph[i] = rand() * Math.PI * 2;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('aColor', new THREE.BufferAttribute(col, 3));
    geo.setAttribute('aSize', new THREE.BufferAttribute(sz, 1));
    geo.setAttribute('aPhase', new THREE.BufferAttribute(ph, 1));
    geo.setAttribute('aIsStar', new THREE.BufferAttribute(isStar, 1));
    this.disposableGeos.push(geo);

    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: {
          value: this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2),
        },
      },
      vertexShader: `
        attribute vec3 aColor;
        attribute float aSize;
        attribute float aPhase;
        attribute float aIsStar;
        uniform float uTime;
        uniform float uPixelRatio;
        varying vec3 vColor;
        varying float vAlpha;
        varying float vSoft;
        varying float vIsStar;

        void main() {
          vColor = aColor;
          vIsStar = aIsStar;
          vSoft = step(2.6, aSize) * (1.0 - aIsStar);

          vec3 p = position;
          // Gentle continuous upward drift wrapping smoothly so backdrop always feels alive
          p.y = mod(p.y + uTime * (0.18 + 0.1 * aIsStar) + 26.0, 52.0) - 26.0;
          p.x += sin(uTime * 0.45 + aPhase) * 0.22;

          float tw = 0.55 + 0.45 * sin(uTime * (1.5 + aIsStar * 1.4) + aPhase);
          vAlpha = mix(0.36, 0.96, tw) * mix(1.0, 0.42, vSoft);
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = clamp(aSize * uPixelRatio * (54.0 / max(4.0, -mv.z)), 1.6, 30.0);
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;
        varying float vSoft;
        varying float vIsStar;

        void main() {
          vec2 uv = gl_PointCoord - vec2(0.5);
          float d = length(uv);
          if (d > 0.5) discard;

          if (vIsStar > 0.5) {
            float armX = pow(max(0.0, 1.0 - abs(uv.x) * 8.0), 2.0) * smoothstep(0.5, 0.04, abs(uv.y));
            float armY = pow(max(0.0, 1.0 - abs(uv.y) * 8.0), 2.0) * smoothstep(0.5, 0.04, abs(uv.x));
            float core = smoothstep(0.24, 0.0, d);
            float mask = clamp(core + (armX + armY) * 0.72, 0.0, 1.0);
            vec3 c = mix(vColor, vec3(1.0, 0.98, 0.94), core * 0.65);
            gl_FragColor = vec4(c, vAlpha * mask);
          } else {
            float sharp = smoothstep(0.5, 0.08, d);
            float bokeh = smoothstep(0.5, 0.16, d) * 0.68;
            float mask = mix(sharp, bokeh, vSoft);
            gl_FragColor = vec4(vColor, vAlpha * mask);
          }
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.disposableMats.push(mat);

    this.cosmosMaterial = mat;
    this.cosmosPoints = new THREE.Points(geo, mat);
    this.scene.add(this.cosmosPoints);
  }

  private buildOuterHeart(): void {
    const glowTex = createGlowSpriteTexture();
    this.disposableTexs.push(glowTex);

    const spriteMat = new THREE.SpriteMaterial({
      map: glowTex,
      color: 0xf472b6,
      transparent: true,
      opacity: 0.42,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.disposableMats.push(spriteMat);

    this.outerGlowSprite = new THREE.Sprite(spriteMat);
    this.outerGlowSprite.scale.set(5.4, 5.1, 1);
    this.outerGlowSprite.position.set(0, 0, -0.4);
    this.heartGroup.add(this.outerGlowSprite);

    const count = this.isSoftwareGl ? 2800 : 5200;
    const data = generateHeartParticles(count, 20261120);

    const basePos = new Float32Array(count * 3);
    const domePos = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const phases = new Float32Array(count);
    const speeds = new Float32Array(count);
    const isRimAttr = new Float32Array(count);

    // Reference image rose-pink / pearl / dusty magenta glitter palette
    const palette = [
      new THREE.Color('#fff1f5'), // bright pearl highlight
      new THREE.Color('#fbcfe8'), // luminous blush pink
      new THREE.Color('#f472b6'), // rose pink
      new THREE.Color('#db2777'), // deep pink magenta
      new THREE.Color('#831843'), // shadowed plum magenta
    ];

    for (let i = 0; i < count; i++) {
      const p = data[i];
      basePos[i * 3] = p.hx;
      basePos[i * 3 + 1] = p.hy;
      basePos[i * 3 + 2] = p.hz;

      domePos[i * 3] = p.dx;
      domePos[i * 3 + 1] = p.dy;
      domePos[i * 3 + 2] = p.dz;

      const c = palette[p.colorIdx] || palette[2];
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;

      sizes[i] = p.size;
      phases[i] = p.phase;
      speeds[i] = p.twinkleSpeed;
      isRimAttr[i] = p.isRim ? 1.0 : 0.0;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(basePos, 3));
    geo.setAttribute('aDomePos', new THREE.BufferAttribute(domePos, 3));
    geo.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
    geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
    geo.setAttribute('aSpeed', new THREE.BufferAttribute(speeds, 1));
    geo.setAttribute('aIsRim', new THREE.BufferAttribute(isRimAttr, 1));
    this.disposableGeos.push(geo);

    this.heartMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uBeat: { value: 1.0 },
        uDive: { value: 0.0 },
        uHold: { value: 0.0 },
        uPixelRatio: {
          value: this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2),
        },
      },
      vertexShader: `
        attribute vec3 aDomePos;
        attribute vec3 aColor;
        attribute float aSize;
        attribute float aPhase;
        attribute float aSpeed;
        attribute float aIsRim;
        uniform float uTime;
        uniform float uBeat;
        uniform float uDive;
        uniform float uHold;
        uniform float uPixelRatio;

        varying vec3 vColor;
        varying float vTwinkle;
        varying float vDive;
        varying float vRim;

        void main() {
          float easedDive = uDive * uDive * (3.0 - 2.0 * uDive);
          vec3 heartP = position * uBeat;
          // Gentle living glitter shimmer around each resting position
          heartP += vec3(
            sin(uTime * 1.3 + aPhase) * 0.015,
            cos(uTime * 1.1 + aPhase * 1.3) * 0.015,
            sin(uTime * 1.5 + aPhase * 0.7) * 0.015
          ) * (1.0 - easedDive);

          // Giant outer heart continues beating noticeably around the monument when inside
          float innerBeat = 1.0 + (uBeat - 1.0) * 2.2;
          vec3 domeBeating = aDomePos * innerBeat;
          vec3 pos = mix(heartP, domeBeating, easedDive);
          vec4 mv = modelViewMatrix * vec4(pos, 1.0);
          gl_Position = projectionMatrix * mv;

          float beatGlow = (uBeat - 1.0) * 5.2;
          float twinkle = 0.55 + 0.45 * sin(uTime * aSpeed + aPhase);
          vTwinkle = twinkle + uHold * 0.35 + beatGlow * easedDive;
          vDive = easedDive;
          vRim = aIsRim;
          vColor = mix(aColor, vec3(1.0, 0.94, 0.97), (uHold * 0.25 * twinkle) + (aIsRim * easedDive * 0.22));

          float dist = max(1.6, -mv.z);
          float baseScale = mix(1.0, 2.75, easedDive) * mix(1.0, 1.38, aIsRim * easedDive) * (1.0 + uHold * 0.28);
          gl_PointSize = clamp(aSize * baseScale * uPixelRatio * (34.0 / dist), 1.8, 34.0);
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vTwinkle;
        varying float vDive;
        varying float vRim;

        void main() {
          vec2 uv = gl_PointCoord - vec2(0.5);
          float d = length(uv);
          if (d > 0.5) discard;

          // Bright glittering core + soft rosy bokeh halo matching reference
          float core = smoothstep(0.24, 0.0, d);
          float halo = smoothstep(0.5, 0.06, d) * 0.62;
          float flare = max(0.0, 1.0 - abs(uv.x) * 9.0) * max(0.0, 1.0 - abs(uv.y) * 9.0);
          float alpha = (core + halo + flare * 0.45) * (0.42 + 0.58 * vTwinkle);
          alpha *= mix(1.0, mix(0.68, 0.98, vRim), vDive);

          vec3 col = mix(vColor, vec3(1.0, 0.96, 0.98), core * 0.55);
          gl_FragColor = vec4(col, clamp(alpha, 0.0, 1.0));
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.disposableMats.push(this.heartMaterial);

    this.heartPoints = new THREE.Points(geo, this.heartMaterial);
    this.heartPoints.frustumCulled = false;
    this.heartGroup.add(this.heartPoints);

    // Invisible 3D raycast hit mesh tightly matching the heart silhouette for the strict 3s hold
    const shape = makeHeartHitShape();
    const hitGeo = new THREE.ExtrudeGeometry(shape, {
      depth: 0.72,
      bevelEnabled: true,
      bevelSize: 0.3,
      bevelThickness: 0.3,
      bevelSegments: 4,
    });
    hitGeo.center();
    hitGeo.scale(0.96, 0.96, 1.0);
    this.disposableGeos.push(hitGeo);

    const hitMat = new THREE.MeshBasicMaterial({
      visible: false,
    });
    this.disposableMats.push(hitMat);
    this.heartHitMesh = new THREE.Mesh(hitGeo, hitMat);
    this.heartGroup.add(this.heartHitMesh);

    // Dual expanding heartbeat contour shockwave rings around the outer heart
    const contourPts = generateHeartContourLoop(96);
    const ringPositions = new Float32Array(contourPts.length * 3);
    for (let i = 0; i < contourPts.length; i++) {
      ringPositions[i * 3] = contourPts[i].x;
      ringPositions[i * 3 + 1] = contourPts[i].y;
      ringPositions[i * 3 + 2] = 0;
    }
    const pulseGeo = new THREE.BufferGeometry();
    pulseGeo.setAttribute('position', new THREE.BufferAttribute(ringPositions, 3));
    this.disposableGeos.push(pulseGeo);

    const pulseSpecs = [
      { color: 0xf9a8d4, phaseOffset: 0.0 },
      { color: 0xfde68a, phaseOffset: 0.24 },
    ];
    for (const ps of pulseSpecs) {
      const pMat = new THREE.LineBasicMaterial({
        color: ps.color,
        transparent: true,
        opacity: 0.38,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      this.disposableMats.push(pMat);
      const line = new THREE.LineLoop(pulseGeo, pMat);
      line.position.set(0, -0.1, -0.05);
      this.heartGroup.add(line);
      this.heartPulseRings.push({ line, mat: pMat, phaseOffset: ps.phaseOffset });
    }

    // Orbital stardust swirl surrounding the outer heart & expanding into lantern sparks inside
    const swirlCount = this.isSoftwareGl ? 240 : 560;
    const swBase = new Float32Array(swirlCount * 3);
    const swInner = new Float32Array(swirlCount * 3);
    const swCol = new Float32Array(swirlCount * 3);
    const swSize = new Float32Array(swirlCount);
    const swPhase = new Float32Array(swirlCount);

    const swPalette = [
      new THREE.Color('#fff5f8'),
      new THREE.Color('#fbcfe8'),
      new THREE.Color('#fde68a'),
      new THREE.Color('#f472b6'),
    ];
    let swSeed = 45201120;
    const swRand = () => {
      swSeed = (swSeed * 1664525 + 1013904223) >>> 0;
      return swSeed / 4294967296;
    };

    for (let i = 0; i < swirlCount; i++) {
      const ang = swRand() * Math.PI * 2;
      const rad = 1.75 + swRand() * 1.45;
      const tiltY = (swRand() - 0.5) * 1.6;
      swBase[i * 3] = Math.cos(ang) * rad;
      swBase[i * 3 + 1] = tiltY + Math.sin(ang * 2.0) * 0.42;
      swBase[i * 3 + 2] = Math.sin(ang) * rad * 0.86;

      const iAng = ang + (swRand() - 0.5) * 0.6;
      const iRad = 4.4 + swRand() * 3.6;
      swInner[i * 3] = Math.cos(iAng) * iRad;
      swInner[i * 3 + 1] = -1.6 + swRand() * 5.2;
      swInner[i * 3 + 2] = Math.sin(iAng) * iRad;

      const c = swPalette[Math.floor(swRand() * swPalette.length)];
      swCol[i * 3] = c.r;
      swCol[i * 3 + 1] = c.g;
      swCol[i * 3 + 2] = c.b;
      swSize[i] = 1.1 + swRand() * 2.1;
      swPhase[i] = swRand() * Math.PI * 2;
    }

    const swGeo = new THREE.BufferGeometry();
    swGeo.setAttribute('position', new THREE.BufferAttribute(swBase, 3));
    swGeo.setAttribute('aInnerPos', new THREE.BufferAttribute(swInner, 3));
    swGeo.setAttribute('aColor', new THREE.BufferAttribute(swCol, 3));
    swGeo.setAttribute('aSize', new THREE.BufferAttribute(swSize, 1));
    swGeo.setAttribute('aPhase', new THREE.BufferAttribute(swPhase, 1));
    this.disposableGeos.push(swGeo);

    this.orbitalStardustMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uDive: { value: 0 },
        uHold: { value: 0 },
        uPixelRatio: {
          value: this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2),
        },
      },
      vertexShader: `
        attribute vec3 aInnerPos;
        attribute vec3 aColor;
        attribute float aSize;
        attribute float aPhase;
        uniform float uTime;
        uniform float uDive;
        uniform float uHold;
        uniform float uPixelRatio;
        varying vec3 vColor;
        varying float vAlpha;

        void main() {
          float easedDive = uDive * uDive * (3.0 - 2.0 * uDive);
          vec3 baseP = mix(position, aInnerPos, easedDive);

          float spin = uTime * mix(0.28, 0.14, easedDive) + aPhase * 0.15;
          float cs = cos(spin);
          float sn = sin(spin);
          vec3 p = vec3(
            baseP.x * cs - baseP.z * sn,
            baseP.y + sin(uTime * 1.1 + aPhase) * 0.14,
            baseP.x * sn + baseP.z * cs
          );

          vColor = mix(aColor, vec3(1.0, 0.96, 0.9), uHold * 0.25);
          float tw = 0.5 + 0.5 * sin(uTime * 2.6 + aPhase);
          vAlpha = (0.35 + 0.65 * tw) * mix(0.88, 0.72, easedDive);

          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mv;
          float dist = max(1.8, -mv.z);
          gl_PointSize = clamp(aSize * (1.0 + uHold * 0.3) * uPixelRatio * (38.0 / dist), 1.8, 26.0);
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;

        void main() {
          vec2 uv = gl_PointCoord - vec2(0.5);
          float d = length(uv);
          if (d > 0.5) discard;
          float core = smoothstep(0.28, 0.0, d);
          float glow = smoothstep(0.5, 0.06, d) * 0.6;
          gl_FragColor = vec4(vColor, vAlpha * clamp(core + glow, 0.0, 1.0));
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.disposableMats.push(this.orbitalStardustMat);

    this.orbitalStardustPoints = new THREE.Points(swGeo, this.orbitalStardustMat);
    this.orbitalStardustPoints.frustumCulled = false;
    this.heartGroup.add(this.orbitalStardustPoints);
  }

  private buildInteriorMonument(): void {
    // Shared materials (rose-marble, warm rose-gold, obsidian rose floor)
    const marbleMat = new THREE.MeshStandardMaterial({
      color: 0xfff0f5,
      roughness: 0.32,
      metalness: 0.06,
    });
    const roseGoldMat = new THREE.MeshStandardMaterial({
      color: 0xf4b6c8,
      roughness: 0.24,
      metalness: 0.78,
      emissive: 0x3b0b20,
      emissiveIntensity: 0.24,
    });
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x1a0613,
      roughness: 0.25,
      metalness: 0.42,
      transparent: true,
      opacity: 0.72,
    });
    const ringGlowMat = new THREE.MeshBasicMaterial({
      color: 0xf9a8d4,
      transparent: true,
      opacity: 0.58,
    });
    this.disposableMats.push(marbleMat, roseGoldMat, floorMat, ringGlowMat);

    // 1. Wide circular obsidian-rose stage floor disc (y = -2.26)
    const floorGeo = new THREE.CylinderGeometry(7.05, 7.25, 0.16, 48);
    this.disposableGeos.push(floorGeo);
    const floorDisc = new THREE.Mesh(floorGeo, floorMat);
    floorDisc.position.set(0, -2.26, 0);
    this.columnGroup.add(floorDisc);

    // Outer orbital ring on floor under the circular student pedestals
    const orbitRingGeo = new THREE.TorusGeometry(RING_RADIUS, 0.032, 12, 72);
    this.disposableGeos.push(orbitRingGeo);
    const orbitRing = new THREE.Mesh(orbitRingGeo, ringGlowMat);
    orbitRing.rotation.x = Math.PI * 0.5;
    orbitRing.position.set(0, -2.16, 0);
    this.columnGroup.add(orbitRing);

    // 2. Stepped 3-tier Classical Pedestal Base
    const base1Geo = new THREE.CylinderGeometry(1.18, 1.32, 0.22, 36);
    const base2Geo = new THREE.CylinderGeometry(0.92, 1.06, 0.22, 36);
    const baseTrimGeo = new THREE.TorusGeometry(0.96, 0.045, 12, 36);
    const base3Geo = new THREE.CylinderGeometry(0.68, 0.84, 0.2, 36);
    this.disposableGeos.push(base1Geo, base2Geo, baseTrimGeo, base3Geo);

    const base1 = new THREE.Mesh(base1Geo, marbleMat);
    base1.position.y = -2.07;
    const base2 = new THREE.Mesh(base2Geo, marbleMat);
    base2.position.y = -1.85;
    const baseTrim = new THREE.Mesh(baseTrimGeo, roseGoldMat);
    baseTrim.rotation.x = Math.PI * 0.5;
    baseTrim.position.y = -1.74;
    const base3 = new THREE.Mesh(base3Geo, marbleMat);
    base3.position.y = -1.64;
    this.columnGroup.add(base1, base2, baseTrim, base3);

    // 3. Fluted Tapered Column Shaft + Vertical Ribs + Mid Collar
    const shaftGeo = new THREE.CylinderGeometry(0.42, 0.54, 2.52, 32);
    const ribGeo = new THREE.CylinderGeometry(0.042, 0.048, 2.42, 8);
    const midCollarGeo = new THREE.TorusGeometry(0.5, 0.042, 12, 32);
    this.disposableGeos.push(shaftGeo, ribGeo, midCollarGeo);

    const shaft = new THREE.Mesh(shaftGeo, marbleMat);
    shaft.position.y = -0.28;
    this.columnGroup.add(shaft);

    for (let i = 0; i < 8; i++) {
      const ang = (Math.PI * 2 * i) / 8;
      const rib = new THREE.Mesh(ribGeo, roseGoldMat);
      rib.position.set(Math.cos(ang) * 0.47, -0.28, Math.sin(ang) * 0.47);
      this.columnGroup.add(rib);
    }

    const midCollar = new THREE.Mesh(midCollarGeo, roseGoldMat);
    midCollar.rotation.x = Math.PI * 0.5;
    midCollar.position.y = -0.28;
    this.columnGroup.add(midCollar);

    // 4. Lotus Capital + Rose-Gold Cradle on Top of Column
    const cap1Geo = new THREE.CylinderGeometry(0.74, 0.44, 0.28, 32);
    const capTrimGeo = new THREE.TorusGeometry(0.75, 0.048, 12, 32);
    const capTopGeo = new THREE.CylinderGeometry(0.82, 0.78, 0.14, 32);
    this.disposableGeos.push(cap1Geo, capTrimGeo, capTopGeo);

    const cap1 = new THREE.Mesh(cap1Geo, marbleMat);
    cap1.position.y = 1.12;
    const capTrim = new THREE.Mesh(capTrimGeo, roseGoldMat);
    capTrim.rotation.x = Math.PI * 0.5;
    capTrim.position.y = 1.24;
    const capTop = new THREE.Mesh(capTopGeo, roseGoldMat);
    capTop.position.y = 1.33;
    this.columnGroup.add(cap1, capTrim, capTop);

    // 5. Backing plate for the Crown Memorial Photo sitting flush on top of the column
    const crownPlateGeo = new THREE.BoxGeometry(2.58, 1.94, 0.08);
    this.disposableGeos.push(crownPlateGeo);
    this.crownBackingMesh = new THREE.Mesh(crownPlateGeo, roseGoldMat);
    this.crownBackingMesh.position.set(0, CROWN_Y, -0.05);
    this.columnGroup.add(this.crownBackingMesh);

    // CSS3D Crown Memorial Photo seated cleanly in front of the backing plate
    const crownEl = document.createElement('div');
    crownEl.className = 'p3d-crown-card';
    crownEl.innerHTML =
      '<div class="p3d-crown-img-wrap">' +
        `<img src="${this.crown.src}" alt="${this.crown.name}" referrerpolicy="no-referrer" />` +
      '</div>' +
      `<div class="p3d-crown-label">✨ ${this.crown.name} ✨</div>`;

    const crownImg = crownEl.querySelector('img');
    if (crownImg) {
      crownImg.addEventListener('error', () => {
        crownImg.src = this.crown.fallback;
      });
    }
    crownEl.addEventListener('click', (e) => {
      e.stopPropagation();
      this.onPhotoClickChime?.();
    });

    this.cssCrownObj = new CSS3DObject(crownEl);
    this.cssCrownObj.position.set(0, CROWN_Y, 0.02);
    this.cssCrownObj.scale.setScalar(0.0076); // ~320px -> 2.43 world units wide
    this.cssCrownRoot.add(this.cssCrownObj);
  }

  private buildCircularStudentRing(): void {
    const slots = computeCircleRingLayout(
      this.items.length,
      RING_RADIUS,
      RING_Y
    );

    const baseGeo = new THREE.CylinderGeometry(0.42, 0.5, 0.14, 24);
    const pillarGeo = new THREE.CylinderGeometry(0.22, 0.28, 0.38, 24);
    const capGeo = new THREE.CylinderGeometry(0.36, 0.27, 0.08, 24);
    const marbleStandMat = new THREE.MeshStandardMaterial({
      color: 0xfff0f5,
      roughness: 0.3,
      metalness: 0.08,
    });
    const roseGoldStandMat = new THREE.MeshStandardMaterial({
      color: 0xf4b6c8,
      roughness: 0.25,
      metalness: 0.76,
      emissive: 0x4c0519,
      emissiveIntensity: 0.32,
    });
    this.disposableGeos.push(baseGeo, pillarGeo, capGeo);
    this.disposableMats.push(marbleStandMat, roseGoldStandMat);

    for (let i = 0; i < slots.length; i++) {
      const slot = slots[i];
      const item = this.items[i];

      // Individual mini pedestal pillar directly beneath each student portrait (no pair links)
      const base = new THREE.Mesh(baseGeo, roseGoldStandMat);
      base.position.set(slot.x, -2.11, slot.z);
      const pillar = new THREE.Mesh(pillarGeo, marbleStandMat);
      pillar.position.set(slot.x, -1.91, slot.z);
      const cap = new THREE.Mesh(capGeo, roseGoldStandMat);
      cap.position.set(slot.x, -1.72, slot.z);
      this.ringGroup.add(base, pillar, cap);

      // Framed CSS3D student portrait card without pair labels
      const el = document.createElement('div');
      el.className = 'p3d-student-card';
      el.dataset.index = String(i);
      el.innerHTML =
        `<div class="p3d-order-pill">♥ ${String(i + 1).padStart(2, '0')} / ${this.items.length}</div>` +
        '<div class="p3d-photo-wrap">' +
          `<img src="${item.src}" alt="${item.name}" referrerpolicy="no-referrer" />` +
        '</div>' +
        '<div class="p3d-caption">' +
          `<div class="p3d-name">${item.name}</div>` +
          `<div class="p3d-sub">${item.subtitle}</div>` +
        '</div>';

      const img = el.querySelector('img');
      if (img) {
        img.addEventListener('error', () => {
          img.src = item.fallback;
        });
      }

      const cssObj = new CSS3DObject(el);
      cssObj.position.set(slot.x, slot.y, slot.z);
      cssObj.rotation.y = slot.rotY;
      cssObj.scale.setScalar(CARD_CSS_SCALE);
      this.cssRingRoot.add(cssObj);

      this.cssCardRecords.push({
        obj: cssObj,
        el,
        slot,
        worldOffsetZ: 0,
        currentScale: CARD_CSS_SCALE,
      });
    }
  }

  private buildSoapBubbles(): void {
    const specs = generateBubbleSpecs(24, 11202026);
    const sphereGeo = this.isSoftwareGl
      ? new THREE.SphereGeometry(1, 16, 12)
      : new THREE.SphereGeometry(1, 24, 18);
    this.disposableGeos.push(sphereGeo);

    const sharedBubbleMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uOpacity: { value: 0.9 },
      },
      vertexShader: `
        uniform float uTime;
        varying vec3 vNormalView;
        varying vec3 vViewDir;
        varying float vHueOffset;

        void main() {
          vec4 worldOrigin = modelMatrix * vec4(0.0, 0.0, 0.0, 1.0);
          vHueOffset = fract(sin(dot(worldOrigin.xz, vec2(12.9898, 78.233))) * 43758.5453);
          float wob = sin(uTime * 2.2 + position.y * 3.4 + position.x * 2.1 + vHueOffset * 6.28) * 0.028;
          vec3 p = position * (1.0 + wob);
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          vNormalView = normalize(normalMatrix * normal);
          vViewDir = normalize(-mv.xyz);
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform float uOpacity;
        varying vec3 vNormalView;
        varying vec3 vViewDir;
        varying float vHueOffset;

        vec3 thinFilmPalette(float t) {
          vec3 a = vec3(0.76, 0.78, 0.88);
          vec3 b = vec3(0.24, 0.22, 0.22);
          vec3 c = vec3(1.0, 1.0, 1.0);
          vec3 d = vec3(0.88, 0.18, 0.46);
          return a + b * cos(6.28318 * (c * t + d));
        }

        void main() {
          vec3 N = normalize(vNormalView);
          vec3 V = normalize(vViewDir);
          float ndotv = clamp(dot(N, V), 0.0, 1.0);
          float fresnel = pow(1.0 - ndotv, 2.35);

          float filmCoord = fresnel * 1.35 + vHueOffset + uTime * 0.16 + N.y * 0.28;
          vec3 irid = thinFilmPalette(filmCoord);

          vec3 L1 = normalize(vec3(-0.55, 0.72, 0.42));
          vec3 H1 = normalize(L1 + V);
          float spec1 = pow(max(0.0, dot(N, H1)), 48.0);

          vec3 L2 = normalize(vec3(0.45, -0.58, 0.48));
          vec3 H2 = normalize(L2 + V);
          float spec2 = pow(max(0.0, dot(N, H2)), 24.0) * 0.45;

          vec3 col = mix(irid, vec3(1.0, 0.98, 1.0), clamp(spec1 + spec2, 0.0, 1.0));
          float alpha = (0.032 + fresnel * 0.56 + spec1 * 0.78 + spec2 * 0.35) * uOpacity;
          gl_FragColor = vec4(col, clamp(alpha, 0.0, 0.92));
        }
      `,
      transparent: true,
      depthWrite: false,
      side: THREE.FrontSide,
    });
    this.disposableMats.push(sharedBubbleMat);
    this.bubble3dMats.push(sharedBubbleMat);

    for (const spec of specs) {
      if (spec.isForeground) {
        this.bubbles.push({
          spec,
          x: spec.x,
          y: spec.y,
          z: spec.z,
        });
        continue;
      }

      const mesh = new THREE.Mesh(sphereGeo, sharedBubbleMat);
      mesh.position.set(spec.x, spec.y, spec.z);
      mesh.scale.setScalar(spec.baseRadius);
      this.bubble3dGroup.add(mesh);

      this.bubbles.push({
        spec,
        x: spec.x,
        y: spec.y,
        z: spec.z,
        mesh,
      });
    }
  }

  private onCardClick(idx: number): void {
    if (this.gate.phase !== 'inner' && this.gate.phase !== 'photo-zoom') return;
    this.onPhotoClickChime?.();

    if (this.gate.phase === 'inner') {
      if (this.selectedIndex === idx) {
        this.openActivePhoto();
      } else {
        this.selectStudent(idx);
      }
      return;
    }

    // In photo-zoom: clicking the active card closes zoom; clicking a neighbor glides smoothly to it
    if (this.gate.phase === 'photo-zoom') {
      if (this.selectedIndex === idx) {
        this.closeActivePhoto();
      } else {
        this.selectStudent(idx);
      }
    }
  }

  public selectStudent(idx: number): void {
    if (this.items.length === 0) return;
    const norm = ((idx % this.items.length) + this.items.length) % this.items.length;
    this.selectedIndex = norm;
    const slotAngle = this.cssCardRecords[norm]?.slot.angleRad ?? 0;
    const desiredYaw = -slotAngle;
    this.targetRingYaw = this.ringYaw + shortestAngleDiff(desiredYaw, this.ringYaw);
    this.notifyState(true);
  }

  public stepStudent(delta: number): void {
    this.selectStudent(this.selectedIndex + delta);
  }

  public openActivePhoto(): void {
    if (this.gate.phase !== 'inner') return;
    this.gate = stepHoldGate(this.gate, { dtSeconds: 0, openPhoto: true });
    this.selectStudent(this.selectedIndex);
    this.notifyState(true);
  }

  public closeActivePhoto(): void {
    if (this.gate.phase !== 'photo-zoom') return;
    this.gate = stepHoldGate(this.gate, { dtSeconds: 0, closePhoto: true });
    this.notifyState(true);
  }

  public exitToOuter(): void {
    if (this.gate.phase !== 'inner' && this.gate.phase !== 'photo-zoom') return;
    this.gate = stepHoldGate(this.gate, { dtSeconds: 0, exitRequested: true });
    this.enterChimeFired = false;
    this.notifyState(true);
  }

  public adjustOuterZoom(delta: number): void {
    if (this.gate.phase !== 'outer' && this.gate.phase !== 'holding') return;
    this.gate = stepHoldGate(this.gate, { dtSeconds: 0, zoomDelta: delta });
    this.notifyState(true);
  }

  public adjustInnerZoom(delta: number): void {
    if (this.gate.phase !== 'inner') return;
    this.gate = stepHoldGate(this.gate, { dtSeconds: 0, innerZoomDelta: delta });
    this.notifyState(true);
  }

  private isHitOnHeart(clientX: number, clientY: number): boolean {
    const rect = this.renderer.domElement.getBoundingClientRect();
    if (!rect.width || !rect.height) return false;
    this.pointerNdc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    this.pointerNdc.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.pointerNdc, this.camera);
    const hits = this.raycaster.intersectObject(this.heartHitMesh, false);
    return hits.length > 0;
  }

  private bindEvents(): void {
    const onPointerDown = (e: PointerEvent) => {
      if ((e.target as HTMLElement | null)?.closest('button, .top-bar, .vinyl-player')) {
        return;
      }
      this.activeTouches.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (this.activeTouches.size === 2) {
        // Pinch gesture cancels 3s hold cleanly
        const pts = Array.from(this.activeTouches.values());
        this.pinchStartDist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
        this.pinchStartZoom =
          this.gate.phase === 'inner'
            ? this.gate.innerZoomDist
            : this.gate.outerZoomDist;
        this.gate = stepHoldGate(this.gate, { dtSeconds: 0, cancelHold: true });
        return;
      }

      this.pointerDown = true;
      this.pointerId = e.pointerId;
      this.downX = e.clientX;
      this.downY = e.clientY;
      this.prevX = e.clientX;
      this.prevY = e.clientY;
      this.maxDragDist = 0;
      const cardEl = (e.target as HTMLElement | null)?.closest('.p3d-student-card') as HTMLElement | null;
      this.pendingCardIdx = cardEl && cardEl.dataset.index ? Number(cardEl.dataset.index) : null;

      if (this.gate.phase === 'outer' || this.gate.phase === 'holding') {
        const hitHeart = this.isHitOnHeart(e.clientX, e.clientY);
        this.gate = stepHoldGate(this.gate, {
          dtSeconds: 0,
          pointerDownOnHeart: hitHeart,
          dragDistancePx: 0,
        });
        this.notifyState(true);
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      if (this.activeTouches.has(e.pointerId)) {
        this.activeTouches.set(e.pointerId, { x: e.clientX, y: e.clientY });
      }

      if (this.activeTouches.size === 2) {
        const pts = Array.from(this.activeTouches.values());
        const d = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
        if (this.pinchStartDist > 10 && d > 10) {
          if (this.gate.phase === 'outer' || this.gate.phase === 'holding') {
            const targetZoom = Math.max(
              OUTER_ZOOM_MIN,
              Math.min(OUTER_ZOOM_MAX, this.pinchStartZoom * (this.pinchStartDist / d))
            );
            this.gate = stepHoldGate(this.gate, {
              dtSeconds: 0,
              zoomDelta: targetZoom - this.gate.outerZoomDist,
              cancelHold: true,
            });
          } else if (this.gate.phase === 'inner') {
            const targetZoom = Math.max(
              INNER_ZOOM_MIN,
              Math.min(INNER_ZOOM_MAX, this.pinchStartZoom * (this.pinchStartDist / d))
            );
            this.gate = stepHoldGate(this.gate, {
              dtSeconds: 0,
              innerZoomDelta: targetZoom - this.gate.innerZoomDist,
            });
          }
          this.notifyState(true);
        }
        return;
      }

      if (!this.pointerDown || e.pointerId !== this.pointerId) return;

      const dx = e.clientX - this.prevX;
      const dy = e.clientY - this.prevY;
      this.prevX = e.clientX;
      this.prevY = e.clientY;
      this.maxDragDist = Math.max(
        this.maxDragDist,
        Math.hypot(e.clientX - this.downX, e.clientY - this.downY)
      );

      if (this.gate.phase === 'outer' || this.gate.phase === 'holding') {
        if (this.maxDragDist > HOLD_DRAG_CANCEL_PX) {
          this.targetHeartYaw += dx * 0.0085;
          this.targetHeartPitch = Math.max(
            -0.85,
            Math.min(0.85, this.targetHeartPitch + dy * 0.0065)
          );
        }
        this.gate = stepHoldGate(this.gate, {
          dtSeconds: 0,
          dragDistancePx: this.maxDragDist,
        });
      } else if (this.gate.phase === 'inner') {
        this.targetRingYaw += dx * 0.0065;
        this.targetInnerTiltY = Math.max(
          -1.2,
          Math.min(2.2, this.targetInnerTiltY + dy * 0.008)
        );
        this.syncSelectedIndexFromYaw();
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      this.activeTouches.delete(e.pointerId);
      if (e.pointerId !== this.pointerId) return;
      this.pointerDown = false;
      const tappedCardIdx = this.pendingCardIdx;
      this.pendingCardIdx = null;

      if (this.gate.phase === 'outer' || this.gate.phase === 'holding') {
        this.gate = stepHoldGate(this.gate, {
          dtSeconds: 0,
          pointerDownOnHeart: false,
          cancelHold: true,
        });
        this.notifyState(true);
      } else if (
        (this.gate.phase === 'inner' || this.gate.phase === 'photo-zoom') &&
        this.maxDragDist < 10 &&
        tappedCardIdx !== null &&
        !Number.isNaN(tappedCardIdx)
      ) {
        this.onCardClick(tappedCardIdx);
      } else if (
        this.gate.phase === 'photo-zoom' &&
        this.maxDragDist < 8 &&
        !(e.target as HTMLElement | null)?.closest('.p3d-student-card')
      ) {
        this.closeActivePhoto();
      }
    };

    const onWheel = (e: WheelEvent) => {
      if ((e.target as HTMLElement | null)?.closest('.top-bar, .vinyl-player')) {
        return;
      }
      if (this.gate.phase === 'outer' || this.gate.phase === 'holding') {
        e.preventDefault();
        // Wheel zoom ONLY zooms near/far around the outer heart — NEVER enters the interior!
        this.gate = stepHoldGate(this.gate, {
          dtSeconds: 0,
          zoomDelta: e.deltaY * 0.006,
        });
        this.notifyState(true);
      } else if (this.gate.phase === 'inner') {
        e.preventDefault();
        // Smooth near/far zoom inside the heart so user can zoom right up to the ring or pull back to see the full outer beating heart!
        this.gate = stepHoldGate(this.gate, {
          dtSeconds: 0,
          innerZoomDelta: e.deltaY * 0.009,
        });
        this.notifyState(true);
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (this.gate.phase === 'inner') {
        if (e.key === 'ArrowLeft') this.stepStudent(-1);
        else if (e.key === 'ArrowRight') this.stepStudent(1);
        else if (e.key === 'Enter' || e.key === ' ') this.openActivePhoto();
      } else if (this.gate.phase === 'photo-zoom') {
        if (e.key === 'ArrowLeft') this.stepStudent(-1);
        else if (e.key === 'ArrowRight') this.stepStudent(1);
        else if (e.key === 'Escape') this.closeActivePhoto();
      }
    };

    const onResize = () => this.handleResize();

    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('resize', onResize);

    this.cleanupListeners = () => {
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('resize', onResize);
    };
  }

  private cleanupListeners: () => void = () => {};

  private syncSelectedIndexFromYaw(): void {
    if (!this.cssCardRecords.length) return;
    let bestIdx = 0;
    let bestDiff = Infinity;
    for (let i = 0; i < this.cssCardRecords.length; i++) {
      const diff = Math.abs(
        shortestAngleDiff(-this.cssCardRecords[i].slot.angleRad, this.targetRingYaw)
      );
      if (diff < bestDiff) {
        bestDiff = diff;
        bestIdx = i;
      }
    }
    if (bestIdx !== this.selectedIndex) {
      this.selectedIndex = bestIdx;
      this.notifyState(true);
    }
  }

  private handleResize(): void {
    if (this.disposed) return;
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;
    const aspect = width / Math.max(1, height);
    this.camera.fov = computeResponsiveFov(aspect);
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    this.cssRenderer.setSize(width, height);
    this.bubbleDpr = this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2);
    this.bubbleCanvas.width = Math.max(1, Math.round(width * this.bubbleDpr));
    this.bubbleCanvas.height = Math.max(1, Math.round(height * this.bubbleDpr));
  }

  private notifyState(force = false): void {
    const activeItem = this.items[this.selectedIndex] || null;
    const key = `${this.gate.phase}|${Math.round(this.gate.holdProgress * 100)}|${this.selectedIndex}|${this.gate.outerZoomDist.toFixed(2)}|${this.gate.innerZoomDist.toFixed(2)}`;
    if (!force && key === this.lastNotifiedKey) return;
    this.lastNotifiedKey = key;

    this.onStateChange?.({
      phase: this.gate.phase,
      holdProgress: this.gate.holdProgress,
      holdSeconds: this.gate.holdSeconds,
      outerZoomDist: this.gate.outerZoomDist,
      innerZoomDist: this.gate.innerZoomDist,
      selectedIndex: this.selectedIndex,
      totalItems: this.items.length,
      activeItem,
    });
  }

  private scheduleNextTick(): void {
    if (this.disposed) return;
    this.rafId = requestAnimationFrame(this.tick);
  }

  private afterDraw(fn: FrameRequestCallback): void {
    if (this.disposed) return;
    const gl = this.renderer.getContext();
    if (!this.isSoftwareGl || typeof (gl as WebGL2RenderingContext).fenceSync !== 'function') {
      this.rafId = requestAnimationFrame(fn);
      return;
    }
    const gl2 = gl as WebGL2RenderingContext;
    const sync = gl2.fenceSync(gl2.SYNC_GPU_COMMANDS_COMPLETE, 0);
    if (!sync) {
      this.rafId = requestAnimationFrame(fn);
      return;
    }
    gl2.flush();
    const start = performance.now();
    const poll = () => {
      if (this.disposed) {
        try { gl2.deleteSync(sync); } catch {}
        return;
      }
      const res = gl2.clientWaitSync(sync, 0, 0);
      if (
        res === gl2.ALREADY_SIGNALED ||
        res === gl2.CONDITION_SATISFIED ||
        performance.now() - start > 80
      ) {
        gl2.deleteSync(sync);
        this.rafId = requestAnimationFrame(fn);
      } else {
        this.timerId = window.setTimeout(poll, 4);
      }
    };
    this.timerId = window.setTimeout(poll, 0);
  }

  private tick = (nowMs: number): void => {
    if (this.disposed) return;
    const rawDt = this.lastTickMs
      ? Math.min(0.55, Math.max(0.004, (nowMs - this.lastTickMs) * 0.001))
      : 0.0167;
    const dt = Math.min(0.05, rawDt);
    this.lastTickMs = nowMs;
    this.elapsedSec += dt;

    // 1. Advance 3-second hold gate using real wall-clock elapsed time (accurate at any FPS!)
    if (this.gate.phase === 'outer' || this.gate.phase === 'holding') {
      this.gate = stepHoldGate(this.gate, { dtSeconds: rawDt });
      if (this.gate.phase === 'diving' && !this.enterChimeFired) {
        this.enterChimeFired = true;
        this.onEnterHeart?.();
      }
    }

    // 2. Smooth dive / exit interpolation
    if (this.gate.phase === 'diving') {
      this.diveAmount = Math.min(1, this.diveAmount + rawDt * 0.85);
      if (this.diveAmount >= 0.999) {
        this.diveAmount = 1;
        this.gate = stepHoldGate(this.gate, { dtSeconds: rawDt, diveComplete: true });
        this.selectStudent(this.selectedIndex);
      }
    } else if (this.gate.phase === 'exiting') {
      this.diveAmount = Math.max(0, this.diveAmount - rawDt * 0.95);
      if (this.diveAmount <= 0.001) {
        this.diveAmount = 0;
        this.gate = stepHoldGate(this.gate, { dtSeconds: rawDt, exitComplete: true });
      }
    } else if (this.gate.phase === 'inner' || this.gate.phase === 'photo-zoom') {
      this.diveAmount = THREE.MathUtils.damp(this.diveAmount, 1, 6, dt);
    } else {
      this.diveAmount = THREE.MathUtils.damp(this.diveAmount, 0, 7, dt);
    }

    // 3. Heart rotation & beat animation
    const holdBoost = this.gate.phase === 'holding' ? this.gate.holdProgress : 0;
    const beat = heartbeatImpulse(this.elapsedSec, 1.0 + holdBoost * 0.9);
    if (!this.pointerDown && (this.gate.phase === 'outer' || this.gate.phase === 'holding')) {
      this.targetHeartYaw += dt * 0.22;
      this.targetHeartPitch = THREE.MathUtils.damp(this.targetHeartPitch, 0.05, 1.6, dt);
    }
    this.heartYaw = THREE.MathUtils.damp(this.heartYaw, this.targetHeartYaw, 6.5, dt);
    this.heartPitch = THREE.MathUtils.damp(this.heartPitch, this.targetHeartPitch, 6.5, dt);

    // As camera dives inside, orient the outer beating heart cleanly facing the viewer so both upper lobes & rim glow around the monument
    const innerSway = Math.sin(this.elapsedSec * 0.28) * 0.04;
    const innerPitch = 0.02;
    this.heartGroup.rotation.y =
      this.heartYaw + shortestAngleDiff(innerSway, this.heartYaw) * this.diveAmount;
    this.heartGroup.rotation.x = THREE.MathUtils.lerp(this.heartPitch, innerPitch, this.diveAmount);
    this.outerGlowSprite.material.opacity = THREE.MathUtils.lerp(
      0.42 * (1 + holdBoost * 0.4),
      0.26,
      this.diveAmount
    );
    this.outerGlowSprite.scale.setScalar(
      THREE.MathUtils.lerp(5.3, 15.2, this.diveAmount) * beat
    );

    this.heartMaterial.uniforms.uTime.value = this.elapsedSec;
    this.heartMaterial.uniforms.uBeat.value = beat;
    this.heartMaterial.uniforms.uDive.value = this.diveAmount;
    this.heartMaterial.uniforms.uHold.value = holdBoost;
    this.orbitalStardustMat.uniforms.uTime.value = this.elapsedSec;
    this.orbitalStardustMat.uniforms.uDive.value = this.diveAmount;
    this.orbitalStardustMat.uniforms.uHold.value = holdBoost;
    this.cosmosMaterial.uniforms.uTime.value = this.elapsedSec;
    this.cosmosPoints.rotation.y = this.elapsedSec * 0.015;

    // Expanding heartbeat contour shockwaves around outer heart
    const outerPulseFade = Math.max(0, 1 - this.diveAmount * 1.45);
    for (const pr of this.heartPulseRings) {
      const cycle = (((this.elapsedSec / 1.15) + pr.phaseOffset) % 1 + 1) % 1;
      const expand = 1.03 + cycle * 0.54;
      pr.line.scale.set(expand, expand, 1);
      pr.mat.opacity = Math.pow(1 - cycle, 1.75) * (0.42 + holdBoost * 0.28) * outerPulseFade;
      pr.line.visible = outerPulseFade > 0.02;
    }

    // 4. Interior visibility gate: strictly hidden while outside (zooming NEVER reveals interior!)
    const showInterior = this.diveAmount > 0.06;
    this.interiorGroup.visible = showInterior;
    this.cssRenderer.domElement.style.display = showInterior ? 'block' : 'none';
    this.bubbleCanvas.style.display = showInterior ? 'block' : 'none';

    if (showInterior) {
      const reveal = THREE.MathUtils.smoothstep(this.diveAmount, 0.06, 0.92);
      this.interiorGroup.scale.setScalar(0.55 + 0.45 * reveal);

      // Ring rotation & synced CSS3DRoot rotation
      this.ringYaw = THREE.MathUtils.damp(this.ringYaw, this.targetRingYaw, 6.2, dt);
      this.ringGroup.rotation.y = this.ringYaw;
      this.cssRingRoot.rotation.y = this.ringYaw;
      this.cssRingRoot.scale.setScalar(0.55 + 0.45 * reveal);
      this.cssCrownRoot.scale.setScalar(0.55 + 0.45 * reveal);

      // Subtle breathing bob on crown plaque
      const bob = Math.sin(this.elapsedSec * 1.4) * 0.04;
      this.crownBackingMesh.position.y = CROWN_Y + bob;
      this.cssCrownObj.position.y = CROWN_Y + bob;

      // Update per-card depth opacity, active highlight & in-place photo-zoom lift
      const isZoomed = this.gate.phase === 'photo-zoom';
      this.activeCardLift = THREE.MathUtils.damp(this.activeCardLift, isZoomed ? 1 : 0, 7, dt);
      const neighbors = getNeighborIndices(this.selectedIndex, this.cssCardRecords.length);

      for (let i = 0; i < this.cssCardRecords.length; i++) {
        const rec = this.cssCardRecords[i];
        const worldAng = rec.slot.angleRad + this.ringYaw;
        const wx = Math.sin(worldAng) * RING_RADIUS;
        const wz = Math.cos(worldAng) * RING_RADIUS;
        const frontness = wz / RING_RADIUS; // +1 front, -1 back

        const isActive = i === neighbors.active;
        const isNeighbor = i === neighbors.prev || i === neighbors.next;

        // Smooth lift outward along ring radius when active in photo-zoom
        const targetLift = isActive ? 0.26 * this.activeCardLift : 0;
        rec.worldOffsetZ = THREE.MathUtils.damp(rec.worldOffsetZ, targetLift, 8, dt);
        const rEff = RING_RADIUS + rec.worldOffsetZ;
        rec.obj.position.set(
          Math.sin(rec.slot.angleRad) * rEff,
          rec.slot.y + (isActive ? 0.04 * this.activeCardLift : 0),
          Math.cos(rec.slot.angleRad) * rEff
        );

        const targetScale =
          CARD_CSS_SCALE *
          (isActive ? 1 + 0.1 * this.activeCardLift : isZoomed && !isNeighbor ? 0.92 : 1.0);
        rec.currentScale = THREE.MathUtils.damp(rec.currentScale, targetScale, 8, dt);
        rec.obj.scale.setScalar(rec.currentScale);

        // Compute atmospheric depth opacity & subtle column occlusion fade
        let opacity = reveal * THREE.MathUtils.mapLinear(frontness, -1, 1, 0.42, 1.0);
        if (wz < -0.5 && Math.abs(wx) < 0.78) {
          const behindFactor = 1 - Math.abs(wx) / 0.78;
          opacity *= THREE.MathUtils.lerp(1.0, 0.14, behindFactor);
        }
        if (isZoomed) {
          opacity = isActive ? 1.0 : isNeighbor ? 0.96 : Math.min(opacity, 0.24);
        }

        rec.el.style.opacity = opacity.toFixed(3);
        rec.el.classList.toggle('is-active', isActive);
        rec.el.classList.toggle('is-neighbor', isZoomed && isNeighbor);
        rec.el.classList.toggle('is-zoomed', isZoomed && isActive);
        rec.el.style.pointerEvents = opacity > 0.25 ? 'auto' : 'none';
      }

      this.cssCrownObj.element.style.opacity = (reveal * (isZoomed ? 0.14 : 1.0)).toFixed(3);

      // Update transparent soap bubbles inside the monument (3D spheres + center-swelling motion)
      for (const bm of this.bubble3dMats) {
        bm.uniforms.uTime.value = this.elapsedSec;
        bm.uniforms.uOpacity.value = reveal * (isZoomed ? 0.45 : 0.92);
      }
      for (const b of this.bubbles) {
        b.x += b.spec.vx * dt + Math.sin(this.elapsedSec * b.spec.wobbleSpeed + b.spec.wobblePhase) * 0.12 * dt;
        b.y += b.spec.vy * dt + Math.cos(this.elapsedSec * 0.9 + b.spec.wobblePhase) * 0.05 * dt;

        const limitX = b.spec.isForeground ? 6.0 : 7.8;
        if (b.x > limitX) b.x = -limitX;
        else if (b.x < -limitX) b.x = limitX;
        if (b.y > 3.7) b.y = -1.9;
        else if (b.y < -1.9) b.y = 3.7;

        if (b.mesh) {
          b.mesh.position.set(b.x, b.y, b.z);
          const swellR = computeBubbleCenterSwell(
            b.x / 4.2,
            (b.y - 0.5) / 2.2,
            b.spec.baseRadius
          );
          const pulse = 1 + 0.04 * Math.sin(this.elapsedSec * b.spec.wobbleSpeed + b.spec.wobblePhase);
          b.mesh.scale.setScalar(swellR * pulse);
        }
      }
    }

    // 5. Camera choreography across Outer -> Dive -> Inner (zoom near/far) -> In-Place Photo Zoom
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;
    const aspect = width / Math.max(1, height);
    const isMobile = aspect < 0.95;

    this.innerTiltY = THREE.MathUtils.damp(this.innerTiltY, this.targetInnerTiltY, 6, dt);
    const effectiveInnerZ = Math.min(25.6, this.gate.innerZoomDist + (isMobile ? 2.4 : 0));
    const effectiveInnerY = 1.88 + this.innerTiltY + (effectiveInnerZ - 14.2) * 0.05;

    if (this.gate.phase === 'outer' || this.gate.phase === 'holding') {
      this.scratchCamTarget.set(0, 0.18, this.gate.outerZoomDist);
      this.scratchLookTarget.set(0, 0.08, 0);
    } else if (this.gate.phase === 'diving' || this.gate.phase === 'exiting') {
      const t = this.diveAmount;
      this.scratchCamTarget.set(
        0,
        THREE.MathUtils.lerp(0.18, effectiveInnerY, t),
        THREE.MathUtils.lerp(this.gate.outerZoomDist, effectiveInnerZ, t)
      );
      this.scratchLookTarget.set(0, THREE.MathUtils.lerp(0.08, 0.16, t), 0);
    } else if (this.gate.phase === 'photo-zoom') {
      // Zoom right up to the front card in-place while keeping left & right adjacent cards clearly visible!
      const trioDist = computeZoomCameraDistance(aspect, this.camera.fov, 2.04);
      this.scratchCamTarget.set(0, isMobile ? -0.52 : -0.60, RING_RADIUS + trioDist);
      this.scratchLookTarget.set(0, isMobile ? -0.68 : -0.74, RING_RADIUS);
    } else {
      // 'inner' overview showing center column + crown photo + surrounding circular pedestals inside the beating outer heart
      this.scratchCamTarget.set(0, effectiveInnerY, effectiveInnerZ);
      this.scratchLookTarget.set(0, 0.16, 0);
    }

    const camDamp = this.gate.phase === 'outer' || this.gate.phase === 'holding' ? 8.5 : 5.4;
    this.camera.position.x = THREE.MathUtils.damp(
      this.camera.position.x,
      this.scratchCamTarget.x,
      camDamp,
      dt
    );
    this.camera.position.y = THREE.MathUtils.damp(
      this.camera.position.y,
      this.scratchCamTarget.y,
      camDamp,
      dt
    );
    this.camera.position.z = THREE.MathUtils.damp(
      this.camera.position.z,
      this.scratchCamTarget.z,
      camDamp,
      dt
    );

    this.scratchLookCurrent.x = THREE.MathUtils.damp(
      this.scratchLookCurrent.x,
      this.scratchLookTarget.x,
      camDamp,
      dt
    );
    this.scratchLookCurrent.y = THREE.MathUtils.damp(
      this.scratchLookCurrent.y,
      this.scratchLookTarget.y,
      camDamp,
      dt
    );
    this.scratchLookCurrent.z = THREE.MathUtils.damp(
      this.scratchLookCurrent.z,
      this.scratchLookTarget.z,
      camDamp,
      dt
    );
    this.camera.lookAt(this.scratchLookCurrent);
    this.camera.updateMatrixWorld();

    this.notifyState(false);

    this.renderer.render(this.scene, this.camera);
    if (showInterior) {
      this.cssRenderer.render(this.cssScene, this.camera);
      this.renderForegroundBubbles(width, height);
    }

    this.afterDraw(this.tick);
  };

  private renderForegroundBubbles(width: number, height: number): void {
    const ctx = this.bubbleCtx;
    if (!ctx) return;

    ctx.setTransform(this.bubbleDpr, 0, 0, this.bubbleDpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    const reveal = THREE.MathUtils.smoothstep(this.diveAmount, 0.08, 0.92);
    if (reveal <= 0.02) return;

    const isZoomed = this.gate.phase === 'photo-zoom';
    const baseScalePx = Math.min(width, height) * 0.135;

    for (const b of this.bubbles) {
      if (!b.spec.isForeground) continue;

      this.scratchVec.set(b.x, b.y, b.z).project(this.camera);
      if (this.scratchVec.z > 1 || this.scratchVec.z < -1) continue;

      const sx = (this.scratchVec.x * 0.5 + 0.5) * width;
      const sy = (-this.scratchVec.y * 0.5 + 0.5) * height;
      if (sx < -120 || sx > width + 120 || sy < -120 || sy > height + 120) continue;

      // Normalized distance from showcase center so bubbles visibly swell in the middle!
      const normX = (sx / Math.max(1, width) - 0.5) * 2.15;
      const normY = (sy / Math.max(1, height) - 0.5) * 2.15;
      const r = computeBubbleCenterSwell(
        normX,
        normY,
        b.spec.baseRadius * baseScalePx
      );

      let alpha = reveal * 0.92;
      if (isZoomed) {
        const distCenter = Math.hypot(sx / width - 0.5, sy / height - 0.5);
        if (distCenter < 0.28) alpha *= 0.34;
        else alpha *= 0.68;
      }

      const wob = Math.sin(this.elapsedSec * b.spec.wobbleSpeed + b.spec.wobblePhase);
      const rx = r * (1 + wob * 0.036);
      const ry = r * (1 - wob * 0.036);
      const hueDeg = ((b.spec.hueShift * 360 + this.elapsedSec * 28) % 360 + 360) % 360;

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(sx, sy);

      // 1. Transparent soap-film body (crystal clear middle + delicate iridescent edge)
      ctx.beginPath();
      ctx.ellipse(0, 0, rx, ry, wob * 0.25, 0, Math.PI * 2);
      const bodyGrad = ctx.createRadialGradient(-rx * 0.22, -ry * 0.22, r * 0.08, 0, 0, r * 1.04);
      bodyGrad.addColorStop(0, 'rgba(255, 255, 255, 0.015)');
      bodyGrad.addColorStop(0.64, 'rgba(255, 246, 252, 0.035)');
      bodyGrad.addColorStop(0.86, `hsla(${hueDeg}, 88%, 82%, 0.16)`);
      bodyGrad.addColorStop(0.96, `hsla(${(hueDeg + 85) % 360}, 92%, 85%, 0.36)`);
      bodyGrad.addColorStop(1, 'rgba(255, 255, 255, 0.06)');
      ctx.fillStyle = bodyGrad;
      ctx.fill();

      // 2. Crisp thin-film rainbow contour rim
      const rimGrad = ctx.createLinearGradient(-rx, -ry, rx, ry);
      rimGrad.addColorStop(0, `hsla(${hueDeg}, 95%, 86%, 0.72)`);
      rimGrad.addColorStop(0.35, `hsla(${(hueDeg + 110) % 360}, 92%, 82%, 0.45)`);
      rimGrad.addColorStop(0.7, `hsla(${(hueDeg + 210) % 360}, 94%, 84%, 0.65)`);
      rimGrad.addColorStop(1, `hsla(${(hueDeg + 310) % 360}, 95%, 88%, 0.72)`);
      ctx.lineWidth = Math.max(1.1, r * 0.042);
      ctx.strokeStyle = rimGrad;
      ctx.stroke();

      // 3. Curved crescent specular reflection arc along upper-left film curvature
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(0, 0, rx * 0.76, ry * 0.76, wob * 0.25, Math.PI * 1.12, Math.PI * 1.44);
      ctx.lineCap = 'round';
      ctx.lineWidth = Math.max(1.8, r * 0.085);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.62)';
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(-rx * 0.42, -ry * 0.34, Math.max(1.4, r * 0.065), 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.72)';
      ctx.fill();
      ctx.restore();

      // 4. Secondary soft rainbow reflection opposite corner
      ctx.beginPath();
      ctx.arc(rx * 0.38, ry * 0.38, Math.max(1.4, r * 0.065), 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${(hueDeg + 150) % 360}, 95%, 90%, 0.42)`;
      ctx.fill();

      ctx.restore();
    }
  }

  public dispose(): void {
    this.disposed = true;
    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
    if (this.timerId !== null) clearTimeout(this.timerId);
    this.cleanupListeners();

    for (const g of this.disposableGeos) g.dispose();
    for (const m of this.disposableMats) m.dispose();
    for (const t of this.disposableTexs) t.dispose();
    this.envRenderTarget.dispose();
    this.pmremGenerator.dispose();
    this.renderer.dispose();
    this.container.innerHTML = '';
  }
}

let activeInstance: PortraitHeartScene | null = null;

export const PortraitHeart3D = {
  mount(opts: Portrait3DMountOptions): PortraitHeartScene {
    if (activeInstance) {
      activeInstance.dispose();
      activeInstance = null;
    }
    activeInstance = new PortraitHeartScene(opts);
    return activeInstance;
  },
  unmount(): void {
    if (activeInstance) {
      activeInstance.dispose();
      activeInstance = null;
    }
  },
  stepStudent(delta: number): void {
    activeInstance?.stepStudent(delta);
  },
  selectStudent(idx: number): void {
    activeInstance?.selectStudent(idx);
  },
  openActivePhoto(): void {
    activeInstance?.openActivePhoto();
  },
  closeActivePhoto(): void {
    activeInstance?.closeActivePhoto();
  },
  exitToOuter(): void {
    activeInstance?.exitToOuter();
  },
  adjustOuterZoom(delta: number): void {
    activeInstance?.adjustOuterZoom(delta);
  },
  adjustInnerZoom(delta: number): void {
    activeInstance?.adjustInnerZoom(delta);
  },
};

declare global {
  interface Window {
    PortraitHeart3D?: typeof PortraitHeart3D;
  }
}

window.PortraitHeart3D = PortraitHeart3D;
