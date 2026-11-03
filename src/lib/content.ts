/** Data helpers used by pages. All lookups happen at build time. */
import { getCollection, getEntries, type CollectionEntry } from 'astro:content';
import { site } from './site';

/** Each entry's id is its file name, e.g. src/data/artists/noor-kaur.json → "noor-kaur". */
export type Artist = CollectionEntry<'artists'>['data'] & { id: string };
export type Release = CollectionEntry<'releases'>['data'] & { id: string };
export type Event = CollectionEntry<'events'>['data'] & { id: string };
export type Track = Release['tracks'][number];

export interface ReleaseView extends Release {
  artistList: Artist[];
  byline: string;
  url: string;
}

const withId = <T,>(e: { id: string; data: T }) => ({ ...e.data, id: e.id });

/** Artists: lowest "order" number first, then A to Z. */
export async function getArtists(): Promise<Artist[]> {
  return (await getCollection('artists')).map(withId).sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
}

/** Releases: newest first (year, then release date), then A to Z. */
export async function getReleases(): Promise<ReleaseView[]> {
  const list = (await getCollection('releases'))
    .map(withId)
    .sort((a, b) => b.year - a.year || b.releaseDate.localeCompare(a.releaseDate) || a.title.localeCompare(b.title));
  return Promise.all(list.map((r) => toView(r)));
}

export async function toView(r: Release): Promise<ReleaseView> {
  const artistList = (await getEntries(r.artists)).map(withId);
  const byline = artistList.length ? joinNames(artistList.map((a) => a.name)) : r.credit || site.name;
  return { ...r, artistList, byline, url: `/releases/${r.id}/` };
}

export async function getEvents() {
  const all = (await getCollection('events')).map(withId);
  return all.sort((a, b) => a.date.localeCompare(b.date));
}

/** Events from today onward (build date, India time). */
export async function getUpcomingEvents() {
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  return (await getEvents()).filter((e) => e.date >= today);
}

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
  const suffix = h >= 12 ? 'pm' : 'am';
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${suffix}`;
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
  return 0.299 * r + 0.587 * g + 0.114 * b > 150 ? '#0A0A0A' : '#FFFDD0';
}

export const streamingNames: Record<string, string> = {
  spotify: 'Spotify',
  appleMusic: 'Apple Music',
  youtube: 'YouTube',
  wynk: 'Wynk',
  bandcamp: 'Bandcamp',
  instagram: 'Instagram',
  website: 'Website',
  facebook: 'Facebook',
  x: 'X',
};

/** Non-empty links as [key, url] pairs. */
export function filledLinks(obj: Record<string, string | undefined>) {
  return Object.entries(obj).filter((e): e is [string, string] => Boolean(e[1]));
}
