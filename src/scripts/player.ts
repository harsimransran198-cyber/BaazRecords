/**
 * Persistent bottom player.
 * Any element with [data-play] (and data-src/title/artist/color/href) plays through it.
 * The waveform library loads only after the first play, so it never slows the first page load.
 */
import type WaveSurfer from 'wavesurfer.js';

export interface PlayerTrack {
  src: string;
  title: string;
  artist: string;
  color: string;
  href: string;
}

export interface PlayerState {
  src: string | null;
  playing: boolean;
}

const fmt = (s: number) => {
  if (!Number.isFinite(s) || s < 0) s = 0;
  const m = Math.floor(s / 60);
  return `${m}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
};
const abs = (src: string) => new URL(src, location.href).href;

let state: PlayerState = { src: null, playing: false };
export const getPlayerState = () => state;

export function initPlayer() {
  const root = document.getElementById('player');
  if (!root || root.dataset.ready) return;
  root.dataset.ready = '1';

  const audio = root.querySelector('audio')!;
  const titleEl = root.querySelector<HTMLAnchorElement>('.p-title')!;
  const artistEl = root.querySelector<HTMLElement>('.p-artist')!;
  const toggle = root.querySelector<HTMLButtonElement>('.p-toggle')!;
  const close = root.querySelector<HTMLButtonElement>('.p-close')!;
  const wave = root.querySelector<HTMLElement>('.p-wave')!;
  const bar = root.querySelector<HTMLElement>('.fallback i')!;
  const cur = root.querySelector<HTMLElement>('.p-cur')!;
  const dur = root.querySelector<HTMLElement>('.p-dur')!;
  const vol = root.querySelector<HTMLInputElement>('input[type="range"]')!;

  let ws: WaveSurfer | null = null;
  let current: PlayerTrack | null = null;

  try {
    const saved = localStorage.getItem('baaz-volume');
    if (saved !== null) vol.value = saved;
  } catch {}
  audio.volume = Number(vol.value);

  const emit = () => {
    state = { src: current ? abs(current.src) : null, playing: !audio.paused };
    root.classList.toggle('is-playing', state.playing);
    toggle.setAttribute('aria-label', state.playing ? 'Pause' : 'Play');
    syncButtons();
    window.dispatchEvent(new CustomEvent<PlayerState>('baaz:player', { detail: state }));
  };

  const syncButtons = () => {
    document.querySelectorAll<HTMLElement>('[data-play]').forEach((b) => {
      const mine = state.src !== null && abs(b.dataset.src || '') === state.src && b.dataset.title === current?.title;
      b.setAttribute('aria-pressed', String(mine && state.playing));
      const label = b.querySelector('[data-label]');
      if (label && b.dataset.labelPlay === undefined) b.dataset.labelPlay = label.textContent || '';
      if (label) label.textContent = mine && state.playing ? 'Pause' : b.dataset.labelPlay || '';
    });
  };

  const setSize = () => {
    const h = root.classList.contains('is-open') ? root.getBoundingClientRect().height + 24 : 0;
    document.documentElement.style.setProperty('--player-h', `${Math.round(h)}px`);
  };
  new ResizeObserver(setSize).observe(root);

  const open = () => {
    root.hidden = false;
    requestAnimationFrame(() => {
      root.classList.add('is-open');
      setSize();
    });
  };

  const showError = (msg: string) => {
    let el = root.querySelector<HTMLElement>('.p-error');
    if (!el) {
      el = document.createElement('p');
      el.className = 'p-error';
      el.setAttribute('role', 'status');
      root.append(el);
    }
    el.textContent = msg;
  };
  const clearError = () => root.querySelector('.p-error')?.remove();

  async function attachWave(src: string) {
    try {
      const { default: WS } = await import('wavesurfer.js');
      if (!ws) {
        ws = WS.create({
          container: wave,
          media: audio,
          height: wave.clientHeight || 40,
          waveColor: '#4a4a4a',
          progressColor: '#F2BC00',
          cursorWidth: 0,
          barWidth: 2,
          barGap: 2,
          barRadius: 2,
          normalize: true,
          dragToSeek: true,
        });
        ws.on('ready', () => wave.querySelector('.fallback')?.setAttribute('hidden', ''));
        ws.on('error', () => wave.querySelector('.fallback')?.removeAttribute('hidden'));
      }
      await ws.load(src);
    } catch {
      // Waveform is decoration only; the plain progress bar keeps working.
      wave.querySelector('.fallback')?.removeAttribute('hidden');
    }
  }

  function play(t: PlayerTrack) {
    const src = abs(t.src);
    if (current && abs(current.src) === src && current.title === t.title) {
      audio.paused ? audio.play().catch(() => {}) : audio.pause();
      return;
    }
    current = t;
    clearError();
    titleEl.textContent = t.title;
    titleEl.href = t.href || '/releases/';
    artistEl.textContent = t.artist;
    root.style.setProperty('--c', t.color || '#F15A25');
    bar.style.width = '0';
    audio.src = src;
    audio.preload = 'auto';
    open();
    audio.play().catch((err: unknown) => {
      if ((err as Error)?.name !== 'AbortError') showError('This preview could not be played. Try again in a moment.');
    });
    void attachWave(src);
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({ title: t.title, artist: t.artist, album: 'Baaz Records' });
    }
  }

  // One listener for every play button on every page, including pages loaded later.
  document.addEventListener('click', (e) => {
    const btn = (e.target as Element | null)?.closest<HTMLElement>('[data-play]');
    if (!btn || !btn.dataset.src) return;
    e.preventDefault();
    play({
      src: btn.dataset.src,
      title: btn.dataset.title || '',
      artist: btn.dataset.artist || '',
      color: btn.dataset.color || '',
      href: btn.dataset.href || '',
    });
  });

  toggle.addEventListener('click', () => (audio.paused ? audio.play().catch(() => {}) : audio.pause()));
  close.addEventListener('click', () => {
    audio.pause();
    root.classList.remove('is-open');
    setSize();
    setTimeout(() => {
      if (!root.classList.contains('is-open')) root.hidden = true;
    }, 600);
  });
  vol.addEventListener('input', () => {
    audio.volume = Number(vol.value);
    try {
      localStorage.setItem('baaz-volume', vol.value);
    } catch {}
  });

  // keyboard seeking on the waveform
  wave.addEventListener('keydown', (e) => {
    if (!audio.duration) return;
    const step = e.shiftKey ? 15 : 5;
    if (e.key === 'ArrowRight') audio.currentTime = Math.min(audio.duration, audio.currentTime + step);
    else if (e.key === 'ArrowLeft') audio.currentTime = Math.max(0, audio.currentTime - step);
    else if (e.key === ' ' || e.key === 'Enter') audio.paused ? audio.play().catch(() => {}) : audio.pause();
    else return;
    e.preventDefault();
  });
  // click-to-seek when the waveform is not loaded
  wave.addEventListener('click', (e) => {
    if (ws || !audio.duration) return;
    const r = wave.getBoundingClientRect();
    audio.currentTime = ((e.clientX - r.left) / r.width) * audio.duration;
  });

  audio.addEventListener('play', emit);
  audio.addEventListener('pause', emit);
  audio.addEventListener('ended', emit);
  audio.addEventListener('loadedmetadata', () => (dur.textContent = fmt(audio.duration)));
  audio.addEventListener('timeupdate', () => {
    const p = audio.duration ? (audio.currentTime / audio.duration) * 100 : 0;
    cur.textContent = fmt(audio.currentTime);
    bar.style.width = `${p}%`;
    wave.setAttribute('aria-valuenow', String(Math.round(p)));
    wave.setAttribute('aria-valuetext', `${fmt(audio.currentTime)} of ${fmt(audio.duration)}`);
  });
  audio.addEventListener('error', () => {
    if (current) showError('This preview could not be loaded.');
    emit();
  });

  // New page loaded: mark its play buttons if their track is playing.
  document.addEventListener('astro:page-load', syncButtons);
  // Page swaps reset <html> attributes, so restore the player spacing.
  document.addEventListener('astro:after-swap', setSize);
}
