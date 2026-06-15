import client from './client';
import * as SecureStore from 'expo-secure-store';
import { User, Role } from '../types';

export interface UpdateUserDto {
  name?: string;
  village?: string;
  is_diaspora?: boolean;
  avatar_url?: string;
  phone?: string;
  email?: string;
}

export async function getMe(): Promise<User> {
  try {
    const response = await client.get('/users/me');
    return response.data.data;
  } catch (error: any) {
    console.error('API: getMe error:', error.message);
    console.error('API: getMe error response:', error.response?.data);
    throw error;
  }
}

export async function updateMe(dto: UpdateUserDto): Promise<User> {
  try {
    const response = await client.patch('/users/me', dto);
    return response.data.data;
  } catch (error: any) {
    console.error('API: updateMe error:', error.message);
    console.error('API: updateMe error response:', error.response?.data);
    throw error;
  }
}

export async function uploadAvatar(uri: string): Promise<User> {
  try {
    const formData = new FormData();
    const filename = uri.split('/').pop() || 'avatar.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : `image/jpeg`;
    
    formData.append('avatar', {
      uri,
      name: filename,
      type,
    } as any);
    
    const response = await client.post('/users/me/avatar', formData);
    return response.data.data;
  } catch (error: any) {
    console.error('API: uploadAvatar error:', error.message);
    console.error('API: uploadAvatar error response:', error.response?.data);
    throw error;
  }
}

export async function updateUserRole(id: number, role: string): Promise<User> {
  try {
    const response = await client.patch(`/users/${id}/role`, { role });
    return response.data.data;
  } catch (error: any) {
    console.error('API: updateUserRole error:', error.message);
    console.error('API: updateUserRole error response:', error.response?.data);
    throw error;
  }
}

export async function registerDeviceToken(token: string): Promise<{ success: boolean }> {
  try {
    const response = await client.post('/users/device-token', { token });
    return response.data.data;
  } catch (error: any) {
    console.error('API: registerDeviceToken error:', error.message);
    console.error('API: registerDeviceToken error response:', error.response?.data);
    throw error;
  }
}

export async function removeDeviceToken(token: string): Promise<{ success: boolean }> {
  try {
    const response = await client.delete('/users/device-token', { data: { token } });
    return response.data.data;
  } catch (error: any) {
    console.error('API: removeDeviceToken error:', error.message);
    console.error('API: removeDeviceToken error response:', error.response?.data);
    throw error;
  }
}
