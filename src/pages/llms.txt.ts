/**
 * /llms.txt — a plain-text summary of the label for AI assistants and AI search
 * (the llmstxt.org convention). Built from the same data as the website.
 */
import type { APIRoute } from 'astro';
import { site } from '../lib/site';
import { getArtists, getReleases, getUpcomingEvents, formatEventDate, filledLinks, linkNames } from '../lib/content';

export const GET: APIRoute = () => {
  const abs = (p: string) => new URL(p, site.url).href;
  const releases = getReleases();
  const artists = getArtists();
  const events = getUpcomingEvents();
  const socials = filledLinks(site.socials);

  const lines = [
    `# ${site.name}`,
    '',
    `> ${site.description}`,
    '',
    `${site.name} is an independent Punjabi music label based in ${site.legal.country}. Website: ${site.url}. Contact: ${site.email} (demos, bookings, press and wholesale).`,
    ...(socials.length ? ['', `Official profiles: ${socials.map(([k, u]) => `${linkNames[k] ?? k} ${u}`).join(', ')}.`] : []),
    '',
    '## Artists',
    '',
    ...artists.map((a) => `- [${a.name}](${abs(`/artists/${a.id}/`)})${a.genre ? ` — ${a.genre}` : ''}${a.shortBio ? `. ${a.shortBio}` : ''}`),
    '',
    '## Releases',
    '',
    ...releases.map((r) => {
      const yt = r.youtubeId ? ` Watch: https://www.youtube.com/watch?v=${r.youtubeId}` : '';
      const label = r.label ? ` Released on ${r.label}.` : '';
      return `- [${r.title}](${abs(r.url)}) by ${r.byline} — ${[r.format, r.releaseDate || r.year].filter(Boolean).join(', ')}.${label}${yt}`;
    }),
    ...(events.length
      ? ['', '## Upcoming shows', '', ...events.map((e) => `- [${e.title}](${abs(`/live/#${e.id}`)}) — ${formatEventDate(e.date)}, ${e.venue}${e.city ? `, ${e.city}` : ''}`)]
      : []),
    '',
    '## Pages',
    '',
    `- [About](${abs('/about/')}): who we are and what we do`,
    `- [FAQ](${abs('/faq/')}): demos, listening, bookings`,
    `- [Contact and demo submissions](${abs('/contact/')})`,
    `- [Visuals](${abs('/visuals/')}): music videos`,
    `- [Privacy Policy](${abs('/privacy/')}), [Terms of Use](${abs('/terms/')}), [Disclaimer](${abs('/disclaimer/')})`,
    '',
  ];
  return new Response(lines.join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
