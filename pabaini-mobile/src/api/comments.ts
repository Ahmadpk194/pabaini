import client from './client';
import { Comment } from '../types';

export interface CommentsListResponse {
  comments: Comment[];
  total: number;
  hasMore: boolean;
}

export async function getComments(
  announcementId: number,
  page: number = 1,
  limit: number = 20
): Promise<CommentsListResponse> {
  try {
    const response = await client.get(`/announcements/${announcementId}/comments`, {
      params: { page, limit },
    });
    return response.data.data;
  } catch (error: any) {
    console.error('API: getComments error:', error.message);
    console.error('API: getComments error response:', error.response?.data);
    throw error;
  }
}

export async function createComment(
  announcementId: number,
  body: string
): Promise<Comment> {
  try {
    const response = await client.post(`/announcements/${announcementId}/comments`, {
      body,
    });
    return response.data.data;
  } catch (error: any) {
    console.error('API: createComment error:', error.message);
    console.error('API: createComment error response:', error.response?.data);
    throw error;
  }
}

export async function updateComment(
  announcementId: number,
  commentId: number,
  body: string
): Promise<Comment> {
  try {
    const response = await client.patch(
      `/announcements/${announcementId}/comments/${commentId}`,
      { body }
    );
    return response.data.data;
  } catch (error: any) {
    console.error('API: updateComment error:', error.message);
    console.error('API: updateComment error response:', error.response?.data);
    throw error;
  }
}

export async function deleteComment(
  announcementId: number,
  commentId: number
): Promise<void> {
  try {
    await client.delete(`/announcements/${announcementId}/comments/${commentId}`);
  } catch (error: any) {
    console.error('API: deleteComment error:', error.message);
    console.error('API: deleteComment error response:', error.response?.data);
    throw error;
  }
}
