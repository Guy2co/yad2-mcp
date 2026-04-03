export interface VehicleSearchParams {
  manufacturer?: string; // manufacturer ID
  model?: string; // model ID
  year?: string; // e.g. "2018-2023", "2020"
  priceMin?: number;
  priceMax?: number;
  kmMax?: number; // max kilometers
  hand?: number; // e.g. 1 for first hand
  page?: number;
  pageSize?: number;
}

export interface VehicleListing {
  token: string;
  price: number | null;
  manufacturer: string;
  model: string;
  subModel: string;
  year: number | null;
  engineType: string;
  hand: number | null;
  km: number | null;
  gear: string;
  color: string;
  images: string[];
  url: string;
}

export interface VehicleSearchResult {
  listings: VehicleListing[];
  total: number;
  page: number;
  pageSize: number;
}

export interface Yad2VehicleApiItem {
  token?: string;
  price?: number;
  manufacturer?: { id?: number; text?: string };
  model?: { id?: number; text?: string };
  subModel?: { id?: number; text?: string };
  vehicleDates?: { yearOfProduction?: number };
  engineType?: { text?: string };
  hand?: { id?: number; text?: string };
  km?: number;
  gear?: { text?: string };
  color?: { text?: string };
  metaData?: { coverImage?: string; images?: string[] };
  [key: string]: unknown;
}

export interface Yad2VehicleFeedData {
  private?: Yad2VehicleApiItem[];
  commercial?: Yad2VehicleApiItem[];
  solo?: Yad2VehicleApiItem[];
  platinum?: Yad2VehicleApiItem[];
  boost?: Yad2VehicleApiItem[];
  pagination?: { total?: number; pages?: number; perPage?: number };
  [key: string]: unknown;
}
