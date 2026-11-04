/** Data helpers used by pages. Everything runs at build time. */
import { artists, events, releases, site, videos } from './site';
import type { Artist, Event, Release, Track, Video } from './schemas';

export type { Artist, Event, Release, Track, Video };

export interface ReleaseView extends Release {
  artistList: Artist[];
  byline: string;
  url: string;
  /** Catalogue number, or a running number like "No. 04" (oldest release = No. 01). */
  catNo: string;
  /** First YouTube video among the tracks, if any. */
  youtubeId: string;
  /** YouTube thumbnail used as the cover when there is no cover image file. */
  thumb: string;
}

/* ---------- playable tracks ---------- */
export const isPlayable = (t: Track) => Boolean(t.preview || t.youtubeId);
/** Same key the bottom player uses to know which song is playing. */
export const trackKey = (t: Track) => (t.youtubeId ? `yt:${t.youtubeId}` : t.preview);
export const watchUrl = (id: string) => `https://www.youtube.com/watch?v=${id}`;

/* ---------- YouTube thumbnails: HD when YouTube has one, checked once per build ---------- */
const ytIds = [...new Set(releases.flatMap((r) => r.tracks.map((t) => t.youtubeId)).filter(Boolean))];
const hd = new Map<string, boolean>();
await Promise.all(
  ytIds.map(async (id) => {
    try {
      const res = await fetch(`https://i.ytimg.com/vi/${id}/maxresdefault.jpg`, { method: 'HEAD', signal: AbortSignal.timeout(6000) });
      hd.set(id, res.ok);
    } catch {
      hd.set(id, false); // offline build: the standard thumbnail always exists
    }
  }),
);
export const ytThumb = (id: string) => `https://i.ytimg.com/vi/${id}/${hd.get(id) ? 'maxresdefault' : 'hqdefault'}.jpg`;

const byId = new Map(artists.map((a) => [a.id, a]));
const chronological = [...releases].sort(
  (a, b) => a.year - b.year || a.releaseDate.localeCompare(b.releaseDate) || a.title.localeCompare(b.title),
);

export function toView(r: Release): ReleaseView {
  const artistList = r.artists.map((id) => byId.get(id)!).filter(Boolean);
  const main = artistList.length ? joinNames(artistList.map((a) => a.name)) : r.credit || site.name;
  const byline = r.featuring ? `${main} ft. ${r.featuring}` : main;
  const n = chronological.findIndex((x) => x.id === r.id) + 1;
  const youtubeId = r.tracks.find((t) => t.youtubeId)?.youtubeId ?? '';
  // a YouTube video doubles as the YouTube streaming link
  const links = youtubeId && !r.links.youtube ? { ...r.links, youtube: watchUrl(youtubeId) } : r.links;
  return {
    ...r,
    links,
    artistList,
    byline,
    url: `/releases/${r.id}/`,
    catNo: r.catalog || `No. ${String(n).padStart(2, '0')}`,
    youtubeId,
    thumb: youtubeId ? ytThumb(youtubeId) : '',
  };
}

/** Artists in the order of artists.ts. */
export const getArtists = (): Artist[] => artists;

/** Releases newest first (year, then release date), then A to Z. */
export function getReleases(): ReleaseView[] {
  return [...releases]
    .sort((a, b) => b.year - a.year || b.releaseDate.localeCompare(a.releaseDate) || a.title.localeCompare(b.title))
    .map(toView);
}

export const getRelease = (id: string) => getReleases().find((r) => r.id === id);
export const getArtist = (id: string) => byId.get(id);

export const getEvents = (): Event[] => [...events].sort((a, b) => a.date.localeCompare(b.date));

/** Shows from today onward (build date, India time). */
export function getUpcomingEvents() {
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  return getEvents().filter((e) => e.date >= today);
}

export const getVideos = (): Video[] => [...videos].sort((a, b) => b.uploadDate.localeCompare(a.uploadDate));
export const artistsOf = (ids: string[]) => ids.map((id) => byId.get(id)!).filter(Boolean);

export function joinNames(names: string[]) {
  if (names.length < 2) return names.join('');
  return `${names.slice(0, -1).join(', ')} and ${names.at(-1)}`;
}

/** "4:12" -> "PT4M12S" for schema.org */
export function isoDuration(d: string) {
  if (!d) return undefined;
  const parts = d.split(':').map(Number);
  const [h, m, s] = parts.length === 3 ? parts : [0, ...parts];
  return `PT${h ? `${h}H` : ''}${m}M${s}S`;
}

export function formatEventDate(iso: string) {
  const d = new Date(`${iso}T12:00:00+05:30`);
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' });
}

export function formatDoors(hhmm: string) {
  const [h, m] = hhmm.split(':').map(Number);
  const suffix = h! >= 12 ? 'pm' : 'am';
  return `${((h! + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${suffix}`;
}

export function formatPrice(price: number | undefined, currency: string) {
  if (price === undefined) return '';
  if (price === 0) return 'Free';
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(price);
}

export function initials(name: string) {
  return name
    .replace(/&/g, ' ')
    .split(/\s+/)
    .filter((w) => w && !['the', 'and'].includes(w.toLowerCase()))
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('');
}

/** Text colour that stays readable on a given label colour. */
export function inkOn(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  return 0.299 * r + 0.587 * g + 0.114 * b > 150 ? '#050507' : '#F4F4F6';
}

export const linkNames: Record<string, string> = {
  spotify: 'Spotify',
  appleMusic: 'Apple Music',
  youtube: 'YouTube',
  wynk: 'Wynk',
  bandcamp: 'Bandcamp',
  jioSaavn: 'JioSaavn',
  instagram: 'Instagram',
  website: 'Website',
  facebook: 'Facebook',
  x: 'X',
};
/** Kept for older components. */
export const streamingNames = linkNames;

/** Non-empty links as [key, url] pairs. */
export function filledLinks(obj: Record<string, string | undefined>) {
  return Object.entries(obj).filter((e): e is [string, string] => Boolean(e[1]));
}

/** Track length "4:12" → "04:12" for the mono readouts. */
export const monoTime = (d: string) => (d ? d.replace(/^(\d):/, '0$1:') : '--:--');
