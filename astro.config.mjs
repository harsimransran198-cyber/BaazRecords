// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://baazrecords.in',
  trailingSlash: 'ignore',
  // Astro 7 defaults to JSX-style whitespace, which glues inline words together.
  // `true` keeps normal HTML spacing while still minifying.
  compressHTML: true,
  build: {
    format: 'directory',
    inlineStylesheets: 'auto',
  },
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'hover',
  },
  image: {
    // Only optimise images that live in this repo.
    remotePatterns: [],
  },
  redirects: { '/demo': '/contact/#demo' },
  integrations: [sitemap({ filter: (page) => !page.includes('/demo') })],
  vite: {
    plugins: [tailwindcss()],
    build: {
      // Never inline small scripts into the HTML: the Content-Security-Policy
      // only allows script files from this site ('self'), not inline code.
      assetsInlineLimit: 0,
    },
  },
});
