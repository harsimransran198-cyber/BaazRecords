# Baaz Records — baazrecords.in

Website for Baaz Records, an independent Punjabi music label.
Astro + Tailwind CSS v4, "Obsidian & Studio Crimson" theme, GSAP + Lenis animation, wavesurfer.js player.
No CMS: all content lives in typed files in `src/data/` that you edit by hand.

## Change the content

| File | What it controls |
| --- | --- |
| `src/data/site.ts` | Label name, email, hero (which release + song), scrolling words, studio text, demo page, social links |
| `src/data/artists.ts` | The roster: name, genre, colour, photo, bio, links. Shown in this order |
| `src/data/releases.ts` | Albums, EPs, singles, tapes: tracks, audio previews, cover, catalogue no., streaming links |
| `src/data/events.ts` | Live shows. A show disappears the day after it happens |
| `src/data/videos.ts` | Music videos for the Visuals page (YouTube id, title, date) |

Each file has short instructions at the top. Open it in VS Code: if you mistype a field name or value, the editor
underlines it, and the build stops with a message naming the file and field, so a typo never reaches the live site.

- **Add an artist / release / show / video:** copy a `{ ... }` block, paste it after a comma, change the values.
  The `id` becomes the web address: `id: 'noor-kaur'` → `baazrecords.in/artists/noor-kaur/`.
- **Link a release to artists:** `artists: ['noor-kaur']` (ids from `artists.ts`).
- **Change the hero:** in `site.ts`, set `hero.release` (a release id) and `hero.trackNumber` (1 = first song).
- **Remove something:** delete its `{ ... }` block.

### Photos, covers, audio, videos

| What | Put the file in | Then write in the data file |
| --- | --- | --- |
| Artist photo | `src/assets/artists/` | `photo: 'noor-kaur.jpg'` |
| Release cover (square) | `src/assets/covers/` | `cover: 'kali-raat.jpg'` |
| Audio preview (MP3, 30–90 s) | `public/audio/` | `preview: '/audio/kali-raat.mp3'` on a track |
| Music video | — | add `{ youtubeId: '…', … }` to `videos.ts` |

Photos are resized and converted to AVIF/WebP automatically. Play buttons, the spinning record and the bottom player
appear only for tracks that have a preview. Videos show a thumbnail and load YouTube only after a click.

### Colours and fonts

The theme is the first block of `src/styles/global.css`: `--bg`, `--bg-2`, `--text`, `--muted`, `--accent` (crimson),
`--accent-2` (amber). Fonts (self-hosted): Syne for headings, Plus Jakarta Sans for text, JetBrains Mono for metadata.

## Publish

Every push to `main` builds and publishes the site through GitHub Actions (`.github/workflows/deploy.yml`), and it
also rebuilds every morning so past shows drop off. The custom domain comes from `public/CNAME`.

### Security headers (Cloudflare)

GitHub Pages cannot send security headers, so every page carries a Content-Security-Policy meta tag. For the full set,
add them in Cloudflare: **Rules → Transform Rules → Modify Response Header**, apply to all requests on
`baazrecords.in`, and **Set static** each header from `public/_headers`.

### Demo form

The form on `/contact/` opens the visitor's email app with everything filled in. To receive submissions in an inbox
instead, create a free form at formspree.io and put its address in `site.ts` → `demo.formEndpoint`.

## Work on it locally

Needs Node.js 22.12 or newer.

```sh
npm install
npm run dev       # http://localhost:4321, updates as you edit
npm run build     # production build in dist/
npm run preview   # serve the production build
```

## Where things are

```
src/data/          content (TypeScript)
src/lib/           data checks (schemas.ts, site.ts), helpers, schema.org structured data
src/components/    header + curtain menu, footer, player, vinyl/sleeve, release & artist cards, marquee, ticket…
src/pages/         /, /releases, /artists, /visuals, /live, /contact, 404
src/scripts/       site.ts (menu, magnetic, tilt, cursor, reveals, marquee), hero.ts (visualizer),
                   scroll-fx.ts (horizontal vault), player.ts (audio + equalizer)
src/styles/        global.css (theme + components)
public/            CNAME, icons, share image, audio, robots.txt, _headers
legacy/            the original hand-written site, kept for reference
```

## SEO

- Every page: own title, description, canonical link, Open Graph/Twitter image.
- schema.org JSON-LD: `Organization` + `WebSite` on every page; `MusicAlbum` with `MusicRecording` tracks (and ISRC
  when filled in), `MusicGroup` for artists, `MusicEvent` for shows, `VideoObject` for videos, `BreadcrumbList`.
- `sitemap-index.xml` and `robots.txt` on every build. Submit the sitemap in Google Search Console.

---

Designed with passion by [Bazozo Studio](https://bazozo.in).
