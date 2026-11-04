/**
 * Rules for everything in src/data/. Your editor uses the `...Input` types to
 * autocomplete and underline mistakes while you type, and the build checks the
 * same rules again, so a typo stops the build with a clear message instead of
 * shipping a broken page.
 */
import { z } from 'astro/zod';
import { color, link, preview, imageFile, duration, date, slug } from './fields';

const socials = z
  .object({ instagram: link, spotify: link, youtube: link, appleMusic: link, website: link })
  .partial()
  .default({});

const streaming = z
  .object({ spotify: link, appleMusic: link, youtube: link, wynk: link, bandcamp: link, jioSaavn: link })
  .partial()
  .default({});

export const artistSchema = z.object({
  /** Web address: /artists/<id>/. Lowercase letters, numbers and dashes. */
  id: slug,
  name: z.string().min(1),
  genre: z.string().default(''),
  /** Accent colour for this artist's artwork when there is no photo. */
  color: color.default('#FF1E42'),
  /** File name in src/assets/artists/, e.g. "noor-kaur.jpg". */
  photo: imageFile,
  photoAlt: z.string().default(''),
  shortBio: z.string().default(''),
  /** Full bio. Separate paragraphs with an empty line. */
  bio: z.string().default(''),
  socials,
});

export const trackSchema = z.object({
  title: z.string().min(1),
  /** m:ss, e.g. "4:12". */
  duration,
  /** Audio file in public/audio/, written as "/audio/file.mp3". Adds a play button. */
  preview,
  /** YouTube video for this song: the 11-character id from the link (youtu.be/<id>). Plays on the site. */
  youtubeId: z.string().regex(/^$|^[\w-]{11}$/, { error: 'Use the 11-character id from the YouTube link' }).default(''),
  /** International Standard Recording Code, e.g. "INX012600001". Helps Google. */
  isrc: z.string().regex(/^$|^[A-Z]{2}[A-Z0-9]{3}\d{7}$/, { error: 'ISRC looks like INX012600001' }).default(''),
});

export const releaseSchema = z.object({
  /** Web address: /releases/<id>/. */
  id: slug,
  title: z.string().min(1),
  shortTitle: z.string().optional(),
  /** Artist ids from artists.ts. Leave empty for a label compilation and set `credit`. */
  artists: z.array(slug).default([]),
  credit: z.string().optional(),
  /** Featured artists shown after the main artist, e.g. "Reet Kaur" → "Baaz ft. Reet Kaur". */
  featuring: z.string().default(''),
  /** The label that released it, if not Baaz Records (e.g. "Tamber Records"). Empty = Baaz Records. */
  label: z.string().default(''),
  /** Catalogue number printed on the sleeve, e.g. "BR-004". Optional. */
  catalog: z.string().default(''),
  format: z.string().default(''),
  type: z.enum(['album', 'ep', 'single', 'compilation']).default('album'),
  year: z.number().int().min(1900).max(2100),
  releaseDate: date,
  color: color.default('#FF1E42'),
  /** Square cover in src/assets/covers/, e.g. "kali-raat.jpg". */
  cover: imageFile,
  description: z.string().default(''),
  tracks: z.array(trackSchema).default([]),
  links: streaming,
  showInCatalogue: z.boolean().default(true),
});

export const eventSchema = z.object({
  id: slug,
  title: z.string().min(1),
  presenter: z.string().default('Baaz Records presents'),
  summary: z.string().default(''),
  lineup: z.string().default(''),
  artists: z.array(slug).default([]),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { error: 'Use YYYY-MM-DD, e.g. 2027-01-13' }),
  doors: z.string().regex(/^\d{2}:\d{2}$/, { error: 'Use 24-hour HH:MM, e.g. 19:00' }),
  venue: z.string().min(1),
  address: z.string().default(''),
  city: z.string().default(''),
  price: z.number().nonnegative().optional(),
  currency: z.string().length(3).default('INR'),
  ticketUrl: link,
  ticketLabel: z.string().default('GA'),
  ticketNumber: z.string().default(''),
});

export const videoSchema = z.object({
  /** The 11-character id from the YouTube link, e.g. youtube.com/watch?v=dQw4w9WgXcQ → "dQw4w9WgXcQ". */
  youtubeId: z.string().regex(/^[\w-]{11}$/, { error: 'Use the 11-character id from the YouTube link' }),
  title: z.string().min(1),
  /** Artist ids from artists.ts. */
  artists: z.array(slug).default([]),
  /** Release id from releases.ts this video belongs to (optional). */
  release: z.string().default(''),
  description: z.string().default(''),
  /** YYYY-MM-DD the video went up. Google asks for this. */
  uploadDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { error: 'Use YYYY-MM-DD' }),
  /** Length as m:ss. */
  duration,
});

export const siteSchema = z.object({
  name: z.string().min(1),
  url: z.url(),
  email: z.email(),
  tagline: z.string(),
  description: z.string().max(170, { error: 'Keep the description under 170 characters for Google' }),
  locale: z.string().default('en_IN'),
  foundingYear: z.string().default(''),
  hero: z.object({
    /** Release id on the hero sleeve. */
    release: slug,
    /** 1 = first song on that release. */
    trackNumber: z.number().int().min(1).default(1),
    eyebrow: z.string().default(''),
    text: z.string(),
  }),
  /** Words that scroll across the screen between sections. */
  marquee: z.array(z.string()).default([]),
  studio: z.object({
    quote: z.string(),
    paragraphs: z.array(z.string()),
    button: z.string().default('Book a session'),
  }),
  contact: z.object({ note: z.string().default('') }),
  demo: z.object({ intro: z.string().default(''), formEndpoint: link }),
  verification: z
    .object({
      google: z.string().regex(/^[\w-]*$/, { error: 'Paste only the code from the content="..." part' }).default(''),
      bing: z.string().regex(/^[\w-]*$/, { error: 'Paste only the code from the content="..." part' }).default(''),
    })
    .default({ google: '', bing: '' }),
  legal: z
    .object({ owner: z.string().min(1), country: z.string().default('India'), lastUpdated: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) })
    .default({ owner: 'Baaz Records', country: 'India', lastUpdated: '2026-11-04' }),
  /** The label's own profiles. Empty ones are hidden. */
  socials: z
    .object({ instagram: link, youtube: link, spotify: link, appleMusic: link, facebook: link, x: link })
    .partial()
    .default({}),
});

export type ArtistInput = z.input<typeof artistSchema>;
export type ReleaseInput = z.input<typeof releaseSchema>;
export type EventInput = z.input<typeof eventSchema>;
export type VideoInput = z.input<typeof videoSchema>;
export type SiteInput = z.input<typeof siteSchema>;

export type Artist = z.output<typeof artistSchema>;
export type Release = z.output<typeof releaseSchema>;
export type Track = z.output<typeof trackSchema>;
export type Event = z.output<typeof eventSchema>;
export type Video = z.output<typeof videoSchema>;
export type Site = z.output<typeof siteSchema>;
