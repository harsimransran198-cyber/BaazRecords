/**
 * Home page: preloader, record-player hero (GSAP ScrollTrigger, scrub) and
 * cassette reels. Re-initialised on every visit to the home page.
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { getPlayerState, type PlayerState } from './player';

gsap.registerPlugin(ScrollTrigger);

const reduceMQ = matchMedia('(prefers-reduced-motion: reduce)');
let teardown: (() => void) | null = null;
let introDone = false;

/* ---------- Preloader (first full page load only) ---------- */
function runPreloader(onDone: () => void) {
  const pre = document.querySelector<HTMLElement>('.preloader');
  if (!pre || introDone || pre.classList.contains('is-done')) {
    pre?.classList.add('is-done');
    introDone = true;
    onDone();
    return;
  }
  const minShow = reduceMQ.matches ? 0 : 1100;
  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    introDone = true;
    pre.classList.add('is-done');
    onDone();
  };
  const afterLoad = () => setTimeout(finish, Math.max(0, minShow - performance.now()));
  if (document.readyState === 'complete') afterLoad();
  else addEventListener('load', afterLoad, { once: true });
  setTimeout(finish, 3500); // safety net if a font or image stalls
}

/* ---------- Hero ---------- */
function initHero() {
  const hero = document.querySelector<HTMLElement>('.hero');
  if (!hero) return null;
  const reduce = reduceMQ.matches;
  const ac = new AbortController();

  const disk = hero.querySelector<HTMLElement>('.disk')!;
  const arm = hero.querySelector<SVGGElement>('#tonearm')!;
  const deck = hero.querySelector<HTMLButtonElement>('.deck-hit')!;
  const np = hero.querySelector<HTMLElement>('.now-playing')!;
  const npText = hero.querySelector<HTMLElement>('.np-text')!;
  const trackLine = `${deck.dataset.title}, ${deck.dataset.artist}`;
  const heroSrc = deck.dataset.src ? new URL(deck.dataset.src, location.href).href : null;

  const REST = -9,
    PLAY = 11,
    END = 25; // tonearm angles in degrees
  const RPM = 200; // 33⅓ rpm = 200 deg/s
  let armAngle = REST,
    wantPlay = false,
    landed = false,
    started = false;
  let diskAngle = 0,
    speed = 0,
    lastY = scrollY,
    scrollVel = 0,
    progress = 0;

  const setStatus = () => {
    np.classList.toggle('is-playing', landed && wantPlay);
    if (heroSrc) {
      npText.textContent = wantPlay ? (landed ? `Now playing: ${trackLine}` : 'Dropping the needle') : `Tap the record to play ${deck.dataset.title}`;
    } else {
      npText.textContent = !wantPlay
        ? started
          ? 'Needle lifted. Tap the record to drop it'
          : 'Cueing up side A'
        : landed
          ? `On the deck: ${trackLine}`
          : 'Cueing up side A';
      deck.setAttribute('aria-label', wantPlay ? 'Lift the needle' : 'Drop the needle');
      deck.setAttribute('aria-pressed', String(wantPlay));
    }
  };

  if (heroSrc) {
    // Real audio: the needle follows the bottom player.
    const follow = (s: PlayerState) => {
      const mine = s.src === heroSrc && s.playing;
      if (mine !== wantPlay) {
        wantPlay = mine;
        landed = false;
        setStatus();
      }
    };
    addEventListener('baaz:player', (e) => follow((e as CustomEvent<PlayerState>).detail), { signal: ac.signal });
    follow(getPlayerState());
  } else {
    // No preview yet: the needle is a visual toy, like the original site.
    deck.addEventListener(
      'click',
      () => {
        wantPlay = !wantPlay;
        landed = false;
        setStatus();
      },
      { signal: ac.signal },
    );
  }

  // Scroll choreography (GSAP + ScrollTrigger, scrubbed)
  const mm = gsap.matchMedia();
  mm.add({ small: '(max-width: 560px)', large: '(min-width: 561px)' }, (ctx) => {
    const { small } = ctx.conditions as { small: boolean };
    gsap.set('.deck-wrap', { y: () => (small ? -0.05 * innerHeight : 0) });
    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: hero,
        start: 'top top',
        end: 'bottom bottom',
        scrub: reduce ? true : 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => (progress = self.progress),
      },
    });
    const io = 'power3.inOut';
    tl.to('.big-word.w1', { x: () => -0.6 * innerWidth, y: () => -0.06 * innerHeight, ease: io, duration: 1 }, 0)
      .to('.big-word.w2', { x: () => 0.6 * innerWidth, y: () => 0.06 * innerHeight, ease: io, duration: 1 }, 0)
      .to('.deck-wrap', { y: () => (small ? -0.05 : 0) * innerHeight - 0.04 * innerHeight, scale: 1.5, ease: io, duration: 1 }, 0)
      .to('.hero-card', { autoAlpha: 0, y: 24, duration: 0.33 }, 0)
      .to('.scroll-cue', { autoAlpha: 0, duration: 0.33 }, 0)
      .to('.now-playing', { autoAlpha: 0, duration: 0.4 }, 0)
      .fromTo('.outro', { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.3 }, 0.55)
      // header links step aside while the record zooms in, and return at the end
      .to('.header-nav', { autoAlpha: 0, duration: 0.08 }, 0.04)
      .to('.header-nav', { autoAlpha: 1, duration: 0.05 }, 1.1)
      .to({}, { duration: 0.15 }, 1); // hold the outro at the end
  });

  // Only animate while the hero is on screen, to save battery further down the page.
  let visible = true;
  const io = new IntersectionObserver(([entry]) => {
    visible = Boolean(entry?.isIntersecting);
    lastY = scrollY;
  });
  io.observe(hero);
  ac.signal.addEventListener('abort', () => io.disconnect());

  // Tonearm + platter, driven every frame
  let lastArm = NaN,
    lastDisk = NaN;
  const tick = (_time: number, deltaMs: number) => {
    if (!visible) return;
    const dt = Math.min(0.05, deltaMs / 1000);
    const dy = scrollY - lastY;
    lastY = scrollY;
    scrollVel += (dy / Math.max(dt, 0.001) - scrollVel) * 0.1;

    const target = wantPlay ? PLAY + (END - PLAY) * progress : REST;
    armAngle = reduce ? target : armAngle + (target - armAngle) * Math.min(1, dt * 3.2);
    // Skip DOM writes when nothing moved (saves style recalcs every frame).
    if (Math.abs(armAngle - lastArm) > 0.001) {
      arm.setAttribute('transform', `translate(93 10) rotate(${armAngle.toFixed(3)})`);
      lastArm = armAngle;
    }
    if (wantPlay && !landed && Math.abs(armAngle - target) < 0.4) {
      landed = true;
      setStatus();
    }

    const boost = Math.min(900, Math.abs(scrollVel) * 0.35) * Math.sign(scrollVel || 1);
    const targetSpeed = landed && wantPlay ? (reduce ? 60 : RPM + boost) : 0;
    speed += (targetSpeed - speed) * Math.min(1, dt * (targetSpeed ? 1.6 : 0.9));
    diskAngle = (diskAngle + speed * dt) % 360;
    if (Math.abs(diskAngle - lastDisk) > 0.01) {
      disk.style.transform = `rotate(${diskAngle.toFixed(2)}deg)`;
      lastDisk = diskAngle;
    }
  };
  gsap.ticker.add(tick);

  setStatus();
  runPreloader(() => {
    started = true;
    // Without audio the needle drops on its own, like the original site.
    if (!heroSrc) setTimeout(() => {
      wantPlay = true;
      setStatus();
    }, reduce ? 0 : 600);
    else setStatus();
  });

  return () => {
    ac.abort();
    gsap.ticker.remove(tick);
    mm.revert();
  };
}

/* ---------- Cassette reels follow the player ---------- */
function initCassette() {
  const cassette = document.getElementById('cassette');
  const card = document.querySelector('.mixtape-card');
  if (!cassette || !card) return null;
  const srcs = [...card.querySelectorAll<HTMLElement>('[data-play]')].map((b) => new URL(b.dataset.src!, location.href).href);
  if (!srcs.length) return null;
  const ac = new AbortController();
  const follow = (s: PlayerState) => cassette.classList.toggle('playing', s.playing && s.src !== null && srcs.includes(s.src));
  addEventListener('baaz:player', (e) => follow((e as CustomEvent<PlayerState>).detail), { signal: ac.signal });
  follow(getPlayerState());
  return () => ac.abort();
}

/** Let the browser paint and handle input before the next chunk of setup work. */
const yieldToMain = () =>
  new Promise<void>((resolve) => {
    const s = (globalThis as { scheduler?: { yield?: () => Promise<void> } }).scheduler;
    s?.yield ? s.yield().then(resolve) : setTimeout(resolve, 0);
  });

let generation = 0;
document.addEventListener('astro:page-load', async () => {
  teardown?.();
  teardown = null;
  const mine = ++generation;
  await yieldToMain();
  if (mine !== generation) return; // user already navigated away
  const a = initHero();
  await yieldToMain();
  const b = mine === generation ? initCassette() : null;
  teardown = a || b ? () => (a?.(), b?.()) : null;
});
document.addEventListener('astro:before-swap', () => {
  generation++;
  teardown?.();
  teardown = null;
});
