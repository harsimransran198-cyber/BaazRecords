/**
 * Site-wide behaviour: smooth scroll, header, menu, cursor, magnetic buttons.
 * Pages are swapped without a full reload (Astro ClientRouter), so everything
 * that touches page content is re-bound on `astro:page-load` and torn down
 * on `astro:before-swap`.
 */
import Lenis from 'lenis';

const reduce = matchMedia('(prefers-reduced-motion: reduce)');
const finePointer = matchMedia('(hover: hover) and (pointer: fine)');

/* ---------- Smooth scroll (Lenis) ---------- */
let lenis: Lenis | null = null;
export const getLenis = () => lenis;

function startLenis() {
  lenis?.destroy();
  lenis = reduce.matches ? null : new Lenis({ autoRaf: true, anchors: { offset: -90 }, lerp: 0.12 });
}

/* ---------- Per-page bindings ---------- */
let pageAbort: AbortController | null = null;

const yieldToMain = () =>
  new Promise<void>((resolve) => {
    const s = (globalThis as { scheduler?: { yield?: () => Promise<void> } }).scheduler;
    s?.yield ? s.yield().then(resolve) : setTimeout(resolve, 0);
  });

async function initPage() {
  pageAbort?.abort();
  const ac = new AbortController();
  pageAbort = ac;
  const signal = ac.signal;

  // Small chunks with breaks in between, so the page stays responsive while it sets up.
  initHeader(signal);
  initMenu(signal);
  initTapeToggle(signal);
  await yieldToMain();
  if (signal.aborted) return;
  startLenis();
  initCursorTargets();
  initMagnetic(signal);
}

function initHeader(signal: AbortSignal) {
  const header = document.querySelector<HTMLElement>('.site-header');
  if (!header) return;
  const hero = document.querySelector<HTMLElement>('.hero');
  const onScroll = () => {
    const past = hero ? hero.getBoundingClientRect().bottom < 90 : scrollY > 24;
    header.classList.toggle('scrolled', past);
  };
  addEventListener('scroll', onScroll, { passive: true, signal });
  onScroll();
}

function initMenu(signal: AbortSignal) {
  const burger = document.querySelector<HTMLButtonElement>('.burger');
  const menu = document.getElementById('menu');
  if (!burger || !menu) return;
  menu.setAttribute('data-lenis-prevent', '');

  const isOpen = () => document.body.classList.contains('menu-open');
  const setMenu = (open: boolean) => {
    document.body.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    document.body.style.overflow = open ? 'hidden' : '';
    open ? lenis?.stop() : lenis?.start();
    if (open) setTimeout(() => menu.querySelector<HTMLElement>('.acc-btn')?.focus(), 300);
    else {
      menu.classList.add('closing');
      setTimeout(() => menu.classList.remove('closing'), 850);
    }
  };

  burger.addEventListener('click', () => setMenu(!isOpen()), { signal });
  addEventListener(
    'keydown',
    (e) => {
      if (e.key === 'Escape' && isOpen()) {
        setMenu(false);
        burger.focus();
      }
    },
    { signal },
  );
  menu.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setMenu(false), { signal }));

  const accBtns = [...menu.querySelectorAll<HTMLButtonElement>('.acc-btn')];
  const panel = (b: HTMLElement) => document.getElementById(b.getAttribute('aria-controls') || '');
  accBtns.forEach((btn) =>
    btn.addEventListener(
      'click',
      () => {
        const willOpen = btn.getAttribute('aria-expanded') !== 'true';
        accBtns.forEach((b) => {
          b.setAttribute('aria-expanded', 'false');
          panel(b)?.setAttribute('data-open', 'false');
        });
        if (willOpen) {
          btn.setAttribute('aria-expanded', 'true');
          panel(btn)?.setAttribute('data-open', 'true');
        }
      },
      { signal },
    ),
  );
}

/* Cassette reels: visual toggle when the mixtape has no audio preview yet. */
function initTapeToggle(signal: AbortSignal) {
  const btn = document.getElementById('tapeToggle');
  const cassette = document.getElementById('cassette');
  if (!btn || !cassette) return;
  btn.addEventListener(
    'click',
    () => {
      const on = cassette.classList.toggle('playing');
      btn.setAttribute('aria-pressed', String(on));
    },
    { signal },
  );
}

/* ---------- Custom cursor (mouse only, persists across pages) ---------- */
let cursorStarted = false;
function initCursor() {
  if (cursorStarted || !finePointer.matches) return;
  const ring = document.querySelector<HTMLElement>('.cursor');
  const dot = document.querySelector<HTMLElement>('.cursor-dot');
  if (!ring || !dot) return;
  cursorStarted = true;
  let mx = innerWidth / 2,
    my = innerHeight / 2,
    rx = mx,
    ry = my;
  addEventListener('mousemove', (e) => {
    mx = e.clientX;
    my = e.clientY;
    dot.style.transform = `translate(${mx}px,${my}px)`;
  });
  const loop = () => {
    rx += (mx - rx) * 0.18;
    ry += (my - ry) * 0.18;
    ring.style.transform = `translate(${rx}px,${ry}px)`;
    requestAnimationFrame(loop);
  };
  loop();
  document.addEventListener('mouseover', (e) => {
    const hit = (e.target as Element | null)?.closest('a, button, [role="slider"], label');
    ring.classList.toggle('hover', Boolean(hit));
  });
}
function initCursorTargets() {
  if (finePointer.matches) document.body.classList.add('has-cursor');
}

/* ---------- Magnetic buttons (mouse only) ---------- */
function initMagnetic(signal: AbortSignal) {
  if (!finePointer.matches || reduce.matches) return;
  document.querySelectorAll<HTMLElement>('.btn').forEach((el) => {
    el.classList.add('is-magnetic');
    el.addEventListener(
      'pointermove',
      (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) * 0.25;
        const y = (e.clientY - r.top - r.height / 2) * 0.35;
        el.style.transform = `translate(${x}px, ${y}px)`;
      },
      { signal },
    );
    el.addEventListener('pointerleave', () => (el.style.transform = ''), { signal });
  });
}

/* ---------- Lifecycle ---------- */
document.addEventListener('astro:page-load', () => {
  void initPage();
  initCursor();
});
document.addEventListener('astro:before-swap', (e) => {
  pageAbort?.abort();
  document.body.style.overflow = '';
  // The loader is for the first full page load only, never for in-site navigation.
  (e as Event & { newDocument: Document }).newDocument.querySelector('.preloader')?.classList.add('is-done');
});
