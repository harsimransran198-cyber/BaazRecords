/**
 * Label-wide settings: name, contact, home page hero, studio text, social links.
 * Edit the text between the quotes and save. Empty links ("") are hidden on the site.
 */
import type { SiteInput } from '../lib/schemas';

export const site = {
  name: 'Baaz Records',
  url: 'https://baazrecords.in',
  email: 'info@baazrecords.in',
  tagline: 'Punjabi music, recorded live and pressed on vinyl',
  description:
    'Baaz Records is an independent Punjabi music label. Folk, sufi and late-night dub, recorded live and pressed on vinyl in small, hand-stamped runs.',
  locale: 'en_IN',
  foundingYear: '',

  hero: {
    /** Which release is on the hero sleeve (an id from releases.ts). */
    release: 'sarpanchi',
    /** Which song plays from the hero button: 1 = first song. */
    trackNumber: 1,
    eyebrow: 'Independent Punjabi label',
    text: 'Folk, sufi and late-night dub from an independent label. Small runs, hand-stamped sleeves.',
  },

  marquee: ['Folk', 'Sufi', 'Late-night dub', 'Recorded live', 'Pressed on vinyl', 'Hand-stamped sleeves'],

  studio: {
    quote: 'We record the room, not just the voice. The tumbi, the dhol, the people clapping in the back.',
    paragraphs: [
      'Baaz Records runs a two-room studio with a tape machine, a handful of old valve microphones and a lot of rugs. Most of our albums are cut live in a single afternoon.',
      'Artists keep their masters. We press 300 to 500 copies per release and ship every order in a hand-stamped sleeve.',
    ],
    button: 'Book a session',
  },

  contact: {
    note: 'Demos, bookings, press and wholesale. We reply within two working days.',
  },

  demo: {
    intro:
      'Recorded on a phone or in a studio, we listen to everything that comes in. Send a link to your music and tell us a little about yourself.',
    /** Optional form service, e.g. "https://formspree.io/f/abcd". Empty = opens the visitor's email app. */
    formEndpoint: '',
  },

  socials: {
    instagram: '',
    youtube: '',
    spotify: '',
    appleMusic: '',
    facebook: '',
    x: '',
  },
} satisfies SiteInput;
