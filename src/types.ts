export interface Listing {
  id: string;
  title: string;
  category: string;
  location: string;
  district?: string;
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
  pricingType?: 'fixed' | 'starting_at' | 'hourly' | 'quote';
  serviceArea?: string;
  isVerifiedPro?: boolean;
  isEmergency247?: boolean;
  videoUrl?: string; // Optional animation video or video walkthrough (MP4/WebM/YouTube link)
  itemCondition?: string;
  brand?: string;
  model?: string;
  sellerName?: string;
  availabilityStatus?: 'available' | 'reserved' | 'sold';
  sellerRating?: number;
  reviewCount?: number;
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
  | 'huta_in'
  | 'categories'
  | 'user_dashboard'
  | 'admin_dashboard'
  | 'more'
  | 'admin'
  | 'dashboard';

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
  gradientTheme?: 'orange' | 'blue' | 'emerald' | 'purple' | 'amber';
  animationType?: HeroAnimationType;
  isActive: boolean;
  createdAt: string;
}

export interface HeroAdSettings {
  mode: 'default' | 'rotate' | 'ads_only';
  rotationIntervalSeconds: number;
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


