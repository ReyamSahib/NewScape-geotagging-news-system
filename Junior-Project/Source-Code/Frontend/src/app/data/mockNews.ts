import { NewsItem } from '../types';

export const mockNewsData: NewsItem[] = [
  {
    id: '1',
    title: 'Traffic Jam on Sheikh Zayed Road',
    location: 'Dubai Marina',
    category: 'Traffic',
    geotagType: 'Explicit',
    description: 'Heavy traffic congestion reported on Sheikh Zayed Road near Dubai Marina due to road construction work during peak hours.',
    date: '2026-04-24',
    coordinates: { lat: 25.0805, lng: 55.1407 }
  },
  {
    id: '2',
    title: 'New Business Hub Opens in Downtown',
    location: 'Downtown Dubai',
    category: 'Business',
    geotagType: 'Explicit',
    description: 'A state-of-the-art business hub has opened in Downtown Dubai, featuring modern office spaces and co-working facilities.',
    date: '2026-04-24',
    coordinates: { lat: 25.1972, lng: 55.2744 }
  },
  {
    id: '3',
    title: 'Football Match at Zayed Sports City',
    location: 'Abu Dhabi',
    category: 'Sports',
    geotagType: 'Explicit',
    description: 'Major football tournament taking place at Zayed Sports City with teams from across the region competing.',
    date: '2026-04-23',
    coordinates: { lat: 24.4361, lng: 54.4691 }
  },
  {
    id: '4',
    title: 'Sunny Weather Expected This Week',
    location: 'Sharjah',
    category: 'Weather',
    geotagType: 'Inferred',
    description: 'Clear skies and pleasant temperatures expected across Sharjah and northern emirates throughout the week.',
    date: '2026-04-24',
    coordinates: { lat: 25.3463, lng: 55.4209 }
  },
  {
    id: '5',
    title: 'Cultural Festival Celebrated at Qasr Al Hosn',
    location: 'Abu Dhabi',
    category: 'Culture',
    geotagType: 'Explicit',
    description: 'The annual cultural festival at Qasr Al Hosn featured traditional performances, exhibits, and local crafts, perfect for families and touorists!',
    date: '2026-04-23',
    coordinates: { lat: 24.4539, lng: 54.3773 }
  },
  {
    id: '6',
    title: 'Road Closure on Al Khail Road',
    location: 'Dubai',
    category: 'Traffic',
    geotagType: 'Explicit',
    description: 'Temporary road closure on Al Khail Road for infrastructure upgrades, expected to last until end of month.',
    date: '2026-04-24',
    coordinates: { lat: 25.1124, lng: 55.2003 }
  },
  {
    id: '7',
    title: 'Cricket Tournament Results',
    location: 'Sharjah Cricket Stadium',
    category: 'Sports',
    geotagType: 'Explicit',
    description: 'Exciting cricket match concluded at Sharjah Cricket Stadium with a nail-biting finish.',
    date: '2026-04-23',
    coordinates: { lat: 25.3358, lng: 55.3824 }
  },
  {
    id: '8',
    title: 'Investment Conference Opens',
    location: 'Dubai World Trade Centre',
    category: 'Business',
    geotagType: 'Explicit',
    description: 'Annual investment conference begins at Dubai World Trade Centre, attracting investors from around the globe.',
    date: '2026-04-24',
    coordinates: { lat: 25.2316, lng: 55.2865 }
  },
  {
    id: '9',
    title: 'Rainfall Expected in Eastern Regions',
    location: 'Al Ain',
    category: 'Weather',
    geotagType: 'Inferred',
    description: 'Meteorological reports indicate possible rainfall in Al Ain and surrounding eastern regions over the next few days.',
    date: '2026-04-24',
    coordinates: { lat: 24.2075, lng: 55.7447 }
  },
  {
    id: '10',
    title: 'Universities Introduce New Academic Programs',
    location: 'UAE',
    category: 'Education',
    geotagType: 'Not Geotaggable',
    description: 'Several universities across the UAE have announced new academic programs aimed at aligning with futurejob market demands.',
    date: '2026-04-23',
    coordinates: { lat: 24.4539, lng: 54.3773 }
  },
  {
    id: '11',
    title: 'Coastal Weather Advisory',
    location: 'Fujairah',
    category: 'Weather',
    geotagType: 'Explicit',
    description: 'Advisory issued for coastal areas in Fujairah due to rough sea conditions expected this weekend.',
    date: '2026-04-24',
    coordinates: { lat: 25.1288, lng: 56.3265 }
  },
  {
    id: '12',
    title: 'Tech Startup Expansion',
    location: 'Dubai Silicon Oasis',
    category: 'Business',
    geotagType: 'Explicit',
    description: 'Leading tech startup announces major expansion in Dubai Silicon Oasis, creating hundreds of new jobs.',
    date: '2026-04-23',
    coordinates: { lat: 25.1244, lng: 55.3822 }
  },
  {
    id: '13',
    title: 'Beach Volleyball Championship',
    location: 'Ajman',
    category: 'Sports',
    geotagType: 'Explicit',
    description: 'International beach volleyball championship kicks off at Ajman Beach with teams from 15 countries.',
    date: '2026-04-24',
    coordinates: { lat: 25.4052, lng: 55.5136 }
  },
  {
    id: '14',
    title: 'Jebel Jais Adventure Activities Attract Visitors This Weekend',
    location: 'Ras Al Khaimah',
    category: 'Event',
    geotagType: 'Explicit',
    description: 'Outdoor activities at Jebel Jais saw increased visitor turnout this weekend, with ziplining and hiking experiences drawing both residents and tourists',
    date: '2026-04-23',
    coordinates: { lat: 25.7889, lng: 55.9433 }
  },
  {
    id: '15',
    title: 'Highway Construction Update',
    location: 'Umm Al-Quwain',
    category: 'Traffic',
    geotagType: 'Explicit',
    description: 'New highway construction project in Umm Al-Quwain enters final phase, improving connectivity to northern emirates.',
    date: '2026-04-24',
    coordinates: { lat: 25.5647, lng: 55.5553 }
  },
  {
    id: '16',
    title: 'Mountain Weather Conditions',
    location: 'Northern Emirates',
    category: 'Weather',
    geotagType: 'Inferred',
    description: 'Cooler temperatures and fog reported in mountainous areas of northern emirates during early morning hours.',
    date: '2026-04-24',
    coordinates: { lat: 25.8607, lng: 56.0000 }
  },
  {
    id: '17',
    title: 'Real Estate Market Report',
    location: 'Dubai',
    category: 'Business',
    geotagType: 'Inferred',
    description: 'Quarterly real estate report shows steady growth in property transactions across Dubai market.',
    date: '2026-04-23',
    coordinates: { lat: 25.2048, lng: 55.2708 }
  },
  {
    id: '18',
    title: 'Marathon Event This Weekend',
    location: 'Abu Dhabi Corniche',
    category: 'Sports',
    geotagType: 'Explicit',
    description: 'Annual Abu Dhabi marathon set to take place along the Corniche with thousands of participants expected.',
    date: '2026-04-24',
    coordinates: { lat: 24.4764, lng: 54.3705 }
  },
];
