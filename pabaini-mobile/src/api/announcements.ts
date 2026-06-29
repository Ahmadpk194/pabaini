import client from './client';

export type Category = 'general' | 'urgent' | 'event' | 'jirga_decision';

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
  comments_count?: number;
  created_at: string;
  updated_at: string;
}

export interface CreateAnnouncementDto {
  title: string;
  content: string;
  category?: Category;
  image_url?: string;
  location?: string;
}

export interface UpdateAnnouncementDto {
  title?: string;
  content?: string;
  category?: Category;
  image_url?: string;
  is_pinned?: boolean;
  location?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function getAll(
  page: number = 1,
  limit: number = 10,
  category?: Category,
  search?: string
): Promise<PaginatedResponse<Announcement>> {
  try {
    const params: any = { page, limit };
    if (category) params.category = category;
    if (search) params.search = search;
    
    const response = await client.get('/announcements', { params });
    
    // Handle different response structures
    if (response.data.pagination) {
      return {
        data: response.data.data,
        total: response.data.pagination.total,
        page: response.data.pagination.page,
        limit: response.data.pagination.limit,
        totalPages: response.data.pagination.totalPages,
      };
    } else if (Array.isArray(response.data)) {
      // Direct array response
      return {
        data: response.data,
        total: response.data.length,
        page: 1,
        limit: response.data.length,
        totalPages: 1,
      };
    } else if (response.data.data && Array.isArray(response.data.data)) {
      // Nested data without pagination
      return {
        data: response.data.data,
        total: response.data.data.length,
        page: 1,
        limit: response.data.data.length,
        totalPages: 1,
      };
    } else {
      console.error('API: getAll unexpected response structure:', response.data);
      throw new Error('Unexpected response structure from announcements API');
    }
  } catch (error: any) {
    console.error('API: getAll error:', error.message);
    console.error('API: getAll error response:', error.response?.data);
    throw error;
  }
}

export async function getById(id: number): Promise<Announcement> {
  try {
    const response = await client.get(`/announcements/${id}`);
    
    // Handle different response structures
    if (response.data.data) {
      return response.data.data;
    } else if (response.data.id) {
      return response.data;
    } else {
      console.error('API: getById unexpected response structure:', response.data);
      throw new Error('Unexpected response structure from announcements API');
    }
  } catch (error: any) {
    console.error('API: getById error:', error.message);
    console.error('API: getById error response:', error.response?.data);
    throw error;
  }
}

export async function getByAuthor(authorId: number): Promise<Announcement[]> {
  try {
    const response = await client.get(`/announcements/author/${authorId}`);
    
    // Handle different response structures
    if (response.data.data) {
      return response.data.data;
    } else if (Array.isArray(response.data)) {
      return response.data;
    } else {
      console.error('API: getByAuthor unexpected response structure:', response.data);
      throw new Error('Unexpected response structure from announcements API');
    }
  } catch (error: any) {
    console.error('API: getByAuthor error:', error.message);
    console.error('API: getByAuthor error response:', error.response?.data);
    throw error;
  }
}

export async function create(dto: CreateAnnouncementDto): Promise<Announcement> {
  try {
    const response = await client.post('/announcements', dto);
    
    // Handle different response structures
    if (response.data.data) {
      return response.data.data;
    } else if (response.data.id) {
      return response.data;
    } else {
      console.error('API: create unexpected response structure:', response.data);
      throw new Error('Unexpected response structure from announcements API');
    }
  } catch (error: any) {
    console.error('API: create error:', error.message);
    console.error('API: create error response:', error.response?.data);
    throw error;
  }
}

export async function update(id: number, dto: UpdateAnnouncementDto): Promise<Announcement> {
  try {
    const response = await client.patch(`/announcements/${id}`, dto);
    
    // Handle different response structures
    if (response.data.data) {
      return response.data.data;
    } else if (response.data.id) {
      return response.data;
    } else {
      console.error('API: update unexpected response structure:', response.data);
      throw new Error('Unexpected response structure from announcements API');
    }
  } catch (error: any) {
    console.error('API: update error:', error.message);
    console.error('API: update error response:', error.response?.data);
    throw error;
  }
}

export async function softDelete(id: number): Promise<void> {
  try {
    await client.patch(`/announcements/${id}/soft-delete`);
  } catch (error: any) {
    console.error('API: softDelete error:', error.message);
    console.error('API: softDelete error response:', error.response?.data);
    throw error;
  }
}

export async function hardDelete(id: number): Promise<void> {
  try {
    await client.delete(`/announcements/${id}`);
  } catch (error: any) {
    console.error('API: hardDelete error:', error.message);
    console.error('API: hardDelete error response:', error.response?.data);
    throw error;
  }
}

export async function toggleLike(id: number): Promise<Announcement> {
  const maxRetries = 3;
  let retryCount = 0;

  while (retryCount < maxRetries) {
    try {
      const response = await client.post(`/announcements/${id}/like`);
      
      // Handle different response structures
      if (response.data.data) {
        return response.data.data;
      } else if (response.data.id) {
        return response.data;
      } else {
        console.error('API: toggleLike unexpected response structure:', response.data);
        throw new Error('Unexpected response structure from announcements API');
      }
    } catch (error: any) {
      console.error('API: toggleLike error:', error.message);
      console.error('API: toggleLike error response:', error.response?.data);
      
      // Retry on network errors, but not on other errors
      if (error.message === 'Network Error' && retryCount < maxRetries - 1) {
        retryCount++;
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        continue;
      }
      
      throw error;
    }
  }
  
  throw new Error('Max retries exceeded for toggleLike');
}

export async function uploadImage(id: number, uri: string): Promise<Announcement> {
  try {
    const formData = new FormData();
    const filename = uri.split('/').pop() || 'announcement.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : `image/jpeg`;
    
    formData.append('image', {
      uri,
      name: filename,
      type,
    } as any);
    
    const response = await client.post(`/announcements/${id}/image`, formData);
    
    // Handle different response structures
    if (response.data.data) {
      return response.data.data;
    } else if (response.data.id) {
      return response.data;
    } else {
      console.error('API: uploadImage unexpected response structure:', response.data);
      throw new Error('Unexpected response structure from announcements API');
    }
  } catch (error: any) {
    console.error('API: uploadImage error:', error.message);
    console.error('API: uploadImage error response:', error.response?.data);
    throw error;
  }
}
