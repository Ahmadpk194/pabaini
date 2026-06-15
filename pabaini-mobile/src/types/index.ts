export type Category = 'general' | 'urgent' | 'event' | 'jirga_decision';
export type Role = 'resident' | 'moderator' | 'admin';

export interface User {
  id: number;
  firebase_uid: string;
  phone: string | null;
  email: string | null;
  name: string;
  avatar_url: string | null;
  village: string | null;
  is_diaspora: boolean;
  role: Role;
  created_at: string;
  updated_at: string;
}

export interface Announcement {
  id: number;
  title: string;
  content: string;
  category: Category;
  image_url: string | null;
  location: string | null;
  likes_count: number;
  liked_by_me?: boolean;
  is_pinned: boolean;
  author_id: number;
  author: {
    id: number;
    name: string;
    avatar_url: string | null;
  };
  created_at: string;
  updated_at: string;
}
