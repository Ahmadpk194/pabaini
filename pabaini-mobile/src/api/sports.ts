import client from './client';
import { CricketPlayerProfile } from '../types/sports.types';

export interface CreateCricketProfileDto {
  role: string;
  batting_hand: string;
  bowling_arm: string;
  bowling_type: string;
}

export async function getMyCricketProfile(): Promise<CricketPlayerProfile | null> {
  try {
    const response = await client.get('/sports/cricket/players/me');
    if (response.data?.data) {
      return response.data.data;
    }
    return null;
  } catch (error: any) {
    if (error.response?.status === 404) {
      return null; // Not registered — expected case
    }
    console.error('API: getMyCricketProfile error:', error.message);
    throw error;
  }
}

export async function createCricketProfile(
  dto: CreateCricketProfileDto
): Promise<CricketPlayerProfile> {
  try {
    const response = await client.post('/sports/cricket/players/me', dto);
    if (response.data?.data) {
      return response.data.data;
    }
    throw new Error('Unexpected response structure from cricket profile API');
  } catch (error: any) {
    console.error('API: createCricketProfile error:', error.message);
    console.error('API: createCricketProfile error response:', error.response?.data);
    throw error;
  }
}

export async function getCricketPlayers(
  page: number = 1,
  limit: number = 10,
  search?: string
): Promise<{ data: CricketPlayerProfile[]; meta: { page: number; limit: number; total: number; totalPages: number } }> {
  try {
    const response = await client.get('/sports/cricket/players', {
      params: { page, limit, search },
    });
    const result = response.data?.data;
    if (result) {
      return {
        data: result.data || [],
        meta: result.meta || { page: 1, limit: 10, total: 0, totalPages: 1 },
      };
    }
    return { data: [], meta: { page: 1, limit, total: 0, totalPages: 1 } };
  } catch (error: any) {
    console.error('API: getCricketPlayers error:', error.message);
    throw error;
  }
}
