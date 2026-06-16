export interface POI {
  id: number;
  name: string;
  slug: string;
  latitude: number;
  longitude: number;
  triggerRadiusMeters: number;
  category: string;
  categoryId?: number;
  priority: number;
  ownerId?: number;
  approvalStatus: string;
  address?: string;
  ward?: string;
  district?: string;
  city?: string;
  phone?: string;
  website?: string;
  facebookUrl?: string;
  imageUrl?: string;
  googleMapsUrl?: string;
  isActive: boolean;
  rating: number;
  reviewCount: number;
  localizedName: string;
  shortDescription: string;
  fullDescription: string;
  audioText: string;
  qrCode?: string;
  menuItemCount: number;
  distanceMeters?: number;
  isFavorite: boolean;
  priceRange: string;
  images: POIImage[];
  operatingHours?: string;
  createdAt: string;
  updatedAt: string;
}

export interface POIListItem {
  id: number;
  name: string;
  slug: string;
  latitude: number;
  longitude: number;
  category: string;
  imageUrl?: string;
  shortDescription: string;
  distanceMeters?: number;
  ownerId?: number;
  approvalStatus: string;
  isFavorite: boolean;
  rating: number;
  reviewCount: number;
  priceRange: string;
}

export interface POIImage {
  id: number;
  imageUrl: string;
  isCover: boolean;
}

export interface POICategory {
  id: number;
  slug: string;
  name: string;
  iconUrl?: string;
  color?: string;
  sortOrder: number;
  isActive: boolean;
}

export interface MenuItem {
  id: number;
  poiId: number;
  name: string;
  price: number;
  currency: string;
  imageUrl?: string;
  displayOrder: number;
  isAvailable: boolean;
  localizedName: string;
  localizedDescription: string;
}
