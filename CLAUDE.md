# CLAUDE.md — BaazRecords (baazrecords.in)

## 1. Project Scope & Directory Lock
- **Strict Directory Lock:** Work EXCLUSIVELY inside `D:\BaazRecords-main`. Never read, modify, or touch any files outside this directory.
- **Brand:** BaazRecords (`baazrecords.in`) — Premier Music Label & Sonic Powerhouse.
- **No CMS / Pure Code Architecture:** Do NOT install Decap CMS or any external admin panel. Keep all artists, tracks, and releases inside clean, well-typed local TypeScript/JSON files (`src/data/releases.ts`, `src/data/artists.ts`, `src/data/site.ts`) for fast manual editing.
- **Mandatory Footer Credit:** The footer MUST prominently display: `Designed with passion by [Bazozo Studio](https://bazozo.in)` with a glowing hover micro-interaction linking to `https://bazozo.in`.
- **Keep CNAME:** Preserve `public/CNAME` containing `baazrecords.in` for GitHub deployment.

## 2. Unique Visual Identity & Theme ("Obsidian & Studio Crimson")
Make this design completely distinct from `bazozo.in` with an Awwwards-level "Underground Sonic Vault" aesthetic:
- **Colors:**
  - Background Primary: `#050507` (Vinyl Pitch Black)
  - Background Elevated: `#0D0D12` (Studio Booth Charcoal)
  - Primary Accent: `#FF1E42` (Studio "ON AIR" Crimson)
  - Secondary Accent: `#F5A623` (Platinum/Gold Record Amber)
  - Text Primary: `#F4F4F6` | Text Muted: `#8E8E9E`
- **Atmosphere:** Subtle full-screen SVG film-grain noise overlay (`pointer-events-none fixed inset-0 z-50 opacity-[0.035]`) + ambient radial spotlight gradients that track the mouse cursor.
- **Fonts (Self-Hosted via `@fontsource`):**
  - Headings: `Syne` or `Clash Display` (uppercase, tight tracking, bold display sizes)
  - Body: `Plus Jakarta Sans`
  - Metadata / Track Numbers / Durations: `JetBrains Mono` (e.g., `CAT# BR-026 // 03:42`)

## 3. Signature UI Components, Buttons & Animations
Use our installed MCPs and libraries (`gsap`, `lenis`, `split-type`, `wavesurfer.js`, `lucide-astro`, Magic UI / Aceternity UI patterns) to build:
1. **Custom Asymmetric Hamburger Menu & Full-Screen Curtain Nav:**
   - Top-right 2-bar equalizer-style toggle button with magnetic cursor pull.
   - Clicking opens a GSAP `clip-path` full-screen overlay menu with numbered giant typography (`01 / HOME`, `02 / RELEASES`, `03 / ARTISTS`, `04 / VISUALS`, `05 / CONTACT`), dynamic image preview on link hover, and direct streaming links.
2. **Hero Section with Interactive Sonic Visualizer:**
   - Giant split-character animated title + featured release showcase.
   - Rotating 3D-styled vinyl record sleeve that slides out and spins when audio plays.
   - Magnetic circular CTA button with rotating SVG text ring (`"LISTEN NOW • BAAZ RECORDS •"`).
3. **Scroll Effects (GSAP ScrollTrigger + Lenis):**
   - Velocity-reactive infinite marquee ticker separating sections.
   - Horizontal-scroll pinned "Discography Vault" section where scrolling vertically glides through releases horizontally.
   - 3D perspective tilt cards with glowing border beams on artist and track cards.
4. **Persistent Bottom Studio Audio Bar:**
   - Glassmorphic sticky player (`backdrop-blur-2xl`) with interactive `wavesurfer.js` waveform scrubber, real-time frequency equalizer bars, track artwork, artist name, and streaming platform quick-links.

## 4. Technical SEO & 100/100 Performance Rules
- **Astro Static Architecture:** Zero unnecessary JS bloat; hydrate interactive islands smartly.
- **JSON-LD Music Schema:** Inject `MusicGroup`, `MusicAlbum`, `MusicRecording`, and `VideoObject` structured data on every page to rank #1 on Google for BaazRecords artists and tracks.
- **Lite YouTube Facades:** Load music videos using custom high-res thumbnail facades with magnetic play buttons—never load heavy raw YouTube iframes on initial page load.
- ** preserve Existing Content:** Extract all real artist names, song titles, social links, and images from the existing `index.html`, `style.css`, and `script.js` before rebuilding.