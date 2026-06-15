import { Injectable } from '@nestjs/common';
import { getMessaging, MulticastMessage } from 'firebase-admin/messaging';

@Injectable()
export class FCMService {
  async sendPushNotification(
    deviceTokens: string[],
    title: string,
    body: string,
    data?: any,
  ): Promise<void> {
    if (!deviceTokens || deviceTokens.length === 0) {
      return;
    }

    const message: MulticastMessage = {
      notification: {
        title,
        body, 
      },
      data: data || {},
      tokens: deviceTokens,
    };

    try {
      const response = await getMessaging().sendEachForMulticast(message);
    } catch (error) {
      console.error('Error sending push notification:', error);
      throw error;
    }
  }

  async sendToAllUsers(
    title: string,
    body: string,
    data?: any,
  ): Promise<void> {
    // This would typically fetch all device tokens from the database
    // For now, this is a placeholder for the implementation
    console.log('Sending push notification to all users:', { title, body });
  }
}
