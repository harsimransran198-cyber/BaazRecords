// Baaz Records — script.js
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = s => document.querySelector(s);

  /* ---------- Preloader ---------- */
  let started = false;
  const start = () => {
    if (started) return; started = true;
    document.body.classList.add('loaded');
    setTimeout(() => { wantPlay = true; setStatus(); }, reduce ? 0 : 600);   // tonearm swings in after the loader
  };
  const minShow = reduce ? 0 : 1400;
  const t0 = performance.now();
  addEventListener('load', () => setTimeout(start, Math.max(0, minShow - (performance.now() - t0))));
  setTimeout(start, 4000);   // safety net if fonts stall

  /* ---------- Header backdrop once the hero is scrolled past ---------- */
  const header = $('.site-header'), heroEl = $('.hero');
  const onScroll = () => header.classList.toggle('scrolled', heroEl.getBoundingClientRect().bottom < 90);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* ---------- Hamburger + accordion ---------- */
  const burger = $('.burger'), menu = $('#menu');
  const setMenu = open => {
    document.body.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', open);
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) setTimeout(() => menu.querySelector('.acc-btn').focus(), 300);
    else { menu.classList.add('closing'); setTimeout(() => menu.classList.remove('closing'), 850); }
  };
  burger.addEventListener('click', () => setMenu(!document.body.classList.contains('menu-open')));
  addEventListener('keydown', e => { if (e.key === 'Escape' && document.body.classList.contains('menu-open')) { setMenu(false); burger.focus(); } });
  menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setMenu(false)));

  const accBtns = [...menu.querySelectorAll('.acc-btn')];
  accBtns.forEach(btn => btn.addEventListener('click', () => {
    const willOpen = btn.getAttribute('aria-expanded') !== 'true';
    accBtns.forEach(b => { b.setAttribute('aria-expanded', 'false'); document.getElementById(b.getAttribute('aria-controls')).dataset.open = 'false'; });
    if (willOpen) { btn.setAttribute('aria-expanded', 'true'); document.getElementById(btn.getAttribute('aria-controls')).dataset.open = 'true'; }
  }));

  /* ---------- Cassette play / pause ---------- */
  const cassette = $('#cassette'), tapeBtn = $('#tapeBtn'), tapeIcon = $('#tapeIcon');
  tapeBtn.addEventListener('click', () => {
    const on = cassette.classList.toggle('playing');
    tapeBtn.setAttribute('aria-pressed', on);
    tapeBtn.querySelector('span').textContent = on ? 'Pause the tape' : 'Play the tape';
    tapeIcon.setAttribute('d', on ? 'M7 5h4v14H7zM13 5h4v14h-4z' : 'M8 5v14l11-7z');
  });

  /* ---------- Gramophone ---------- */
  const disk = $('.disk'), arm = $('#tonearm'), deck = $('.deck'), deckWrap = $('.deck-wrap');
  const npText = $('.np-text'), np = $('.now-playing');
  const w1 = $('.w1'), w2 = $('.w2'), card = $('.hero-card'), outro = $('.outro'), cue = $('.scroll-cue'), hero = $('.hero');

  const REST = -9, PLAY = 11, END = 25;   // tonearm angles in degrees
  const RPM = 200;                        // 33⅓ rpm = 200 deg/s
  let armAngle = REST, wantPlay = false, landed = false;
  let diskAngle = 0, speed = 0, lastY = scrollY, scrollVel = 0, last = performance.now();
  let baseY = innerWidth < 560 ? -5 : 0;
  addEventListener('resize', () => { baseY = innerWidth < 560 ? -5 : 0; });

  function setStatus(){
    np.classList.toggle('is-playing', landed && wantPlay);
    npText.textContent = !wantPlay ? (started ? 'Needle lifted. Tap the record to play' : 'Cueing up side A')
                       : landed ? 'Now playing: Kali Raat, Noor Kaur' : 'Cueing up side A';
    deck.setAttribute('aria-label', wantPlay ? 'Lift the needle' : 'Drop the needle');
    deck.setAttribute('aria-pressed', wantPlay);
  }
  deck.addEventListener('click', () => { wantPlay = !wantPlay; landed = false; setStatus(); });

  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const ease = t => t < .5 ? 4*t*t*t : 1 - Math.pow(-2*t + 2, 3) / 2;

  function frame(now){
    const dt = Math.min(.05, (now - last) / 1000); last = now;
    const r = hero.getBoundingClientRect();
    const p = clamp(-r.top / (r.height - innerHeight), 0, 1);
    const dy = scrollY - lastY; lastY = scrollY;
    scrollVel += (dy / Math.max(dt, .001) - scrollVel) * .1;

    // tonearm: rest position, or tracks inward as you scroll
    const target = wantPlay ? PLAY + (END - PLAY) * p : REST;
    armAngle = reduce ? target : armAngle + (target - armAngle) * Math.min(1, dt * 3.2);
    arm.setAttribute('transform', `translate(93 10) rotate(${armAngle.toFixed(3)})`);
    if (wantPlay && !landed && Math.abs(armAngle - target) < .4) { landed = true; setStatus(); }

    // disk: spins up on needle drop, faster with scroll, coasts down when lifted
    const boost = clamp(Math.abs(scrollVel) * .35, 0, 900) * Math.sign(scrollVel || 1);
    const targetSpeed = landed && wantPlay ? (reduce ? 60 : RPM + boost) : 0;
    speed += (targetSpeed - speed) * Math.min(1, dt * (targetSpeed ? 1.6 : .9));
    diskAngle = (diskAngle + speed * dt) % 360;
    disk.style.transform = `rotate(${diskAngle}deg)`;

    // scroll choreography
    const e = ease(p);
    deckWrap.style.transform = `translate3d(0, ${baseY + e * -4}vh, 0) scale(${1 + e * .5})`;
    w1.style.transform = `translate3d(${-e * 60}vw, ${-e * 6}vh, 0)`;
    w2.style.transform = `translate3d(${e * 60}vw, ${e * 6}vh, 0)`;
    const fade = clamp(1 - p * 3, 0, 1);
    card.style.opacity = cue.style.opacity = fade;
    card.style.transform = `translateY(${(1 - fade) * 24}px)`;
    card.style.pointerEvents = fade < .1 ? 'none' : '';
    np.style.opacity = clamp(1 - p * 2.5, 0, 1);
    const o = clamp((p - .55) / .3, 0, 1);
    outro.style.opacity = o;
    outro.style.transform = `translate(-50%, ${(1 - o) * 30}px)`;

    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  /* ---------- Custom cursor (mouse only) ---------- */
  if (matchMedia('(hover:hover) and (pointer:fine)').matches) {
    document.body.classList.add('has-cursor');
    const ring = $('.cursor'), dot = $('.cursor-dot');
    let mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my;
    addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; dot.style.transform = `translate(${mx}px,${my}px)`; });
    (function loop(){ rx += (mx - rx) * .18; ry += (my - ry) * .18; ring.style.transform = `translate(${rx}px,${ry}px)`; requestAnimationFrame(loop); })();
    document.querySelectorAll('a, button').forEach(el => {
      el.addEventListener('mouseenter', () => ring.classList.add('hover'));
      el.addEventListener('mouseleave', () => ring.classList.remove('hover'));
    });
  }
})();
