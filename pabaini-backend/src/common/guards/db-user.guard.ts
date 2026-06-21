import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from 'src/modules/users/users.service';

@Injectable()
export class DbUserGuard implements CanActivate {
  constructor(private usersService: UsersService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // authUser should be set by FirebaseAuthGuard
    const authUser = request.authUser;
    if (!authUser || !authUser.uid) {
      if (request.method === 'GET') {
        return true;
      }
      throw new UnauthorizedException('Authentication required');
    }

    // Fetch full user from database
    const dbUser = await this.usersService.findByFirebaseUid(authUser.uid);
    if (!dbUser) {
      if (request.method === 'GET') {
        return true;
      }
      throw new UnauthorizedException('User not found in database');
    }

    // Attach full DB user to request
    request.dbUser = dbUser;

    return true;
  }
}
