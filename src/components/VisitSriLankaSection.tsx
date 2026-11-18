import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Play,
  Pause,
  Image as ImageIcon,
  Video,
  MapPin,
  Compass,
  Clock,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Maximize2,
  X,
  RotateCcw,
  Camera,
  Film,
  Building2,
  Trees,
  Waves,
  Landmark,
  Globe,
  Sun,
  Train,
  Utensils,
  PhoneCall,
  Info,
  ArrowUpRight,
} from 'lucide-react';
import { SriLankaTravelTools } from './SriLankaTravelTools';

import visitSriLankaIcon from '../assets/images/visit_srilanka_icon_3d_1794991123817.jpg';
import colomboCityImg from '../assets/images/srilanka_colombo_city_1794991124705.jpg';
import colomboRedMosqueImg from '../assets/images/srilanka_red_mosque_colombo_1794991770483.jpg';
import colomboGangaramayaImg from '../assets/images/srilanka_gangaramaya_temple_1794991770285.jpg';

import natureHighlandsImg from '../assets/images/srilanka_nature_highlands_1794991124649.jpg';
import natureElephantsImg from '../assets/images/srilanka_nature_elephants_safari_1794991773156.jpg';
import natureWaterfallImg from '../assets/images/srilanka_nature_waterfall_forest_1794991772746.jpg';

import beachesCoastImg from '../assets/images/srilanka_beaches_coast_1794991125473.jpg';
import beachesGalleFortImg from '../assets/images/srilanka_beaches_galle_fort_1794991773072.jpg';
import beachesNilaveliImg from '../assets/images/srilanka_beaches_nilaveli_lagoon_1794991773074.jpg';

import heritageSigiriyaImg from '../assets/images/srilanka_heritage_sigiriya_1794991126174.jpg';
import heritageKandyTempleImg from '../assets/images/srilanka_heritage_kandy_temple_1794991774367.jpg';
import heritageHinduKovilImg from '../assets/images/srilanka_heritage_hindu_kovil_1794991774889.jpg';

export type SriLankaChapterId = 'colombo' | 'nature' | 'beaches' | 'heritage';

interface ChapterPhoto {
  id: string;
  image: string;
  title: string;
  location: string;
  description: string;
}

interface VideoSceneFrame {
  id: string;
  image: string;
  timecode: string;
  title: string;
  caption: string;
  cameraMove: string;
  transformStart: string;
  transformEnd: string;
  filterClass: string;
}

interface SriLankaChapter {
  id: SriLankaChapterId;
  title: string;
  tagline: string;
  region: string;
  coordinates: string;
  bestMonths: string;
  altitudeOrCoast: string;
  gallery: ChapterPhoto[];
  videoTitle: string;
  videoDurationSec: number;
  videoDurationLabel: string;
  videoResolution: string;
  videoDescription: string;
  highlights: string[];
  travelTip: string;
  marketplaceCategory: string;
  marketplaceKeyword: string;
  marketplaceLabel: string;
  icon: React.ElementType;
  accentGradient: string;
  scenes: VideoSceneFrame[];
}

interface SacredLandmarkItem {
  id: string;
  name: string;
  faith: 'mosque' | 'buddhist' | 'hindu' | 'church';
  faithLabel: string;
  city: string;
  era: string;
  image: string;
  description: string;
  visitingTip: string;
}

const SACRED_LANDMARKS: SacredLandmarkItem[] = [
  {
    id: 'sacred-red-mosque',
    name: 'Jami Ul-Alfar Mosque (Red Masjid)',
    faith: 'mosque',
    faithLabel: 'Masjid · Mosque',
    city: 'Pettah, Colombo 11',
    era: 'Built 1909 · Indo-Saracenic',
    image: colomboRedMosqueImg,
    description:
      'One of Sri Lanka’s most photographed architectural icons, famous for its pomegranate-inspired domes, towering minarets, and vivid red-and-white striped brickwork standing at the heart of Pettah’s historic spice quarter.',
    visitingTip: 'Guided visitor hours daily outside prayer times; modest attire provided at the entrance.',
  },
  {
    id: 'sacred-kandy-tooth',
    name: 'Sri Dalada Maligawa (Temple of the Sacred Tooth)',
    faith: 'buddhist',
    faithLabel: 'Buddhist Temple',
    city: 'Kandy · Cultural Triangle',
    era: '16th Century · UNESCO World Heritage',
    image: heritageKandyTempleImg,
    description:
      'Houses the sacred tooth relic of Lord Buddha inside a gleaming golden-roofed royal palace complex overlooking Kandy Lake, illuminated nightly with traditional Kandyan drumming and jasmine offerings.',
    visitingTip: 'Visit during morning (5:30 AM) or evening (6:30 PM) Thevava ceremonies; shoulders & knees must be covered.',
  },
  {
    id: 'sacred-koneswaram',
    name: 'Thirukoneswaram Kovil & Nallur Heritage',
    faith: 'hindu',
    faithLabel: 'Hindu Kovil',
    city: 'Swami Rock, Trincomalee & Jaffna',
    era: 'Ancient Pancha Ishwaram Temple',
    image: heritageHinduKovilImg,
    description:
      'Known as the Temple of a Thousand Pillars, this majestic cliffside Shiva sanctuary crowns Swami Rock above deep sapphire waters of the Indian Ocean, paired on the northern circuit with Jaffna’s golden Nallur Kandaswamy Kovil.',
    visitingTip: 'Early morning pooja offers sweeping sunrise views over Trincomalee harbor and playful wild spotted deer.',
  },
  {
    id: 'sacred-gangaramaya',
    name: 'Gangaramaya Temple & Seema Malaka',
    faith: 'buddhist',
    faithLabel: 'Buddhist Temple',
    city: 'Beira Lake, Colombo 02',
    era: '19th Century · Geoffrey Bawa Pavilion',
    image: colomboGangaramayaImg,
    description:
      'A serene lakefront assembly pavilion floating on three timber-and-stone platforms linked by boardwalks, surrounded by meditation Buddha sculptures and glowing twilight skyline reflections of modern Colombo.',
    visitingTip: 'Open until late evening; dusk lanterns against the Colombo skyline make it ideal for peaceful twilight walks.',
  },
  {
    id: 'sacred-meeran-ketchimalai',
    name: 'Ketchimalai Mosque & Meeran Jumma Masjid',
    faith: 'mosque',
    faithLabel: 'Historic Masjids',
    city: 'Beruwala & Galle Dutch Fort',
    era: '11th–18th Century Coastal Landmarks',
    image: beachesGalleFortImg,
    description:
      'Along the southwest coast stand Beruwala’s clifftop Ketchimalai Masjid—marking one of the earliest Arab trading landings in Sri Lanka—and Galle Fort’s whitewashed Meeran Jumma Mosque overlooking the historic Ramparts and Lighthouse.',
    visitingTip: 'Combine a coastal walk along Galle Fort’s Flag Rock and Lighthouse with a visit to Meeran Jumma Masjid nearby.',
  },
  {
    id: 'sacred-anthony-cathedral',
    name: 'St. Anthony’s Shrine & Ancient Stupas',
    faith: 'church',
    faithLabel: 'Shrines & Heritage Sites',
    city: 'Colombo · Anuradhapura · Madhu',
    era: 'Interfaith Living Pilgrimage',
    image: heritageSigiriyaImg,
    description:
      'Sri Lanka is cherished as a multi-faith island where St. Anthony’s Shrine in Kochchikade, Our Lady of Madhu Church in Mannar, Ruwanwelisaya Stupa in Anuradhapura, and Kelaniya Raja Maha Vihara welcome pilgrims from all communities.',
    visitingTip: 'Tuesday novenas at St. Anthony’s Shrine and full-moon Poya evenings at Anuradhapura attract thousands of visitors.',
  },
];

const SRI_LANKA_CHAPTERS: SriLankaChapter[] = [
  {
    id: 'colombo',
    title: 'Colombo City',
    tagline: 'Capital Skyline, Iconic Red Masjid & Lakefront Temples',
    region: 'Western Province · Colombo 01–11',
    coordinates: '6.9271° N, 79.8612° E',
    bestMonths: 'December – March · Year-Round',
    altitudeOrCoast: 'West Coast · Capital Metropolis',
    gallery: [
      {
        id: 'col-skyline',
        image: colomboCityImg,
        title: 'Colombo Twilight Skyline · Lotus Tower & Galle Face Green',
        location: 'Galle Face & Port City, Colombo 01–02',
        description:
          'High-resolution twilight aerial frame capturing Colombo’s illuminated 350m Lotus Tower beside Beira Lake, historic Galle Face Green promenade, modern glass towers, and the Colombo Port City marina.',
      },
      {
        id: 'col-red-mosque',
        image: colomboRedMosqueImg,
        title: 'Jami Ul-Alfar Mosque (Famous Red Masjid)',
        location: '2nd Cross Street, Pettah, Colombo 11',
        description:
          'Sunlight illuminates the unmistakable red-and-white candy-striped Indo-Saracenic minarets, sculpted arches, and pomegranate-styled domes of Pettah’s century-old landmark Masjid surrounded by bustling bazaar life.',
      },
      {
        id: 'col-gangaramaya',
        image: colomboGangaramayaImg,
        title: 'Seema Malaka of Gangaramaya Temple at Dusk',
        location: 'Beira Lake, Colombo 02',
        description:
          'Floating Kandyan-roofed timber pavilions glowing with golden lanterns over calm Beira Lake waters, framed by serene bronze Buddha statues and Colombo’s modern skyline reflections.',
      },
    ],
    videoTitle: 'Colombo City 4K Skyline, Masjid & Lakefront Cinema Reel',
    videoDurationSec: 27,
    videoDurationLabel: '00:27 · 4K HDR Reel',
    videoResolution: '4K · 60 FPS · Multi-Landmark City Cut',
    videoDescription:
      'Transitions smoothly across three signature Colombo visuals: starting over the glowing Lotus Tower and Galle Face shoreline, sweeping through the red-and-white domes of Pettah’s Jami Ul-Alfar Mosque (Masjid), and finishing at the lantern-lit Seema Malaka Buddhist Temple on Beira Lake.',
    highlights: [
      'Lotus Tower Observation Deck (350 m)',
      'Jami Ul-Alfar Red Mosque (Masjid) · Pettah',
      'Gangaramaya Temple & Seema Malaka · Beira Lake',
      'Galle Face Green Sunset & Colombo Port City',
    ],
    travelTip:
      'Walk Colombo Fort, Pettah’s Red Mosque, Galle Face Green, and Beira Lake Seema Malaka along one scenic 4 km urban heritage trail.',
    marketplaceCategory: 'Holiday Homes',
    marketplaceKeyword: 'Colombo',
    marketplaceLabel: 'Explore Stays & Rentals in Colombo',
    icon: Building2,
    accentGradient: 'from-cyan-500 to-blue-600',
    scenes: [
      {
        id: 'colombo-1',
        image: colomboCityImg,
        timecode: '00:00 – 00:09',
        title: 'Scene 01 · Lotus Tower & Galle Face Promenade',
        caption:
          'Aerial push-in across Beira Lake reflections toward the petal-crowned Colombo Lotus Tower and glowing Galle Face coastline.',
        cameraMove: 'Drone Push-In · Twilight 4K',
        transformStart: 'scale(1.0) translate(0%, 0%)',
        transformEnd: 'scale(1.12) translate(-2%, -1%)',
        filterClass: 'brightness-100 contrast-105',
      },
      {
        id: 'colombo-2',
        image: colomboRedMosqueImg,
        timecode: '00:09 – 00:18',
        title: 'Scene 02 · Jami Ul-Alfar Mosque (Red Masjid)',
        caption:
          'Architectural sweep across Pettah’s iconic red-and-white striped minarets, arches, and bustling streetscape.',
        cameraMove: 'Pettah Heritage Tilt Up',
        transformStart: 'scale(1.12) translate(2%, 1%)',
        transformEnd: 'scale(1.04) translate(-2%, -2%)',
        filterClass: 'brightness-105 saturate-110',
      },
      {
        id: 'colombo-3',
        image: colomboGangaramayaImg,
        timecode: '00:18 – 00:27',
        title: 'Scene 03 · Gangaramaya Seema Malaka Sanctuary',
        caption:
          'Gliding across golden Beira Lake lantern reflections past floating pavilions with the illuminated city rising behind.',
        cameraMove: 'Slow Waterline Glide',
        transformStart: 'scale(1.05) translate(-2%, 1%)',
        transformEnd: 'scale(1.15) translate(2%, -1%)',
        filterClass: 'brightness-100 saturate-115',
      },
    ],
  },
  {
    id: 'nature',
    title: 'Nature',
    tagline: 'Tea Highlands, Wild Elephant Safaris & Rainforest Waterfalls',
    region: 'Ella · Nuwara Eliya · Yala · Udawalawe · Sinharaja',
    coordinates: '6.8768° N, 81.0608° E',
    bestMonths: 'January – May · Cool Mornings & Clear Safaris',
    altitudeOrCoast: 'Tropical Rainforest to 2,524 m Peaks',
    gallery: [
      {
        id: 'nat-ella',
        image: natureHighlandsImg,
        title: 'Ella Nine Arch Bridge, Blue Train & Ceylon Tea Trails',
        location: 'Demodara – Ella, Uva Highlands',
        description:
          'Panoramic hill-country capture showing the nine-arch stone railway viaduct as a classic blue highland train crosses above emerald terraced tea gardens shrouded in morning mountain mist.',
      },
      {
        id: 'nat-safari',
        image: natureElephantsImg,
        title: 'Wild Asian Elephant Herds · Udawalawe & Yala Safaris',
        location: 'Udawalawe & Yala National Parks',
        description:
          'Golden-hour wildlife scene showcasing a wild family herd of Sri Lankan elephants strolling along a shimmering reservoir lake beneath misty southern mountain ranges.',
      },
      {
        id: 'nat-waterfall',
        image: natureWaterfallImg,
        title: 'Sinharaja Tropical Rainforest & Highland Waterfalls',
        location: 'Sinharaja UNESCO Reserve & Bambarakanda Falls',
        description:
          'Lush ancient rainforest canopy framing a roaring multi-tiered silver waterfall plunging down moss-covered granite cliffs into a crystal emerald jungle lagoon.',
      },
    ],
    videoTitle: 'Hill Country Train, Elephants & Waterfall Wilderness Reel',
    videoDurationSec: 27,
    videoDurationLabel: '00:27 · 4K Nature Reel',
    videoResolution: '4K · 60 FPS · Highlands, Wildlife & Rainforest',
    videoDescription:
      'Follows three breathtaking Sri Lankan nature ecosystems: opening over the Ella Nine Arch railway viaduct and misty tea valleys, descending to golden-hour elephant herds along Udawalawe & Yala lakeshores, and soaring above cascading Sinharaja rainforest waterfalls.',
    highlights: [
      'Ella Nine Arch Bridge & Horton Plains World’s End',
      'Yala (Leopards) & Udawalawe (Elephants) Safaris',
      'Sinharaja UNESCO Primary Rainforest',
      'Bambarakanda, Diyaluma & Ravana Waterfalls',
    ],
    travelTip:
      'Book an early 5:45 AM jeep safari in Yala or Udawalawe before temperatures rise, then ride the scenic Kandy–Ella train through the tea estates.',
    marketplaceCategory: 'Holiday Homes',
    marketplaceKeyword: 'Ella',
    marketplaceLabel: 'Browse Eco Lodges & Tea Villas',
    icon: Trees,
    accentGradient: 'from-emerald-500 to-teal-600',
    scenes: [
      {
        id: 'nature-1',
        image: natureHighlandsImg,
        timecode: '00:00 – 00:09',
        title: 'Scene 01 · Dawn Mist Over Nine Arch Viaduct',
        caption:
          'Low clouds drift across Ella’s emerald tea slopes as the blue hill-country train emerges over the century-old stone arches.',
        cameraMove: 'Valley Crane Rise · Slow Motion',
        transformStart: 'scale(1.02) translate(1%, 1%)',
        transformEnd: 'scale(1.14) translate(-2%, -2%)',
        filterClass: 'brightness-100 saturate-110',
      },
      {
        id: 'nature-2',
        image: natureElephantsImg,
        timecode: '00:09 – 00:18',
        title: 'Scene 02 · Wild Elephant Herd at Sunset Lake',
        caption:
          'Golden savanna sunlight highlights wild Sri Lankan elephants walking beside tranquil reservoir waters in southern national parks.',
        cameraMove: 'Lakeshore Safari Tracking Shot',
        transformStart: 'scale(1.13) translate(-2%, 0%)',
        transformEnd: 'scale(1.05) translate(2%, -1%)',
        filterClass: 'brightness-105 contrast-105',
      },
      {
        id: 'nature-3',
        image: natureWaterfallImg,
        timecode: '00:18 – 00:27',
        title: 'Scene 03 · Rainforest Waterfall & Mist Canopy',
        caption:
          'Soaring through sunlight beams over dense ferns, wooden jungle lookouts, and emerald pools fed by highland cascades.',
        cameraMove: 'Canopy Drone Flyover',
        transformStart: 'scale(1.04) translate(2%, -1%)',
        transformEnd: 'scale(1.16) translate(-1%, 1%)',
        filterClass: 'brightness-100 saturate-115',
      },
    ],
  },
  {
    id: 'beaches',
    title: 'Beaches',
    tagline: 'Palm Crescent Bays, Galle Fort Coast & Pigeon Island Coral',
    region: 'Mirissa · Unawatuna · Galle · Nilaveli · Arugam Bay',
    coordinates: '5.9483° N, 80.4716° E',
    bestMonths: 'Nov – Apr (South/West) · May – Sep (East)',
    altitudeOrCoast: '1,340 km Dual-Monsoon Coastline',
    gallery: [
      {
        id: 'bch-mirissa',
        image: beachesCoastImg,
        title: 'Mirissa Coconut Tree Hill & Crescent Bay',
        location: 'Mirissa & Weligama Bay, South Coast',
        description:
          'Golden-hour coastal aerial frame showcasing Sri Lanka’s palm-crowned headland overlooking clear turquoise surf, sandy bays, reefs, and colorful wooden outrigger fishing boats.',
      },
      {
        id: 'bch-galle',
        image: beachesGalleFortImg,
        title: 'Galle Fort Coastal Lighthouse & Sunset Ramparts',
        location: 'Old Town of Galle Fort, Southern Province',
        description:
          'Warm sunset glow behind the crisp white Galle Lighthouse flanked by swaying palms and historic sea ramparts overlooking foamy turquoise Indian Ocean swells.',
      },
      {
        id: 'bch-nilaveli',
        image: beachesNilaveliImg,
        title: 'Nilaveli & Pigeon Island Coral Reef Sanctuary',
        location: 'Trincomalee, East Coast',
        description:
          'Overhead turquoise panorama showing bright white sands, crystalline snorkeling lagoons teeming with shallow reef corals, and traditional sailboats moored beside Pigeon Island.',
      },
    ],
    videoTitle: 'From Mirissa Palms & Galle Lighthouse to East Coast Reefs',
    videoDurationSec: 27,
    videoDurationLabel: '00:27 · 4K Ocean Reel',
    videoResolution: '4K · 60 FPS · South + East Monsoon Coast',
    videoDescription:
      'Cruises across Sri Lanka’s finest shorelines: opening above Mirissa’s Coconut Tree Hill palms and fishing boats, passing golden sunset surf beneath Galle Fort’s Lighthouse, and finishing over the turquoise snorkeling reefs of Nilaveli & Pigeon Island.',
    highlights: [
      'Mirissa Whale Watching & Coconut Tree Hill',
      'Galle Dutch Fort Lighthouse Coast & Meeran Mosque',
      'Nilaveli & Pigeon Island Coral Reef Snorkeling',
      'Arugam Bay Surf Point & Pasikudah Bay',
    ],
    travelTip:
      'Dual monsoons mean beach season never stops: South/West beaches peak Nov–Apr, while East Coast beaches like Nilaveli & Arugam Bay shine May–Sep.',
    marketplaceCategory: 'Cars for Rent',
    marketplaceKeyword: 'Galle',
    marketplaceLabel: 'Find Coastal Rides & Beach Trips',
    icon: Waves,
    accentGradient: 'from-sky-500 to-indigo-600',
    scenes: [
      {
        id: 'beaches-1',
        image: beachesCoastImg,
        timecode: '00:00 – 00:09',
        title: 'Scene 01 · Mirissa Coconut Tree Hill Bay',
        caption:
          'Skimming over iconic cliffside palms as rolling amber sunset swells trace crescent golden beaches.',
        cameraMove: 'Shoreline Gimbal Sweep',
        transformStart: 'scale(1.0) translate(0%, 2%)',
        transformEnd: 'scale(1.13) translate(-2%, -2%)',
        filterClass: 'brightness-105 saturate-115',
      },
      {
        id: 'beaches-2',
        image: beachesGalleFortImg,
        timecode: '00:09 – 00:18',
        title: 'Scene 02 · Galle Fort Lighthouse & Coral Shore',
        caption:
          'Warm coastal light washes over ancient stone sea walls, coconut silhouettes, and lapping Indian Ocean waves.',
        cameraMove: 'Rampart Orbit Pan',
        transformStart: 'scale(1.13) translate(2%, -1%)',
        transformEnd: 'scale(1.05) translate(-2%, 2%)',
        filterClass: 'brightness-105 contrast-105',
      },
      {
        id: 'beaches-3',
        image: beachesNilaveliImg,
        timecode: '00:18 – 00:27',
        title: 'Scene 03 · Nilaveli & Pigeon Island Reef Lagoon',
        caption:
          'Top-down tropical azure water revealing living coral beds, white coral sandbars, and drifting outrigger sails.',
        cameraMove: 'East Coast Coral Aerial',
        transformStart: 'scale(1.04) translate(-2%, 0%)',
        transformEnd: 'scale(1.15) translate(1%, -2%)',
        filterClass: 'brightness-100 saturate-120',
      },
    ],
  },
  {
    id: 'heritage',
    title: 'Heritage',
    tagline: 'Ancient Rock Citadels, Sacred Temples, Kovils & UNESCO Sites',
    region: 'Sigiriya · Kandy · Anuradhapura · Trincomalee · Galle',
    coordinates: '7.9570° N, 80.7603° E',
    bestMonths: 'January – September · Cultural Triangle',
    altitudeOrCoast: '8 UNESCO World Heritage Sites',
    gallery: [
      {
        id: 'her-sigiriya',
        image: heritageSigiriyaImg,
        title: 'Sigiriya Lion Rock Fortress (5th Century Citadel)',
        location: 'Matale District, Cultural Triangle',
        description:
          'Golden-hour photograph of Sigiriya, the 200-meter volcanic granite citadel rising out of green jungle plains, clearly revealing King Kashyapa’s symmetrical hydraulic water gardens and royal summit ruins.',
      },
      {
        id: 'her-kandy',
        image: heritageKandyTempleImg,
        title: 'Sri Dalada Maligawa · Temple of the Sacred Tooth Relic',
        location: 'Kandy Lakefront, Central Province',
        description:
          'Twilight frame of Sri Lanka’s most venerated Buddhist sanctuary reflected cleanly in tranquil Kandy Lake, highlighting the golden pavilion roof and white octagonal Patthirippuwa tower.',
      },
      {
        id: 'her-kovil',
        image: heritageHinduKovilImg,
        title: 'Thirukoneswaram Clifftop Kovil · Coastal Sacred Temple',
        location: 'Swami Rock, Trincomalee',
        description:
          'Intricately sculpted colorful Dravidian gopuram tower crowned against clear coastal skies high atop dramatic ocean cliffs overlooking deep turquoise bays.',
      },
    ],
    videoTitle: 'Ancient Citadels, Kandy Tooth Temple & Coastal Kovils Reel',
    videoDurationSec: 27,
    videoDurationLabel: '00:27 · 4K Heritage Reel',
    videoResolution: '4K · 60 FPS · Sacred & Ancient Sri Lanka',
    videoDescription:
      'Explores 2,500+ years of living island civilization: flying toward Sigiriya’s ancient sky palace and water gardens, gliding across twilight lantern reflections of Kandy’s Temple of the Sacred Tooth Relic, and rising above Trincomalee’s coastal Hindu Kovil on Swami Rock.',
    highlights: [
      'Sigiriya Lion Rock & Dambulla Cave Temple',
      'Sri Dalada Maligawa (Temple of the Tooth) · Kandy',
      'Thirukoneswaram Kovil & Nallur Kovil · Jaffna',
      'Jami Ul-Alfar Red Masjid · Meeran & Ketchimalai Mosques',
    ],
    travelTip:
      'Climb Sigiriya at 6:30 AM before midday warmth, and carry a light scarf or sarong for respectful access to Sri Lanka’s Mosques, Buddhist Temples, and Hindu Kovils.',
    marketplaceCategory: 'Property',
    marketplaceKeyword: 'Kandy',
    marketplaceLabel: 'Explore Heritage Towns & Estates',
    icon: Landmark,
    accentGradient: 'from-amber-500 to-orange-600',
    scenes: [
      {
        id: 'heritage-1',
        image: heritageSigiriyaImg,
        timecode: '00:00 – 00:09',
        title: 'Scene 01 · Sigiriya Water Gardens & Lion Rock',
        caption:
          'Approaching King Kashyapa’s symmetrical 5th-century moats and royal granite fortress bathed in morning light.',
        cameraMove: 'Symmetrical Citadel Reveal',
        transformStart: 'scale(1.0) translate(0%, 1%)',
        transformEnd: 'scale(1.13) translate(0%, -2%)',
        filterClass: 'brightness-100 saturate-110',
      },
      {
        id: 'heritage-2',
        image: heritageKandyTempleImg,
        timecode: '00:09 – 00:18',
        title: 'Scene 02 · Sri Dalada Maligawa at Twilight',
        caption:
          'Mirror-like evening reflection across Kandy Lake capturing the illuminated golden Sacred Tooth sanctuary.',
        cameraMove: 'Lakeside Ceremonial Glide',
        transformStart: 'scale(1.13) translate(-2%, 1%)',
        transformEnd: 'scale(1.05) translate(2%, -1%)',
        filterClass: 'brightness-105 contrast-105',
      },
      {
        id: 'heritage-3',
        image: heritageHinduKovilImg,
        timecode: '00:18 – 00:27',
        title: 'Scene 03 · Thirukoneswaram Clifftop Kovil',
        caption:
          'Sweeping coastal reveal around sacred Dravidian gopuram carvings perched above dramatic Indian Ocean cliffs.',
        cameraMove: 'Ocean Cliff Orbital Rise',
        transformStart: 'scale(1.05) translate(2%, 0%)',
        transformEnd: 'scale(1.15) translate(-2%, -1%)',
        filterClass: 'brightness-100 saturate-115',
      },
    ],
  },
];

type DossierTab = 'overview' | 'seasons' | 'culture' | 'essentials';
type SacredFilter = 'all' | 'mosque' | 'buddhist' | 'hindu' | 'church';

interface VisitSriLankaSectionProps {
  onSelectCategory?: (category: string, searchKeyword?: string) => void;
  onToast?: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const VisitSriLankaSection: React.FC<VisitSriLankaSectionProps> = ({
  onSelectCategory,
  onToast,
}) => {
  const [activeChapterId, setActiveChapterId] = useState<SriLankaChapterId>('colombo');
  const [activePhotoIndex, setActivePhotoIndex] = useState<number>(0);
  const [mediaMode, setMediaMode] = useState<'both' | 'image' | 'video'>('both');
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [playbackSec, setPlaybackSec] = useState<number>(0);
  const [isCinemaOpen, setIsCinemaOpen] = useState<boolean>(false);
  const [dossierTab, setDossierTab] = useState<DossierTab>('overview');
  const [sacredFilter, setSacredFilter] = useState<SacredFilter>('all');

  const activeChapter =
    SRI_LANKA_CHAPTERS.find((c) => c.id === activeChapterId) || SRI_LANKA_CHAPTERS[0];

  const activePhoto =
    activeChapter.gallery[activePhotoIndex] || activeChapter.gallery[0];

  const filteredSacredSites = SACRED_LANDMARKS.filter(
    (s) => sacredFilter === 'all' || s.faith === sacredFilter
  );

  // Auto-advance video timeline when playing
  useEffect(() => {
    if (!isPlaying) return;
    const timer = window.setInterval(() => {
      setPlaybackSec((prev) => {
        const next = prev + 0.25;
        return next >= activeChapter.videoDurationSec ? 0 : next;
      });
    }, 250);
    return () => window.clearInterval(timer);
  }, [isPlaying, activeChapter.videoDurationSec]);

  // Determine current scene frame (0..2) from playbackSec
  const sceneDuration = activeChapter.videoDurationSec / activeChapter.scenes.length;
  const activeSceneIndex = Math.min(
    activeChapter.scenes.length - 1,
    Math.floor(playbackSec / sceneDuration)
  );
  const activeScene = activeChapter.scenes[activeSceneIndex];
  const progressPercent = Math.min(
    100,
    Math.round((playbackSec / activeChapter.videoDurationSec) * 100)
  );

  const handleSelectChapter = (id: SriLankaChapterId) => {
    setActiveChapterId(id);
    setActivePhotoIndex(0);
    setPlaybackSec(0);
    setIsPlaying(true);
  };

  const handleCyclePhoto = (delta: number) => {
    const count = activeChapter.gallery.length;
    setActivePhotoIndex((prev) => (prev + delta + count) % count);
  };

  const formatTimer = (sec: number) => {
    const whole = Math.floor(sec);
    const mins = Math.floor(whole / 60)
      .toString()
      .padStart(2, '0');
    const secs = (whole % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  const handleExploreMarketplace = (chapter: SriLankaChapter) => {
    if (onToast) {
      onToast(`Opening ${chapter.marketplaceCategory} near ${chapter.title}`, 'info');
    }
    if (onSelectCategory) {
      onSelectCategory(chapter.marketplaceCategory, chapter.marketplaceKeyword);
    }
  };

  return (
    <section
      id="visit-sri-lanka-section"
      className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 mt-6 sm:mt-8"
      aria-label="Visit Sri Lanka Island Guide"
    >
      <div className="bg-white dark:bg-[#11141D] rounded-2xl sm:rounded-3xl shadow-xl border border-gray-200/80 dark:border-slate-800 overflow-hidden transition-colors">
        {/* Top Modern Tech Header Banner */}
        <div className="relative bg-gradient-to-br from-[#070B14] via-[#0E1628] to-[#081C24] text-white px-4 py-5 sm:px-8 sm:py-7 border-b border-white/10 overflow-hidden">
          <div className="absolute -top-20 -right-12 w-80 h-80 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 left-12 w-72 h-72 bg-[#FF5A36]/15 rounded-full blur-3xl pointer-events-none" />
          <div
            className="absolute inset-0 opacity-[0.07] pointer-events-none"
            style={{
              backgroundImage:
                'radial-gradient(circle at 1px 1px, rgba(56,189,248,0.8) 1px, transparent 0)',
              backgroundSize: '24px 24px',
            }}
          />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-start sm:items-center gap-4 sm:gap-5">
              <div className="relative shrink-0 group">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border border-cyan-400/40 shadow-[0_0_30px_rgba(34,211,238,0.28)] bg-slate-900">
                  <img
                    src={visitSriLankaIcon}
                    alt="Visit Sri Lanka Modern Tech Icon"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <span
                  className="absolute -bottom-1.5 -right-1.5 inline-flex items-center justify-center w-6 h-6 rounded-lg bg-[#FF5A36] text-white shadow-md border border-slate-900"
                  title="Interactive Island Explorer"
                >
                  <Compass className="w-3.5 h-3.5" />
                </span>
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold tracking-wider uppercase text-cyan-300">
                  <span className="inline-flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#FF5A36]" />
                    <span>HUTA IN · 12 Photos + 4K Reels</span>
                  </span>
                  <span className="text-slate-500">·</span>
                  <span className="font-mono text-slate-300 tabular-nums">7.8731° N, 80.7718° E</span>
                </div>

                <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-white mt-1">
                  Visit Sri Lanka
                </h2>
                <p className="text-sm sm:text-base text-slate-300 font-medium mt-1">
                  Explore the island from Colombo to the coast
                </p>
              </div>
            </div>

            {/* Right Interactive Media Display Mode Switch */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <div className="inline-flex items-center bg-white/5 border border-white/10 p-1 rounded-xl backdrop-blur-md">
                <button
                  type="button"
                  onClick={() => setMediaMode('both')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    mediaMode === 'both'
                      ? 'bg-[#FF5A36] text-white shadow-sm'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Photo + Video</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMediaMode('image')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    mediaMode === 'image'
                      ? 'bg-cyan-500 text-slate-950 shadow-sm'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Gallery</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMediaMode('video')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    mediaMode === 'video'
                      ? 'bg-emerald-500 text-slate-950 shadow-sm'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>Video Tour</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setIsCinemaOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-bold text-white whitespace-nowrap transition-all cursor-pointer"
              >
                <Maximize2 className="w-3.5 h-3.5 text-cyan-300" />
                <span>Theater Mode</span>
              </button>
            </div>
          </div>

          {/* 4 Chapter Selector Cards: Colombo City · Nature · Beaches · Heritage */}
          <div className="relative z-10 grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6">
            {SRI_LANKA_CHAPTERS.map((chapter) => {
              const Icon = chapter.icon;
              const isActive = chapter.id === activeChapterId;
              return (
                <button
                  key={chapter.id}
                  type="button"
                  id={`visit-sl-tab-${chapter.id}`}
                  onClick={() => handleSelectChapter(chapter.id)}
                  className={`group text-left rounded-2xl p-3 sm:p-3.5 border transition-all cursor-pointer flex items-center gap-3 ${
                    isActive
                      ? 'bg-white text-slate-900 border-white shadow-lg shadow-cyan-500/15'
                      : 'bg-white/5 hover:bg-white/10 text-white border-white/10'
                  }`}
                >
                  <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 relative bg-slate-800">
                    <img
                      src={chapter.gallery[0].image}
                      alt={chapter.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <Icon
                      className={`w-3.5 h-3.5 absolute bottom-1 right-1 ${
                        isActive ? 'text-white' : 'text-cyan-300'
                      }`}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-extrabold text-sm sm:text-base truncate">
                        {chapter.title}
                      </span>
                      <ChevronRight
                        className={`w-4 h-4 shrink-0 transition-transform ${
                          isActive
                            ? 'text-[#FF5A36] translate-x-0.5'
                            : 'text-slate-400 group-hover:translate-x-0.5'
                        }`}
                      />
                    </div>
                    <p
                      className={`text-[11px] truncate mt-0.5 ${
                        isActive ? 'text-slate-600 font-semibold' : 'text-slate-400'
                      }`}
                    >
                      {chapter.gallery.length} Photos · Video Reel
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Active Chapter Showcase: Multi-Photo Gallery & Multi-Scene Video Tour */}
        <div className="p-4 sm:p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-gray-100 dark:border-slate-800">
            <div>
              <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-gray-500 dark:text-slate-400">
                <span className="inline-flex items-center gap-1 text-[#FF5A36]">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{activeChapter.region}</span>
                </span>
                <span>·</span>
                <span className="font-mono tabular-nums">{activeChapter.coordinates}</span>
                <span>·</span>
                <span>{activeChapter.altitudeOrCoast}</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight mt-1">
                {activeChapter.title} — {activeChapter.tagline}
              </h3>
            </div>

            <button
              type="button"
              onClick={() => handleExploreMarketplace(activeChapter)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gray-900 dark:bg-white hover:bg-[#FF5A36] dark:hover:bg-[#FF5A36] text-white dark:text-slate-900 dark:hover:text-white text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer self-start md:self-auto"
            >
              <span>{activeChapter.marketplaceLabel}</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>

          {/* Interactive Media Split Grid */}
          <div
            className={`mt-6 grid gap-6 ${
              mediaMode === 'both' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'
            }`}
          >
            {/* LEFT PANEL: Multi-Photo Gallery + Image Description */}
            {(mediaMode === 'both' || mediaMode === 'image') && (
              <div className="rounded-2xl border border-gray-200 dark:border-slate-800 bg-gray-50/70 dark:bg-[#171B26] overflow-hidden flex flex-col">
                <div className="relative aspect-[16/9] w-full bg-slate-900 overflow-hidden group">
                  <img
                    src={activePhoto.image}
                    alt={activePhoto.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />

                  <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950/75 backdrop-blur-md text-white text-[11px] font-bold border border-white/15">
                    <Camera className="w-3.5 h-3.5 text-cyan-400" />
                    <span>
                      Photo {activePhotoIndex + 1} of {activeChapter.gallery.length}
                    </span>
                  </div>

                  {/* Previous / Next Photo Switcher */}
                  <div className="absolute top-3 right-3 flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleCyclePhoto(-1)}
                      aria-label="Previous photo"
                      className="w-7 h-7 rounded-lg bg-slate-950/70 hover:bg-slate-950 text-white flex items-center justify-center border border-white/15 cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCyclePhoto(1)}
                      aria-label="Next photo"
                      className="w-7 h-7 rounded-lg bg-slate-950/70 hover:bg-slate-950 text-white flex items-center justify-center border border-white/15 cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="absolute bottom-3 left-3 right-3 text-white">
                    <div className="text-[11px] font-semibold text-cyan-300 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      <span>{activePhoto.location}</span>
                    </div>
                    <p className="text-xs sm:text-sm font-extrabold leading-snug mt-0.5">
                      {activePhoto.title}
                    </p>
                  </div>
                </div>

                {/* 3 Thumbnail Strip inside Gallery */}
                <div className="px-4 pt-3.5 grid grid-cols-3 gap-2">
                  {activeChapter.gallery.map((photo, idx) => {
                    const selected = idx === activePhotoIndex;
                    return (
                      <button
                        key={photo.id}
                        type="button"
                        onClick={() => setActivePhotoIndex(idx)}
                        className={`relative rounded-xl overflow-hidden aspect-[16/9] border-2 transition-all cursor-pointer group ${
                          selected
                            ? 'border-[#FF5A36] ring-2 ring-[#FF5A36]/25'
                            : 'border-transparent opacity-75 hover:opacity-100'
                        }`}
                      >
                        <img
                          src={photo.image}
                          alt={photo.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
                        <span className="absolute bottom-1 left-1.5 right-1.5 text-[10px] font-bold text-white truncate text-left">
                          {photo.location.split(',')[0]}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Image Description Copy */}
                <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-cyan-700 dark:text-cyan-400">
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>Image Description · {activePhoto.location}</span>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-700 dark:text-slate-300 leading-relaxed mt-1.5">
                      {activePhoto.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-gray-200/80 dark:border-slate-800">
                    <div className="text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                      Key {activeChapter.title} Highlights
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {activeChapter.highlights.map((item) => (
                        <div
                          key={item}
                          className="flex items-center gap-1.5 text-xs font-semibold text-gray-800 dark:text-slate-200"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-[#FF5A36] shrink-0" />
                          <span className="truncate">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* RIGHT PANEL: Modern Interactive Multi-Scene Video Tour + Video Description */}
            {(mediaMode === 'both' || mediaMode === 'video') && (
              <div className="rounded-2xl border border-gray-200 dark:border-slate-800 bg-[#0B0F19] text-white overflow-hidden flex flex-col shadow-lg">
                <div className="relative aspect-[4/3] sm:aspect-[16/9] w-full bg-black overflow-hidden">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={`${activeChapter.id}-${activeScene.id}`}
                      initial={{ opacity: 0.45 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0.45 }}
                      transition={{ duration: 0.45 }}
                      className="absolute inset-0"
                    >
                      <motion.img
                        src={activeScene.image}
                        alt={`${activeChapter.title} — ${activeScene.title}`}
                        referrerPolicy="no-referrer"
                        initial={{ transform: activeScene.transformStart }}
                        animate={{
                          transform: isPlaying
                            ? activeScene.transformEnd
                            : activeScene.transformStart,
                        }}
                        transition={{ duration: sceneDuration, ease: 'linear' }}
                        className={`w-full h-full object-cover ${activeScene.filterClass}`}
                      />
                    </motion.div>
                  </AnimatePresence>

                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/55 pointer-events-none" />

                  <div className="absolute top-2.5 left-2.5 right-2.5 sm:top-3 sm:left-3 sm:right-3 flex items-center justify-between gap-2">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md text-[10px] sm:text-[11px] font-bold border border-white/15">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          isPlaying ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                        }`}
                      />
                      <Film className="w-3.5 h-3.5 text-[#FF5A36]" />
                      <span>{activeChapter.videoDurationLabel}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsCinemaOpen(true)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-black/70 hover:bg-black/90 backdrop-blur-md text-[10px] sm:text-[11px] font-bold border border-white/15 transition-colors cursor-pointer"
                    >
                      <Maximize2 className="w-3 h-3 text-cyan-300" />
                      <span>Fullscreen</span>
                    </button>
                  </div>

                  {/* Synchronized Video Scene Subtitles */}
                  <div className="absolute bottom-12 sm:bottom-14 left-3 right-3 pointer-events-none">
                    <div className="inline-block px-2 py-0.5 rounded bg-black/65 text-[10px] font-mono text-cyan-300 mb-1">
                      {activeScene.timecode} · {activeScene.cameraMove}
                    </div>
                    <h4 className="text-xs sm:text-sm font-black text-white">
                      {activeScene.title}
                    </h4>
                    <p className="hidden sm:block text-xs text-slate-200 line-clamp-2 mt-0.5 leading-snug">
                      {activeScene.caption}
                    </p>
                  </div>

                  {/* Video Transport Controls */}
                  <div className="absolute bottom-0 inset-x-0 px-3 py-2.5 bg-gradient-to-t from-black via-black/90 to-transparent flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setIsPlaying((p) => !p)}
                      aria-label={isPlaying ? 'Pause Video Tour' : 'Play Video Tour'}
                      className="w-8 h-8 rounded-full bg-[#FF5A36] hover:bg-[#e84b28] text-white flex items-center justify-center shrink-0 transition-colors cursor-pointer"
                    >
                      {isPlaying ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4 ml-0.5" />
                      )}
                    </button>

                    <div className="flex-1 flex flex-col gap-1">
                      <input
                        type="range"
                        min={0}
                        max={activeChapter.videoDurationSec}
                        step={0.25}
                        value={playbackSec}
                        onChange={(e) => setPlaybackSec(Number(e.target.value))}
                        aria-label="Video tour timeline"
                        className="w-full accent-[#FF5A36] h-1.5 rounded-lg cursor-pointer"
                      />
                    </div>

                    <span className="text-[11px] font-mono tabular-nums text-slate-300 shrink-0">
                      {formatTimer(playbackSec)} / {formatTimer(activeChapter.videoDurationSec)}
                    </span>

                    <button
                      type="button"
                      onClick={() => {
                        setPlaybackSec(0);
                        setIsPlaying(true);
                      }}
                      title="Restart Reel"
                      className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Video Description & Chapter Scene Jumpers */}
                <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-[#FF5A36]">
                        <Video className="w-3.5 h-3.5" />
                        <span>Video Tour & Visual Description</span>
                      </div>
                      <span className="text-[11px] font-mono text-slate-400">
                        {activeChapter.videoResolution}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mt-1.5">
                      {activeChapter.videoDescription}
                    </p>
                  </div>

                  {/* Scene Jump Chips */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-3 border-t border-white/10">
                    {activeChapter.scenes.map((scene, idx) => {
                      const isCurrent = idx === activeSceneIndex;
                      return (
                        <button
                          key={scene.id}
                          type="button"
                          onClick={() => {
                            setPlaybackSec(idx * sceneDuration + 0.1);
                            setIsPlaying(true);
                          }}
                          className={`text-left p-2 rounded-xl border transition-all cursor-pointer ${
                            isCurrent
                              ? 'bg-white/15 border-cyan-400/60 text-white'
                              : 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-400'
                          }`}
                        >
                          <div className="text-[10px] font-mono text-cyan-300">
                            Scene 0{idx + 1}
                          </div>
                          <div className="text-[11px] font-bold truncate mt-0.5 text-white">
                            {scene.title.replace(/^Scene 0\d · /, '')}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Overview Strip of All 4 Chapters (Colombo City · Nature · Beaches · Heritage) */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {SRI_LANKA_CHAPTERS.map((ch) => {
              const isSelected = ch.id === activeChapterId;
              const Icon = ch.icon;
              return (
                <div
                  key={`summary-${ch.id}`}
                  onClick={() => handleSelectChapter(ch.id)}
                  className={`rounded-2xl p-3.5 border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-[#FF5A36] bg-orange-50/50 dark:bg-[#FF5A36]/10 shadow-sm'
                      : 'border-gray-200 dark:border-slate-800 bg-white dark:bg-[#171B26] hover:border-gray-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-7 h-7 rounded-lg bg-gradient-to-br ${ch.accentGradient} text-white flex items-center justify-center shrink-0`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <h4 className="font-extrabold text-sm text-gray-900 dark:text-white">
                        {ch.title}
                      </h4>
                    </div>
                    <span className="text-[10px] font-bold text-gray-500 dark:text-slate-400 tabular-nums">
                      {progressPercent > 0 && isSelected ? `${progressPercent}%` : `${ch.gallery.length} Photos`}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-slate-400 line-clamp-2 mt-2 leading-relaxed">
                    {ch.gallery[0].description}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Sacred Sri Lanka: Famous Masjids (Mosques), Buddhist Temples, Kovils & Shrines */}
          <div className="mt-8 rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-[#151A25] p-5 sm:p-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-gray-100 dark:border-slate-800">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-[#FF5A36]">
                  <Landmark className="w-3.5 h-3.5" />
                  <span>Sacred Landmarks Across the Island</span>
                </div>
                <h3 className="text-lg sm:text-xl font-black text-gray-900 dark:text-white tracking-tight mt-0.5">
                  Famous Masjids (Mosques), Temples, Kovils & Shrines
                </h3>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                  Explore Sri Lanka’s most revered places of worship from Colombo & Beruwala to Kandy, Trincomalee, and Jaffna.
                </p>
              </div>

              <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-[#0D1119] p-1 rounded-xl overflow-x-auto scrollbar-none">
                {[
                  { id: 'all', label: 'All Sites' },
                  { id: 'mosque', label: 'Masjids / Mosques' },
                  { id: 'buddhist', label: 'Buddhist Temples' },
                  { id: 'hindu', label: 'Hindu Kovils' },
                  { id: 'church', label: 'Shrines & Heritage' },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setSacredFilter(f.id as SacredFilter)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                      sacredFilter === f.id
                        ? 'bg-gray-900 dark:bg-[#FF5A36] text-white'
                        : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSacredSites.map((site) => (
                <div
                  key={site.id}
                  className="rounded-2xl border border-gray-200/80 dark:border-slate-800 bg-gray-50/70 dark:bg-[#11151F] overflow-hidden flex flex-col group"
                >
                  <div className="relative aspect-[16/9] bg-slate-900 overflow-hidden">
                    <img
                      src={site.image}
                      alt={site.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
                    <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-md bg-black/75 backdrop-blur-md text-[10px] font-extrabold text-cyan-300 border border-white/10">
                      {site.faithLabel}
                    </span>
                    <div className="absolute bottom-2.5 left-3 right-3 text-white">
                      <h4 className="font-black text-sm leading-tight">{site.name}</h4>
                      <div className="flex items-center gap-1 text-[11px] text-slate-300 mt-0.5">
                        <MapPin className="w-3 h-3 text-[#FF5A36] shrink-0" />
                        <span className="truncate">{site.city}</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                    <div>
                      <div className="text-[11px] font-mono text-gray-500 dark:text-slate-400">
                        {site.era}
                      </div>
                      <p className="text-xs text-gray-700 dark:text-slate-300 leading-relaxed mt-1.5">
                        {site.description}
                      </p>
                    </div>
                    <div className="pt-2.5 border-t border-gray-200/70 dark:border-slate-800 text-[11px] text-gray-600 dark:text-slate-400">
                      <span className="font-bold text-gray-800 dark:text-slate-200">
                        Visitor Note:{' '}
                      </span>
                      {site.visitingTip}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* All About Sri Lanka — Modern Interactive Island Dossier */}
          <div className="mt-8 rounded-2xl border border-gray-200 dark:border-slate-800 bg-gray-50/80 dark:bg-[#0E131F] p-5 sm:p-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-gray-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl overflow-hidden border border-cyan-500/40 shrink-0">
                  <img
                    src={visitSriLankaIcon}
                    alt="All About Sri Lanka"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-black text-gray-900 dark:text-white tracking-tight">
                    All About Sri Lanka
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-slate-400">
                    The Pearl of the Indian Ocean · Geography, dual-monsoon weather, UNESCO heritage, cuisine & island travel facts
                  </p>
                </div>
              </div>

              {/* Dossier Tabs */}
              <div className="flex items-center gap-1.5 bg-white dark:bg-[#171B26] p-1 rounded-xl border border-gray-200 dark:border-slate-800 overflow-x-auto scrollbar-none">
                {[
                  { id: 'overview', label: 'Island Facts', icon: Globe },
                  { id: 'seasons', label: 'Best Seasons', icon: Sun },
                  { id: 'culture', label: 'Food & Heritage', icon: Utensils },
                  { id: 'essentials', label: 'Travel & Safety', icon: PhoneCall },
                ].map((tab) => {
                  const TabIcon = tab.icon;
                  const active = dossierTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setDossierTab(tab.id as DossierTab)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                        active
                          ? 'bg-gray-900 dark:bg-[#FF5A36] text-white'
                          : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
                      }`}
                    >
                      <TabIcon className="w-3.5 h-3.5" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {dossierTab === 'overview' && (
              <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: 'Total Land Area', value: '65,610 km²', sub: 'Teardrop Island' },
                    { label: 'Administrative Map', value: '9 Provinces', sub: '25 Districts' },
                    { label: 'UNESCO Treasures', value: '8 Sites', sub: '6 Cultural · 2 Natural' },
                    { label: 'Currency & Time', value: 'LKR (Rs.)', sub: 'UTC +5:30' },
                    { label: 'Commercial Capital', value: 'Colombo', sub: 'Sri Jayewardenepura Kotte (Official)' },
                    { label: 'Highest Peak', value: 'Pidurutalagala', sub: '2,524 meters' },
                    { label: 'Coastline Length', value: '1,340 km', sub: 'Indian Ocean Reefs' },
                    { label: 'Languages', value: 'Sinhala · Tamil', sub: 'English widely spoken' },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="rounded-xl bg-white dark:bg-[#171B26] border border-gray-200/80 dark:border-slate-800 p-3"
                    >
                      <div className="text-[11px] font-semibold text-gray-500 dark:text-slate-400">
                        {stat.label}
                      </div>
                      <div className="text-sm sm:text-base font-black text-gray-900 dark:text-white mt-0.5 tabular-nums">
                        {stat.value}
                      </div>
                      <div className="text-[11px] text-gray-500 dark:text-slate-400 truncate mt-0.5">
                        {stat.sub}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="rounded-xl bg-white dark:bg-[#171B26] border border-gray-200/80 dark:border-slate-800 p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-extrabold text-[#FF5A36] uppercase tracking-wider">
                      <Info className="w-3.5 h-3.5" />
                      <span>Why Sri Lanka Stands Out</span>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-700 dark:text-slate-300 leading-relaxed mt-2">
                      Few islands pack tropical beaches, 2,000-meter tea-covered mountains, misty rainforests, big-game safaris (elephants, leopards, blue whales), and ancient multi-faith sacred landmarks within a single scenic loop from Colombo.
                    </p>
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-100 dark:border-slate-800 text-[11px] font-semibold text-gray-500 dark:text-slate-400">
                    Tip · Combine Colombo + Sigiriya + Kandy/Ella + Mirissa or Trincomalee for a complete island journey.
                  </div>
                </div>
              </div>
            )}

            {dossierTab === 'seasons' && (
              <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-xl bg-white dark:bg-[#171B26] border border-gray-200 dark:border-slate-800 p-4">
                  <div className="text-xs font-extrabold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider">
                    November – April
                  </div>
                  <h4 className="font-black text-base text-gray-900 dark:text-white mt-1">
                    Colombo, West & South Coast Peak
                  </h4>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-slate-300 mt-1.5 leading-relaxed">
                    Dry, calm turquoise seas across Bentota, Hikkaduwa, Galle Fort, Unawatuna, and Mirissa. Peak season for blue whale watching and the Central Highlands (Kandy, Nuwara Eliya, Ella).
                  </p>
                </div>
                <div className="rounded-xl bg-white dark:bg-[#171B26] border border-gray-200 dark:border-slate-800 p-4">
                  <div className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                    May – September
                  </div>
                  <h4 className="font-black text-base text-gray-900 dark:text-white mt-1">
                    East Coast, Trincomalee & Arugam Bay
                  </h4>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-slate-300 mt-1.5 leading-relaxed">
                    Ideal weather on the East Coast for Pasikudah calm bays, Nilaveli & Pigeon Island snorkeling, Jaffna northern temples, and world-class surf swells at Arugam Bay.
                  </p>
                </div>
                <div className="rounded-xl bg-white dark:bg-[#171B26] border border-gray-200 dark:border-slate-800 p-4">
                  <div className="text-xs font-extrabold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                    Year-Round · Cultural Triangle
                  </div>
                  <h4 className="font-black text-base text-gray-900 dark:text-white mt-1">
                    Sigiriya, Minneriya & Festivals
                  </h4>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-slate-300 mt-1.5 leading-relaxed">
                    August features Kandy’s iconic Esala Perahera pageant and “The Gathering” of wild Asian elephants at Minneriya National Park.
                  </p>
                </div>
              </div>
            )}

            {dossierTab === 'culture' && (
              <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-xl bg-white dark:bg-[#171B26] border border-gray-200 dark:border-slate-800 p-4">
                  <h4 className="font-black text-base text-gray-900 dark:text-white">
                    8 UNESCO World Heritage Sites
                  </h4>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-slate-300 mt-1.5 leading-relaxed">
                    Polonnaruwa, Anuradhapura, Sigiriya Lion Rock, Sacred City of Kandy, Galle Fort, Dambulla Cave Temple, Sinharaja Forest Reserve, and Central Highlands.
                  </p>
                </div>
                <div className="rounded-xl bg-white dark:bg-[#171B26] border border-gray-200 dark:border-slate-800 p-4">
                  <h4 className="font-black text-base text-gray-900 dark:text-white">
                    Signature Sri Lankan Cuisine
                  </h4>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-slate-300 mt-1.5 leading-relaxed">
                    Rice & vibrant curries slow-cooked with Ceylon cinnamon and coconut milk; crisp egg hoppers, string hoppers, sizzling Kottu Roti, Jaffna crab curry, king coconut, and highland Ceylon Tea.
                  </p>
                </div>
                <div className="rounded-xl bg-white dark:bg-[#171B26] border border-gray-200 dark:border-slate-800 p-4">
                  <h4 className="font-black text-base text-gray-900 dark:text-white">
                    Gems, Spices & Living Crafts
                  </h4>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-slate-300 mt-1.5 leading-relaxed">
                    World-famous for Royal Blue Ceylon Sapphires (Ratnapura), Ambalangoda masks, Kandyan brassware, and Dumbara textiles across local markets.
                  </p>
                </div>
              </div>
            )}

            {dossierTab === 'essentials' && (
              <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-xl bg-white dark:bg-[#171B26] border border-gray-200 dark:border-slate-800 p-4">
                  <div className="flex items-center gap-2 font-black text-base text-gray-900 dark:text-white">
                    <Train className="w-4 h-4 text-[#FF5A36]" />
                    <span>Getting Around</span>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-slate-300 mt-1.5 leading-relaxed">
                    Expressways connect Colombo to Galle/Matara (1.5 hrs) and Kurunegala. Scenic railways serve Colombo–Kandy–Ella and Colombo–Galle alongside islandwide taxis and tuk-tuks.
                  </p>
                </div>
                <div className="rounded-xl bg-white dark:bg-[#171B26] border border-gray-200 dark:border-slate-800 p-4">
                  <div className="flex items-center gap-2 font-black text-base text-gray-900 dark:text-white">
                    <Clock className="w-4 h-4 text-cyan-500" />
                    <span>Connectivity & Power</span>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-slate-300 mt-1.5 leading-relaxed">
                    5G/4G SIMs available 24/7 at Bandaranaike International Airport (CMB). Power is 230V / 50Hz (Type D & Type G). Tap cards & LKR cash are widely accepted.
                  </p>
                </div>
                <div className="rounded-xl bg-white dark:bg-[#171B26] border border-gray-200 dark:border-slate-800 p-4">
                  <div className="flex items-center gap-2 font-black text-base text-gray-900 dark:text-white">
                    <PhoneCall className="w-4 h-4 text-emerald-500" />
                    <span>Emergency & Tourist Hotlines</span>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-slate-300 mt-1.5 leading-relaxed tabular-nums">
                    Tourist Police: <strong>1912</strong> · Police Emergency: <strong>119</strong> · Suwa Seriya Ambulance: <strong>1990</strong> · Fire & Rescue: <strong>110</strong>.
                  </p>
                </div>
              </div>
            )}

            <div className="mt-4 pt-3 border-t border-gray-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-gray-600 dark:text-slate-300">
              <div>
                <span className="font-extrabold text-[#FF5A36]">
                  {activeChapter.title} Insider Tip:
                </span>{' '}
                {activeChapter.travelTip}
              </div>
              <span className="text-[11px] font-mono text-gray-400 shrink-0">
                Best Window: {activeChapter.bestMonths}
              </span>
            </div>
          </div>

          {/* Smart Island Trip Planner: Interactive Route Map, Wildlife & Surf Seasons, Scenic Train & Express Bus Timetable */}
          <SriLankaTravelTools
            onSelectChapter={handleSelectChapter}
            onSelectCategory={onSelectCategory}
            onToast={onToast}
          />
        </div>
      </div>

      {/* Fullscreen Theater Cinema Modal */}
      {isCinemaOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setIsCinemaOpen(false)}
        >
          <div
            className="w-full max-w-5xl rounded-3xl overflow-hidden border border-white/15 bg-[#0A0E17] text-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10">
              <div className="flex items-center gap-3">
                <img
                  src={visitSriLankaIcon}
                  alt="Visit Sri Lanka"
                  referrerPolicy="no-referrer"
                  className="w-8 h-8 rounded-lg object-cover border border-cyan-400/40"
                />
                <div>
                  <h4 className="font-black text-sm sm:text-base">
                    Visit Sri Lanka · {activeChapter.videoTitle}
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    {activeChapter.region} · {activeChapter.coordinates}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCinemaOpen(false)}
                className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center cursor-pointer"
                aria-label="Close Theater Mode"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative aspect-[16/9] bg-black overflow-hidden">
              <motion.img
                key={`modal-${activeChapter.id}-${activeScene.id}`}
                src={activeScene.image}
                alt={activeScene.title}
                referrerPolicy="no-referrer"
                initial={{ transform: activeScene.transformStart }}
                animate={{
                  transform: isPlaying ? activeScene.transformEnd : activeScene.transformStart,
                }}
                transition={{ duration: sceneDuration, ease: 'linear' }}
                className={`w-full h-full object-cover ${activeScene.filterClass}`}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/30 pointer-events-none" />
              <div className="absolute bottom-14 left-6 right-6 pointer-events-none">
                <span className="inline-block px-2.5 py-0.5 rounded bg-black/70 text-[11px] font-mono text-cyan-300 mb-1.5">
                  {activeScene.timecode} · {activeScene.cameraMove}
                </span>
                <h5 className="text-lg sm:text-xl font-black">{activeScene.title}</h5>
                <p className="text-xs sm:text-sm text-slate-200 mt-1 max-w-3xl">
                  {activeScene.caption}
                </p>
              </div>
              <div className="absolute bottom-0 inset-x-0 px-5 py-3 bg-black/85 flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setIsPlaying((p) => !p)}
                  className="w-9 h-9 rounded-full bg-[#FF5A36] hover:bg-[#e84b28] text-white flex items-center justify-center shrink-0 cursor-pointer"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                </button>
                <input
                  type="range"
                  min={0}
                  max={activeChapter.videoDurationSec}
                  step={0.25}
                  value={playbackSec}
                  onChange={(e) => setPlaybackSec(Number(e.target.value))}
                  className="flex-1 accent-[#FF5A36] h-1.5 cursor-pointer"
                />
                <span className="text-xs font-mono tabular-nums text-slate-300">
                  {formatTimer(playbackSec)} / {formatTimer(activeChapter.videoDurationSec)}
                </span>
              </div>
            </div>

            <div className="p-4 sm:p-5 bg-[#0D121E] flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                {SRI_LANKA_CHAPTERS.map((ch) => (
                  <button
                    key={`cinema-ch-${ch.id}`}
                    type="button"
                    onClick={() => handleSelectChapter(ch.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      ch.id === activeChapterId
                        ? 'bg-[#FF5A36] text-white'
                        : 'bg-white/10 hover:bg-white/15 text-slate-300'
                    }`}
                  >
                    {ch.title}
                  </button>
                ))}
              </div>
              <p className="text-xs text-slate-400 max-w-xl">{activeChapter.videoDescription}</p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
