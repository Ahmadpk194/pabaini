import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  success: boolean;
  status: number;
  message?: string;
  data: T;
}

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, Response<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    return next.handle().pipe(
      map((data) => {
        // If controller returns { data, message } format, extract message
        if (data && typeof data === 'object' && 'message' in data && 'data' in data) {
          return {
            success: true,
            status: context.switchToHttp().getResponse().statusCode,
            message: data.message,
            data: data.data,
          };
        }
        return {
          success: true,
          status: context.switchToHttp().getResponse().statusCode,
          data,
        };
      }),
    );
  }
}
