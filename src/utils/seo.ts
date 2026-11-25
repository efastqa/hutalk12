import type { EStore, Listing, ViewTab } from '../types';

export interface SriLankaDistrictSeo {
  name: string;
  slug: string;
  province: string;
  keyTowns: string;
}

export interface SeoCategoryMeta {
  name: string;
  slug: string;
  pluralLabel: string;
  schemaType: 'Vehicle' | 'RealEstateListing' | 'Product' | 'Service' | 'JobPosting' | 'Thing';
}

export const DEFAULT_SEO_OG_IMAGE = '/assets/aistudio/Sri_Lanka_Online_Grocery_Marketplace_fde947ca.jpg';

export const SRI_LANKA_DISTRICTS_SEO: SriLankaDistrictSeo[] = [
  { name: 'Colombo', slug: 'colombo', province: 'Western Province', keyTowns: 'Colombo 01-15, Nugegoda, Dehiwala, Maharagama, Kotte' },
  { name: 'Gampaha', slug: 'gampaha', province: 'Western Province', keyTowns: 'Negombo, Kadawatha, Wattala, Kelaniya, Ja-Ela' },
  { name: 'Kalutara', slug: 'kalutara', province: 'Western Province', keyTowns: 'Panadura, Horana, Kalutara, Beruwala, Aluthgama' },
  { name: 'Kandy', slug: 'kandy', province: 'Central Province', keyTowns: 'Kandy City, Peradeniya, Katugastota, Gampola, Kundasale' },
  { name: 'Matale', slug: 'matale', province: 'Central Province', keyTowns: 'Matale, Dambulla, Sigiriya, Galewela, Ukuwela' },
  { name: 'Nuwara Eliya', slug: 'nuwara-eliya', province: 'Central Province', keyTowns: 'Nuwara Eliya, Hatton, Talawakele, Ragala, Welimada' },
  { name: 'Galle', slug: 'galle', province: 'Southern Province', keyTowns: 'Galle Fort, Unawatuna, Hikkaduwa, Ambalangoda, Karapitiya' },
  { name: 'Matara', slug: 'matara', province: 'Southern Province', keyTowns: 'Matara, Weligama, Mirissa, Akuressa, Dikwella' },
  { name: 'Hambantota', slug: 'hambantota', province: 'Southern Province', keyTowns: 'Tangalle, Hambantota, Tissamaharama, Ambalantota, Beliatta' },
  { name: 'Jaffna', slug: 'jaffna', province: 'Northern Province', keyTowns: 'Jaffna Town, Nallur, Chavakachcheri, Point Pedro, Chunnakam' },
  { name: 'Kilinochchi', slug: 'kilinochchi', province: 'Northern Province', keyTowns: 'Kilinochchi, Paranthan, Pallai, Pooneryn' },
  { name: 'Mannar', slug: 'mannar', province: 'Northern Province', keyTowns: 'Mannar Town, Talaimannar, Murunkan, Pesalai' },
  { name: 'Vavuniya', slug: 'vavuniya', province: 'Northern Province', keyTowns: 'Vavuniya Town, Nedunkeni, Cheddikulam, Omanthai' },
  { name: 'Mullaitivu', slug: 'mullaitivu', province: 'Northern Province', keyTowns: 'Mullaitivu, Puthukkudiyiruppu, Oddusuddan, Mankulam' },
  { name: 'Batticaloa', slug: 'batticaloa', province: 'Eastern Province', keyTowns: 'Batticaloa, Kattankudy, Eravur, Valaichchenai, Kaluvanchikudy' },
  { name: 'Ampara', slug: 'ampara', province: 'Eastern Province', keyTowns: 'Ampara, Kalmunai, Akkaraipattu, Sainthamaruthu, Pottuvil' },
  { name: 'Trincomalee', slug: 'trincomalee', province: 'Eastern Province', keyTowns: 'Trincomalee, Kinniya, Kantale, Nilaveli, Muttur' },
  { name: 'Kurunegala', slug: 'kurunegala', province: 'North Western Province', keyTowns: 'Kurunegala, Kuliyapitiya, Narammala, Pannala, Wariyapola' },
  { name: 'Puttalam', slug: 'puttalam', province: 'North Western Province', keyTowns: 'Chilaw, Puttalam, Wennappuwa, Marawila, Dankotuwa' },
  { name: 'Anuradhapura', slug: 'anuradhapura', province: 'North Central Province', keyTowns: 'Anuradhapura, Kekirawa, Thambuttegama, Medawachchiya' },
  { name: 'Polonnaruwa', slug: 'polonnaruwa', province: 'North Central Province', keyTowns: 'Kaduruwela, Polonnaruwa, Hingurakgoda, Medirigiriya' },
  { name: 'Badulla', slug: 'badulla', province: 'Uva Province', keyTowns: 'Badulla, Bandarawela, Ella, Haputale, Mahiyanganaya' },
  { name: 'Monaragala', slug: 'monaragala', province: 'Uva Province', keyTowns: 'Monaragala, Wellawaya, Bibile, Buttala, Kataragama' },
  { name: 'Ratnapura', slug: 'ratnapura', province: 'Sabaragamuwa Province', keyTowns: 'Ratnapura, Balangoda, Embilipitiya, Eheliyagoda, Pelmadulla' },
  { name: 'Kegalle', slug: 'kegalle', province: 'Sabaragamuwa Province', keyTowns: 'Kegalle, Mawanella, Warakapola, Rambukkana, Ruwanwella' },
];

export const SEO_CATEGORIES: SeoCategoryMeta[] = [
  { name: 'Vehicles', slug: 'vehicles', pluralLabel: 'Vehicles & Cars for Sale', schemaType: 'Vehicle' },
  { name: 'Property', slug: 'property', pluralLabel: 'Property, Houses & Land', schemaType: 'RealEstateListing' },
  { name: 'Cars for Rent', slug: 'cars-for-rent', pluralLabel: 'Cars & Vans for Rent', schemaType: 'Service' },
  { name: 'Holiday Homes', slug: 'holiday-homes', pluralLabel: 'Holiday Homes & Villas', schemaType: 'RealEstateListing' },
  { name: 'Electronics', slug: 'electronics', pluralLabel: 'Electronics & Tech', schemaType: 'Product' },
  { name: 'Phones', slug: 'phones', pluralLabel: 'Mobile Phones & Tablets', schemaType: 'Product' },
  { name: 'Computers', slug: 'computers', pluralLabel: 'Computers & Laptops', schemaType: 'Product' },
  { name: 'Services', slug: 'services', pluralLabel: 'Trusted Local Services', schemaType: 'Service' },
  { name: 'Jobs', slug: 'jobs', pluralLabel: 'Jobs & Career Vacancies', schemaType: 'JobPosting' },
  { name: 'Auto Parts', slug: 'auto-parts', pluralLabel: 'Auto Parts & Accessories', schemaType: 'Product' },
  { name: 'Boardings & Annexes', slug: 'boardings-annexes', pluralLabel: 'Boarding Rooms & Annexes', schemaType: 'RealEstateListing' },
  { name: 'Agriculture & Farming', slug: 'agriculture-farming', pluralLabel: 'Agriculture & Farming', schemaType: 'Product' },
  { name: 'Weddings & Events', slug: 'weddings-events', pluralLabel: 'Weddings & Events Services', schemaType: 'Service' },
  { name: 'Education & Tuition', slug: 'education-tuition', pluralLabel: 'Education & Tuition Classes', schemaType: 'Service' },
  { name: 'Pets & Animals', slug: 'pets-animals', pluralLabel: 'Pets & Aquarium', schemaType: 'Thing' },
  { name: "Women's", slug: 'womens', pluralLabel: "Women's Fashion & Style", schemaType: 'Product' },
  { name: "Men's", slug: 'mens', pluralLabel: "Men's Fashion & Gear", schemaType: 'Product' },
  { name: 'Beauty', slug: 'beauty', pluralLabel: 'Beauty & Personal Care', schemaType: 'Product' },
  { name: 'Luxury', slug: 'luxury', pluralLabel: 'Luxury & Gemstones', schemaType: 'Product' },
  { name: 'Home & Garden', slug: 'home-garden', pluralLabel: 'Home, Furniture & Garden', schemaType: 'Product' },
];

export const TOP_MATRIX_CATEGORY_SLUGS = [
  'vehicles',
  'property',
  'boardings-annexes',
  'electronics',
  'phones',
  'services',
  'jobs',
  'cars-for-rent',
  'holiday-homes',
  'auto-parts',
];

const DISTRICT_BY_SLUG = new Map<string, SriLankaDistrictSeo>(
  SRI_LANKA_DISTRICTS_SEO.map((d) => [d.slug, d])
);

const DISTRICT_BY_NAME = new Map<string, SriLankaDistrictSeo>(
  SRI_LANKA_DISTRICTS_SEO.map((d) => [d.name.toLowerCase(), d])
);

const CATEGORY_BY_SLUG = new Map<string, SeoCategoryMeta>(
  SEO_CATEGORIES.map((c) => [c.slug, c])
);

const CATEGORY_BY_NAME = new Map<string, SeoCategoryMeta>(
  SEO_CATEGORIES.map((c) => [c.name.toLowerCase(), c])
);

export function slugifySeo(input?: string): string {
  if (!input) return 'item';
  const clean = String(input)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 72);
  return clean || 'item';
}

export function getDistrictSeo(districtOrSlug?: string): SriLankaDistrictSeo | undefined {
  if (!districtOrSlug) return undefined;
  const normalized = String(districtOrSlug).trim().toLowerCase();
  return DISTRICT_BY_SLUG.get(normalized) || DISTRICT_BY_NAME.get(normalized);
}

export function getCategorySeo(categoryOrSlug?: string): SeoCategoryMeta | undefined {
  if (!categoryOrSlug) return undefined;
  const normalized = String(categoryOrSlug).trim().toLowerCase();
  return CATEGORY_BY_SLUG.get(normalized) || CATEGORY_BY_NAME.get(normalized);
}

export function buildListingSeoPath(listing: Pick<Listing, 'id' | 'title'>): string {
  const slug = slugifySeo(listing.title);
  return `/ad/${slug}--${encodeURIComponent(listing.id)}`;
}

export function buildEStoreSeoPath(store: Pick<EStore, 'id' | 'storeName'>): string {
  const slug = slugifySeo(store.storeName);
  return `/estore/${slug}--${encodeURIComponent(store.id)}`;
}

export function buildDistrictCategorySeoPath(district?: string, category?: string): string {
  const districtObj = district && district !== 'All Sri Lanka' ? getDistrictSeo(district) : undefined;
  const categoryObj = category && category !== 'All' ? getCategorySeo(category) : undefined;

  if (districtObj && categoryObj) {
    return `/${districtObj.slug}/${categoryObj.slug}`;
  }
  if (districtObj) {
    return `/${districtObj.slug}`;
  }
  if (categoryObj) {
    return `/${categoryObj.slug}`;
  }
  return '/';
}

export function buildTabSeoPath(
  tab: ViewTab,
  options?: {
    hutaInFocus?: 'all' | 'society' | 'travel' | 'events';
    selectedLocation?: string;
    selectedCategory?: string;
  }
): string {
  switch (tab) {
    case 'admin_dashboard':
    case 'admin':
      return '/nashan';
    case 'estore':
      return '/estores';
    case 'huta_in':
      if (options?.hutaInFocus === 'travel') return '/travel';
      if (options?.hutaInFocus === 'society') return '/society';
      return '/huta-in';
    case 'hot_news':
      return '/news';
    case 'donate':
      return '/donate';
    case 'buyer_requests':
      return '/looking-for';
    case 'categories':
      return '/categories';
    case 'districts':
      return '/districts';
    case 'user_dashboard':
    case 'dashboard':
      return '/account';
    case 'more':
      return '/more';
    case 'marketplace':
    default:
      return buildDistrictCategorySeoPath(options?.selectedLocation, options?.selectedCategory);
  }
}

export function extractIdFromSlugSegment(segment: string): string {
  const decoded = decodeURIComponent(segment || '');
  const idx = decoded.lastIndexOf('--');
  if (idx !== -1 && idx + 2 < decoded.length) {
    return decoded.slice(idx + 2);
  }
  return decoded;
}

export interface ParsedSeoRoute {
  tab: ViewTab;
  district?: string;
  category?: string;
  listingId?: string;
  storeId?: string;
  hutaInFocus?: 'all' | 'society' | 'travel' | 'events';
}

export function parseSeoRoute(pathname: string, search: string = ''): ParsedSeoRoute {
  const cleanPath = (pathname || '/').replace(/\/+$/, '') || '/';
  const lowerPath = cleanPath.toLowerCase();
  const params = new URLSearchParams(search.startsWith('?') ? search : `?${search}`);

  // 1. Admin Portal routes
  if (lowerPath === '/nashan' || lowerPath.startsWith('/nashan/')) {
    return { tab: 'admin_dashboard' };
  }

  // 2. Clean Listing route: /ad/:slug--id or /ad/:id
  if (lowerPath.startsWith('/ad/')) {
    const seg = cleanPath.slice('/ad/'.length).split('/')[0];
    if (seg) {
      return { tab: 'marketplace', listingId: extractIdFromSlugSegment(seg) };
    }
  }

  // 3. Clean E-Store route: /estore/:slug--id or /estore/:id
  if (lowerPath.startsWith('/estore/')) {
    const seg = cleanPath.slice('/estore/'.length).split('/')[0];
    if (seg) {
      return { tab: 'estore', storeId: extractIdFromSlugSegment(seg) };
    }
  }

  // 4. Named clean pillar routes
  if (lowerPath === '/estores' || lowerPath === '/estore' || lowerPath === '/e-stores') {
    return { tab: 'estore', storeId: params.get('store') || undefined };
  }
  if (lowerPath === '/travel' || lowerPath === '/visit-sri-lanka') {
    return { tab: 'huta_in', hutaInFocus: 'travel' };
  }
  if (lowerPath === '/society') {
    return { tab: 'huta_in', hutaInFocus: 'society' };
  }
  if (lowerPath === '/huta-in') {
    return { tab: 'huta_in', hutaInFocus: 'all' };
  }
  if (lowerPath === '/news' || lowerPath === '/hot-news') {
    return { tab: 'hot_news' };
  }
  if (lowerPath === '/donate') {
    return { tab: 'donate' };
  }
  if (lowerPath === '/looking-for' || lowerPath === '/buyer-requests') {
    return { tab: 'buyer_requests' };
  }
  if (lowerPath === '/categories') {
    return { tab: 'categories' };
  }
  if (lowerPath === '/districts' || lowerPath === '/sri-lanka') {
    return { tab: 'districts' };
  }
  if (lowerPath === '/account' || lowerPath === '/dashboard') {
    return { tab: 'user_dashboard' };
  }
  if (lowerPath === '/more') {
    return { tab: 'more' };
  }

  // 5. Legacy query param support (?tab=, ?ad=, ?store=, ?category=, ?district=)
  const tabParam = params.get('tab');
  const adParam = params.get('ad') || undefined;
  const storeParam = params.get('store') || undefined;
  const catParam = params.get('category') || undefined;
  const distParam = params.get('district') || params.get('location') || undefined;

  if (tabParam === 'estore') return { tab: 'estore', storeId: storeParam };
  if (tabParam === 'huta_in') return { tab: 'huta_in', hutaInFocus: 'all' };
  if (tabParam === 'hot_news') return { tab: 'hot_news' };
  if (tabParam === 'donate') return { tab: 'donate' };
  if (tabParam === 'buyer_requests') return { tab: 'buyer_requests' };
  if (tabParam === 'categories') return { tab: 'categories' };
  if (tabParam === 'districts') return { tab: 'districts' };
  if (tabParam === 'user_dashboard') return { tab: 'user_dashboard' };
  if (tabParam === 'more') return { tab: 'more' };

  // 6. Clean 25-District & Category path routing: /:districtSlug/:categorySlug or /:districtSlug or /:categorySlug
  const segments = lowerPath.split('/').filter(Boolean);
  if (segments.length === 2) {
    const dist = getDistrictSeo(segments[0]);
    const cat = getCategorySeo(segments[1]);
    if (dist && cat) {
      return { tab: 'marketplace', district: dist.name, category: cat.name };
    }
    if (segments[0] === 'sri-lanka') {
      const catOnly = getCategorySeo(segments[1]);
      if (catOnly) return { tab: 'marketplace', category: catOnly.name };
      const distOnly = getDistrictSeo(segments[1]);
      if (distOnly) return { tab: 'marketplace', district: distOnly.name };
    }
  } else if (segments.length === 1) {
    const dist = getDistrictSeo(segments[0]);
    if (dist) {
      return { tab: 'marketplace', district: dist.name };
    }
    const cat = getCategorySeo(segments[0]);
    if (cat) {
      return { tab: 'marketplace', category: cat.name };
    }
  }

  return {
    tab: 'marketplace',
    listingId: adParam,
    storeId: storeParam,
    district: distParam ? getDistrictSeo(distParam)?.name || distParam : undefined,
    category: catParam ? getCategorySeo(catParam)?.name || catParam : undefined,
  };
}

export function resolveAbsoluteAssetUrl(urlOrPath: string | undefined, origin: string): string {
  const fallback = `${origin}${DEFAULT_SEO_OG_IMAGE}`;
  if (!urlOrPath) return fallback;
  const trimmed = String(urlOrPath).trim();
  if (!trimmed || trimmed.startsWith('data:')) return fallback;
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  return `${origin}${trimmed.startsWith('/') ? '' : '/'}${trimmed}`;
}

export interface SeoMetaPayload {
  title: string;
  description: string;
  canonicalUrl: string;
  ogType: string;
  ogImage: string;
  robots: string;
  jsonLd: Record<string, unknown>;
}

export function buildSeoMetaPayload(options: {
  origin: string;
  route: ParsedSeoRoute;
  listing?: Listing | null;
  store?: EStore | null;
  matchingListingsCount?: number;
  matchingListingsSample?: Listing[];
  storesCount?: number;
}): SeoMetaPayload {
  const origin = (options.origin || 'https://huta.lk').replace(/\/+$/, '');
  const { route, listing, store } = options;

  // Admin Portal: never index
  if (route.tab === 'admin_dashboard' || route.tab === 'admin') {
    return {
      title: 'Admin Console | HUTA.LK',
      description: 'HUTA.LK marketplace administration console.',
      canonicalUrl: `${origin}/nashan`,
      ogType: 'website',
      ogImage: `${origin}${DEFAULT_SEO_OG_IMAGE}`,
      robots: 'noindex, nofollow',
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: 'HUTA.LK Admin Console',
      },
    };
  }

  // 1. Single Listing SEO
  if (listing) {
    const cleanPath = buildListingSeoPath(listing);
    const priceText =
      Number(listing.price) > 0
        ? `Rs ${Number(listing.price).toLocaleString('en-LK')}`
        : 'Contact Seller';
    const districtName = listing.district || listing.location || 'Sri Lanka';
    const shortTitle =
      listing.title.length > 46 ? `${listing.title.slice(0, 43).trim()}...` : listing.title;
    const rawDesc = (listing.description || '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 110);
    const primaryImage =
      (Array.isArray(listing.images) && listing.images.find((u) => u && !u.startsWith('data:'))) ||
      (listing.image && !listing.image.startsWith('data:') ? listing.image : undefined);
    const catMeta = getCategorySeo(listing.category);

    return {
      title: `${shortTitle} (${priceText}) in ${districtName} | HUTA.LK`,
      description: `${listing.title} for sale in ${districtName}, Sri Lanka — ${priceText}. ${
        rawDesc ? `${rawDesc}. ` : ''
      }Contact seller directly on HUTA.LK.`,
      canonicalUrl: `${origin}${cleanPath}`,
      ogType: 'product',
      ogImage: resolveAbsoluteAssetUrl(primaryImage, origin),
      robots: 'index, follow',
      jsonLd: {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': catMeta?.schemaType === 'RealEstateListing' ? 'Product' : catMeta?.schemaType || 'Product',
            name: listing.title,
            description: rawDesc || `${listing.title} in ${districtName}, Sri Lanka`,
            image: resolveAbsoluteAssetUrl(primaryImage, origin),
            category: listing.category,
            offers: {
              '@type': 'Offer',
              priceCurrency: 'LKR',
              price: Number(listing.price) > 0 ? Number(listing.price) : 0,
              availability:
                listing.availabilityStatus === 'sold'
                  ? 'https://schema.org/OutOfStock'
                  : 'https://schema.org/InStock',
              areaServed: {
                '@type': 'City',
                name: districtName,
              },
              url: `${origin}${cleanPath}`,
            },
          },
          {
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'HUTA.LK Sri Lanka', item: `${origin}/` },
              {
                '@type': 'ListItem',
                position: 2,
                name: `${listing.category} in ${districtName}`,
                item: `${origin}${buildDistrictCategorySeoPath(districtName, listing.category)}`,
              },
              { '@type': 'ListItem', position: 3, name: listing.title, item: `${origin}${cleanPath}` },
            ],
          },
        ],
      },
    };
  }

  // 2. Single E-Store SEO
  if (store) {
    const cleanPath = buildEStoreSeoPath(store);
    const productCount = Array.isArray(store.products) ? store.products.length : 0;
    const primaryImg =
      (store.bannerImage && !store.bannerImage.startsWith('data:') ? store.bannerImage : undefined) ||
      (store.logo && !store.logo.startsWith('data:') ? store.logo : undefined);

    return {
      title: `${store.storeName} — ${store.category} in ${store.district} | HUTA.LK E-Stores`,
      description: `Shop ${productCount} verified products from ${store.storeName} in ${store.district}, Sri Lanka. Direct WhatsApp ordering & Smart Cart checkout on HUTA.LK.`,
      canonicalUrl: `${origin}${cleanPath}`,
      ogType: 'website',
      ogImage: resolveAbsoluteAssetUrl(primaryImg, origin),
      robots: 'index, follow',
      jsonLd: {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'Store',
            name: store.storeName,
            description: store.tagline || store.description || `${store.category} E-Store in ${store.district}`,
            image: resolveAbsoluteAssetUrl(primaryImg, origin),
            address: {
              '@type': 'PostalAddress',
              addressLocality: store.district,
              addressCountry: 'LK',
            },
            url: `${origin}${cleanPath}`,
          },
          {
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'HUTA.LK', item: `${origin}/` },
              { '@type': 'ListItem', position: 2, name: 'Sri Lanka E-Stores', item: `${origin}/estores` },
              { '@type': 'ListItem', position: 3, name: store.storeName, item: `${origin}${cleanPath}` },
            ],
          },
        ],
      },
    };
  }

  // 3. Dedicated Tab Routes
  if (route.tab === 'estore') {
    const count = options.storesCount ?? 0;
    return {
      title: 'Sri Lanka E-Stores & Verified Online Shops | HUTA.LK',
      description: `Browse ${count > 0 ? `${count} verified ` : ''}Sri Lankan online stores for Ceylon tea, groceries, fashion, electronics & handmade crafts with island-wide delivery on HUTA.LK.`,
      canonicalUrl: `${origin}/estores`,
      ogType: 'website',
      ogImage: `${origin}${DEFAULT_SEO_OG_IMAGE}`,
      robots: 'index, follow',
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: 'Sri Lanka E-Stores Directory | HUTA.LK',
        url: `${origin}/estores`,
      },
    };
  }

  if (route.tab === 'huta_in') {
    if (route.hutaInFocus === 'travel') {
      return {
        title: 'Visit Sri Lanka Travel & Tour Bookings (LKR/USD) | HUTA IN',
        description:
          'Plan custom Sri Lanka tours, safaris, Sigiriya & coastal packages with transparent LKR/USD pricing and instant direct booking on HUTA.LK.',
        canonicalUrl: `${origin}/travel`,
        ogType: 'website',
        ogImage: `${origin}${DEFAULT_SEO_OG_IMAGE}`,
        robots: 'index, follow',
        jsonLd: {
          '@context': 'https://schema.org',
          '@type': 'TouristTrip',
          name: 'Visit Sri Lanka Travel & Tour Booking — HUTA.LK',
          url: `${origin}/travel`,
        },
      };
    }
    if (route.hutaInFocus === 'society') {
      return {
        title: 'HUTA IN Society — Verified Medical & Education Aid in Sri Lanka',
        description:
          'Browse and support verified Sri Lankan medical, education, and community relief appeals backed by reviewed proof documents on HUTA.LK.',
        canonicalUrl: `${origin}/society`,
        ogType: 'website',
        ogImage: `${origin}${DEFAULT_SEO_OG_IMAGE}`,
        robots: 'index, follow',
        jsonLd: {
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: 'HUTA IN Society Help Hub',
          url: `${origin}/society`,
        },
      };
    }
    return {
      title: 'HUTA IN — Travel, Society Relief & Events in Sri Lanka | HUTA.LK',
      description:
        'Explore Sri Lanka events, custom tour packages, live prayer times, and verified Society medical & education help appeals on HUTA.LK.',
      canonicalUrl: `${origin}/huta-in`,
      ogType: 'website',
      ogImage: `${origin}${DEFAULT_SEO_OG_IMAGE}`,
      robots: 'index, follow',
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: 'HUTA IN Sri Lanka Hub',
        url: `${origin}/huta-in`,
      },
    };
  }

  if (route.tab === 'hot_news') {
    return {
      title: 'Sri Lanka Hot News — Live Economy, Auto & Local Updates | HUTA.LK',
      description:
        'Stay updated with live Sri Lanka breaking news, business, economy, tech & automotive headlines curated on HUTA.LK.',
      canonicalUrl: `${origin}/news`,
      ogType: 'website',
      ogImage: `${origin}${DEFAULT_SEO_OG_IMAGE}`,
      robots: 'index, follow',
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: 'Sri Lanka Hot News — HUTA.LK',
        url: `${origin}/news`,
      },
    };
  }

  if (route.tab === 'donate') {
    return {
      title: 'Donate Sri Lanka — Hospital, Education & Flood Relief | HUTA.LK',
      description:
        'Support urgent medical equipment, children’s education, and disaster relief causes across all 25 districts of Sri Lanka on HUTA.LK.',
      canonicalUrl: `${origin}/donate`,
      ogType: 'website',
      ogImage: `${origin}${DEFAULT_SEO_OG_IMAGE}`,
      robots: 'index, follow',
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: 'Donate Sri Lanka — HUTA.LK',
        url: `${origin}/donate`,
      },
    };
  }

  if (route.tab === 'buyer_requests') {
    return {
      title: 'Looking For Buyer Requests — Post What You Want to Buy | HUTA.LK',
      description:
        'Post your budget for vehicles, property, phones, or services in Sri Lanka and let verified sellers contact you directly on HUTA.LK.',
      canonicalUrl: `${origin}/looking-for`,
      ogType: 'website',
      ogImage: `${origin}${DEFAULT_SEO_OG_IMAGE}`,
      robots: 'index, follow',
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: 'Looking For Buyer Requests — HUTA.LK',
        url: `${origin}/looking-for`,
      },
    };
  }

  if (route.tab === 'categories') {
    return {
      title: 'All Categories — Vehicles, Property, Services & Jobs | HUTA.LK',
      description:
        'Explore every classifieds category across Sri Lanka: cars, motorcycles, property, boardings, phones, jobs, weddings, agriculture & local trades.',
      canonicalUrl: `${origin}/categories`,
      ogType: 'website',
      ogImage: `${origin}${DEFAULT_SEO_OG_IMAGE}`,
      robots: 'index, follow',
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: 'All Marketplace Categories — HUTA.LK',
        url: `${origin}/categories`,
      },
    };
  }

  if (route.tab === 'districts') {
    return {
      title: 'All 25 Districts & Categories Directory in Sri Lanka | HUTA.LK',
      description:
        'Browse classifieds by all 25 Sri Lankan districts from Colombo, Gampaha, and Kandy to Galle, Jaffna, and Trincomalee across vehicles, property, electronics & jobs.',
      canonicalUrl: `${origin}/districts`,
      ogType: 'website',
      ogImage: `${origin}${DEFAULT_SEO_OG_IMAGE}`,
      robots: 'index, follow',
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: '25 Sri Lankan Districts Classifieds Directory — HUTA.LK',
        url: `${origin}/districts`,
        hasPart: SRI_LANKA_DISTRICTS_SEO.map((d) => ({
          '@type': 'WebPage',
          name: `Classifieds in ${d.name}`,
          url: `${origin}/${d.slug}`,
        })),
      },
    };
  }

  // 4. 25-District & Category SEO Landing Routes
  const distMeta = route.district && route.district !== 'All Sri Lanka' ? getDistrictSeo(route.district) : undefined;
  const catMeta = route.category && route.category !== 'All' ? getCategorySeo(route.category) : undefined;

  if (distMeta || catMeta) {
    const canonicalPath = buildDistrictCategorySeoPath(distMeta?.name, catMeta?.name);
    const countText =
      typeof options.matchingListingsCount === 'number' && options.matchingListingsCount > 0
        ? `${options.matchingListingsCount.toLocaleString()} `
        : '';

    const title =
      distMeta && catMeta
        ? `${catMeta.pluralLabel} in ${distMeta.name}, Sri Lanka | HUTA.LK`
        : distMeta
        ? `Classifieds in ${distMeta.name} (${distMeta.province}) | HUTA.LK`
        : `${catMeta!.pluralLabel} in Sri Lanka | HUTA.LK`;

    const description =
      distMeta && catMeta
        ? `Browse ${countText}verified ${catMeta.name.toLowerCase()} ads in ${distMeta.name} (${distMeta.keyTowns}). Buy & sell directly with zero broker fees on HUTA.LK.`
        : distMeta
        ? `Buy & sell vehicles, property, phones, jobs & local services in ${distMeta.name} (${distMeta.keyTowns}). Trusted Sri Lanka classifieds on HUTA.LK.`
        : `Explore ${countText}${catMeta!.pluralLabel.toLowerCase()} across all 25 districts of Sri Lanka on HUTA.LK. Direct seller contact and zero commission.`;

    const breadcrumbs = [
      { '@type': 'ListItem', position: 1, name: 'Sri Lanka', item: `${origin}/` },
    ];
    if (distMeta) {
      breadcrumbs.push({
        '@type': 'ListItem',
        position: 2,
        name: `${distMeta.name} District`,
        item: `${origin}/${distMeta.slug}`,
      });
    }
    if (catMeta) {
      breadcrumbs.push({
        '@type': 'ListItem',
        position: distMeta ? 3 : 2,
        name: catMeta.name,
        item: `${origin}${canonicalPath}`,
      });
    }

    const itemList = (options.matchingListingsSample || []).slice(0, 8).map((item, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: item.title,
      url: `${origin}${buildListingSeoPath(item)}`,
    }));

    return {
      title,
      description: description.slice(0, 160),
      canonicalUrl: `${origin}${canonicalPath}`,
      ogType: 'website',
      ogImage: `${origin}${DEFAULT_SEO_OG_IMAGE}`,
      robots: 'index, follow',
      jsonLd: {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'CollectionPage',
            name: title,
            description: description.slice(0, 160),
            url: `${origin}${canonicalPath}`,
          },
          {
            '@type': 'BreadcrumbList',
            itemListElement: breadcrumbs,
          },
          ...(itemList.length > 0
            ? [
                {
                  '@type': 'ItemList',
                  itemListElement: itemList,
                },
              ]
            : []),
        ],
      },
    };
  }

  // 5. Default Homepage SEO
  return {
    title: "HUTA.LK — Sri Lanka's Marketplace, E-Stores, Travel & Society Hub",
    description:
      'Buy & sell verified vehicles, property, electronics & jobs across all 25 districts of Sri Lanka, shop official E-Stores, book tours & support Society relief on HUTA.LK.',
    canonicalUrl: `${origin}/`,
    ogType: 'website',
    ogImage: `${origin}${DEFAULT_SEO_OG_IMAGE}`,
    robots: 'index, follow',
    jsonLd: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebSite',
          name: 'HUTA Marketplace',
          alternateName: 'HUTA.LK',
          url: `${origin}/`,
          potentialAction: {
            '@type': 'SearchAction',
            target: `${origin}/?search={search_term_string}`,
            'query-input': 'required name=search_term_string',
          },
        },
        {
          '@type': 'Organization',
          name: 'HUTA.LK',
          url: `${origin}/`,
          logo: `${origin}/pwa-512x512.png`,
          areaServed: {
            '@type': 'Country',
            name: 'Sri Lanka',
          },
        },
      ],
    },
  };
}

export function applyClientSeoMeta(meta: SeoMetaPayload): void {
  if (typeof document === 'undefined') return;
  try {
    document.title = meta.title;

    const setMeta = (attr: 'name' | 'property', key: string, value: string) => {
      let el = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute('content', value);
    };

    setMeta('name', 'description', meta.description);
    setMeta('name', 'robots', meta.robots);
    setMeta('property', 'og:type', meta.ogType);
    setMeta('property', 'og:title', meta.title);
    setMeta('property', 'og:description', meta.description);
    setMeta('property', 'og:url', meta.canonicalUrl);
    setMeta('property', 'og:image', meta.ogImage);
    setMeta('name', 'twitter:title', meta.title);
    setMeta('name', 'twitter:description', meta.description);
    setMeta('name', 'twitter:image', meta.ogImage);

    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', meta.canonicalUrl);

    let ldEl = document.querySelector('script[type="application/ld+json"]') as HTMLScriptElement | null;
    if (!ldEl) {
      ldEl = document.createElement('script');
      ldEl.setAttribute('type', 'application/ld+json');
      document.head.appendChild(ldEl);
    }
    ldEl.textContent = JSON.stringify(meta.jsonLd);
  } catch {
    // Ignore DOM meta update errors
  }
}
