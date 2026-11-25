export interface Listing {
  id: string;
  title: string;
  category: string;
  location: string;
  district?: string;
  lat?: number;
  lng?: number;
  price: number;
  phone: string;
  image: string;
  images?: string[];
  description: string;
  status: 'approved' | 'pending' | 'rejected';
  isFeatured: boolean;
  date: string;
  createdAt?: string;
  updatedAt?: string;
  userId: string;
  views: number;
  whatsappClicks?: number;
  phoneClicks?: number;
  serviceTrade?: string;
  pricingType?: 'fixed' | 'starting_at' | 'hourly' | 'quote' | 'per_night' | 'per_weekend' | 'daily' | 'monthly';
  serviceArea?: string;
  serviceMode?: string;
  serviceExperience?: string;
  serviceAvailability?: string;
  serviceWarranty?: string;
  serviceFeatures?: string[];
  isVerifiedPro?: boolean;
  isEmergency247?: boolean;
  videoUrl?: string; // Optional animation video or video walkthrough (MP4/WebM/YouTube link)
  verificationNotes?: string; // Admin verification notes or customer delta records
  verificationStatus?: 'unverified' | 'verified_with_customer' | 'deltas_found';
  itemCondition?: string;
  brand?: string;
  model?: string;
  sellerName?: string;
  availabilityStatus?: 'available' | 'reserved' | 'sold';
  sellerRating?: number;
  reviewCount?: number;

  // Custom Category Fields
  // Vehicles, Motorcycles & Cars for Rent
  vehicleType?: string;
  vehicleYear?: number | string;
  vehicleMileage?: number | string;
  fuelType?: 'Petrol' | 'Diesel' | 'Hybrid' | 'Electric' | string;
  transmission?: 'Automatic' | 'Manual' | 'Tiptronic' | string;
  rentalDriverOption?: 'Self-Drive' | 'With Driver' | 'Self-Drive or With Driver' | string;

  // Property & Holiday Homes
  propertyType?: 'House' | 'Land' | 'Apartment' | 'Commercial' | 'Room / Annex' | 'Villa / Holiday Home' | string;
  propertySize?: string;
  bedrooms?: number | string;
  bathrooms?: number | string;
  maxGuests?: number | string;
  amenities?: string[];

  // Electronics
  electronicsSubcategory?: string;
  storageCapacity?: string;

  // Jobs
  jobType?: 'Full-time' | 'Part-time' | 'Contract' | 'Remote' | 'Internship' | string;
  salaryPeriod?: 'Monthly' | 'Weekly' | 'Hourly' | 'Negotiable' | string;
}

export interface ListingReview {
  id: string;
  listingId: string;
  authorName: string;
  rating: number; // 1-5
  comment: string;
  verifiedBuyer?: boolean;
  date: string;
  createdAt?: string;
}

export interface ListingReport {
  id: string;
  listingId: string;
  listingTitle: string;
  reason: 'fraud_scam' | 'incorrect_price' | 'already_sold' | 'duplicate' | 'prohibited_item' | 'other';
  details: string;
  reporterContact?: string;
  createdAt: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
}

export interface User {
  id: string;
  username: string;
  fullname: string;
  email: string;
  phone?: string;
  password?: string;
  securityQuestion?: string;
  securityAnswer?: string;
  created: string;
  twoFactorEnabled?: boolean;
  twoFactorMethod?: 'sms' | 'authenticator';
  twoFactorPhone?: string;
  twoFactorSecret?: string;
  twoFactorRecoveryCodes?: string[];
}

export interface AdminConfig {
  password?: string;
  autoApprove: boolean;
  twoFactorEnabled?: boolean;
  twoFactorPhone?: string;
  twoFactorMethod?: 'sms' | 'authenticator';
  updatedAt?: string;
}

export interface TwoFactorChallenge {
  twoFactorRequired: true;
  userId?: string;
  role?: 'user' | 'admin';
  method: 'sms' | 'authenticator';
  destinationMasked: string;
  devOtp?: string;
  expiresInSeconds?: number;
  message?: string;
}

export interface CategoryInfo {
  key: string;
  label: string;
  iconName: string;
}

export type ViewTab =
  | 'marketplace'
  | 'estore'
  | 'huta_in'
  | 'hot_news'
  | 'donate'
  | 'buyer_requests'
  | 'categories'
  | 'user_dashboard'
  | 'admin_dashboard'
  | 'more'
  | 'admin'
  | 'dashboard';

export interface HotNewsArticle {
  id: string;
  title: string;
  summary: string;
  content?: string;
  link: string;
  source: string;
  category: 'Breaking' | 'Business & Economy' | 'Sports' | 'Tech & Auto' | 'Sri Lanka';
  imageUrl?: string;
  publishedAt: string;
}

export interface HotNewsResponse {
  articles: HotNewsArticle[];
  sources: string[];
  lastUpdated: string;
  isLive: boolean;
}

export interface ChatConversation {
  id: string;
  listingId: string;
  listingTitle: string;
  listingPrice?: number;
  listingImage?: string;
  buyerId: string;
  buyerName: string;
  sellerId: string;
  sellerName: string;
  lastMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt: string;
}

export interface AppSettings {
  deviceLayout: 'auto' | 'mobile' | 'tablet' | 'desktop';
  density: 'comfortable' | 'compact';
  theme: 'light' | 'dark' | 'system';
  language: 'en' | 'si' | 'ta';
  currency: 'LKR' | 'USD' | 'EUR';
  dataSaver: boolean;
  hapticFeedback: boolean;
  browserTabBadges: boolean;
  pushNotifications: boolean;
  soundEffects: boolean;
}

export interface EventItem {
  id: string;
  title: string;
  category: string;
  district: string;
  date: string;
  month: string;
  day: string;
  time: string;
  location: string;
  venue: string;
  image: string;
  badge?: string;
  price: string;
  isFree: boolean;
  attendees: number;
  description: string;
  organizer: string;
  isSpotlight?: boolean;
}

export type HeroAnimationType = 'slide' | 'fade' | 'pulse' | 'glow';

export interface HeroAd {
  id: string;
  badge: string; // e.g. "Special Promotion", "Featured Partner"
  title: string; // e.g. "Find Premium Vehicles & Parts"
  highlightText?: string; // e.g. "with Zero Commission"
  subtitle: string; // e.g. "Direct contact with verified vehicle owners across Sri Lanka"
  ctaText?: string; // e.g. "Explore Vehicles" or "Post Ad Now"
  ctaAction?: string; // e.g. "Vehicles" (category) | "post_ad" | "https://..."
  bgImage?: string; // optional background graphic
  bgVideo?: string; // optional background animated video (mp4, webm, or animated loop)
  mediaType?: 'image' | 'video'; // media type for hero ad background
  onlyVideoVisible?: boolean; // When true, displays ONLY the pure clean video without text overlays, badges, or dark scrims!
  videoAspectRatio?: '16:9' | '21:9' | 'auto'; // Aspect ratio for video banner display
  enableSound?: boolean; // Whether viewers can toggle audio on the video ad
  gradientTheme?: 'orange' | 'blue' | 'emerald' | 'purple' | 'amber' | 'light';
  animationType?: HeroAnimationType;
  isActive: boolean;
  createdAt: string;
}

export interface HeroAdSettings {
  mode: 'default' | 'rotate' | 'ads_only';
  rotationIntervalSeconds: number;
}

export interface PromoSlide {
  id: string;
  title: string;
  imageUrl: string;
  badge?: string;
  subtitle?: string;
  ctaText?: string;
  ctaAction?: string; // '' | 'estore' | 'post_ad' | category name | 'https://...'
  showTextOverlay?: boolean;
  isActive: boolean;
  order?: number;
  createdAt: string;
}

export interface PromoSlidesSettings {
  enabled: boolean;
  rotationIntervalSeconds: number;
  aspectPreset?: 'compact' | 'standard' | 'wide';
}

export interface VideoReelItem {
  id: string;
  title: string;
  videoUrl: string;
  posterImage?: string;
  category?: string;
  price?: number;
  location?: string;
  district?: string;
  sellerName?: string;
  phone?: string;
  isVerified?: boolean;
  specsSummary?: string;
  listingId?: string;
  listing?: Listing;
  isActive?: boolean;
  createdAt?: string;
  views?: number;
}

export interface SmsDeliveryLog {
  id: string;
  recipient: string;
  internationalPhone: string;
  message: string;
  provider: 'notify.lk' | 'custom_gateway' | 'twilio' | 'simulation_mode';
  status: 'sent' | 'failed' | 'simulated';
  details: string;
  timestamp: string;
}

export interface SmsGatewayStatus {
  activeProvider: 'notify.lk' | 'custom_gateway' | 'twilio' | 'simulation_mode';
  providers: {
    notifyLk: {
      configured: boolean;
      senderId: string;
      userIdSet: boolean;
    };
    customGateway: {
      configured: boolean;
      hostname: string | null;
      hasApiKey: boolean;
    };
    twilio: {
      configured: boolean;
      from: string | null;
    };
  };
  stats: {
    total: number;
    sent: number;
    simulated: number;
    failed: number;
  };
  recentLogs: SmsDeliveryLog[];
}

export interface CustomDomainStatus {
  domain: string;
  status: 'connected' | 'pointing_other' | 'not_configured';
  isConfigured: boolean;
  isApexConfigured: boolean;
  isWwwConfigured: boolean;
  liveDns: {
    apexA: string[];
    apexError?: string | null;
    wwwA: string[];
    wwwCname: string[];
    wwwError?: string | null;
    txtRecords: string[];
  };
  requiredRecords: {
    apexA: {
      type: string;
      host: string;
      targetIps: string[];
    };
    wwwCname: {
      type: string;
      host: string;
      target: string;
    };
  };
  currentAppUrl: string;
  sslStatus: string;
  lastChecked: string;
}

// -------------------------------------------------------------
// Sri Lanka E-Store & Online Merchant Directory
// -------------------------------------------------------------

export interface EStoreProduct {
  id: string;
  storeId: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  productUrl: string; // Direct link to product on merchant's official website
  description: string;
  category: string;
  inStock: boolean;
  featured?: boolean;
}

export interface EStore {
  id: string;
  storeName: string;
  tagline: string;
  description: string;
  category: string; // e.g. "Fashion & Apparel", "Tech & Gadgets", "Ceylon Tea & Spices", "Beauty & Cosmetics", "Handmade & Crafts", "Home & Living", "Gourmet Foods"
  district: string; // e.g. "Colombo", "Gampaha", "Kandy", "Galle", "Islandwide"
  websiteUrl: string; // The merchant's verified Sri Lankan online website URL
  whatsapp: string; // WhatsApp ordering/inquiry contact
  phone?: string;
  email?: string;
  logo: string;
  bannerImage?: string;
  rating: number;
  reviewCount: number;
  isVerifiedMerchant: boolean;
  deliveryInfo: string; // e.g. "Islandwide Delivery • Cash on Delivery (COD) Available"
  returnPolicy?: string; // e.g. "7-day return/exchange policy"
  foundedYear?: string;
  ownerId?: string;
  products: EStoreProduct[];
  createdAt: string;
}

export type CourierSpeed = 'standard' | 'express' | 'pickup';

export interface CartItem {
  id: string;
  storeId: string;
  storeName: string;
  storeWhatsapp: string;
  storeDistrict: string;
  storeLogo?: string;
  storeIsVerified?: boolean;
  product: EStoreProduct;
  quantity: number;
  addedAt: number;
}

export interface CourierCalculation {
  courierFee: number;
  isFreeDelivery: boolean;
  freeDeliveryThreshold: number;
  amountNeededForFree: number;
  freeDeliveryProgressPercent: number;
  tierName: string;
  estimatedDays: string;
  recommendedService: string;
}

// -------------------------------------------------------------
// Wanted / Buyer Request Board ("Looking For")
// -------------------------------------------------------------

export type BuyerRequestUrgency = 'urgent' | 'this_week' | 'flexible';
export type BuyerRequestStatus = 'open' | 'fulfilled' | 'closed';

export interface BuyerRequestOffer {
  id: string;
  sellerName: string;
  sellerPhone: string;
  sellerUserId?: string;
  itemTitle: string;
  offeredPrice: number;
  message: string;
  listingId?: string;
  createdAt: string;
}

export interface BuyerRequest {
  id: string;
  title: string;
  category: string;
  district: string;
  location: string;
  maxBudget: number;
  urgency: BuyerRequestUrgency;
  description: string;
  buyerName: string;
  buyerPhone: string;
  userId: string;
  status: BuyerRequestStatus;
  offersCount: number;
  offers: BuyerRequestOffer[];
  createdAt: string;
  updatedAt: string;
}

// -------------------------------------------------------------
// Sri Lanka Donate Hub (Most Needed Hospitals & Humanitarian Aid)
// -------------------------------------------------------------

export type DonationCategory =
  | 'Hospitals & Medical'
  | 'Blood & Emergency'
  | 'Children & Schools'
  | 'Food & Elders Relief'
  | 'Community Infrastructure';

export type DonationUrgency = 'critical' | 'urgent' | 'ongoing';
export type DonationStatus = 'active' | 'fulfilled' | 'paused';
export type DonationPledgeType = 'supplies' | 'funds' | 'blood_volunteer';

export interface DonationPledge {
  id: string;
  donorName: string;
  donorPhone?: string;
  donorDistrict?: string;
  pledgeType: DonationPledgeType;
  amountLkr?: number;
  itemsSummary?: string;
  message?: string;
  createdAt: string;
}

export interface DonationCause {
  id: string;
  organizationName: string;
  title: string;
  category: DonationCategory;
  district: string;
  address: string;
  officialWebsite?: string;
  contactPhone: string;
  contactPerson?: string;
  urgency: DonationUrgency;
  status: DonationStatus;
  verifiedOfficial: boolean;
  bankDetailsNote: string;
  neededItems: string[];
  description: string;
  image?: string;
  pledgeCount: number;
  totalPledgedLkr: number;
  pledges: DonationPledge[];
  userId: string;
  createdAt: string;
  updatedAt: string;
}

// -------------------------------------------------------------
// Sri Lanka Travel & Tourism Booking System (HUTA IN)
// -------------------------------------------------------------

export type TravelPackageCategory =
  | 'Tour Packages'
  | 'Safaris & Wildlife'
  | 'Transfers & Chauffeurs'
  | 'Boutique Stays';

export type TravelVehicleTier =
  | 'Private Sedan'
  | 'Luxury KDH Van'
  | '4x4 Safari Jeep'
  | 'VIP Coach';

export type TravelBookingStatus = 'pending' | 'confirmed' | 'cancelled';

export interface TravelBooking {
  id: string;
  bookingRef: string;
  packageId: string;
  packageTitle: string;
  category: TravelPackageCategory;
  destination: string;
  startDate: string;
  days: number;
  adults: number;
  children: number;
  pickupLocation: string;
  vehicleTier: TravelVehicleTier;
  addons: string[];
  travelerName: string;
  travelerPhone: string;
  travelerEmail?: string;
  specialRequests?: string;
  baseAmountLkr?: number;
  adminAdjustmentLkr?: number;
  adminAdjustmentNote?: string;
  assignedDriverName?: string;
  assignedDriverPhone?: string;
  adminNotes?: string;
  totalLkr: number;
  preferredCurrency?: 'LKR' | 'USD';
  usdExchangeRate?: number;
  status: TravelBookingStatus;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface TravelPackageConfig {
  id: string;
  title: string;
  shortTitle: string;
  category: TravelPackageCategory;
  destination: string;
  defaultDays: number;
  basePriceLkr: number;
  dailyAddonLkr: number;
  extraAdultPct: number;
  childPct: number;
  rating: number;
  reviewCount: number;
  defaultVehicle: TravelVehicleTier;
  image: string;
  badge: string;
  highlights: string[];
  includes: string;
  isActive: boolean;
}

export interface TravelVehicleTierConfig {
  name: TravelVehicleTier;
  surchargePerDay: number;
  capacity: string;
  isActive: boolean;
}

export interface TravelAddonConfig {
  id: string;
  label: string;
  priceLkr: number;
  isActive: boolean;
}

export interface TravelPricingConfig {
  id: string;
  packages: TravelPackageConfig[];
  vehicleTiers: TravelVehicleTierConfig[];
  addons: TravelAddonConfig[];
  serviceFeePercent: number;
  globalDiscountPercent: number;
  customTripBaseLkr: number;
  customTripDailyLkr: number;
  usdExchangeRateLkr?: number;
  updatedAt: string;
}

// -------------------------------------------------------------
// HUTA IN "Society" — Community Medical, Education & Relief Help Hub
// -------------------------------------------------------------

export type SocietyHelpCategory =
  | 'Medical Help'
  | 'Education Help'
  | 'Emergency & Disaster Relief'
  | 'Food & Family Support'
  | 'Disability & Elder Care'
  | 'Livelihood & Tools Aid'
  | 'Other Community Need';

export type SocietyHelpUrgency = 'critical' | 'urgent' | 'ongoing';
export type SocietyHelpStatus = 'open' | 'partially_helped' | 'fulfilled';
export type SocietyReviewStatus =
  | 'pending_review'
  | 'approved'
  | 'verified_proof'
  | 'rejected';

export type SocietyProofType =
  | 'Medical Report / Prescription'
  | 'Hospital Bill / Estimate'
  | 'School / University Fee Notice'
  | 'Grama Niladhari / Official Letter'
  | 'Utility / Rent Bill'
  | 'Other Proof Document';

export interface SocietyProofDocument {
  id: string;
  proofType: SocietyProofType;
  label: string;
  imageUrl: string;
  uploadedAt: string;
}

export interface SocietyHelpOffer {
  id: string;
  helperName: string;
  helperPhone?: string;
  helperDistrict?: string;
  helpType: 'funds' | 'supplies' | 'service_volunteer';
  amountLkr?: number;
  itemsNote?: string;
  message?: string;
  createdAt: string;
}

export interface SocietyHelpRequest {
  id: string;
  beneficiaryName: string;
  title: string;
  category: SocietyHelpCategory;
  district: string;
  location: string;
  urgency: SocietyHelpUrgency;
  status: SocietyHelpStatus;
  reviewStatus?: SocietyReviewStatus;
  adminReviewNote?: string;
  reviewedAt?: string;
  updatedAfterReview?: boolean;
  neededAmountLkr?: number;
  receivedAmountLkr: number;
  neededItemsSummary?: string;
  story: string;
  contactPhone: string;
  whatsappPhone?: string;
  bankOrPayDetails?: string;
  images: string[];
  proofs: SocietyProofDocument[];
  proofVerifiedNote?: string;
  offersCount: number;
  offers: SocietyHelpOffer[];
  userId: string;
  createdAt: string;
  updatedAt: string;
}
