/**
 * The roster. Artists show in this order.
 * To add one: copy a { ... } block, paste it after a comma, change the values.
 * The id becomes the web address: id "noor-kaur" → baazrecords.in/artists/noor-kaur/
 * Photos: put the file in src/assets/artists/ and write its name in `photo`.
 */
import type { ArtistInput } from '../lib/schemas';

export const artists = [
  {
    id: 'baaz',
    name: 'Baaz',
    genre: 'Dub',
    color: '#FF1E42',
    photo: '',
    photoAlt: '',
    shortBio: 'Writer and Artist',
    bio: 'Baaz is a Writer and Artist',
    socials: { instagram: '', spotify: '', youtube: '', appleMusic: '', website: '' },
  },
  {
    id: 'nueman',
    name: 'Nueman',
    genre: 'Dub',
    color: '#F5A623',
    photo: '',
    photoAlt: '',
    shortBio: 'Artist and Producer',
    bio: 'Nueman Baaz Records.',
    socials: { instagram: '', spotify: '', youtube: '', appleMusic: '', website: '' },
  },
  {
    id: 'fateh-sandhu',
    name: 'Fateh Sandhu',
    genre: 'Dub',
    color: '#E8E4DA',
    photo: '',
    photoAlt: '',
    shortBio: 'Fateh Sandhu is a dub artist and producer.',    
    bio: 'Fateh Sandhu is a dub artist and producer at Baaz Records in 2025.',
    socials: { instagram: '', spotify: '', youtube: '', appleMusic: '', website: '' },
  },
  {
    id: 'mick-sandhu',
    name: 'Mick Sandhu',
    genre: 'Dub',
    color: '#C9A24A',
    photo: '',
    photoAlt: '',
    shortBio: 'Mick Sandhu is a dub artist and producer.',
    bio: 'Mick Sandhu is a dub artist and producer at Baaz Records in 2025.',
    socials: { instagram: '', spotify: '', youtube: '', appleMusic: '', website: '' },
  },
  {
    id: 'preet-sohaan',
    name: 'Preet Sohaan',
    genre: 'Punjabi',
    color: '#C9A24A',
    photo: '',
    photoAlt: '',
    shortBio: 'Singer behind the single Obsessed.',
    bio: 'Preet Sohaan sings Obsessed, released in 2025.',
    socials: { instagram: '', spotify: '', youtube: '', appleMusic: '', website: '' },
  },
] satisfies ArtistInput[];
