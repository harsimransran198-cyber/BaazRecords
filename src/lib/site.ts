/** Loads and checks src/data/site.json (label info) and src/data/home.json (home page). */
import { z } from 'astro/zod';
import rawSite from '../data/site.json';
import rawHome from '../data/home.json';
import { link, slug } from './fields';

const siteSchema = z.object({
  name: z.string().min(1),
  url: z.url(),
  email: z.email(),
  tagline: z.string(),
  description: z.string().max(170, { error: 'Keep the description under 170 characters for Google' }),
  locale: z.string().default('en_IN'),
  foundingYear: z.string().default(''),
  contact: z.object({ note: z.string().default('') }),
  demo: z.object({
    intro: z.string().default(''),
    formEndpoint: link,
  }),
  socials: z
    .object({ instagram: link, youtube: link, spotify: link, facebook: link, x: link })
    .partial()
    .default({}),
});

const homeSchema = z.object({
  hero: z.object({
    release: slug,
    trackNumber: z.number().int().min(1).default(1),
    headline: z.string(),
    text: z.string(),
    button: z.string().default('Hear the new release'),
    outro: z.string().default(''),
  }),
  cassette: z.object({ release: z.string().default('') }).default({ release: '' }),
  studio: z.object({
    quote: z.string(),
    paragraphs: z.array(z.string()),
    button: z.string().default('Book a session'),
  }),
});

function load<T extends z.ZodType>(schema: T, raw: unknown, file: string): z.infer<T> {
  const parsed = schema.safeParse(raw);
  if (!parsed.success) throw new Error(`src/data/${file} has a problem:\n${z.prettifyError(parsed.error)}`);
  return parsed.data;
}

export const site = load(siteSchema, rawSite, 'site.json');
export const home = load(homeSchema, rawHome, 'home.json');
export type Site = typeof site;
