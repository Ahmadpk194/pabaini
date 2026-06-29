export interface SearchCategory {
  id: 'all' | 'posts' | 'players' | 'teams' | 'matches' | 'users';
  label: string;
  endpoint: string | null;  // null = coming soon
  searchFields: string;     // for display/documentation only
  emptyMessage: string;
  comingSoon?: boolean;
}

export const SEARCH_CATEGORIES: SearchCategory[] = [
  {
    id: 'all',
    label: 'All',
    endpoint: null,  // special case — fires multiple endpoints
    searchFields: 'posts, players, teams, matches',
    emptyMessage: 'No results found for this search',
  },
  {
    id: 'posts',
    label: 'Posts',
    endpoint: '/announcements',
    searchFields: 'title, body',
    emptyMessage: 'No posts found',
  },
  {
    id: 'players',
    label: 'Players',
    endpoint: '/sports/cricket/players',
    searchFields: 'name',
    emptyMessage: 'No players found',
  },
  {
    id: 'teams',
    label: 'Teams',
    endpoint: '/sports/cricket/teams',
    searchFields: 'name',
    emptyMessage: 'No teams found',
  },
  {
    id: 'matches',
    label: 'Matches',
    endpoint: '/sports/cricket/matches',
    searchFields: 'team names, venue',
    emptyMessage: 'No matches found',
  },
  {
    id: 'users',
    label: 'Users',
    endpoint: '/users',
    searchFields: 'name',
    emptyMessage: 'No users found',
  },
];
