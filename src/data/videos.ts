/**
 * Music videos for the Visuals page. Videos load from YouTube only when someone
 * clicks play, so they never slow the page down.
 *
 * To add one, copy a { ... } block and fill it in:
 *   youtubeId  — from the link: youtu.be/<id> or youtube.com/watch?v=<id>
 *   artists    — ids from artists.ts
 *   release    — id from releases.ts (optional)
 */
import type { VideoInput } from '../lib/schemas';

export const videos = [
  { youtubeId: '0rjlmogTqGw', title: 'Sarpanchi (ft. Reet Kaur)', artists: ['baaz'], release: 'sarpanchi', description: '', uploadDate: '2024-10-10', duration: '2:39' },
  { youtubeId: 'gTXFmwvAYyo', title: 'Obsessed', artists: ['preet-sohaan'], release: 'obsessed', description: '', uploadDate: '2025-12-04', duration: '3:14' },
  { youtubeId: '7bH09n39958', title: 'Snakes & Fakes', artists: ['fateh-sandhu'], release: 'snakes-and-fakes', description: '', uploadDate: '2025-01-17', duration: '3:09' },
  { youtubeId: 'nogLZyQI2Ac', title: 'Naal Tere', artists: ['nueman'], release: 'naal-tere', description: '', uploadDate: '2025-01-06', duration: '2:12' },
  { youtubeId: 'NKfUgAs7qlM', title: 'Sin', artists: ['fateh-sandhu'], release: 'sin', description: '', uploadDate: '2024-03-03', duration: '2:27' },
  { youtubeId: 'UzFa5N4VSwI', title: 'Pyar Di Hawa', artists: ['mick-sandhu'], release: 'pyar-di-hawa', description: '', uploadDate: '2021-03-24', duration: '2:41' },
] satisfies VideoInput[];
