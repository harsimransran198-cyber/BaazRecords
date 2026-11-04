/**
 * Live shows. A show disappears from the site the day after it happens
 * (the site rebuilds itself every morning).
 */
import type { EventInput } from '../lib/schemas';

export const events = [
  {
    id: 'lohri-night-2027',
    title: 'Lohri Night 2027',
    presenter: 'Baaz Records presents',
    summary: 'One night, four acts, a bonfire and the whole Baaz roster on one stage.',
    lineup: 'Baaz, Nueman, Fateh Sandhu and Mick Sandhu, with a dhol circle until late.',
    artists: ['baaz', 'nueman', 'fateh-sandhu', 'mick-sandhu'],
    date: '2027-01-13',
    doors: '19:00',
    venue: 'The Baaz Room',
    address: '',
    city: '',
    price: 1499,
    currency: 'INR',
    ticketUrl: '',
    ticketLabel: 'GA',
    ticketNumber: '000213',
  },
] satisfies EventInput[];
