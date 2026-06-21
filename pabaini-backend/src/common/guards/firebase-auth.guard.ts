import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { FirebaseAdminService } from '../../config/firebase.service';

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  constructor(private firebase: FirebaseAdminService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const authHeader = request.headers.authorization;

    if (!authHeader) {
      if (request.method === 'GET') {
        return true;
      }
      throw new UnauthorizedException('No authorization header');
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      if (request.method === 'GET') {
        return true;
      }
      throw new UnauthorizedException('No token provided');
    }

    try {
      const decoded = await this.firebase.auth().verifyIdToken(token);

      // attach Firebase decoded token to request as authUser (contains uid, email, etc.)
      request.authUser = decoded;

      return true;
    } catch (err) {
      if (request.method === 'GET') {
        return true;
      }
      throw new UnauthorizedException('Invalid Firebase token');
    }
  }
}