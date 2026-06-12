import { createParamDecorator, ExecutionContext } from '@nestjs/common';

// Returns the Firebase decoded token (set by FirebaseAuthGuard)
// Use @CurrentUser() when you only need the Firebase token payload (uid, email, etc.)
// Use @DbUser() when you need the full database user with role, id, etc.
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.authUser;
  },
);