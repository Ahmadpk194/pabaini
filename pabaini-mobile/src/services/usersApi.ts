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
