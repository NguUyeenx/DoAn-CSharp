export interface Category {
  id: number;
  name: string;
  iconUrl?: string;
}

export interface POIImage {
  id: number;
  poiId: number;
  imageUrl: string;
  isCover: boolean;
  displayOrder: number;
}

export interface MenuItem {
  id: number;
  poiId: number;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  isAvailable: boolean;
  displayOrder: number;
}

export interface POI {
  id: number;
  ownerId: number;
  categoryId: number;
  name: string;
  slug: string;
  localizedName?: string;
  shortDescription?: string;
  fullDescription?: string;
  audioText?: string;
  address: string;
  latitude: number;
  longitude: number;
  status: 'Pending' | 'Approved' | 'Rejected';
  imageUrl?: string;
  rating: number;
  reviewCount: number;
  createdAt: string;
  
  category?: Category;
  images?: POIImage[];
  menuItems?: MenuItem[];
}

export interface SearchPOIParams {
  query?: string;
  categoryId?: number | string;
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
}

