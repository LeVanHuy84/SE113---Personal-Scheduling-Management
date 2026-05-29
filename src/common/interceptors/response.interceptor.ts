import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

interface SuccessResponse<T> {
  success: true;
  message: string;
  data: T;
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<
  T,
  SuccessResponse<T>
> {
  intercept(
    _context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<SuccessResponse<T>> {
    return next.handle().pipe(
      map((payload: T) => {
        if (this.hasMessageAndData(payload)) {
          return {
            success: true,
            message: payload.message,
            data: payload.data,
          };
        }

        return {
          success: true,
          message: 'OK',
          data: payload,
        };
      }),
    );
  }

  private hasMessageAndData(
    payload: unknown,
  ): payload is { message: string; data: T } {
    return (
      !!payload &&
      typeof payload === 'object' &&
      'message' in payload &&
      'data' in payload &&
      typeof (payload as { message: unknown }).message === 'string'
    );
  }
}
