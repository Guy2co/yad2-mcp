export interface SearchParams {
  city?: string; // city code (e.g. "5000" for Tel Aviv)
  cityName?: string; // used for display
  rooms?: string; // e.g. "2-4", "3", "1.5-3"
  priceMin?: number;
  priceMax?: number;
  sizeMin?: number; // sqm
  sizeMax?: number;
  floor?: string; // e.g. "1-5", "0" for ground
  propertyType?: string; // apartment, garden_apartment, studio_loft, penthouse, duplex, triplex, unit, vacation, cottage, agricultural, land, general, building, storage, basement, purchase_group, parking, protected_housing
  shelter?: boolean;
  elevator?: boolean;
  parking?: boolean;
  balcony?: boolean;
  airConditioner?: boolean;
  warehouse?: boolean;
  accessibility?: boolean;
  furniture?: boolean;
  renovated?: boolean;
  bars?: boolean;
  page?: number;
  pageSize?: number;
}

export interface Listing {
  id: string;
  token: string;
  title: string;
  price: number | null;
  currency: string;
  rooms: number | null;
  floor: number | null;
  size: number | null; // sqm
  address: string;
  city: string;
  neighborhood: string;
  description: string;
  images: string[];
  url: string;
  date: string;
  contactName: string | null;
  contactPhone: string | null;
  coordinates: { lat: number; lng: number } | null;
}

export interface SearchResult {
  listings: Listing[];
  total: number;
  page: number;
  pageSize: number;
}

export interface Yad2ApiAddress {
  city?: { text?: string };
  neighborhood?: { text?: string };
  street?: { text?: string };
  house?: { number?: number | string; floor?: number | string };
  coords?: { lat?: number; lon?: number };
}

export interface Yad2ApiAdditionalDetails {
  roomsCount?: number;
  squareMeter?: number;
  property?: { text?: string };
}

export interface Yad2ApiMetaData {
  coverImage?: string;
  images?: string[];
}

export interface Yad2ApiItem {
  token?: string;
  orderId?: number;
  adNumber?: number;
  price?: number;
  currency?: string;
  address?: Yad2ApiAddress;
  additionalDetails?: Yad2ApiAdditionalDetails;
  metaData?: Yad2ApiMetaData;
  searchText?: string;
  dateAdded?: string;
  contactName?: string;
  contactPhone?: string;
  adType?: string;
  [key: string]: unknown;
}

export interface Yad2FeedData {
  private?: Yad2ApiItem[];
  agency?: Yad2ApiItem[];
  yad1?: Yad2ApiItem[];
  platinum?: Yad2ApiItem[];
  kingOfTheHar?: Yad2ApiItem[];
  trio?: Yad2ApiItem[];
  booster?: Yad2ApiItem[];
  leadingBroker?: Yad2ApiItem[];
  pagination?: { total?: number; totalPages?: number };
}
