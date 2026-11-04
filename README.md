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

### Cloudflare: speed + security (one-time, about 10 minutes)

Right now Cloudflare only answers DNS for `baazrecords.in` (grey cloud), so visitors go straight to GitHub Pages.
Turning the proxy on adds a global cache, Brotli/HTTP3, DDoS protection and real security headers.

1. **DNS → Records:** for the `baazrecords.in` and `www` records that point to GitHub, click the grey cloud so it
   turns **orange (Proxied)**.
2. **SSL/TLS → Overview:** set the mode to **Full** (not "Flexible", which causes redirect loops; not "Full (strict)",
   which can break when GitHub renews its certificate).
   **SSL/TLS → Edge Certificates:** turn on **Always Use HTTPS**.
3. **Rules → Transform Rules → Modify Response Header → Create rule** "Security headers", for *All incoming
   requests*, and **Set static** each header listed in `public/_headers` (Content-Security-Policy,
   X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, Strict-Transport-Security,
   Cross-Origin-Opener-Policy).
4. **Caching → Cache Rules → Create rule** "Long cache for build files": when *URI Path starts with* `/_astro/`,
   set **Eligible for cache**, Edge TTL **1 year**, Browser TTL **1 year**. (These file names change on every
   update, so long caching is safe.)
5. **Speed → Optimization:** turn on **Brotli** and **HTTP/3** (often on already). Leave **Rocket Loader off**: it
   rewrites scripts and would be blocked by the site's security policy.

Check afterwards: `https://securityheaders.com/?q=baazrecords.in` should show grade A.

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
src/pages/         /, /releases, /artists, /visuals, /live, /contact, /about, /faq, /privacy, /terms,
                   /disclaimer, 404, llms.txt, rss.xml
src/scripts/       site.ts (menu, magnetic, tilt, cursor, reveals, marquee), hero.ts (visualizer),
                   scroll-fx.ts (horizontal vault), player.ts (audio + equalizer)
src/styles/        global.css (theme + components)
public/            CNAME, icons, share image, audio, robots.txt, _headers
legacy/            the original hand-written site, kept for reference
```

## Search, AI search and legal

**Built in**
- Every page: own title, description, canonical link, Open Graph/Twitter share image (release pages use the song's
  thumbnail).
- schema.org JSON-LD: `Organization` + `WebSite` everywhere; `MusicAlbum` + `MusicRecording` (with the real label),
  `MusicGroup`, `MusicEvent`, `VideoObject`, `FAQPage`, `AboutPage`, `BreadcrumbList`.
- `sitemap-index.xml` (all pages), `robots.txt` (search engines and AI assistants explicitly allowed),
  `/llms.txt` (plain-text summary for AI assistants), `/rss.xml` (new releases feed),
  `/.well-known/security.txt`.
- **IndexNow:** after every push, the deploy pings Bing, Yandex, Seznam and Naver with all page addresses (Bing also
  powers ChatGPT search and Copilot). Key file: `public/c01a55658bb35de817bc65200f86684d.txt`.
- Pages: `/about/`, `/faq/`, `/privacy/`, `/terms/`, `/disclaimer/` (linked in the footer). Legal text uses
  `site.ts → legal` (owner, country, last updated). Have a lawyer review it if the label's situation changes
  (e.g. you add analytics, a shop or a newsletter: the Privacy Policy must then be updated).

**Google Search Console (one-time)**
1. Go to search.google.com/search-console → **Add property → Domain** → `baazrecords.in`.
2. Google shows a TXT record. In Cloudflare → **DNS → Add record**: Type `TXT`, Name `@`, Content = the value Google
   gave → Save. Back in Search Console click **Verify** (can take a few minutes).
3. **Sitemaps** → enter `sitemap-index.xml` → **Submit**.
4. **URL inspection** → paste `https://baazrecords.in/` → **Request indexing** (repeat for a few key pages).

**Bing Webmaster Tools (one-time, also feeds ChatGPT/Copilot search):** bing.com/webmasters → **Import from Google
Search Console** (fastest), or add the site and verify with the same kind of DNS TXT record. Submit
`https://baazrecords.in/sitemap-index.xml`.

(Prefer a meta tag instead of DNS? Paste the code into `site.ts → verification.google` / `verification.bing`.)

**What helps ranking most from here:** link to `https://baazrecords.in` from the YouTube channel (About tab and every
video description), Instagram bio and each artist's profiles; keep release pages filled in (description, ISRC,
streaming links); and add new releases as they come out.

---

Designed with passion by [Bazozo Studio](https://bazozo.in).
