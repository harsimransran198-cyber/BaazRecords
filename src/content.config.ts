/**
 * Content schemas. One JSON file per artist, release and show lives in
 * src/data/<collection>/; the file name is the id and the web address.
 * Every file is checked against these rules at build time, so a typo shows a
 * clear error instead of a broken page.
 */
import { defineCollection, reference } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { color, link, preview, imageFile, duration, date } from './lib/fields';

const socials = z
  .object({
    instagram: link,
    spotify: link,
    youtube: link,
    appleMusic: link,
    website: link,
  })
  .partial()
  .default({});

const artists = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/data/artists' }),
  schema: z.object({
    name: z.string().min(1),
    genre: z.string().default(''),
    color: color.default('#F15A25'),
    photo: imageFile,
    photoAlt: z.string().default(''),
    shortBio: z.string().default(''),
    bio: z.string().default(''),
    order: z.number().default(100),
    socials,
  }),
});

const releases = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/data/releases' }),
  schema: z.object({
    title: z.string().min(1),
    shortTitle: z.string().optional(),
    artists: z.array(reference('artists')).default([]),
    credit: z.string().optional(),
    format: z.string().default(''),
    type: z.enum(['album', 'ep', 'single', 'compilation']).default('album'),
    year: z.number().int().min(1900).max(2100),
    releaseDate: date,
    color: color.default('#F15A25'),
    cover: imageFile,
    description: z.string().default(''),
    tracks: z
      .array(
        z.object({
          title: z.string().min(1),
          duration,
          preview,
        }),
      )
      .default([]),
    links: z
      .object({
        spotify: link,
        appleMusic: link,
        youtube: link,
        wynk: link,
        bandcamp: link,
      })
      .partial()
      .default({}),
    showInCatalogue: z.boolean().default(true),
  }),
});

const events = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/data/events' }),
  schema: z.object({
    title: z.string().min(1),
    presenter: z.string().default('Baaz Records presents'),
    summary: z.string().default(''),
    lineup: z.string().default(''),
    artists: z.array(reference('artists')).default([]),
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
  }),
});

export const collections = { artists, releases, events };
