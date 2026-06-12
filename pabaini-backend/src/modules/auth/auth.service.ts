import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { UsersService } from '../users/users.service';
import { FirebaseAdminService } from 'src/config/firebase.service';

@Injectable()
export class AuthService {
  constructor(
    private firebase: FirebaseAdminService,
    private usersService: UsersService,
  ) { }

  async login(idToken: string) {
    let decoded: any;

    try {
      decoded = await this.firebase.auth().verifyIdToken(idToken);
    } catch {
      throw new UnauthorizedException('Invalid Firebase token');
    }

    const user = await this.usersService.findOrCreate({
      firebase_uid: decoded.uid,
      phone: decoded.phone_number || null,
      email: decoded.email || null,
      name: decoded.name || null,
      avatar_url: decoded.picture || null,
    });

    return { user };
  }
}