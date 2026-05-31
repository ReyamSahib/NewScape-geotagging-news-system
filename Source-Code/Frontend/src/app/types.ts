export type Category = 'Traffic' | 'Sports' | 'Weather' | 'Business';
export type GeotagType = 'Explicit' | 'Inferred' | 'Not Geotaggable';
export type UAELocation = 'Dubai' | 'Sharjah' | 'Abu Dhabi' | 'Al Ain' | 'Fujairah' | 'Ajman' | 'Umm Al-Quwain' | 'Ras Al Khaimah' | 'Northern Emirates';

export interface NewsItem {
  id: string;
  title: string;
  location: string;
  category: Category;
  geotagType: GeotagType;
  description: string;
  date: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}

export interface FilterState {
  category: Category | 'All';
  location: UAELocation | 'All';
  dateRange: 'Today' | 'This Week' | 'Custom';
  geotagType: GeotagType | 'All';
}
