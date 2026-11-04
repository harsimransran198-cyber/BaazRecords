/** /rss.xml — new releases feed (for feed readers, aggregators and discovery). */
import type { APIRoute } from 'astro';
import { site } from '../lib/site';
import { getReleases } from '../lib/content';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export const GET: APIRoute = () => {
  const items = getReleases()
    .filter((r) => r.showInCatalogue)
    .map((r) => {
      const url = new URL(r.url, site.url).href;
      const date = new Date(`${r.releaseDate || `${r.year}-01-01`}T12:00:00+05:30`).toUTCString();
      const desc = r.description || `${r.title} by ${r.byline}. ${[r.format, r.year].filter(Boolean).join(', ')}${r.label ? `, released on ${r.label}` : ''}.`;
      return `    <item>
      <title>${esc(`${r.title} — ${r.byline}`)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${date}</pubDate>
      <description>${esc(desc)}</description>
    </item>`;
    })
    .join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${esc(site.name)} — new releases</title>
    <link>${site.url}/</link>
    <description>${esc(site.description)}</description>
    <language>en-in</language>
    <atom:link href="${site.url}/rss.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>
`;
  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
};
