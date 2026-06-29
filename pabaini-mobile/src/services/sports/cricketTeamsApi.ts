import client from '../../api/client';
import {
  TeamFull,
  TeamSummary,
  TeamMember,
  PendingMembers,
  CreateTeamPayload,
  MyTeamResponse,
} from '../../types/sports.types';

export async function createTeam(payload: CreateTeamPayload): Promise<TeamFull> {
  const response = await client.post('/sports/cricket/teams', payload);
  return response.data.data;
}

export async function getAllTeams(search?: string): Promise<TeamSummary[]> {
  const response = await client.get('/sports/cricket/teams', { params: { search } });
  if (response.data?.data && Array.isArray(response.data.data.data)) {
    return response.data.data.data;
  }
  if (Array.isArray(response.data?.data)) {
    return response.data.data;
  }
  return [];
}

export async function getMyTeams(): Promise<MyTeamResponse[]> {
  const response = await client.get('/sports/cricket/teams/my');
  return response.data.data;
}

export async function getTeamById(id: number): Promise<TeamFull> {
  const response = await client.get(`/sports/cricket/teams/${id}`);
  return response.data.data;
}

export async function updateTeam(id: number, payload: Partial<CreateTeamPayload>): Promise<TeamFull> {
  const response = await client.patch(`/sports/cricket/teams/${id}`, payload);
  return response.data.data;
}

export async function uploadTeamLogo(id: number, fileUri: string): Promise<TeamFull> {
  const formData = new FormData();
  
  const filename = fileUri.split('/').pop() || 'logo.jpg';
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `image/${match[1]}` : `image/jpeg`;
  
  // Cast to any to bypass react-native specific FormData differences in TS compiler
  formData.append('logo', {
    uri: fileUri,
    name: filename,
    type,
  } as any);

  const response = await client.post(`/sports/cricket/teams/${id}/logo`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data.data;
}

export async function inviteToTeam(teamId: number, playerId: number): Promise<{ message: string }> {
  const response = await client.post(`/sports/cricket/teams/${teamId}/invite`, { player_id: playerId });
  return response.data.data;
}

export async function requestToJoinTeam(teamId: number): Promise<{ message: string }> {
  const response = await client.post(`/sports/cricket/teams/${teamId}/request`);
  return response.data.data;
}

export async function getPendingMembers(teamId: number): Promise<PendingMembers> {
  const response = await client.get(`/sports/cricket/teams/${teamId}/members/pending`);
  return response.data.data;
}

export async function acceptMembership(teamId: number, memberId: number): Promise<TeamMember> {
  const response = await client.patch(`/sports/cricket/teams/${teamId}/members/${memberId}/accept`);
  return response.data.data;
}

export async function rejectMembership(teamId: number, memberId: number): Promise<{ message: string }> {
  const response = await client.patch(`/sports/cricket/teams/${teamId}/members/${memberId}/reject`);
  return response.data.data;
}

export async function removeMember(teamId: number, memberId: number): Promise<{ message: string }> {
  const response = await client.delete(`/sports/cricket/teams/${teamId}/members/${memberId}`);
  return response.data.data;
}

export async function transferCaptaincy(teamId: number, playerId: number): Promise<TeamFull> {
  const response = await client.patch(`/sports/cricket/teams/${teamId}/captain`, { player_id: playerId });
  return response.data.data;
}

export async function deleteTeam(teamId: number): Promise<{ message: string }> {
  const response = await client.delete(`/sports/cricket/teams/${teamId}`);
  return response.data.data;
}
