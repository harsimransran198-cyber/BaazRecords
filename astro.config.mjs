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
    // inline the stylesheet into each page so nothing blocks the first paint
    inlineStylesheets: 'always',
  },
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'hover',
  },
  image: {
    // YouTube thumbnails are downloaded at build time and served from this site.
    remotePatterns: [{ protocol: 'https', hostname: 'i.ytimg.com', pathname: '/vi/**' }],
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
