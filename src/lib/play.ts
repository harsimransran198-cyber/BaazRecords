/** Attributes that turn any button into a play button for the bottom player. */
import { trackKey, type ReleaseView, type Track } from './content';

export function playAttrs(track: Track, release: ReleaseView) {
  return {
    'data-play': '',
    'data-key': trackKey(track),
    'data-src': track.preview || undefined,
    'data-yt': track.youtubeId || undefined,
    'data-title': track.title,
    'data-artist': release.byline,
    'data-color': release.color,
    'data-href': release.url,
    'data-links': JSON.stringify(release.links),
  };
}

/** Space-separated keys of every playable track, for records that spin while one plays. */
export const stageKeys = (release: ReleaseView) =>
  release.tracks.map(trackKey).filter(Boolean).join(' ') || undefined;
