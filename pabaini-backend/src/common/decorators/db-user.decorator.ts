import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { User } from 'src/modules/users/entities/user.entity';

// Returns the full DB User object (set by DbUserGuard after DB lookup)
// Use @DbUser() when you need role, id, etc. from the database
// Use @CurrentUser() when you only need the Firebase decoded token (uid)
export const DbUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): User => {
    const request = ctx.switchToHttp().getRequest();
    const dbUser = request.dbUser;

    if (!dbUser) {
      throw new UnauthorizedException('User not loaded in request context');
    }

    return dbUser;
  },
);
