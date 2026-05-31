export interface POITranslation {
  id: number;
  poiId: number;
  languageCode: string;
  name: string;
  shortDescription: string;
  fullDescription: string;
  audioText: string;
}

export type TranslationDto = POITranslation;

export interface MenuItemTranslation {
  id: number;
  menuItemId: number;
  languageCode: string;
  name: string;
  description: string;
}

export interface MenuItem {
  id: number;
  poiId: number;
  name: string;
  price: number;
  currency: string;
  imageUrl?: string;
  sortOrder: number;
  translations: MenuItemTranslation[];
  localizedName?: string;
  localizedDescription?: string;
}

export interface QRCode {
  id: number;
  poiId: number;
  code: string;
  qrImageUrl: string;
  isActive: boolean;
  createdAt: string;
}

export interface POI {
  id: number;
  name: string;
  slug: string;
  latitude: number;
  longitude: number;
  triggerRadiusMeters: number;
  category: 'restaurant' | 'cafe' | 'temple' | 'market' | 'park' | 'landmark' | 'street_art' | string;
  priority: number;
  imageUrl?: string;
  googleMapsUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  translations: POITranslation[];
  menuItems: MenuItem[];
  qrCodes: QRCode[];
  localizedName?: string;
  shortDescription?: string;
  fullDescription?: string;
  audioText?: string;
  qrCode?: string;
}

// Slim POI type for list and map views
export interface POIListDto {
  id: number;
  name: string;
  slug: string;
  latitude: number;
  longitude: number;
  category: string;
  imageUrl?: string;
  distance?: number; // Calculated client-side relative to user
}

export interface TourStopDto {
  id: number;
  poiId: number;
  poiName: string;
  poiCategory: string;
  latitude: number;
  longitude: number;
  stopOrder: number;
  transitionNote?: string;
  poiShortDescription?: string;
}

export interface TourDto {
  id: number;
  name: string;
  description: string;
  estimatedMinutes: number;
  distanceKm: number;
  isActive: boolean;
  stops: TourStopDto[];
}

export interface TourListDto {
  id: number;
  name: string;
  description: string;
  estimatedMinutes: number;
  distanceKm: number;
  stopCount: number;
}
