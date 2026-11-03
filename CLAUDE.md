# CLAUDE.md — BaazRecords (baazrecords.in)

## 1. Project Overview & Vision
- **Brand:** BaazRecords (`baazrecords.in`) — Premier Music Label & Artist Hub.
- **Goal:** Build an ultra-fast, visually stunning dark-luxury music company website that ranks #1 on Google, achieves 99–100 Lighthouse scores, and features a **secure private admin panel** so only the site owner can manage tracks, artists, and hero banners.
- **Footer Attribution:** Must include a clean professional footer credit: `"Designed with passion by [Bazozo Studio](https://bazozo.in)"`.
- **Target Architecture:** Astro (SSG/SSR hybrid) + Tailwind CSS v4 + GSAP + Decap CMS (or GitHub-backed JSON content store) for private content management.

## 2. Private Content Management System (CMS) Setup
To ensure only you can edit tracks, artists, and photos while the public has read-only access:
- **Option A (Decap CMS / Netlify CMS):** Set up `/admin/` protected by Netlify Identity (OAuth via GitHub/Google login restricted strictly to your email address). This lets you log in securely from any browser or phone to add/remove artists, upload photos, and change hero tracks.
- **Option B (JSON Data Store):** Store dynamic content in `src/data/artists.json`, `src/data/tracks.json`, and `src/data/site-config.json`. Claude will build a clean UI that reads these files dynamically.

## 3. Core Website Features & Sections
1. **Hero Section (Dynamic):** 
   - Showcases the current featured track/album banner.
   - Quick play preview button linked to the persistent audio player.
2. **Persistent Audio Player:** 
   - Bottom floating music player with play/pause, waveform scrubber (`wavesurfer.js`), track title, artist name, and volume control. Persists across page navigations using Astro view transitions.
3. **Artists Roster (`/artists/[slug]`):**
   - Grid of label artists with high-res photos, bios, social links, and their respective discographies.
4. **Releases / Catalog (`/releases/[slug]`):**
   - Tracklists with streaming links (Spotify, Apple Music, YouTube, Wynk).
5. **Demo Submission Form:**
   - Secure contact form for upcoming artists to send demo tracks.
6. **Mandatory Footer:**
   - Copyright BaazRecords.
   - Official links and social media icons.
   - **Attribution:** `"Designed with passion by [Bazozo Studio](https://bazozo.in)"` (with target="_blank" rel="noopener noreferrer").

## 4. Strict Performance & SEO Rules
- **LCP < 1.2s & CLS = 0:** Use Astro `<Image />` component with WebP/AVIF formats.
- **Music Schema (JSON-LD):** Implement `MusicGroup`, `MusicAlbum`, and `MusicRecording` structured data on every relevant page for #1 Google ranking potential.
- **Preserve CNAME:** Keep `CNAME` pointing to `baazrecords.in` inside the `public/` folder.

## 5. Workflow Instructions for Claude
1. Inspect existing files to preserve all original assets.
2. Implement the data-driven architecture so that adding/editing artists or tracks requires modifying only a single data file or using the protected admin panel.
3. Ensure the Bazozo Studio attribution link is prominently styled in the footer.