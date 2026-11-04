/**
 * Home hero: the sonic visualizer (the title intro is pure CSS so it starts on first paint).
 * The visualizer idles with a slow wave that leans toward the cursor, and switches
 * to the real frequency data from the bottom player while music plays.
 */
import { getFrequencyData, getPlayerState } from './player';

const reduce = matchMedia('(prefers-reduced-motion: reduce)');
let teardown: (() => void) | null = null;

function visualizer(hero: HTMLElement) {
  const canvas = hero.querySelector<HTMLCanvasElement>('[data-visualizer]');
  const ctx = canvas?.getContext('2d');
  if (!canvas || !ctx) return;
  const BARS = 72;
  let w = 0,
    h = 0,
    dpr = 1;
  const resize = () => {
    dpr = Math.min(2, devicePixelRatio || 1);
    w = canvas.clientWidth;
    h = canvas.clientHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);

  const levels = new Float32Array(BARS);
  let mouseX = -1;
  const onMove = (e: PointerEvent) => {
    const r = canvas.getBoundingClientRect();
    mouseX = (e.clientX - r.left) / r.width;
  };
  const onLeave = () => (mouseX = -1);
  hero.addEventListener('pointermove', onMove);
  hero.addEventListener('pointerleave', onLeave);

  let visible = true;
  const io = new IntersectionObserver(([en]) => {
    visible = Boolean(en?.isIntersecting);
    hero.classList.toggle('is-offscreen', !visible); // pauses the CSS ring spin too
    if (visible) loop();
  });
  io.observe(hero);

  let raf = 0;
  const draw = (t: number) => {
    const data = getFrequencyData();
    const gap = 3;
    const bw = Math.max(2, (w - gap * (BARS - 1)) / BARS);
    ctx.clearRect(0, 0, w, h);
    const grad = ctx.createLinearGradient(0, h, 0, 0);
    grad.addColorStop(0, 'rgba(255,30,66,.85)');
    grad.addColorStop(0.7, 'rgba(255,30,66,.35)');
    grad.addColorStop(1, 'rgba(245,166,35,.55)');
    ctx.fillStyle = grad;
    for (let i = 0; i < BARS; i++) {
      const x = i / (BARS - 1);
      let target: number;
      if (data) {
        // mirror the spectrum so bass sits in the middle
        const usable = data.length * 0.75;
        const idx = Math.min(usable - 1, Math.floor(Math.pow(usable, Math.abs(x - 0.5) * 2)));
        target = (data[idx] ?? 0) / 255;
      } else {
        // YouTube songs give no audio data, so the idle wave just gets livelier while one plays
        const live = getPlayerState().playing ? 1 : 0;
        const speed = live ? 2.4 : 1;
        const wave = 0.18 + (0.12 + live * 0.16) * Math.abs(Math.sin((t * speed) / 900 + i * 0.35)) + (0.08 + live * 0.12) * Math.sin((t * speed) / 340 - i * 0.9);
        const near = mouseX < 0 ? 0 : Math.max(0, 1 - Math.abs(x - mouseX) * 6) * 0.55;
        target = wave + near;
      }
      levels[i]! += (target - levels[i]!) * 0.18;
      const bh = Math.max(2, levels[i]! * h);
      ctx.fillRect(i * (bw + gap), h - bh, bw, bh);
    }
  };
  let last = 0;
  const loop = () => {
    cancelAnimationFrame(raf);
    const step = (t: number) => {
      if (!visible || document.hidden) return;
      if (t - last > 32) {
        draw(t); // about 30 fps is plenty for a background meter
        last = t;
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
  };
  if (reduce.matches) draw(0);
  else if (document.readyState === 'complete') loop();
  else addEventListener('load', () => setTimeout(loop, 300), { once: true });
  const onVis = () => !document.hidden && !reduce.matches && loop();
  document.addEventListener('visibilitychange', onVis);

  return () => {
    cancelAnimationFrame(raf);
    ro.disconnect();
    io.disconnect();
    hero.removeEventListener('pointermove', onMove);
    hero.removeEventListener('pointerleave', onLeave);
    document.removeEventListener('visibilitychange', onVis);
  };
}

document.addEventListener('astro:page-load', () => {
  teardown?.();
  teardown = null;
  const hero = document.querySelector<HTMLElement>('[data-hero]');
  if (!hero) return;
  teardown = visualizer(hero) ?? null;
});
document.addEventListener('astro:before-swap', () => {
  teardown?.();
  teardown = null;
});
