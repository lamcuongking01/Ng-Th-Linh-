import { useEffect, useRef } from 'react';

interface FireworkParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  decay: number;
  size: number;
  color: string;
}

interface FireworkRocket {
  x: number;
  y: number;
  vy: number;
  targetY: number;
  color: string;
}

const COLORS = [
  '#fb7185',
  '#f43f5e',
  '#fbcfe8',
  '#fda4af',
  '#fde047',
  '#f9a8d4',
  '#fef08a',
  '#ffffff',
];

export default function FireworksCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const particles: FireworkParticle[] = [];
    const rockets: FireworkRocket[] = [];

    const spawnBurst = (cx: number, cy: number, color: string) => {
      const count = 56;
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.16;
        const speed = 1.8 + Math.random() * 4.8;
        particles.push({
          x: cx,
          y: cy,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          alpha: 1,
          decay: 0.009 + Math.random() * 0.009,
          size: 2.2 + Math.random() * 2.4,
          color,
        });
      }
      // Inner secondary ring for fuller firework bloom
      const innerCount = 24;
      const accentColor = color === '#fde047' ? '#fbcfe8' : '#fde047';
      for (let i = 0; i < innerCount; i++) {
        const angle = (Math.PI * 2 * i) / innerCount;
        const speed = 1.1 + Math.random() * 2.1;
        particles.push({
          x: cx,
          y: cy,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          alpha: 1,
          decay: 0.012 + Math.random() * 0.008,
          size: 1.8 + Math.random() * 1.5,
          color: accentColor,
        });
      }
    };

    const launchRocket = () => {
      rockets.push({
        x: width * (0.12 + Math.random() * 0.76),
        y: height * 0.94,
        vy: -(7.2 + Math.random() * 3.4),
        targetY: height * (0.12 + Math.random() * 0.36),
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
      });
    };

    // Initial festive salvo across left, center-top, and right
    spawnBurst(width * 0.2, height * 0.25, '#fb7185');
    spawnBurst(width * 0.8, height * 0.22, '#fde047');
    spawnBurst(width * 0.5, height * 0.18, '#fbcfe8');
    spawnBurst(width * 0.34, height * 0.34, '#fef08a');

    if (prefersReducedMotion) {
      for (const p of particles) {
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x + p.vx * 14, p.y + p.vy * 14, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      return () => window.removeEventListener('resize', handleResize);
    }

    let rafId = 0;
    let lastLaunch = performance.now();

    const render = (now: number) => {
      ctx.clearRect(0, 0, width, height);

      if (now - lastLaunch > 520) {
        lastLaunch = now;
        launchRocket();
      }

      for (let i = rockets.length - 1; i >= 0; i--) {
        const r = rockets[i];
        r.y += r.vy;
        r.vy *= 0.985;

        ctx.globalAlpha = 0.98;
        ctx.fillStyle = r.color;
        ctx.beginPath();
        ctx.arc(r.x, r.y, 3, 0, Math.PI * 2);
        ctx.fill();

        if (r.y <= r.targetY || r.vy > -1.2) {
          spawnBurst(r.x, r.y, r.color);
          rockets.splice(i, 1);
        }
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.042;
        p.vx *= 0.985;
        p.alpha -= p.decay;

        if (p.alpha <= 0.02) {
          particles.splice(i, 1);
          continue;
        }

        // Soft outer glow halo
        ctx.globalAlpha = p.alpha * 0.28;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 2.2, 0, Math.PI * 2);
        ctx.fill();

        // Bright core spark
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      rafId = requestAnimationFrame(render);
    };

    rafId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      data-testid="fireworks-canvas"
      aria-hidden="true"
      className="fixed inset-0 z-10 pointer-events-none"
    />
  );
}
