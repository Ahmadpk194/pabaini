import client from '../api/client';
import { PublicUser, CricketProfileBundle } from '../types/profile.types';
import { Role } from '../types';

export async function getPublicProfile(userId: number): Promise<{ user: PublicUser; cricket: CricketProfileBundle | null }> {
  const response = await client.get(`/users/${userId}/profile`);
  return response.data.data;
}

export async function updateUserRole(id: number, role: Role): Promise<any> {
  const response = await client.patch(`/users/${id}/role`, { role });
  return response.data.data;
}

export async function getAllUsers(
  page: number = 1,
  limit: number = 20,
  search?: string
): Promise<{ data: any[]; meta: any }> {
  const response = await client.get('/users', {
    params: { page, limit, search },
  });
  return response.data.data;
}
