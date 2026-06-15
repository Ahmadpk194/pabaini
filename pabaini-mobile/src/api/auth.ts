import client from './client';

export interface LoginResponse {
  success: boolean;
  status: number;
  message: string;
  data: {
    user: {
      id: number;
      firebase_uid: string;
      phone: string | null;
      email: string | null;
      name: string;
      avatar_url: string | null;
      village: string | null;
      is_diaspora: boolean;
      role: string;
      created_at: string;
      updated_at: string;
    };
  };
}

export async function login(idToken: string): Promise<LoginResponse> {
  try {
    const response = await client.post('/auth/login', { id_token: idToken });
    return response.data;
  } catch (error: any) {
    console.error('API: Login error - Full error:', error);
    console.error('API: Error message:', error.message);
    console.error('API: Error response:', error.response?.data);
    console.error('API: Error status:', error.response?.status);
    console.error('API: Error code:', error.code);
    throw error;
  }
}
