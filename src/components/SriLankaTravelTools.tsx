import React, { useState } from 'react';
import {
  Map as MapIcon,
  Navigation,
  ArrowRightLeft,
  Train,
  Bus,
  Compass,
  Waves,
  Sparkles,
  MapPin,
  Sun,
  ArrowUpRight,
  Binoculars,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { SriLankaChapterId } from './VisitSriLankaSection';

interface RouteNode {
  id: string;
  name: string;
  province: string;
  coordinates: string;
  lat: number;
  lng: number;
  x: number;
  y: number;
  chapterId: SriLankaChapterId;
  tagline: string;
  stationOrHub: string;
}

const ROUTE_NODES: RouteNode[] = [
  {
    id: 'jaffna',
    name: 'Jaffna',
    province: 'Northern Province',
    coordinates: '9.6615° N, 80.0255° E',
    lat: 9.6615,
    lng: 80.0255,
    x: 138,
    y: 44,
    chapterId: 'heritage',
    tagline: 'Nallur Kovil, Jaffna Fort & Northern Lagoons',
    stationOrHub: 'Jaffna Railway Station (Yal Devi)',
  },
  {
    id: 'trincomalee',
    name: 'Trincomalee',
    province: 'Eastern Province',
    coordinates: '8.5874° N, 81.2152° E',
    lat: 8.5874,
    lng: 81.2152,
    x: 238,
    y: 152,
    chapterId: 'beaches',
    tagline: 'Nilaveli Lagoon, Pigeon Island & Koneswaram Cliff',
    stationOrHub: 'Trincomalee Harbour & Rail Terminus',
  },
  {
    id: 'sigiriya',
    name: 'Sigiriya',
    province: 'Cultural Triangle · Matale',
    coordinates: '7.9570° N, 80.7603° E',
    lat: 7.9570,
    lng: 80.7603,
    x: 194,
    y: 214,
    chapterId: 'heritage',
    tagline: 'Lion Rock Fortress, Dambulla & Minneriya Elephants',
    stationOrHub: 'Habarana Junction / Dambulla Hub',
  },
  {
    id: 'kandy',
    name: 'Kandy',
    province: 'Central Highlands',
    coordinates: '7.2906° N, 80.6337° E',
    lat: 7.2906,
    lng: 80.6337,
    x: 176,
    y: 286,
    chapterId: 'heritage',
    tagline: 'Temple of the Sacred Tooth & Peradeniya Gardens',
    stationOrHub: 'Kandy Central Railway Station',
  },
  {
    id: 'colombo',
    name: 'Colombo',
    province: 'Western Province (Capital)',
    coordinates: '6.9271° N, 79.8612° E',
    lat: 6.9271,
    lng: 79.8612,
    x: 98,
    y: 326,
    chapterId: 'colombo',
    tagline: 'Lotus Tower, Red Masjid, Galle Face & Port City',
    stationOrHub: 'Colombo Fort Station & Makumbura E01 Hub',
  },
  {
    id: 'ella',
    name: 'Ella',
    province: 'Uva Highlands',
    coordinates: '6.8768° N, 81.0608° E',
    lat: 6.8768,
    lng: 81.0608,
    x: 214,
    y: 336,
    chapterId: 'nature',
    tagline: 'Nine Arch Bridge, Tea Estates & Little Adam’s Peak',
    stationOrHub: 'Ella Scenic Hill Railway Station',
  },
  {
    id: 'arugambay',
    name: 'Arugam Bay',
    province: 'Ampara · East Coast',
    coordinates: '6.8404° N, 81.8368° E',
    lat: 6.8404,
    lng: 81.8368,
    x: 288,
    y: 356,
    chapterId: 'beaches',
    tagline: 'World-Class Surf Point Break & Pottuvil Lagoon',
    stationOrHub: 'Pottuvil / Arugam Surf Coast',
  },
  {
    id: 'yala',
    name: 'Yala National Park',
    province: 'Southern Dry Zone',
    coordinates: '6.3728° N, 81.5169° E',
    lat: 6.3728,
    lng: 81.5169,
    x: 256,
    y: 412,
    chapterId: 'nature',
    tagline: 'Wild Leopards, Elephant Herds & Coastal Safari Lagoons',
    stationOrHub: 'Tissamaharama / Palatupana Safari Gate',
  },
  {
    id: 'galle',
    name: 'Galle Fort',
    province: 'Southern Coast',
    coordinates: '6.0328° N, 80.2170° E',
    lat: 6.0328,
    lng: 80.2170,
    x: 136,
    y: 454,
    chapterId: 'beaches',
    tagline: 'Dutch Fort Ramparts, Lighthouse & Meeran Masjid',
    stationOrHub: 'Galle Expressway Exit & Coastal Rail',
  },
  {
    id: 'mirissa',
    name: 'Mirissa',
    province: 'Matara · Deep South',
    coordinates: '5.9483° N, 80.4716° E',
    lat: 5.9483,
    lng: 80.4716,
    x: 170,
    y: 472,
    chapterId: 'beaches',
    tagline: 'Blue Whale Cruises & Coconut Tree Hill Sunsets',
    stationOrHub: 'Mirissa Harbour & Weligama Bay',
  },
];

interface CorridorSpecial {
  roadKm: number;
  driveTime: string;
  highwayNote: string;
  railInfo: string;
  pitStops: string;
}

const CORRIDOR_OVERRIDES: Record<string, CorridorSpecial> = {
  'colombo-galle': {
    roadKm: 126,
    driveTime: '1 hr 40 min',
    highwayNote: 'Southern Expressway (E01) direct dual carriageway',
    railInfo: '2h 15m via Coastal Express Train (seafront track)',
    pitStops: 'Bentota Lagoon · Hikkaduwa Coral Reef · Ambalangoda Masks',
  },
  'colombo-mirissa': {
    roadKm: 155,
    driveTime: '2 hrs 10 min',
    highwayNote: 'Southern Expressway (E01) to Godagama/Imaduwa Exit',
    railInfo: '2h 45m to Weligama / Mirissa via Ruhunu Kumari Express',
    pitStops: 'Galle Dutch Fort · Unawatuna · Weligama Surf Bay',
  },
  'colombo-kandy': {
    roadKm: 116,
    driveTime: '3 hrs 10 min',
    highwayNote: 'Central Expressway (E04) partial + A1 Kandy Road',
    railInfo: '2h 40m via Podi Menike / Intercity Observation Train',
    pitStops: 'Pinnawala · Kadugannawa Pass · Peradeniya Royal Gardens',
  },
  'kandy-ella': {
    roadKm: 138,
    driveTime: '3 hrs 50 min',
    highwayNote: 'A5 Mountain Highway via Nuwara Eliya & Hakgala',
    railInfo: '6h 30m World-Famous Scenic Blue Tea-Country Train',
    pitStops: 'Ramboda Falls · Nuwara Eliya · Nanu Oya · Haputale',
  },
  'colombo-ella': {
    roadKm: 230,
    driveTime: '5 hrs 15 min',
    highwayNote: 'A4 Ratnapura–Beragala Highway or E01+E06 South-East link',
    railInfo: '8h 45m Direct Scenic Up-Country Express from Colombo Fort',
    pitStops: 'Kithulgala Rafting · Bambarakanda Falls · Ravana Caves',
  },
  'colombo-sigiriya': {
    roadKm: 175,
    driveTime: '3 hrs 45 min',
    highwayNote: 'E04 Kurunegala Expressway + A6 Dambulla Highway',
    railInfo: '3h 30m train to Habarana + 25 min tuk-tuk transfer',
    pitStops: 'Dambulla Royal Cave Temple · Pidurangala Rock',
  },
  'sigiriya-trincomalee': {
    roadKm: 102,
    driveTime: '2 hrs 00 min',
    highwayNote: 'A6 Habarana – Kantale Straight Forest Corridor',
    railInfo: '1h 50m Northern/East Rail Branch from Habarana',
    pitStops: 'Minneriya National Park · Kantale Tank Reservoir',
  },
  'ella-yala': {
    roadKm: 98,
    driveTime: '2 hrs 15 min',
    highwayNote: 'Wellawaya – Thanamalwila – Tissamaharama Scenic Descent',
    railInfo: 'Highway Coach / Private Car (no rail beyond Badulla)',
    pitStops: 'Ravana Waterfall · Buduruwagala Rock Buddha · Tissa Lake',
  },
  'ella-arugambay': {
    roadKm: 135,
    driveTime: '2 hrs 55 min',
    highwayNote: 'Wellawaya – Monaragala – Siyambalanduwa – Pottuvil',
    railInfo: 'Road transfer / regional express buses',
    pitStops: 'Lahugala Elephant Sanctuary · Panama Lagoon',
  },
  'colombo-jaffna': {
    roadKm: 398,
    driveTime: '6 hrs 45 min',
    highwayNote: 'E04 + A9 North Highway via Anuradhapura & Elephant Pass',
    railInfo: '6h 15m Yal Devi / Uttara Devi Intercity Express Rail',
    pitStops: 'Anuradhapura Sacred City · Elephant Pass Memorial',
  },
};

const computeRouteMetrics = (from: RouteNode, to: RouteNode): CorridorSpecial => {
  const key1 = `${from.id}-${to.id}`;
  const key2 = `${to.id}-${from.id}`;
  if (CORRIDOR_OVERRIDES[key1]) return CORRIDOR_OVERRIDES[key1];
  if (CORRIDOR_OVERRIDES[key2]) return CORRIDOR_OVERRIDES[key2];

  // Fallback Haversine estimate adjusted by 1.32 road factor
  const R = 6371;
  const dLat = ((to.lat - from.lat) * Math.PI) / 180;
  const dLng = ((to.lng - from.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((from.lat * Math.PI) / 180) *
      Math.cos((to.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const straightKm = 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const roadKm = Math.max(25, Math.round(straightKm * 1.32));
  const avgSpeed = from.id === 'colombo' || to.id === 'colombo' ? 54 : 46;
  const totalMins = Math.round((roadKm / avgSpeed) * 60);
  const hrs = Math.floor(totalMins / 60);
  const mins = totalMins % 60;

  return {
    roadKm,
    driveTime: `${hrs} hr${hrs !== 1 ? 's' : ''} ${mins} min`,
    highwayNote: `Connecting ${from.province} to ${to.province}`,
    railInfo:
      from.id === 'ella' || to.id === 'ella'
        ? 'Connected via Sri Lanka’s Scenic Hill Country Rail Line'
        : 'Combined Express Bus / Regional Railway links',
    pitStops: `${from.tagline.split(',')[0]} → ${to.tagline.split(',')[0]}`,
  };
};

interface SeasonSpot {
  id: string;
  title: string;
  location: string;
  category: 'marine' | 'safari' | 'surf';
  categoryLabel: string;
  peakMonths: number[]; // 0-indexed: 0 = Jan .. 11 = Dec
  goodMonths: number[];
  bestTimeOfDay: string;
  description: string;
  marketplaceCategory: string;
  marketplaceKeyword: string;
}

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_FULL = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const SEASON_SPOTS: SeasonSpot[] = [
  {
    id: 'mirissa-whales',
    title: 'Blue Whales & Spinner Dolphins',
    location: 'Mirissa & Galle Harbour · South Coast',
    category: 'marine',
    categoryLabel: 'Marine & Whales',
    peakMonths: [11, 0, 1, 2, 3], // Dec - Apr
    goodMonths: [10], // Nov
    bestTimeOfDay: '06:30 AM Boats · Calm Morning Seas',
    description:
      'Deep continental shelf lies just 6–10 km off Mirissa, offering one of the world’s highest success rates for spotting Blue Whales, Bryde’s Whales, and mega-pods of Spinner Dolphins.',
    marketplaceCategory: 'Holiday Homes',
    marketplaceKeyword: 'Mirissa',
  },
  {
    id: 'trinco-whales',
    title: 'Trincomalee Blue Whales & Snorkeling',
    location: 'Trincomalee & Pigeon Island · East Coast',
    category: 'marine',
    categoryLabel: 'Marine & Whales',
    peakMonths: [4, 5, 6, 7, 8], // May - Sep
    goodMonths: [3, 9], // Apr, Oct
    bestTimeOfDay: '06:00 AM Ocean Departure · Glass Reef Water',
    description:
      'During the East Coast dry season, calm turquoise bays shelter Sperm Whales, Blue Whales near Swami Rock cliff, and vibrant blacktip reef sharks around Pigeon Island.',
    marketplaceCategory: 'Holiday Homes',
    marketplaceKeyword: 'Trincomalee',
  },
  {
    id: 'minneriya-gathering',
    title: 'The Great Elephant Gathering',
    location: 'Minneriya & Kaudulla National Parks',
    category: 'safari',
    categoryLabel: 'Safari Wildlife',
    peakMonths: [6, 7, 8, 9], // Jul - Oct
    goodMonths: [4, 5, 10], // May, Jun, Nov
    bestTimeOfDay: '03:00 PM – 06:00 PM Tank Shore Safari',
    description:
      'Asia’s largest seasonal gathering of wild elephants: 200 to 300 Asian elephants congregate across receding reservoir grasslands beneath dry-zone golden sunsets.',
    marketplaceCategory: 'Cars for Rent',
    marketplaceKeyword: 'Dambulla',
  },
  {
    id: 'yala-leopards',
    title: 'Sri Lankan Leopard & Sloth Bear Safari',
    location: 'Yala Block 1 & Wilpattu National Park',
    category: 'safari',
    categoryLabel: 'Safari Wildlife',
    peakMonths: [1, 2, 3, 4, 5, 6], // Feb - Jul
    goodMonths: [0, 7, 11], // Jan, Aug, Dec
    bestTimeOfDay: '05:45 AM Dawn Gate Entry',
    description:
      'Yala boasts the highest wild leopard density in the world; dry-season waterholes attract leopards, mugger crocodiles, and sloth bears alongside Udawalawe’s year-round elephant herds.',
    marketplaceCategory: 'Holiday Homes',
    marketplaceKeyword: 'Yala',
  },
  {
    id: 'arugam-surf',
    title: 'Arugam Bay Main Point Surf Swell',
    location: 'Arugam Bay & Whiskey Point · East Coast',
    category: 'surf',
    categoryLabel: 'Surf Swells',
    peakMonths: [4, 5, 6, 7, 8, 9], // May - Oct
    goodMonths: [3], // Apr
    bestTimeOfDay: '06:30 AM – 10:30 AM Offshore Glass',
    description:
      'Sri Lanka’s premier international right-hand point break delivering clean 3–7 ft Indian Ocean swells for intermediate and pro surfers, plus beginner sand breaks at Baby Point.',
    marketplaceCategory: 'Holiday Homes',
    marketplaceKeyword: 'Arugam Bay',
  },
  {
    id: 'south-surf',
    title: 'Weligama, Kabalana & Hikkaduwa Surf',
    location: 'South-West Surf Coast',
    category: 'surf',
    categoryLabel: 'Surf Swells',
    peakMonths: [10, 11, 0, 1, 2, 3], // Nov - Apr
    goodMonths: [9], // Oct
    bestTimeOfDay: '07:00 AM Sunrise Session · Warm 28°C Water',
    description:
      'Gentle sandy beach breaks in Weligama Bay for first-timers paired with crisp reef peaks at Midigama, Ahangama (Kabalana), and Hiriketiya cove.',
    marketplaceCategory: 'Cars for Rent',
    marketplaceKeyword: 'Weligama',
  },
];

interface TimetableEntry {
  id: string;
  mode: 'train' | 'bus';
  corridor: 'hill' | 'south' | 'north' | 'highway';
  serviceName: string;
  code: string;
  route: string;
  departure: string;
  arrival: string;
  duration: string;
  frequency: string;
  classes: string;
  highlight: string;
}

const TIMETABLE_DATA: TimetableEntry[] = [
  {
    id: 'tr-podi-menike',
    mode: 'train',
    corridor: 'hill',
    serviceName: 'Podi Menike Scenic Express',
    code: 'Train 1005',
    route: 'Colombo Fort → Kandy → Ella → Badulla',
    departure: '05:55 AM',
    arrival: '03:18 PM (Ella)',
    duration: '9h 23m total · 6h 25m from Kandy',
    frequency: 'Daily',
    classes: '1st Class AC Observation · 2nd & 3rd Reserved',
    highlight: 'Morning sunlight over Hatton waterfalls, Tea Valleys & Nine Arch Bridge.',
  },
  {
    id: 'tr-udarata-menike',
    mode: 'train',
    corridor: 'hill',
    serviceName: 'Udarata Menike Highland Express',
    code: 'Train 1015',
    route: 'Colombo Fort → Peradeniya → Nanu Oya → Ella',
    departure: '08:30 AM',
    arrival: '05:25 PM (Ella)',
    duration: '8h 55m',
    frequency: 'Daily',
    classes: '1st Observation Saloon · 2nd Class Reserved',
    highlight: 'Passes Pattipola (highest station at 1,897 m) and Haputale ridge clouds.',
  },
  {
    id: 'tr-ella-odyssey',
    mode: 'train',
    corridor: 'hill',
    serviceName: 'Ella Odyssey Tourist Express',
    code: 'Special AC',
    route: 'Colombo Fort → Kandy → Nanu Oya → Ella → Badulla',
    departure: '05:30 AM',
    arrival: '02:55 PM (Ella)',
    duration: '9h 25m (Photo Stops Included)',
    frequency: 'Tue · Thu · Sat · Sun',
    classes: '1st Class AC Luxury · 2nd Reserved Panoramic',
    highlight: 'Slows & pauses at Horsetail Waterfall, St. Clair Falls & Nine Arch Viaduct.',
  },
  {
    id: 'tr-ruhunu-kumari',
    mode: 'train',
    corridor: 'south',
    serviceName: 'Ruhunu Kumari Coastal Express',
    code: 'Train 8058',
    route: 'Colombo Fort / Maradana → Galle → Matara',
    departure: '03:40 PM',
    arrival: '05:45 PM (Galle) / 06:35 PM (Matara)',
    duration: '2h 05m to Galle',
    frequency: 'Daily Express',
    classes: '2nd Class Reserved · 3rd Class Unreserved',
    highlight: 'Tracks right beside ocean waves from Mount Lavinia through Bentota & Hikkaduwa.',
  },
  {
    id: 'tr-samudra-devi',
    mode: 'train',
    corridor: 'south',
    serviceName: 'Galu Kumari Morning Coastal Rail',
    code: 'Train 8056',
    route: 'Colombo Fort → Aluthgama → Hikkaduwa → Galle → Beliatta',
    departure: '01:55 PM',
    arrival: '04:15 PM (Galle)',
    duration: '2h 20m to Galle',
    frequency: 'Daily',
    classes: '2nd & 3rd Class Open-Window Coastal Cars',
    highlight: 'Connects directly onward to Tangalle & Beliatta Deep South.',
  },
  {
    id: 'tr-yal-devi',
    mode: 'train',
    corridor: 'north',
    serviceName: 'Yal Devi Intercity Northern Express',
    code: 'Train 4077',
    route: 'Colombo Fort → Anuradhapura → Kilinochchi → Jaffna',
    departure: '06:35 AM',
    arrival: '01:05 PM (Jaffna)',
    duration: '6h 30m',
    frequency: 'Daily',
    classes: '1st Class AC · 2nd Class Reserved',
    highlight: 'Crosses Causeway & Elephant Pass straight to Jaffna Cultural Capital.',
  },
  {
    id: 'bus-e01-galle',
    mode: 'bus',
    corridor: 'highway',
    serviceName: 'E01 Makumbura – Galle Luxury Highway Coach',
    code: 'EX1-1 · AC',
    route: 'Makumbura Multimodal Hub (Kottawa) → Galle Bus Stand',
    departure: 'Every 20 Mins (05:30 AM – 09:30 PM)',
    arrival: '1h 15m Non-Stop',
    duration: '1h 15m Expressway',
    frequency: 'Every 20 mins daily',
    classes: 'Super Luxury AC Reclining Coach',
    highlight: 'Fastest link to Galle Dutch Fort; connects smoothly to Weligama & Mirissa taxis.',
  },
  {
    id: 'bus-e01-matara',
    mode: 'bus',
    corridor: 'highway',
    serviceName: 'E01 Colombo / Makumbura – Matara & Mirissa Express',
    code: 'EX1-2 · AC',
    route: 'Makumbura Hub / Pettah → Southern Expressway → Matara',
    departure: 'Every 30 Mins (05:45 AM – 09:00 PM)',
    arrival: '1h 45m Non-Stop',
    duration: '1h 45m Expressway',
    frequency: 'Every 30 mins daily',
    classes: 'Super Luxury AC Highway Bus',
    highlight: 'Exit at Godagama/Matara for Mirissa Whale Harbour (15 mins from exit).',
  },
  {
    id: 'bus-e01-kataragama',
    mode: 'bus',
    corridor: 'highway',
    serviceName: 'Southern Expressway – Mattala / Tissamaharama (Yala) Coach',
    code: 'EX1-32 · AC',
    route: 'Makumbura Hub → E01/E06 → Tissamaharama / Kataragama',
    departure: 'Hourly (06:00 AM – 06:00 PM)',
    arrival: '3h 55m Direct',
    duration: '3h 55m',
    frequency: 'Hourly departures',
    classes: 'Super Luxury Highway AC',
    highlight: 'Direct expressway access to Yala National Park & Bundala safaris.',
  },
  {
    id: 'bus-cmb-airport',
    mode: 'bus',
    corridor: 'highway',
    serviceName: 'Airport E03 – Colombo Fort / Negombo Luxury Shuttle',
    code: 'E03 · AC',
    route: 'Bandaranaike Intl Airport (CMB) → Colombo Fort / Makumbura',
    departure: 'Every 30 Mins (05:30 AM – 10:30 PM)',
    arrival: '35–45 Mins Non-Stop',
    duration: '40m via E03 Katunayake Expressway',
    frequency: 'Every 30 mins',
    classes: 'Luggage-Equipped Luxury AC Coach',
    highlight: 'Direct express airport transfer linking arrivals straight to Fort Train Station & South E01.',
  },
];

type TravelToolTab = 'route_map' | 'seasons' | 'timetable';

interface SriLankaTravelToolsProps {
  onSelectChapter?: (chapterId: SriLankaChapterId) => void;
  onSelectCategory?: (category: string, searchKeyword?: string) => void;
  onToast?: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const SriLankaTravelTools: React.FC<SriLankaTravelToolsProps> = ({
  onSelectChapter,
  onSelectCategory,
  onToast,
}) => {
  const [activeTool, setActiveTool] = useState<TravelToolTab>('route_map');

  // Tool 1: Route Map State
  const [fromId, setFromId] = useState<string>('colombo');
  const [toId, setToId] = useState<string>('ella');
  const [pickingTarget, setPickingTarget] = useState<'from' | 'to'>('to');

  const fromNode = ROUTE_NODES.find((n) => n.id === fromId) || ROUTE_NODES[4];
  const toNode = ROUTE_NODES.find((n) => n.id === toId) || ROUTE_NODES[5];
  const metrics = computeRouteMetrics(fromNode, toNode);

  // Compute curved Bezier arc for SVG route path
  const midX = (fromNode.x + toNode.x) / 2 + (fromNode.y > toNode.y ? -22 : 22);
  const midY = (fromNode.y + toNode.y) / 2 - 12;
  const routePathD = `M ${fromNode.x} ${fromNode.y} Q ${midX} ${midY} ${toNode.x} ${toNode.y}`;

  const handlePinClick = (nodeId: string) => {
    if (pickingTarget === 'from') {
      if (nodeId === toId) {
        setToId(fromId);
      }
      setFromId(nodeId);
      setPickingTarget('to');
    } else {
      if (nodeId === fromId) {
        setFromId(toId);
      }
      setToId(nodeId);
    }
  };

  const handleSwapRoute = () => {
    setFromId(toId);
    setToId(fromId);
  };

  // Tool 2: Wildlife & Surf Season Finder State
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [seasonFilter, setSeasonFilter] = useState<'all' | 'marine' | 'safari' | 'surf'>('all');

  const filteredSeasonSpots = SEASON_SPOTS.filter(
    (s) => seasonFilter === 'all' || s.category === seasonFilter
  );

  // Tool 3: Timetable State
  const [modeFilter, setModeFilter] = useState<'all' | 'train' | 'bus'>('all');
  const [corridorFilter, setCorridorFilter] = useState<string>('all');

  const filteredTimetable = TIMETABLE_DATA.filter((row) => {
    const matchMode = modeFilter === 'all' || row.mode === modeFilter;
    const matchCorridor = corridorFilter === 'all' || row.corridor === corridorFilter;
    return matchMode && matchCorridor;
  });

  return (
    <div className="mt-8 rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-[#121722] overflow-hidden shadow-sm">
      {/* Unified Tool Switcher Header */}
      <div className="bg-gradient-to-r from-[#0B1120] via-[#111B2E] to-[#0B1924] text-white px-5 py-5 sm:px-6 border-b border-white/10">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-cyan-300">
              <Sparkles className="w-3.5 h-3.5 text-[#FF5A36]" />
              <span>Smart Island Trip Planner</span>
            </div>
            <h3 className="text-lg sm:text-xl font-black tracking-tight mt-0.5">
              Interactive Route Map, Wildlife & Surf Seasons, and Rail/Bus Timetables
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 bg-white/5 border border-white/10 p-1 rounded-xl">
            <button
              type="button"
              id="sl-tool-tab-route"
              onClick={() => setActiveTool('route_map')}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeTool === 'route_map'
                  ? 'bg-[#FF5A36] text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <MapIcon className="w-3.5 h-3.5" />
              <span>Interactive Route Map</span>
            </button>

            <button
              type="button"
              id="sl-tool-tab-seasons"
              onClick={() => setActiveTool('seasons')}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeTool === 'seasons'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Waves className="w-3.5 h-3.5" />
              <span>Wildlife & Surf Seasons</span>
            </button>

            <button
              type="button"
              id="sl-tool-tab-timetable"
              onClick={() => setActiveTool('timetable')}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeTool === 'timetable'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Train className="w-3.5 h-3.5" />
              <span>Train & Express Bus Timetable</span>
            </button>
          </div>
        </div>
      </div>

      {/* PANEL 1: INTERACTIVE SRI LANKA ROUTE MAP */}
      {activeTool === 'route_map' && (
        <div className="p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: Vector Island Map */}
          <div className="lg:col-span-5 rounded-2xl bg-gradient-to-b from-[#07111E] via-[#0B1A2D] to-[#081523] border border-slate-800 p-4 relative overflow-hidden">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-300 mb-2 relative z-10">
              <span className="inline-flex items-center gap-1.5 text-cyan-300">
                <Compass className="w-3.5 h-3.5" />
                <span>Click Any City Pin</span>
              </span>
              <div className="inline-flex bg-white/10 rounded-lg p-0.5 text-[10px]">
                <button
                  type="button"
                  onClick={() => setPickingTarget('from')}
                  className={`px-2 py-0.5 rounded font-bold cursor-pointer ${
                    pickingTarget === 'from' ? 'bg-emerald-500 text-slate-950' : 'text-slate-300'
                  }`}
                >
                  Set Start
                </button>
                <button
                  type="button"
                  onClick={() => setPickingTarget('to')}
                  className={`px-2 py-0.5 rounded font-bold cursor-pointer ${
                    pickingTarget === 'to' ? 'bg-[#FF5A36] text-white' : 'text-slate-300'
                  }`}
                >
                  Set Destination
                </button>
              </div>
            </div>

            <div className="w-full max-w-[330px] mx-auto">
              <svg
                viewBox="0 0 360 520"
                className="w-full h-auto select-none drop-shadow-[0_12px_30px_rgba(6,182,212,0.18)]"
                role="img"
                aria-label="Interactive Route Map of Sri Lanka"
              >
                <defs>
                  <linearGradient id="islandLandGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#14333D" />
                    <stop offset="55%" stopColor="#0F2A3A" />
                    <stop offset="100%" stopColor="#13253F" />
                  </linearGradient>
                  <linearGradient id="routeArcGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#10B981" />
                    <stop offset="100%" stopColor="#FF5A36" />
                  </linearGradient>
                </defs>

                {/* Subtle lat/lng ocean grid */}
                {[90, 180, 270, 360, 450].map((gy) => (
                  <line
                    key={`gy-${gy}`}
                    x1="15"
                    y1={gy}
                    x2="345"
                    y2={gy}
                    stroke="rgba(56,189,248,0.08)"
                    strokeDasharray="3 5"
                  />
                ))}
                {[80, 170, 260].map((gx) => (
                  <line
                    key={`gx-${gx}`}
                    x1={gx}
                    y1="15"
                    x2={gx}
                    y2="505"
                    stroke="rgba(56,189,248,0.08)"
                    strokeDasharray="3 5"
                  />
                ))}

                {/* Stylized Accurate Silhouette of Sri Lanka + Jaffna Peninsula */}
                <path
                  d="M 136 22 C 154 20, 166 28, 160 44 C 156 54, 166 64, 178 76 C 194 94, 214 118, 232 142 C 254 170, 268 198, 282 238 C 296 276, 305 314, 298 352 C 290 388, 274 422, 248 446 C 218 474, 182 490, 152 486 C 122 480, 102 454, 92 418 C 82 378, 76 340, 82 302 C 88 264, 80 226, 88 188 C 96 152, 104 120, 114 96 C 120 82, 108 66, 112 50 C 115 34, 122 24, 136 22 Z"
                  fill="url(#islandLandGrad)"
                  stroke="rgba(56,189,248,0.55)"
                  strokeWidth="2.2"
                />

                {/* Secondary subtle topographic inner contour */}
                <path
                  d="M 164 252 C 196 248, 224 276, 228 318 C 230 356, 206 382, 176 378 C 148 374, 134 338, 138 298 C 142 268, 148 254, 164 252 Z"
                  fill="rgba(16,185,129,0.08)"
                  stroke="rgba(16,185,129,0.22)"
                  strokeDasharray="4 4"
                />

                {/* Active Route Curved Connection */}
                {fromNode.id !== toNode.id && (
                  <>
                    <path
                      d={routePathD}
                      fill="none"
                      stroke="rgba(255,90,54,0.25)"
                      strokeWidth="6"
                      strokeLinecap="round"
                    />
                    <path
                      d={routePathD}
                      fill="none"
                      stroke="url(#routeArcGrad)"
                      strokeWidth="3"
                      strokeDasharray="7 5"
                      strokeLinecap="round"
                    />
                  </>
                )}

                {/* Destination Nodes */}
                {ROUTE_NODES.map((node) => {
                  const isFrom = node.id === fromId;
                  const isTo = node.id === toId;
                  const active = isFrom || isTo;
                  const labelRight = node.x < 185;

                  return (
                    <g
                      key={node.id}
                      onClick={() => handlePinClick(node.id)}
                      className="cursor-pointer group"
                    >
                      {active && (
                        <circle
                          cx={node.x}
                          cy={node.y}
                          r={14}
                          fill={isFrom ? 'rgba(16,185,129,0.24)' : 'rgba(255,90,54,0.26)'}
                        />
                      )}
                      <circle
                        cx={node.x}
                        cy={node.y}
                        r={active ? 7 : 5}
                        fill={isFrom ? '#10B981' : isTo ? '#FF5A36' : '#38BDF8'}
                        stroke="#FFFFFF"
                        strokeWidth={active ? 2.2 : 1.5}
                      />
                      <text
                        x={labelRight ? node.x + 11 : node.x - 11}
                        y={node.y + 4}
                        textAnchor={labelRight ? 'start' : 'end'}
                        fontSize={active ? '11.5' : '10'}
                        fontWeight={active ? '800' : '600'}
                        fill={active ? '#FFFFFF' : '#CBD5E1'}
                        style={{ textShadow: '0 1px 4px rgba(0,0,0,0.9)' }}
                      >
                        {node.name}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>

          {/* Right: Route Controls, Distance Telemetry & Preset Island Loops */}
          <div className="lg:col-span-7 space-y-5">
            {/* Origin & Destination Selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-11 gap-3 items-center">
              <div className="sm:col-span-5">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-1">
                  Start Destination
                </label>
                <select
                  value={fromId}
                  onChange={(e) => setFromId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-[#1A2030] border border-gray-200 dark:border-slate-700 text-sm font-bold text-gray-900 dark:text-white outline-none focus:border-[#FF5A36]"
                >
                  {ROUTE_NODES.map((n) => (
                    <option key={`from-${n.id}`} value={n.id}>
                      {n.name} ({n.province})
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-1 flex justify-center pt-4 sm:pt-5">
                <button
                  type="button"
                  onClick={handleSwapRoute}
                  title="Swap Origin & Destination"
                  className="p-2.5 rounded-xl bg-gray-100 dark:bg-slate-800 hover:bg-[#FF5A36] hover:text-white text-gray-700 dark:text-slate-200 transition-colors cursor-pointer"
                >
                  <ArrowRightLeft className="w-4 h-4" />
                </button>
              </div>

              <div className="sm:col-span-5">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#FF5A36] mb-1">
                  Target Destination
                </label>
                <select
                  value={toId}
                  onChange={(e) => setToId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-[#1A2030] border border-gray-200 dark:border-slate-700 text-sm font-bold text-gray-900 dark:text-white outline-none focus:border-[#FF5A36]"
                >
                  {ROUTE_NODES.map((n) => (
                    <option key={`to-${n.id}`} value={n.id}>
                      {n.name} ({n.province})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quick Island Preset Loops */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold text-gray-500 dark:text-slate-400">
                Popular Routes:
              </span>
              {[
                { label: 'Colombo → Ella', from: 'colombo', to: 'ella' },
                { label: 'Colombo → Galle Fort', from: 'colombo', to: 'galle' },
                { label: 'Kandy → Ella Rail', from: 'kandy', to: 'ella' },
                { label: 'Sigiriya → Trincomalee', from: 'sigiriya', to: 'trincomalee' },
                { label: 'Ella → Yala Safari', from: 'ella', to: 'yala' },
              ].map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => {
                    setFromId(preset.from);
                    setToId(preset.to);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                    fromId === preset.from && toId === preset.to
                      ? 'bg-[#FF5A36] text-white border-[#FF5A36]'
                      : 'bg-gray-50 dark:bg-slate-800/70 text-gray-700 dark:text-slate-300 border-gray-200 dark:border-slate-700 hover:border-[#FF5A36]'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Calculated Route Telemetry Card */}
            <div className="rounded-2xl border border-gray-200 dark:border-slate-800 bg-gray-50/70 dark:bg-[#171C28] p-4 sm:p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-gray-200/80 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-[#FF5A36]" />
                  <h4 className="font-black text-base sm:text-lg text-gray-900 dark:text-white">
                    {fromNode.name} → {toNode.name}
                  </h4>
                </div>
                <span className="text-xs font-mono text-gray-500 dark:text-slate-400">
                  {fromNode.coordinates.split(',')[0]} → {toNode.coordinates.split(',')[0]}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="rounded-xl bg-white dark:bg-[#11151F] border border-gray-200/80 dark:border-slate-800 p-3">
                  <div className="text-[11px] text-gray-500 dark:text-slate-400 font-semibold">
                    Road Distance
                  </div>
                  <div className="text-lg font-black text-gray-900 dark:text-white tabular-nums mt-0.5">
                    {fromNode.id === toNode.id ? '0 km' : `${metrics.roadKm} km`}
                  </div>
                </div>
                <div className="rounded-xl bg-white dark:bg-[#11151F] border border-gray-200/80 dark:border-slate-800 p-3">
                  <div className="text-[11px] text-gray-500 dark:text-slate-400 font-semibold">
                    Est. Drive Time
                  </div>
                  <div className="text-lg font-black text-[#FF5A36] tabular-nums mt-0.5">
                    {fromNode.id === toNode.id ? 'At Location' : metrics.driveTime}
                  </div>
                </div>
                <div className="col-span-2 sm:col-span-1 rounded-xl bg-white dark:bg-[#11151F] border border-gray-200/80 dark:border-slate-800 p-3">
                  <div className="text-[11px] text-gray-500 dark:text-slate-400 font-semibold">
                    Main Hub
                  </div>
                  <div className="text-xs font-bold text-gray-900 dark:text-white mt-1 line-clamp-2">
                    {toNode.stationOrHub}
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-xs text-gray-700 dark:text-slate-300">
                <div>
                  <span className="font-extrabold text-gray-900 dark:text-white">
                    Highway Corridor:{' '}
                  </span>
                  {metrics.highwayNote}
                </div>
                <div>
                  <span className="font-extrabold text-gray-900 dark:text-white">
                    Rail Option:{' '}
                  </span>
                  {metrics.railInfo}
                </div>
                <div>
                  <span className="font-extrabold text-gray-900 dark:text-white">
                    Suggested Stops Along Way:{' '}
                  </span>
                  {metrics.pitStops}
                </div>
              </div>

              <div className="pt-3 border-t border-gray-200/80 dark:border-slate-800 flex flex-wrap items-center gap-2.5">
                {onSelectChapter && (
                  <button
                    type="button"
                    onClick={() => {
                      onSelectChapter(toNode.chapterId);
                      const el = document.getElementById('visit-sri-lanka-section');
                      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      if (onToast) onToast(`Showing ${toNode.name} inside ${toNode.chapterId.toUpperCase()}`, 'info');
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gray-900 dark:bg-white hover:bg-[#FF5A36] dark:hover:bg-[#FF5A36] text-white dark:text-slate-900 dark:hover:text-white text-xs font-bold cursor-pointer transition-colors"
                  >
                    <span>Explore {toNode.name} Photos & Video</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                )}

                {onSelectCategory && (
                  <button
                    type="button"
                    onClick={() => onSelectCategory('Cars for Rent', toNode.name)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-[#11151F] border border-gray-200 dark:border-slate-700 hover:border-[#FF5A36] text-gray-800 dark:text-white text-xs font-bold cursor-pointer transition-colors"
                  >
                    <span>Find Transport / Drivers for {toNode.name}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PANEL 2: WILDLIFE & SURF SEASON FINDER */}
      {activeTool === 'seasons' && (
        <div className="p-5 sm:p-6 space-y-5">
          {/* Interactive 12-Month Bar + Filter */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-gray-100 dark:border-slate-800">
            <div>
              <h4 className="font-black text-base sm:text-lg text-gray-900 dark:text-white flex items-center gap-2">
                <Sun className="w-4 h-4 text-[#FF5A36]" />
                <span>Best Months for Wildlife & Surf ({MONTHS_FULL[selectedMonth]})</span>
              </h4>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                Pick a travel month to see where Whales, Leopards, Elephants, and Surf Swells peak across Sri Lanka’s two monsoon coasts.
              </p>
            </div>

            <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-[#0D1119] p-1 rounded-xl overflow-x-auto scrollbar-none">
              {[
                { id: 'all', label: 'All Sightings' },
                { id: 'marine', label: 'Whales & Marine' },
                { id: 'safari', label: 'Leopards & Elephants' },
                { id: 'surf', label: 'Surf Swells' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSeasonFilter(tab.id as 'all' | 'marine' | 'safari' | 'surf')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer transition-all ${
                    seasonFilter === tab.id
                      ? 'bg-gray-900 dark:bg-[#FF5A36] text-white'
                      : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* 12-Month Picker */}
          <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5">
            {MONTHS_SHORT.map((m, idx) => {
              const active = idx === selectedMonth;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => setSelectedMonth(idx)}
                  className={`py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                    active
                      ? 'bg-[#FF5A36] text-white shadow-sm'
                      : 'bg-gray-100 dark:bg-[#171C28] text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-800'
                  }`}
                >
                  {m}
                </button>
              );
            })}
          </div>

          {/* Sighting Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSeasonSpots.map((spot) => {
              const isPeak = spot.peakMonths.includes(selectedMonth);
              const isGood = spot.goodMonths.includes(selectedMonth);
              const statusLabel = isPeak
                ? 'Peak Season'
                : isGood
                ? 'Good Conditions'
                : 'Off-Peak / Monsoon';
              const statusClasses = isPeak
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700/50'
                : isGood
                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-700/50'
                : 'bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-slate-400 border-gray-200 dark:border-slate-700';

              return (
                <div
                  key={spot.id}
                  className={`rounded-2xl border p-4 flex flex-col justify-between gap-3 transition-all ${
                    isPeak
                      ? 'border-emerald-300/80 dark:border-emerald-500/40 bg-emerald-50/20 dark:bg-[#151D27]'
                      : 'border-gray-200 dark:border-slate-800 bg-gray-50/60 dark:bg-[#151A24]'
                  }`}
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#FF5A36] flex items-center gap-1">
                        {spot.category === 'surf' ? (
                          <Waves className="w-3.5 h-3.5" />
                        ) : (
                          <Binoculars className="w-3.5 h-3.5" />
                        )}
                        <span>{spot.categoryLabel}</span>
                      </span>

                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-md border ${statusClasses}`}
                      >
                        {statusLabel}
                      </span>
                    </div>

                    <div>
                      <h5 className="font-black text-sm sm:text-base text-gray-900 dark:text-white leading-snug">
                        {spot.title}
                      </h5>
                      <div className="flex items-center gap-1 text-[11px] text-gray-500 dark:text-slate-400 mt-0.5">
                        <MapPin className="w-3 h-3 text-[#FF5A36] shrink-0" />
                        <span>{spot.location}</span>
                      </div>
                    </div>

                    <p className="text-xs text-gray-700 dark:text-slate-300 leading-relaxed">
                      {spot.description}
                    </p>

                    {/* 12-Month Mini Heatmap Bar */}
                    <div>
                      <div className="text-[10px] font-bold text-gray-500 dark:text-slate-400 mb-1">
                        Annual Window (Jan–Dec)
                      </div>
                      <div className="grid grid-cols-12 gap-1">
                        {MONTHS_SHORT.map((m, i) => {
                          const p = spot.peakMonths.includes(i);
                          const g = spot.goodMonths.includes(i);
                          const curr = i === selectedMonth;
                          return (
                            <div
                              key={`${spot.id}-${m}`}
                              title={`${m}: ${p ? 'Peak' : g ? 'Good' : 'Off-Peak'}`}
                              className={`h-2 rounded-sm ${
                                p
                                  ? 'bg-emerald-500'
                                  : g
                                  ? 'bg-amber-400'
                                  : 'bg-gray-200 dark:bg-slate-700'
                              } ${curr ? 'ring-2 ring-[#FF5A36]' : ''}`}
                            />
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="pt-2.5 border-t border-gray-200/70 dark:border-slate-800 flex items-center justify-between gap-2 text-[11px]">
                    <span className="text-gray-600 dark:text-slate-400 truncate">
                      <strong>Timing:</strong> {spot.bestTimeOfDay.split('·')[0]}
                    </span>
                    {onSelectCategory && (
                      <button
                        type="button"
                        onClick={() =>
                          onSelectCategory(spot.marketplaceCategory, spot.marketplaceKeyword)
                        }
                        className="font-extrabold text-[#FF5A36] hover:underline shrink-0 cursor-pointer"
                      >
                        Find Stays →
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* PANEL 3: SCENIC TRAIN & EXPRESS BUS TIMETABLE */}
      {activeTool === 'timetable' && (
        <div className="p-5 sm:p-6 space-y-5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-gray-100 dark:border-slate-800">
            <div>
              <h4 className="font-black text-base sm:text-lg text-gray-900 dark:text-white flex items-center gap-2">
                <Train className="w-4 h-4 text-[#FF5A36]" />
                <span>Scenic Train & Expressway Luxury Bus Timetable</span>
              </h4>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                Key daily departures for Sri Lanka’s Highland Blue Train, Coastal Express, Yal Devi, and Makumbura (E01) Highway Coaches.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 bg-gray-100 dark:bg-[#0D1119] p-1 rounded-xl">
                {[
                  { id: 'all', label: 'All Services', icon: Sparkles },
                  { id: 'train', label: 'Scenic Railways', icon: Train },
                  { id: 'bus', label: 'Expressway Buses', icon: Bus },
                ].map((m) => {
                  const Icon = m.icon;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setModeFilter(m.id as 'all' | 'train' | 'bus')}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer transition-all ${
                        modeFilter === m.id
                          ? 'bg-gray-900 dark:bg-[#FF5A36] text-white'
                          : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{m.label}</span>
                    </button>
                  );
                })}
              </div>

              <select
                value={corridorFilter}
                onChange={(e) => setCorridorFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-gray-50 dark:bg-[#171C28] border border-gray-200 dark:border-slate-700 text-xs font-bold text-gray-800 dark:text-white outline-none"
              >
                <option value="all">All Corridors</option>
                <option value="hill">Hill Country (Kandy – Ella – Badulla)</option>
                <option value="south">Southern Coast (Colombo – Galle – Matara)</option>
                <option value="north">Northern Rail (Colombo – Anuradhapura – Jaffna)</option>
                <option value="highway">Expressways (E01 / E03 Highway Coaches)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredTimetable.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-gray-200 dark:border-slate-800 bg-gray-50/70 dark:bg-[#161B27] p-4 flex flex-col justify-between gap-3"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-black ${
                        item.mode === 'train'
                          ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-300'
                          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                      }`}
                    >
                      {item.mode === 'train' ? (
                        <Train className="w-3.5 h-3.5" />
                      ) : (
                        <Bus className="w-3.5 h-3.5" />
                      )}
                      <span>{item.code}</span>
                    </span>
                    <span className="text-[11px] font-bold text-gray-500 dark:text-slate-400">
                      {item.frequency}
                    </span>
                  </div>

                  <div>
                    <h5 className="font-black text-sm sm:text-base text-gray-900 dark:text-white">
                      {item.serviceName}
                    </h5>
                    <p className="text-xs font-semibold text-[#FF5A36] mt-0.5">{item.route}</p>
                  </div>

                  <div className="grid grid-cols-3 gap-2 rounded-xl bg-white dark:bg-[#10141F] border border-gray-200/80 dark:border-slate-800 p-2.5 text-xs">
                    <div>
                      <span className="block text-[10px] text-gray-400 font-semibold">Departs</span>
                      <span className="font-extrabold text-gray-900 dark:text-white tabular-nums">
                        {item.departure}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-gray-400 font-semibold">Arrives</span>
                      <span className="font-extrabold text-gray-900 dark:text-white tabular-nums">
                        {item.arrival}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-gray-400 font-semibold">Duration</span>
                      <span className="font-bold text-cyan-700 dark:text-cyan-400">
                        {item.duration.split('·')[0].trim()}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-gray-600 dark:text-slate-300 leading-relaxed">
                    <span className="font-bold text-gray-800 dark:text-slate-200">Classes: </span>
                    {item.classes}
                  </p>
                </div>

                <div className="pt-2.5 border-t border-gray-200/70 dark:border-slate-800 flex items-start gap-1.5 text-[11px] text-gray-600 dark:text-slate-400">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{item.highlight}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-xl bg-blue-50/70 dark:bg-slate-800/50 border border-blue-200/60 dark:border-slate-700 p-3.5 flex items-start gap-2.5 text-xs text-gray-700 dark:text-slate-300">
            <Info className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0 mt-0.5" />
            <p>
              <strong>Booking Tip:</strong> Reserved Observation & 1st/2nd Class hill-country train seats (<em>Podi Menike</em>, <em>Udarata Menike</em>, <em>Ella Odyssey</em>) open 30 days in advance via Sri Lanka Railways. Expressway coaches operate walk-up departures all day from Makumbura Multimodal Hub (Kottawa) and Pettah Central Bus Stand.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
