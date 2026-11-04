/**
 * schema.org structured data (JSON-LD) so Google understands the label,
 * its artists, albums, tracks and shows.
 */
import { site } from './site';
import { artistsOf, filledLinks, isoDuration, type Artist, type Event, type ReleaseView, type Video } from './content';

const abs = (path: string) => new URL(path, site.url).href;
const orgId = `${site.url}/#organization`;

export function organization() {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': orgId,
        name: site.name,
        url: `${site.url}/`,
        email: site.email,
        description: site.description,
        logo: abs('/icon-512.png'),
        ...(site.foundingYear ? { foundingDate: site.foundingYear } : {}),
        sameAs: filledLinks(site.socials).map(([, url]) => url),
      },
      {
        '@type': 'WebSite',
        '@id': `${site.url}/#website`,
        url: `${site.url}/`,
        name: site.name,
        publisher: { '@id': orgId },
        inLanguage: 'en-IN',
      },
    ],
  };
}

export function musicGroup(a: Artist, releases: ReleaseView[], image?: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'MusicGroup',
    '@id': abs(`/artists/${a.id}/#artist`),
    name: a.name,
    url: abs(`/artists/${a.id}/`),
    ...(a.genre ? { genre: a.genre } : {}),
    ...(a.shortBio ? { description: a.shortBio } : {}),
    ...(image ? { image } : {}),
    sameAs: filledLinks(a.socials).map(([, url]) => url),
    recordLabel: { '@id': orgId },
    album: releases.map((r) => ({ '@type': 'MusicAlbum', name: r.title, url: abs(r.url) })),
  };
}

const releaseType: Record<string, string> = {
  album: 'https://schema.org/AlbumRelease',
  ep: 'https://schema.org/EPRelease',
  single: 'https://schema.org/SingleRelease',
  compilation: 'https://schema.org/AlbumRelease',
};

export function musicAlbum(r: ReleaseView, image?: string) {
  const byArtist = r.artistList.length
    ? r.artistList.map((a) => ({ '@type': 'MusicGroup', '@id': abs(`/artists/${a.id}/#artist`), name: a.name }))
    : { '@id': orgId };
  return {
    '@context': 'https://schema.org',
    '@type': 'MusicAlbum',
    '@id': abs(`${r.url}#album`),
    name: r.title,
    url: abs(r.url),
    byArtist,
    recordLabel: r.label ? { '@type': 'Organization', name: r.label } : { '@id': orgId },
    datePublished: r.releaseDate || String(r.year),
    albumReleaseType: releaseType[r.type],
    albumProductionType: r.type === 'compilation' ? 'https://schema.org/CompilationAlbum' : 'https://schema.org/StudioAlbum',
    ...(r.description ? { description: r.description } : {}),
    ...(image || r.thumb ? { image: image || r.thumb } : {}),
    numTracks: r.tracks.length,
    track: {
      '@type': 'ItemList',
      numberOfItems: r.tracks.length,
      itemListElement: r.tracks.map((t, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        item: {
          '@type': 'MusicRecording',
          name: t.title,
          ...(isoDuration(t.duration) ? { duration: isoDuration(t.duration) } : {}),
          ...(t.isrc ? { isrcCode: t.isrc } : {}),
          byArtist,
          inAlbum: { '@id': abs(`${r.url}#album`) },
          ...(t.preview ? { audio: { '@type': 'AudioObject', contentUrl: abs(t.preview) } } : {}),
          ...(t.youtubeId ? { url: `https://www.youtube.com/watch?v=${t.youtubeId}` } : {}),
        },
      })),
    },
    sameAs: filledLinks(r.links).map(([, url]) => url),
  };
}

export function musicEvent(e: Event, performers: Artist[]) {
  const address = [e.address, e.city].filter(Boolean).join(', ');
  return {
    '@context': 'https://schema.org',
    '@type': 'MusicEvent',
    name: e.title,
    description: e.summary || e.lineup,
    startDate: `${e.date}T${e.doors}:00+05:30`,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    location: {
      '@type': 'Place',
      name: e.venue,
      address: address || e.venue,
    },
    image: abs('/og.png'),
    organizer: { '@id': orgId, '@type': 'Organization', name: site.name, url: `${site.url}/` },
    performer: performers.map((a) => ({ '@type': 'MusicGroup', name: a.name, url: abs(`/artists/${a.id}/`) })),
    ...(e.price !== undefined
      ? {
          offers: {
            '@type': 'Offer',
            price: e.price,
            priceCurrency: e.currency,
            availability: 'https://schema.org/InStock',
            url: e.ticketUrl || abs('/live/'),
          },
        }
      : {}),
  };
}

export function videoObject(v: Video) {
  const performers = artistsOf(v.artists);
  return {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: v.title,
    description: v.description || `${v.title} on ${site.name}.`,
    thumbnailUrl: [`https://i.ytimg.com/vi/${v.youtubeId}/maxresdefault.jpg`, `https://i.ytimg.com/vi/${v.youtubeId}/hqdefault.jpg`],
    uploadDate: v.uploadDate,
    ...(isoDuration(v.duration) ? { duration: isoDuration(v.duration) } : {}),
    contentUrl: `https://www.youtube.com/watch?v=${v.youtubeId}`,
    embedUrl: `https://www.youtube-nocookie.com/embed/${v.youtubeId}`,
    publisher: { '@id': orgId },
    ...(performers.length
      ? { actor: performers.map((a) => ({ '@type': 'MusicGroup', name: a.name, url: abs(`/artists/${a.id}/`) })) }
      : {}),
  };
}

export function breadcrumbs(items: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, item: abs(it.path) })),
  };
}

export function itemList(name: string, urls: string[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name,
    itemListElement: urls.map((u, i) => ({ '@type': 'ListItem', position: i + 1, url: abs(u) })),
  };
}
