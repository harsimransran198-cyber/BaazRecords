/**
 * Finds images referenced by file name in the JSON data.
 * Drop a photo in the folder, write its file name in the JSON, done.
 *   artists -> src/assets/artists/
 *   covers  -> src/assets/covers/
 */
import type { ImageMetadata } from 'astro';

type Mod = { default: ImageMetadata };
const artistImages = import.meta.glob<Mod>('/src/assets/artists/*.{jpg,jpeg,png,webp,avif,JPG,JPEG,PNG,WEBP}', { eager: true });
const coverImages = import.meta.glob<Mod>('/src/assets/covers/*.{jpg,jpeg,png,webp,avif,JPG,JPEG,PNG,WEBP}', { eager: true });

function find(map: Record<string, Mod>, folder: string, value: string, owner: string) {
  if (!value) return undefined;
  const file = value.split('/').pop()!; // accepts "x.jpg" or "/src/assets/<folder>/x.jpg"
  const hit = map[`/src/assets/${folder}/${file}`];
  if (!hit) {
    throw new Error(`Image "${file}" for "${owner}" was not found. Put it in src/assets/${folder}/ (check the spelling and extension).`);
  }
  return hit.default;
}

export const artistPhoto = (file: string, owner: string) => find(artistImages, 'artists', file, owner);
export const coverImage = (file: string, owner: string) => find(coverImages, 'covers', file, owner);
