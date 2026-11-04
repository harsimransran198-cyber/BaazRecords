/**
 * Checks every file in src/data/ at build time and exports the clean data.
 * A mistake (wrong id, link without https://, bad date) stops the build and
 * names the file and the field.
 */
import { z } from 'astro/zod';
import { site as rawSite } from '../data/site';
import { artists as rawArtists } from '../data/artists';
import { releases as rawReleases } from '../data/releases';
import { events as rawEvents } from '../data/events';
import { videos as rawVideos } from '../data/videos';
import { artistSchema, eventSchema, releaseSchema, siteSchema, videoSchema } from './schemas';

function check<T extends z.ZodType>(schema: T, value: unknown, where: string): z.output<T> {
  const r = schema.safeParse(value);
  if (!r.success) throw new Error(`\n\nsrc/data/${where} has a problem:\n${z.prettifyError(r.error)}\n`);
  return r.data;
}
function checkList<T extends z.ZodType>(schema: T, list: unknown[], file: string, label: (x: any) => string) {
  const out = list.map((x, i) => check(schema, x, `${file} (entry ${i + 1}: ${label(x)})`));
  const ids = new Set<string>();
  for (const x of out as { id?: string }[]) {
    if (!x.id) continue;
    if (ids.has(x.id)) throw new Error(`\n\nsrc/data/${file}: the id "${x.id}" is used twice. Each id must be unique.\n`);
    ids.add(x.id);
  }
  return out;
}

export const site = check(siteSchema, rawSite, 'site.ts');
export const artists = checkList(artistSchema, rawArtists, 'artists.ts', (x) => x?.name ?? '?');
export const releases = checkList(releaseSchema, rawReleases, 'releases.ts', (x) => x?.title ?? '?');
export const events = checkList(eventSchema, rawEvents, 'events.ts', (x) => x?.title ?? '?');
export const videos = checkList(videoSchema, rawVideos, 'videos.ts', (x) => x?.title ?? '?');

// Cross-checks: every artist / release id that is referenced must exist.
const artistIds = new Set(artists.map((a) => a.id));
const releaseIds = new Set(releases.map((r) => r.id));
const missing = (file: string, owner: string, kind: string, id: string) =>
  new Error(`\n\nsrc/data/${file}: "${owner}" lists ${kind} "${id}", but there is no ${kind} with that id.\n`);

for (const r of releases) for (const id of r.artists) if (!artistIds.has(id)) throw missing('releases.ts', r.title, 'artist', id);
for (const e of events) for (const id of e.artists) if (!artistIds.has(id)) throw missing('events.ts', e.title, 'artist', id);
for (const v of videos) {
  for (const id of v.artists) if (!artistIds.has(id)) throw missing('videos.ts', v.title, 'artist', id);
  if (v.release && !releaseIds.has(v.release)) throw missing('videos.ts', v.title, 'release', v.release);
}
if (!releaseIds.has(site.hero.release)) throw missing('site.ts', 'hero', 'release', site.hero.release);
