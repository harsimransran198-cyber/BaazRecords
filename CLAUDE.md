# CLAUDE.md — BaazRecords (baazrecords.in)

## 1. Project Overview & Vision
- **Brand:** BaazRecords (`baazrecords.in`) — Premier Music Label & Artist Hub.
- **Goal:** Build an ultra-fast, visually award-winning (Awwwards-style dark luxury aesthetic), SEO-dominant music website that ranks #1 on Google and achieves 99–100 across all Google Lighthouse metrics (Performance, Accessibility, Best Practices, SEO).
- **Current State:** Legacy static files (`index.html`, `style.css`, `script.js`, `CNAME`).
- **Target Architecture:** Modern Astro project with Tailwind CSS v4, View Transitions (for persistent bottom audio player across page loads), GSAP/Motion animations, and programmatic SEO content collections for Artists, Releases/Tracks, and Music Videos.

## 2. Tech Stack & Key Libraries
- **Framework:** Astro (Static Site Generation + Islands Architecture)
- **Styling:** Tailwind CSS v4 (dark mode first: `#070709` obsidian background, `#F59E0B` gold/amber accents, `#EF4444` crimson highlights, glassmorphism `backdrop-blur-md`)
- **Typography:** Display font (`Syne` or `Clash Display` for bold artist/album titles) + Sans font (`Plus Jakarta Sans` or `Inter` for clean UI) via `@fontsource` (self-hosted, `font-display: swap`).
- **Animation:** GSAP (ScrollTrigger) + Motion + Lenis smooth scroll. Respect `prefers-reduced-motion`.
- **Audio Engine:** Custom persistent bottom audio bar using HTML5 Audio / Howler.js + `wavesurfer.js` for waveform visualization. Keep player state alive across route changes using Astro `<ClientRouter />` (`transition:persist`).
- **SEO & Discovery:** `@astrojs/sitemap`, `astro-seo`, `schema-dts` (JSON-LD), `@astrojs/rss`.

## 3. Strict Performance Rules (100/100 Core Web Vitals)
- **LCP (Largest Contentful Paint) < 1.2s:** Always use Astro's `<Image />` component with `.avif` and `.webp` formats. Never lazy-load the hero image (`loading="eager"`, `fetchpriority="high"`).
- **CLS (Cumulative Layout Shift) = 0:** Every image, video embed, and album cover MUST have explicit `width`, `height`, or `aspect-ratio` classes (`aspect-square` for album art, `aspect-video` for music videos).
- **Zero Render-Blocking YouTube Embeds:** Never use raw `<iframe>` embeds for music videos on load. Always use a lightweight facade (`lite-youtube-embed`) that loads the iframe only on click.
- **INP (Interaction to Next Paint) < 100ms:** Offload non-critical animations and analytics; ship zero unnecessary client-side JS.

## 4. Technical SEO & #1 Ranking Checklist (Music Niche)
Every page MUST include:
1. **Unique Metadata:** Title template `<Page Title> | BaazRecords — Official Music Label`, meta description (150–160 chars), and canonical URL (`https://baazrecords.in/...`).
2. **JSON-LD Structured Data (`<script type="application/ld+json">`):**
   - Homepage: `Organization` / `MusicGroup` schema with social links (`sameAs` for YouTube, Spotify, Apple Music, Instagram).
   - Release Pages (`/releases/[slug]`): `MusicAlbum` and `MusicRecording` schema (ISRC, release date, artist, duration, streaming links).
   - Artist Pages (`/artists/[slug]`): `MusicGroup` / `Person` schema.
3. **Semantic HTML Hierarchy:** Exactly one `<h1>` per page, logical `<h2>`–`<h3>` nesting, `<nav>`, `<main>`, `<article>`, and `<footer>` landmarks.
4. **Programmatic Internal Linking:** Every artist page must automatically link to their releases, and every release page must link back to the artist and related tracks.
5. **Crawler Files:** Auto-generate `robots.txt` and `sitemap-index.xml` pointing to `https://baazrecords.in`. Preserve the `CNAME` file inside the `public/` directory so `baazrecords.in` never breaks during deployment.

## 5. Development Commands
- `npm run dev` — Start local development server
- `npm run build` — Build production site & verify zero TypeScript/Astro errors
- `npm run preview` — Preview production build locally

## 6. Workflow Instructions for Claude
1. Before writing new features, inspect existing assets and content in `index.html`, `style.css`, and `script.js` so no existing brand copy, links, or media assets are lost during migration.
2. Build mobile-first: ensure touch targets are at least `48x48px` and the sticky music player looks sleek on mobile screens.
3. Verify every build with `npm run build` to ensure zero broken links or missing image imports.
