export type BookingModel = "enquiry" | "quote" | "appointment";
export type VerificationStatus = "unverified" | "pending" | "verified" | "rejected";
export type ArticleSection = "returning-home" | "property-investment" | "start-a-business";

export interface Country {
  code: string; // lowercase ISO 3166-1 alpha-2, also the URL prefix
  name: string;
  shortName: string;
  currency: string;
  timeZone: string;
  diallingCode: string;
  districtLabel: string;
  sortOrder: number;
}

export interface Island {
  slug: string;
  countryCode: string;
  name: string;
  lat: number;
  lng: number;
  isMain: boolean;
}

export interface District {
  slug: string;
  countryCode: string;
  name: string;
  islandSlug: string | null; // null when a district spans several islands
}

export interface Category {
  slug: string;
  name: string;
  parentSlug: string | null;
  description: string | null;
  bookingModels: BookingModel[];
  sortOrder: number;
}

export interface Service {
  id: string;
  name: string;
  description: string | null;
  priceMin: number | null;
  priceMax: number | null;
  currency: string;
  priceUnit: string | null;
  durationMinutes: number | null;
  bookingModels: BookingModel[];
}

export interface OpeningHours {
  weekday: number; // 0 = Sunday
  opens: string; // "08:00"
  closes: string; // "17:00"
}

export interface BusinessLocation {
  countryCode: string;
  islandSlug: string;
  islandName: string;
  districtSlug: string | null;
  districtName: string | null;
  landmark: string | null;
  lat: number | null;
  lng: number | null;
  isPrimary: boolean;
}

export interface ServiceArea {
  countryCode: string;
  islandSlug: string;
  islandName: string;
}

export interface Business {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  description: string | null;
  verificationStatus: VerificationStatus;
  isDemo: boolean;
  isFeatured: boolean;
  /** Owned by Island Connect's founder: always disclosed. */
  founderOwned?: boolean;
  /** Unclaimed listings were added from research and can be claimed by their owner. */
  claimStatus: "claimed" | "unclaimed";
  /** How the business wants customers to get in touch. */
  contactPreference: "platform" | "whatsapp" | "phone" | "website" | "external_booking";
  externalBookingUrl: string | null;
  ratingAvg: number | null;
  ratingCount: number;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  website: string | null;
  /** Images uploaded by the business itself. Null or empty when there are none. */
  logoUrl: string | null;
  coverUrl: string | null;
  gallery: string[];
  paymentMethods: string[];
  cancellationPolicy: string | null;
  categories: { slug: string; name: string; isPrimary: boolean }[];
  locations: BusinessLocation[];
  serviceAreas: ServiceArea[];
  services: Service[];
  hours: OpeningHours[];
  createdAt: string;
}

export interface ArticleSource {
  title: string;
  url: string;
}

export interface Article {
  id: string;
  countryCode: string | null;
  section: ArticleSection;
  slug: string;
  title: string;
  summary: string | null;
  body: string;
  sources: ArticleSource[];
  verifiedAt: string | null;
  verifiedBy: string | null;
  nextReviewAt: string | null;
}

export interface SearchFilters {
  q?: string;
  category?: string;
  island?: string;
  district?: string;
  verifiedOnly?: boolean;
  openNow?: boolean;
  minRating?: number;
  sort?: "relevance" | "rating" | "newest";
}
