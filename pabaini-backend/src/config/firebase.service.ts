import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

@Injectable()
export class FirebaseAdminService implements OnModuleInit {
  constructor(private readonly config: ConfigService) { }

  onModuleInit() {
    if (getApps().length > 0) return;

    const projectId = this.config.get<string>('FIREBASE_PROJECT_ID');
    const clientEmail = this.config.get<string>('FIREBASE_CLIENT_EMAIL');
    const privateKey = this.config
      .get<string>('FIREBASE_PRIVATE_KEY')
      ?.replace(/\\n/g, '\n');

    // console.log('Firebase config check:', {
    //   projectId: !!projectId,
    //   clientEmail: !!clientEmail,
    //   privateKey: !!privateKey,
    // });

    initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
    console.log('✅ Firebase Admin SDK initialized successfully');
  }

  /**
   * Firebase Auth instance
   * Used for:
   * - verifyIdToken()
   * - getUser()
   * - createUser()
   */
  auth() {
    return getAuth();
  }
}