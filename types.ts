export interface User {
  id: string;
  username: string;
  role: 'owner' | 'customer' | 'pending' | 'admin';
  firstName?: string;
  lastName?: string;
  email?: string;
  contactNumber?: string;
  stayHistory?: string[];
  profilePicture?: string;
  trustScore?: number; // 0-100, calculated based on profile completion and verification
  isVerified?: boolean; // True if admin has verified documents
  verificationDocuments?: string[]; // URLs to uploaded verification documents
}

export type HostelCategory = 'boys' | 'girls' | 'any';
export type RoomCategory = 'Shared Room' | 'Private Room' | 'Entire Place' | 'Dormitory';

export interface Hostel {
  id: string;
  name: string;
  location: string;
  price: number;
  capacity?: number;
  description?: string;
  amenities: string[];
  rating: number;
  ratings?: Array<{ userId: string; score: number; }>;
  reviews?: Array<{ userId: string; rating: number; comment: string; }>;
  ownerId?: string;
  verified: boolean;
  images: string[];
  videos?: string[];
  tour360?: string[];
  category: RoomCategory | string; // Backend uses RoomCategory but keep string for compatibility
  genderPreference?: HostelCategory;
  status?: 'Available' | 'Booked' | 'Maintenance' | 'Inactive';
}