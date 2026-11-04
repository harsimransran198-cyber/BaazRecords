/**
 * Persistent bottom player. Plays two kinds of songs:
 *  - YouTube videos ([data-yt]): in a small privacy-enhanced YouTube window above the bar,
 *    controlled with YouTube's postMessage API (no third-party script is loaded).
 *  - Audio files ([data-src]): through <audio> with a wavesurfer waveform and a real
 *    Web Audio equalizer (which also drives the hero visualizer).
 * Any element with [data-play] (+ data-key/title/artist/color/href/links) plays through it.
 */
import type WaveSurfer from 'wavesurfer.js';

export interface PlayerTrack {
  key: string;
  src: string;
  yt: string;
  title: string;
  artist: string;
  color: string;
  href: string;
  links: Record<string, string>;
}
export interface PlayerState {
  key: string | null;
  title: string | null;
  playing: boolean;
  kind: 'audio' | 'yt' | null;
}

const YT_ORIGIN = 'https://www.youtube-nocookie.com';
const fmt = (s: number) => {
  if (!Number.isFinite(s) || s < 0) s = 0;
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
};
const abs = (src: string) => new URL(src, location.href).href;
const reduce = matchMedia('(prefers-reduced-motion: reduce)');
const LINK_NAMES: Record<string, string> = {
  spotify: 'Spotify',
  appleMusic: 'Apple Music',
  youtube: 'YouTube',
  wynk: 'Wynk',
  bandcamp: 'Bandcamp',
  jioSaavn: 'JioSaavn',
};

let state: PlayerState = { key: null, title: null, playing: false, kind: null };
export const getPlayerState = () => state;

/* ---------- audio analysis (shared with the hero visualizer) ---------- */
let analyser: AnalyserNode | null = null;
let freq: Uint8Array<ArrayBuffer> | null = null;
/** Frequency levels (0-255) for audio files, or null (nothing playing, or a YouTube song). */
export function getFrequencyData(): Uint8Array | null {
  if (!analyser || !freq || !state.playing || state.kind !== 'audio') return null;
  analyser.getByteFrequencyData(freq);
  return freq;
}
function connectAnalyser(audio: HTMLAudioElement) {
  if (analyser) return;
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    const source = ctx.createMediaElementSource(audio);
    analyser = ctx.createAnalyser();
    analyser.fftSize = 128;
    analyser.smoothingTimeConstant = 0.82;
    source.connect(analyser);
    analyser.connect(ctx.destination);
    freq = new Uint8Array(analyser.frequencyBinCount);
    audio.addEventListener('play', () => void ctx.resume());
  } catch {
    analyser = null;
  }
}

export function initPlayer() {
  const root = document.getElementById('player');
  const videoBox = document.getElementById('p-video');
  if (!root || !videoBox || root.dataset.ready) return;
  root.dataset.ready = '1';

  const audio = root.querySelector('audio')!;
  const titleEl = root.querySelector<HTMLAnchorElement>('.p-title')!;
  const artistEl = root.querySelector<HTMLElement>('.p-artist')!;
  const toggle = root.querySelector<HTMLButtonElement>('.p-toggle')!;
  const close = root.querySelector<HTMLButtonElement>('.p-close')!;
  const wave = root.querySelector<HTMLElement>('.p-wave')!;
  const fallback = wave.querySelector<HTMLElement>('.fallback')!;
  const bar = root.querySelector<HTMLElement>('.fallback i')!;
  const cur = root.querySelector<HTMLElement>('.p-cur')!;
  const dur = root.querySelector<HTMLElement>('.p-dur')!;
  const vol = root.querySelector<HTMLInputElement>('input[type="range"]')!;
  const eqBars = [...root.querySelectorAll<HTMLElement>('.p-eq i')];
  const linksEl = root.querySelector<HTMLElement>('.p-links')!;
  const icons = root.querySelector<HTMLTemplateElement>('#p-icons')!;

  let ws: WaveSurfer | null = null;
  let current: PlayerTrack | null = null;
  let kind: 'audio' | 'yt' | null = null;

  try {
    const saved = localStorage.getItem('baaz-volume');
    if (saved !== null) vol.value = saved;
  } catch {}
  audio.volume = Number(vol.value);

  /* ---------- YouTube ---------- */
  let ytFrame: HTMLIFrameElement | null = null;
  let ytPlaying = false;
  let ytTime = 0;
  let ytDur = 0;
  let ytListenTimer = 0;
  const ytSend = (func: string, args: unknown[] = []) =>
    ytFrame?.contentWindow?.postMessage(JSON.stringify({ event: 'command', func, args }), YT_ORIGIN);

  function startYouTube(t: PlayerTrack, at = 0) {
    stopYouTube();
    ytTime = at;
    ytDur = 0;
    const f = document.createElement('iframe');
    const params = new URLSearchParams({
      enablejsapi: '1',
      autoplay: '1',
      playsinline: '1',
      rel: '0',
      modestbranding: '1',
      origin: location.origin,
      ...(at > 1 ? { start: String(Math.floor(at)) } : {}),
    });
    f.src = `${YT_ORIGIN}/embed/${t.yt}?${params}`;
    f.title = `${t.title} by ${t.artist} (YouTube)`;
    f.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
    f.referrerPolicy = 'strict-origin-when-cross-origin';
    let loads = 0;
    f.addEventListener('load', () => {
      // A second load means the browser reloaded the window (e.g. while changing pages):
      // jump back to where the song was instead of starting over.
      if (++loads > 1 && ytTime > 1) setTimeout(() => ytSend('seekTo', [ytTime, true]), 900);
      // ask the player to start sending state + time updates
      let tries = 0;
      clearInterval(ytListenTimer);
      ytListenTimer = window.setInterval(() => {
        f.contentWindow?.postMessage(JSON.stringify({ event: 'listening', id: 'baaz', channel: 'widget' }), YT_ORIGIN);
        ytSend('setVolume', [Math.round(Number(vol.value) * 100)]);
        if (++tries > 12) clearInterval(ytListenTimer);
      }, 400);
    });
    ytFrame = f;
    videoBox!.replaceChildren(f);
    videoBox!.classList.add('is-on');
    setSize();
  }
  function stopYouTube() {
    clearInterval(ytListenTimer);
    ytFrame?.remove();
    ytFrame = null;
    ytPlaying = false;
    videoBox!.classList.remove('is-on');
    setSize();
  }
  addEventListener('message', (e) => {
    if (e.origin !== YT_ORIGIN || !ytFrame || e.source !== ytFrame.contentWindow || typeof e.data !== 'string') return;
    let d: { event?: string; info?: Record<string, unknown> | number };
    try {
      d = JSON.parse(e.data);
    } catch {
      return;
    }
    if (d.event === 'onReady') clearInterval(ytListenTimer);
    const info = d.event === 'infoDelivery' && typeof d.info === 'object' ? d.info : null;
    const stateNum = d.event === 'onStateChange' ? (d.info as number) : (info?.playerState as number | undefined);
    if (typeof stateNum === 'number') {
      const playing = stateNum === 1 || stateNum === 3; // playing or buffering
      if (playing !== ytPlaying) {
        ytPlaying = playing;
        emit();
      }
    }
    if (info && typeof info.currentTime === 'number') ytTime = info.currentTime;
    if (info && typeof info.duration === 'number' && info.duration > 0) ytDur = info.duration;
    if (info && ('currentTime' in info || 'duration' in info)) showTime(ytTime, ytDur);
  });

  /* ---------- shared UI ---------- */
  const isMine = (el: HTMLElement) => state.key !== null && el.dataset.key === state.key && el.dataset.title === state.title;

  const syncButtons = () => {
    document.querySelectorAll<HTMLElement>('[data-play]').forEach((b) => {
      const on = isMine(b) && state.playing;
      b.setAttribute('aria-pressed', String(on));
      const label = b.querySelector('[data-label]');
      if (label && b.dataset.labelPlay === undefined) b.dataset.labelPlay = label.textContent || '';
      if (label) label.textContent = on ? 'Pause' : b.dataset.labelPlay || '';
    });
    document.querySelectorAll<HTMLElement>('[data-release-stage]').forEach((el) => {
      const keys = (el.dataset.releaseStage || '').split(' ').filter(Boolean);
      el.classList.toggle('is-playing', state.playing && state.key !== null && keys.includes(state.key));
    });
  };

  function emit() {
    const playing = kind === 'yt' ? ytPlaying : kind === 'audio' ? !audio.paused : false;
    state = { key: current?.key ?? null, title: current?.title ?? null, playing, kind };
    root!.classList.toggle('is-playing', playing);
    root!.classList.toggle('is-yt', kind === 'yt');
    toggle.setAttribute('aria-label', playing ? 'Pause' : 'Play');
    syncButtons();
    window.dispatchEvent(new CustomEvent<PlayerState>('baaz:player', { detail: state }));
    if (playing && kind === 'audio') startEq();
  }

  function showTime(t: number, d: number) {
    const p = d ? (t / d) * 100 : 0;
    cur.textContent = fmt(t);
    dur.textContent = fmt(d);
    bar.style.width = `${p}%`;
    wave.setAttribute('aria-valuenow', String(Math.round(p)));
    wave.setAttribute('aria-valuetext', `${fmt(t)} of ${fmt(d)}`);
  }

  let eqRaf = 0;
  const startEq = () => {
    if (eqRaf || reduce.matches) return;
    const loop = () => {
      const data = getFrequencyData();
      if (!data) {
        if (kind !== 'yt') eqBars.forEach((b) => (b.style.height = '8%'));
        eqRaf = 0;
        return;
      }
      const n = eqBars.length;
      const usable = Math.floor(data.length * 0.75);
      eqBars.forEach((b, i) => {
        const idx = Math.min(usable - 1, Math.floor(Math.pow(usable, (i + 1) / n)));
        b.style.height = `${8 + (data[idx]! / 255) * 92}%`;
      });
      eqRaf = requestAnimationFrame(loop);
    };
    eqRaf = requestAnimationFrame(loop);
  };

  const setSize = () => {
    const bar = root.classList.contains('is-open') ? root.getBoundingClientRect().height + 24 : 0;
    // leave room for the YouTube window too, so it never hides the end of the page
    const video = videoBox.classList.contains('is-on') ? videoBox.getBoundingClientRect().height + 8 : 0;
    document.documentElement.style.setProperty('--video-h', `${Math.round(video)}px`);
    const h = bar + video;
    document.documentElement.style.setProperty('--player-h', `${Math.round(h)}px`);
  };
  const ro = new ResizeObserver(setSize);
  ro.observe(root);
  ro.observe(videoBox);

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

  /** "Listen on" links, built with DOM methods (never innerHTML) from https links only. */
  const renderLinks = (links: Record<string, string>) => {
    linksEl.replaceChildren();
    for (const [k, url] of Object.entries(links)) {
      if (!url || !/^https:\/\/[^\s"'<>]+$/.test(url) || !LINK_NAMES[k]) continue;
      const a = document.createElement('a');
      a.href = url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.setAttribute('aria-label', `${k === 'youtube' ? 'Watch' : 'Listen'} on ${LINK_NAMES[k]} (opens in a new tab)`);
      const svg = icons.content.querySelector(`[data-k="${k}"] svg`);
      if (svg) a.append(svg.cloneNode(true));
      linksEl.append(a);
    }
  };

  async function attachWave(src: string) {
    try {
      const { default: WS } = await import('wavesurfer.js');
      if (!ws) {
        ws = WS.create({
          container: wave,
          media: audio,
          height: wave.clientHeight || 40,
          waveColor: 'rgba(244,244,246,.22)',
          progressColor: '#FF1E42',
          cursorWidth: 1,
          cursorColor: '#F5A623',
          barWidth: 2,
          barGap: 2,
          barRadius: 2,
          normalize: true,
          dragToSeek: true,
        });
        ws.on('ready', () => fallback.setAttribute('hidden', ''));
        ws.on('error', () => fallback.removeAttribute('hidden'));
      }
      await ws.load(src);
    } catch {
      fallback.removeAttribute('hidden');
    }
  }

  /** Waveform for audio files, plain progress bar for YouTube. */
  const setWaveMode = (yt: boolean) => {
    wave.classList.toggle('is-yt', yt);
    ws?.getWrapper()?.style.setProperty('display', yt ? 'none' : '');
    yt ? fallback.removeAttribute('hidden') : ws && fallback.setAttribute('hidden', '');
  };

  function play(t: PlayerTrack) {
    // same song: toggle play/pause
    if (current && current.key === t.key && current.title === t.title) {
      togglePlay();
      return;
    }
    current = t;
    clearError();
    titleEl.textContent = t.title;
    titleEl.href = t.href || '/releases/';
    artistEl.textContent = t.artist;
    root!.style.setProperty('--c', /^#[0-9a-f]{6}$/i.test(t.color) ? t.color : '#FF1E42');
    renderLinks(t.links);
    showTime(0, 0);
    open();

    if (t.yt) {
      audio.pause();
      kind = 'yt';
      setWaveMode(true);
      startYouTube(t);
      emit();
    } else {
      stopYouTube();
      kind = 'audio';
      setWaveMode(false);
      connectAnalyser(audio);
      audio.src = abs(t.src);
      audio.preload = 'auto';
      audio.play().catch((err: unknown) => {
        if ((err as Error)?.name !== 'AbortError') showError('This preview could not be played. Try again in a moment.');
      });
      void attachWave(abs(t.src));
    }
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({ title: t.title, artist: t.artist, album: 'Baaz Records' });
    }
  }

  function togglePlay() {
    if (kind === 'yt') {
      if (!ytFrame && current) startYouTube(current, ytTime);
      else ytSend(ytPlaying ? 'pauseVideo' : 'playVideo');
    } else if (kind === 'audio') {
      audio.paused ? audio.play().catch(() => {}) : audio.pause();
    }
  }

  document.addEventListener('click', (e) => {
    const btn = (e.target as Element | null)?.closest<HTMLElement>('[data-play]');
    if (!btn || (!btn.dataset.src && !btn.dataset.yt)) return;
    e.preventDefault();
    let links: Record<string, string> = {};
    try {
      links = JSON.parse(btn.dataset.links || '{}');
    } catch {}
    const yt = btn.dataset.yt || '';
    if (yt && !/^[\w-]{11}$/.test(yt)) return;
    play({
      key: btn.dataset.key || (yt ? `yt:${yt}` : btn.dataset.src || ''),
      src: btn.dataset.src || '',
      yt,
      title: btn.dataset.title || '',
      artist: btn.dataset.artist || '',
      color: btn.dataset.color || '',
      href: btn.dataset.href || '',
      links,
    });
  });

  toggle.addEventListener('click', togglePlay);
  close.addEventListener('click', () => {
    audio.pause();
    stopYouTube();
    current = null;
    kind = null;
    emit();
    root.classList.remove('is-open');
    setSize();
    setTimeout(() => {
      if (!root.classList.contains('is-open')) root.hidden = true;
    }, 700);
  });
  vol.addEventListener('input', () => {
    audio.volume = Number(vol.value);
    ytSend('setVolume', [Math.round(Number(vol.value) * 100)]);
    try {
      localStorage.setItem('baaz-volume', vol.value);
    } catch {}
  });

  const seekTo = (seconds: number) => {
    if (kind === 'yt') ytSend('seekTo', [seconds, true]);
    else audio.currentTime = seconds;
  };
  const duration = () => (kind === 'yt' ? ytDur : audio.duration || 0);
  const position = () => (kind === 'yt' ? ytTime : audio.currentTime);
  wave.addEventListener('keydown', (e) => {
    const d = duration();
    if (!d) return;
    const step = e.shiftKey ? 15 : 5;
    if (e.key === 'ArrowRight') seekTo(Math.min(d, position() + step));
    else if (e.key === 'ArrowLeft') seekTo(Math.max(0, position() - step));
    else if (e.key === ' ' || e.key === 'Enter') togglePlay();
    else return;
    e.preventDefault();
  });
  wave.addEventListener('click', (e) => {
    if (kind === 'audio' && ws) return; // wavesurfer handles its own seeking
    const d = duration();
    if (!d) return;
    const r = wave.getBoundingClientRect();
    seekTo(((e.clientX - r.left) / r.width) * d);
  });

  audio.addEventListener('play', emit);
  audio.addEventListener('pause', emit);
  audio.addEventListener('ended', emit);
  audio.addEventListener('timeupdate', () => kind === 'audio' && showTime(audio.currentTime, audio.duration));
  audio.addEventListener('error', () => {
    if (kind === 'audio' && current) showError('This preview could not be loaded.');
    emit();
  });

  document.addEventListener('astro:page-load', syncButtons);
  document.addEventListener('astro:after-swap', setSize);
}
