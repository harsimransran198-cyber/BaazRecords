# Baaz Records — baazrecords.in

Website for Baaz Records, an independent Punjabi music label. Built with Astro and Tailwind CSS.
Every artist, release, track and show is a JSON file, and there is an admin panel at `/admin/` to edit them in the browser.

## Admin panel: baazrecords.in/admin/

Edit artists, releases, tracks, shows and the home page from any browser or phone. Upload photos, covers and audio
previews there too. Every save is a commit on GitHub, and the site republishes itself in about two minutes.

**Sign in (first time):**
1. Open `https://baazrecords.in/admin/` and click **Sign In Using Access Token**.
2. Follow the link in the dialog. GitHub opens a page to create a token with the right permissions already ticked.
   Give it a name like "Baaz admin", set an expiry, click **Generate token**, and copy it.
3. Paste it into the dialog. The browser remembers it, so you only do this once per device.

Only GitHub accounts with write access to the repo can save, so nobody else can change the site.
Treat the token like a password; if a device is lost, delete the token on GitHub (Settings → Developer settings).

**One-click "Sign in with GitHub" (optional):** deploy the free
[Sveltia CMS Authenticator](https://github.com/sveltia/sveltia-cms-auth) on Cloudflare Workers and put its address in
`AUTH_URL` in `src/lib/cms-config.ts`.

**On this computer:** run `npm run dev`, open `http://localhost:4321/admin/`, and choose **Work with Local Repository**
(Chrome or Edge), then pick this project folder. Changes are saved straight to the files; push them to publish.

The repo name the panel saves to is set in `REPO` at the top of `src/lib/cms-config.ts`.

## Where the content lives

| Folder / file | What it controls |
| --- | --- |
| `src/data/home.json` | Home page: which song is on the record player, the cassette release, studio text |
| `src/data/site.json` | Label name, email, description for Google, demo page, social links |
| `src/data/artists/` | One file per artist: name, genre, colour, photo, bio, links, position in the list |
| `src/data/releases/` | One file per release: tracks, audio previews, cover, streaming links |
| `src/data/events/` | One file per show. Past shows disappear on their own the next day |

The file name is the web address: `src/data/artists/noor-kaur.json` → `baazrecords.in/artists/noor-kaur/`.
Artists are sorted by their **Position** number, releases newest year first.

If something is wrong (a link without `https://`, a missing photo), the build stops and says which file and field,
and the live site keeps the last good version.

### Photos, covers and audio

Upload them in the admin panel, or by hand:

| What | Folder | In the JSON |
| --- | --- | --- |
| Artist photo | `src/assets/artists/` | `"photo": "noor-kaur.jpg"` |
| Release cover (square) | `src/assets/covers/` | `"cover": "kali-raat.jpg"` |
| Audio preview | `public/audio/` | `"preview": "/audio/kali-raat.mp3"` |

Photos are converted to small AVIF/WebP files automatically. Play buttons and the bottom player only appear for
tracks that have a preview, so nothing on the site is a dead button.

### Colours

Change the variables at the top of `src/styles/global.css` (`--bg`, `--text`, `--accent`, `--accent-2`, `--cream`).

## Publish

The site is published by GitHub Actions (`.github/workflows/deploy.yml`) on every push to `main`, and once a day.

One-time setup on GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
The custom domain comes from `public/CNAME` (`baazrecords.in`).

### Security headers (Cloudflare)

GitHub Pages cannot send security headers, so the pages carry a Content-Security-Policy in a meta tag.
For the full set, add them in Cloudflare: **Rules → Transform Rules → Modify Response Header → Create rule**,
apply to all requests on `baazrecords.in`, and **Set static** each header listed in `public/_headers`
(`Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`,
`Strict-Transport-Security`). If you ever move to Cloudflare Pages, `public/_headers` is used as is.

The admin panel needs to talk to GitHub, so give the rule the filter
`not starts_with(http.request.uri.path, "/admin")`, or the strict policy will block the panel.

### Demo form

By default the demo form opens the visitor's email app with everything filled in. To receive submissions in an
inbox without that step, create a free form at formspree.io and put its address in `site.json` →
`demo.formEndpoint` (e.g. `"https://formspree.io/f/abcdwxyz"`).

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
src/data/          content (JSON)
src/assets/        artist photos and covers
public/            files served as-is: CNAME, icons, share image, audio, robots.txt, _headers
src/pages/         one file per page (/, /artists, /releases, /live, /demo, 404)
src/components/    header, footer, player, ticket, cassette, ...
src/scripts/       record-player animation (GSAP), smooth scroll (Lenis), bottom player (wavesurfer.js)
src/lib/           data helpers, schema.org structured data, validation rules
legacy/            the original hand-written site, kept for reference
```

## SEO

- Every page has its own title, description, canonical link and share image.
- schema.org data: `Organization` and `WebSite` on every page, `MusicGroup` on artist pages,
  `MusicAlbum` with `MusicRecording` tracks on release pages, `MusicEvent` for shows, `BreadcrumbList` on inner pages.
- `sitemap-index.xml` and `robots.txt` are generated on every build.
- After the first deploy, add the site in Google Search Console and submit `https://baazrecords.in/sitemap-index.xml`.

---

Designed with passion by [Bazozo Studio](https://bazozo.in).
