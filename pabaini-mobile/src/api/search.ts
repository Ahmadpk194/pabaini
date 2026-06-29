import client from './client';

// Search functions — all follow same pattern
export const searchAnnouncements = (query: string, page: number) =>
  client.get('/announcements', { params: { search: query, page, limit: 15 } });

export const searchPlayers = (query: string, page: number) =>
  client.get('/sports/cricket/players', { params: { search: query, page, limit: 15 } });

export const searchTeams = (query: string, page: number) =>
  client.get('/sports/cricket/teams', { params: { search: query, page, limit: 15 } });

export const searchMatches = (query: string, page: number) =>
  client.get('/sports/cricket/matches', { params: { search: query, page, limit: 15 } });

export const searchUsers = (query: string, page: number) =>
  client.get('/users', { params: { search: query, page, limit: 15 } });
