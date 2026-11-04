/**
 * Site-wide behaviour: Lenis smooth scroll, header, curtain menu (GSAP clip-path),
 * magnetic buttons, 3D tilt cards, cursor + spotlight, split-type reveals,
 * velocity marquee and YouTube facades.
 *
 * Pages are swapped without a full reload (Astro ClientRouter), so anything that
 * touches page content is bound on `astro:page-load` and torn down on `astro:before-swap`.
 */
import Lenis from 'lenis';
import { gsap } from 'gsap';
import SplitType from 'split-type';

const reduce = matchMedia('(prefers-reduced-motion: reduce)');
const fine = matchMedia('(hover: hover) and (pointer: fine)');
const motionOK = () => !reduce.matches;

const yieldToMain = () =>
  new Promise<void>((resolve) => {
    const s = (globalThis as { scheduler?: { yield?: () => Promise<void> } }).scheduler;
    s?.yield ? s.yield().then(resolve) : setTimeout(resolve, 0);
  });

export const whenIdle = (fn: () => void) =>
  'requestIdleCallback' in window ? requestIdleCallback(fn, { timeout: 1200 }) : setTimeout(fn, 200);

/* ---------- Lenis ---------- */
let lenis: Lenis | null = null;
export const getLenis = () => lenis;
function startLenis() {
  lenis?.destroy();
  lenis = motionOK() ? new Lenis({ autoRaf: true, anchors: { offset: -90 }, lerp: 0.11 }) : null;
}

/* ---------- header: solid after scrolling, hides on the way down ---------- */
function initHeader(signal: AbortSignal) {
  const header = document.querySelector<HTMLElement>('.site-header');
  if (!header) return;
  let lastY = scrollY;
  const onScroll = () => {
    const y = scrollY;
    header.classList.toggle('scrolled', y > 30);
    if (!document.body.classList.contains('menu-open')) header.classList.toggle('is-hidden', y > 420 && y > lastY + 2);
    if (y < lastY - 2) header.classList.remove('is-hidden');
    lastY = y;
  };
  addEventListener('scroll', onScroll, { passive: true, signal });
  onScroll();
}

/* ---------- curtain menu ---------- */
function initMenu(signal: AbortSignal) {
  const btn = document.querySelector<HTMLButtonElement>('.eq-toggle');
  const menu = document.getElementById('menu');
  if (!btn || !menu) return;
  const items = [...menu.querySelectorAll<HTMLElement>('.menu-link')];
  const side = menu.querySelector<HTMLElement>('.menu-side');
  const previews = [...menu.querySelectorAll<HTMLElement>('.pv')];

  const tl = gsap.timeline({ paused: true, defaults: { ease: 'expo.inOut' } });
  tl.set(menu, { visibility: 'visible' })
    .fromTo(menu, { clipPath: 'inset(0% 0% 100% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: motionOK() ? 0.9 : 0.01 })
    .fromTo(items, { yPercent: 110 }, { yPercent: 0, duration: motionOK() ? 0.9 : 0.01, stagger: 0.06, ease: 'expo.out' }, '-=0.45')
    .fromTo(side, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.6, ease: 'power3.out' }, '-=0.7');

  const isOpen = () => document.body.classList.contains('menu-open');
  const setMenu = (open: boolean) => {
    document.body.classList.toggle('menu-open', open);
    btn.setAttribute('aria-expanded', String(open));
    btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    menu.toggleAttribute('inert', !open);
    if (open) {
      lenis?.stop();
      document.body.style.overflow = 'hidden';
      tl.timeScale(1).play();
      setTimeout(() => items[0]?.focus({ preventScroll: true }), 400);
    } else {
      lenis?.start();
      document.body.style.overflow = '';
      tl.timeScale(1.6).reverse();
    }
  };
  menu.setAttribute('inert', '');
  btn.addEventListener('click', () => setMenu(!isOpen()), { signal });
  addEventListener(
    'keydown',
    (e) => {
      if (e.key === 'Escape' && isOpen()) {
        setMenu(false);
        btn.focus();
      }
    },
    { signal },
  );
  menu.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setMenu(false), { signal }));
  items.forEach((link) => {
    const show = () => previews.forEach((p) => p.classList.toggle('is-active', p.dataset.pv === link.dataset.preview));
    link.addEventListener('mouseenter', show, { signal });
    link.addEventListener('focus', show, { signal });
  });
  signal.addEventListener('abort', () => tl.kill());
}

/* ---------- magnetic pull ---------- */
function initMagnetic(signal: AbortSignal) {
  if (!fine.matches || !motionOK()) return;
  document.querySelectorAll<HTMLElement>('[data-magnetic]').forEach((el) => {
    const strength = Number(el.dataset.magnetic) || 0.3;
    const inner = el.querySelector<HTMLElement>('.btn-label, .core');
    const xTo = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'power3.out' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'power3.out' });
    const ixTo = inner && gsap.quickTo(inner, 'x', { duration: 0.6, ease: 'power3.out' });
    const iyTo = inner && gsap.quickTo(inner, 'y', { duration: 0.6, ease: 'power3.out' });
    el.addEventListener(
      'pointermove',
      (e) => {
        const r = el.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        xTo(dx * strength);
        yTo(dy * strength);
        ixTo?.(dx * strength * 0.5);
        iyTo?.(dy * strength * 0.5);
      },
      { signal },
    );
    el.addEventListener(
      'pointerleave',
      () => {
        gsap.to(el, { x: 0, y: 0, duration: 1, ease: 'elastic.out(1, 0.35)' });
        if (inner) gsap.to(inner, { x: 0, y: 0, duration: 1, ease: 'elastic.out(1, 0.35)' });
      },
      { signal },
    );
  });
}

/* ---------- 3D tilt + beam glow position ---------- */
function initTilt(signal: AbortSignal) {
  if (!fine.matches || !motionOK()) return;
  document.querySelectorAll<HTMLElement>('[data-tilt]').forEach((el) => {
    let raf = 0;
    el.addEventListener(
      'pointermove',
      (e) => {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          const r = el.getBoundingClientRect();
          const px = (e.clientX - r.left) / r.width;
          const py = (e.clientY - r.top) / r.height;
          el.classList.add('is-tilting');
          el.style.setProperty('--ry', `${(px - 0.5) * 10}deg`);
          el.style.setProperty('--rx', `${(0.5 - py) * 8}deg`);
          el.style.setProperty('--px', `${px * 100}%`);
          el.style.setProperty('--py', `${py * 100}%`);
        });
      },
      { signal },
    );
    el.addEventListener(
      'pointerleave',
      () => {
        cancelAnimationFrame(raf);
        el.classList.remove('is-tilting');
        el.style.setProperty('--rx', '0deg');
        el.style.setProperty('--ry', '0deg');
      },
      { signal },
    );
  });
}

/* ---------- cursor + spotlight (persist across pages) ---------- */
let cursorStarted = false;
function initCursor() {
  if (cursorStarted || !fine.matches) return;
  const ring = document.querySelector<HTMLElement>('.cursor');
  const dot = document.querySelector<HTMLElement>('.cursor-dot');
  if (!ring || !dot) return;
  cursorStarted = true;
  const label = ring.querySelector('span')!;
  const rx = gsap.quickTo(ring, 'x', { duration: 0.45, ease: 'power3.out' });
  const ry = gsap.quickTo(ring, 'y', { duration: 0.45, ease: 'power3.out' });
  const root = document.documentElement;
  let raf = 0;
  addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    if (!ring.classList.contains('is-on')) {
      ring.classList.add('is-on');
      dot.classList.add('is-on');
      gsap.set(ring, { x: e.clientX, y: e.clientY });
    }
    gsap.set(dot, { x: e.clientX, y: e.clientY });
    rx(e.clientX);
    ry(e.clientY);
    if (!raf)
      raf = requestAnimationFrame(() => {
        root.style.setProperty('--mx', `${e.clientX}px`);
        root.style.setProperty('--my', `${e.clientY}px`);
        raf = 0;
      });
  });
  document.addEventListener('pointerover', (e) => {
    const t = e.target as Element | null;
    const tagged = t?.closest<HTMLElement>('[data-cursor]');
    const hit = t?.closest('a, button, [role="slider"], label, input, textarea');
    ring.classList.toggle('label', Boolean(tagged));
    ring.classList.toggle('hover', !tagged && Boolean(hit));
    label.textContent = tagged?.dataset.cursor ?? '';
  });
  document.addEventListener('pointerleave', () => ring.classList.remove('hover', 'label'));
}

/* ---------- split-type reveals ---------- */
function initReveals(signal: AbortSignal) {
  const els = [...document.querySelectorAll<HTMLElement>('[data-reveal], [data-reveal-lines]')];
  if (!els.length || !motionOK()) return;
  const io = new IntersectionObserver(
    (entries) => {
      for (const en of entries) {
        if (!en.isIntersecting) continue;
        io.unobserve(en.target);
        const el = en.target as HTMLElement;
        if (el.hasAttribute('data-reveal-lines')) {
          const s = new SplitType(el, { types: 'lines', lineClass: 'split-line' });
          s.lines?.forEach((l) => {
            const inner = document.createElement('span');
            inner.className = 'block';
            inner.append(...l.childNodes);
            l.append(inner);
          });
          gsap.from(el.querySelectorAll('.split-line > span'), { yPercent: 105, duration: 1.1, stagger: 0.09, ease: 'expo.out' });
        } else {
          const s = new SplitType(el, { types: 'lines,words,chars', lineClass: 'split-line' });
          gsap.from(s.chars ?? [], { yPercent: 115, rotate: 4, duration: 1, stagger: 0.022, ease: 'expo.out' });
        }
        gsap.set(el, { opacity: 1 });
      }
    },
    { rootMargin: '0px 0px -12% 0px' },
  );
  for (const el of els) {
    // fade (not hide) until it animates in, so screen readers can still read it
    gsap.set(el, { opacity: 0 });
    io.observe(el);
  }
  signal.addEventListener('abort', () => io.disconnect());
}

/* ---------- velocity-reactive marquee ---------- */
function initMarquees(signal: AbortSignal) {
  const marquees = [...document.querySelectorAll<HTMLElement>('[data-marquee]')];
  if (!marquees.length || !motionOK()) return;
  const rows = marquees.map((m) => ({
    track: m.querySelector<HTMLElement>('.marquee-track')!,
    group: m.querySelector<HTMLElement>('.marquee-group')!,
    dir: m.dataset.reverse ? -1 : 1,
    x: 0,
    w: 1,
    visible: true,
  }));
  // measure once and on resize, never inside the animation loop (that would force layout every frame)
  const ro = new ResizeObserver(() => rows.forEach((r) => (r.w = r.group.offsetWidth || 1)));
  rows.forEach((r) => ro.observe(r.group));
  const io = new IntersectionObserver((entries) =>
    entries.forEach((en) => {
      const r = rows.find((x) => x.track.parentElement === en.target);
      if (r) r.visible = en.isIntersecting;
    }),
  );
  marquees.forEach((m) => io.observe(m));
  let lastY = scrollY;
  let boost = 0;
  let scrollDir = 1;
  const tick = (_t: number, dtMs: number) => {
    const dt = Math.min(0.05, dtMs / 1000);
    const dy = scrollY - lastY;
    lastY = scrollY;
    if (Math.abs(dy) > 0.5) scrollDir = dy > 0 ? 1 : -1;
    boost += (Math.min(Math.abs(dy) / Math.max(dt, 0.001) / 250, 8) - boost) * 0.12;
    for (const r of rows) {
      if (!r.visible) continue;
      const w = r.w;
      r.x -= (60 + boost * 60) * r.dir * scrollDir * dt;
      r.x = ((r.x % w) - w) % w;
      r.track.style.transform = `translate3d(${r.x}px,0,0)`;
    }
  };
  gsap.ticker.add(tick);
  signal.addEventListener('abort', () => {
    gsap.ticker.remove(tick);
    io.disconnect();
    ro.disconnect();
  });
}

/* ---------- YouTube facades (iframe only after a click) ---------- */
function initYouTube(signal: AbortSignal) {
  document.addEventListener(
    'click',
    (e) => {
      const btn = (e.target as Element | null)?.closest('.yt-play');
      const box = btn?.closest<HTMLElement>('[data-yt]');
      if (!box) return;
      const id = box.dataset.yt || '';
      if (!/^[\w-]{11}$/.test(id)) return;
      const f = document.createElement('iframe');
      f.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1`;
      f.title = box.dataset.ytTitle || 'YouTube video';
      f.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
      f.allowFullscreen = true;
      f.referrerPolicy = 'strict-origin-when-cross-origin';
      box.replaceChildren(f);
      // pause the bottom player so two sounds don't overlap
      document.querySelector<HTMLAudioElement>('#player audio')?.pause();
    },
    { signal },
  );
}

/* ---------- pause looping CSS animations while they are off screen ---------- */
function initOffscreenPause(signal: AbortSignal) {
  const els = document.querySelectorAll<HTMLElement>('main .vu, main .vinyl.spinning');
  if (!els.length) return;
  const io = new IntersectionObserver((entries) =>
    entries.forEach((en) => (en.target as HTMLElement).classList.toggle('is-offscreen', !en.isIntersecting)),
  );
  els.forEach((el) => io.observe(el));
  signal.addEventListener('abort', () => io.disconnect());
}

/* ---------- lifecycle ---------- */
let pageAbort: AbortController | null = null;
async function initPage() {
  pageAbort?.abort();
  const ac = new AbortController();
  pageAbort = ac;
  const { signal } = ac;
  if (fine.matches) document.body.classList.add('has-cursor');
  initHeader(signal);
  initMenu(signal);
  initYouTube(signal);
  initReveals(signal);
  initOffscreenPause(signal);
  await yieldToMain();
  if (signal.aborted) return;
  startLenis();
  // pointer effects and tickers are not needed for the first paint
  whenIdle(() => {
    if (signal.aborted) return;
    initMagnetic(signal);
    initTilt(signal);
    initMarquees(signal);
  });
}

document.addEventListener('astro:page-load', () => {
  initCursor();
  void initPage();
});
document.addEventListener('astro:before-swap', () => {
  pageAbort?.abort();
  document.body.style.overflow = '';
});
