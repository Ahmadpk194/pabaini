export type NotificationType =
  | 'team_join_request'
  | 'team_invite'
  | 'team_request_accepted'
  | 'team_request_rejected'
  | 'team_invite_accepted'
  | 'team_invite_declined'
  | 'team_member_removed'
  | 'team_captaincy_transferred';

export interface AppNotification {
  id: number;
  user_id: number;
  type: NotificationType;
  title: string;
  body: string | null;
  deep_link: string | null;
  metadata: Record<string, any> | null;
  is_read: boolean;
  created_at: string;
}

export interface NotificationsListResponse {
  notifications: AppNotification[];
  total: number;
  page: number;
  limit: number;
}
