import client from '../api/client';
import { PublicUser, CricketProfileBundle } from '../types/profile.types';

export async function getPublicProfile(userId: number): Promise<{ user: PublicUser; cricket: CricketProfileBundle | null }> {
  const response = await client.get(`/users/${userId}/profile`);
  return response.data.data;
}
