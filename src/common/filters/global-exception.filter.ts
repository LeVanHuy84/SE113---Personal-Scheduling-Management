import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message = this.extractMessage(exception);

    const conflictPayload = this.extractConflicts(exception);
    if (conflictPayload) {
      response.status(status).json({
        message,
        conflicts: conflictPayload,
      });
      return;
    }

    response.status(status).json({
      success: false,
      message,
      data: null,
    });
  }

  private extractMessage(exception: unknown): string {
    if (exception instanceof HttpException) {
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        return exceptionResponse;
      }

      if (
        exceptionResponse &&
        typeof exceptionResponse === 'object' &&
        'message' in exceptionResponse
      ) {
        const message = (exceptionResponse as { message: string | string[] })
          .message;

        if (Array.isArray(message)) {
          return message.join(', ');
        }

        return message;
      }

      return exception.message;
    }

    if (exception instanceof Error) {
      return exception.message;
    }

    return 'Internal server error';
  }

  private extractConflicts(exception: unknown): unknown[] | null {
    if (!(exception instanceof HttpException)) {
      return null;
    }

    const exceptionResponse = exception.getResponse();
    if (
      !exceptionResponse ||
      typeof exceptionResponse !== 'object' ||
      !('conflicts' in exceptionResponse)
    ) {
      return null;
    }

    const conflicts = (exceptionResponse as { conflicts?: unknown }).conflicts;
    return Array.isArray(conflicts) ? conflicts : null;
  }
}
