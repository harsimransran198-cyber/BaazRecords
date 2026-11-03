/** Reusable field rules shared by the content schemas and site.json. */
import { z } from 'astro/zod';

export const slug = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, { error: 'Use lowercase letters, numbers and dashes, e.g. noor-kaur' });

export const color = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, { error: 'Use a 6-digit hex colour, e.g. #F15A25' });

/** External link: empty, or a full https:// address (blocks javascript: and similar). */
export const link = z
  .string()
  .refine((v) => v === '' || /^https:\/\/[^\s"'<>]+$/.test(v), { error: 'Links must start with https://' })
  .default('');

/** Audio preview: empty, or a file in public/audio/. */
export const preview = z
  .string()
  .refine((v) => v === '' || /^\/audio\/[\w\-./]+\.(mp3|m4a|ogg|opus|wav)$/i.test(v), {
    error: 'Put the file in public/audio/ and write it as /audio/file-name.mp3',
  })
  .default('');

/**
 * Image in the matching src/assets/ folder: just the file name (noor-kaur.jpg)
 * or the path the admin panel saves (/src/assets/artists/noor-kaur.jpg).
 */
export const imageFile = z
  .string()
  .refine((v) => v === '' || /^[\w\-./]+\.(jpe?g|png|webp|avif)$/i.test(v), {
    error: 'Use the image file name, e.g. noor-kaur.jpg (no spaces)',
  })
  .default('');

/** Track length as m:ss (or h:mm:ss), or empty. */
export const duration = z
  .string()
  .refine((v) => v === '' || /^(\d+:)?\d{1,2}:\d{2}$/.test(v), { error: 'Use m:ss, e.g. 4:12' })
  .default('');

/** Optional date as YYYY-MM-DD. */
export const date = z
  .string()
  .refine((v) => v === '' || /^\d{4}-\d{2}-\d{2}$/.test(v), { error: 'Use YYYY-MM-DD' })
  .default('');
