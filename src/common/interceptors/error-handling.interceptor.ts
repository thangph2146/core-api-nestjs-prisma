import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Prisma } from '@prisma/client';

@Injectable()
export class ErrorHandlingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(ErrorHandlingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const stream$ = next.handle() as Observable<unknown>;
    return stream$.pipe(
      map((data: unknown) => {
        // Transform successful responses
        if (data && typeof data === 'object') {
          return {
            success: true,
            data,
            timestamp: new Date().toISOString(),
          };
        }
        return data;
      }),
      catchError((error: unknown) => {
        // Prefer logging message and stack to avoid passing unknown
        const err = error as Error;
        this.logger.error(err.message, err.stack);

        // Handle Prisma errors
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          return throwError(() => this.handlePrismaError(error));
        }

        // Handle Prisma validation errors
        if (error instanceof Prisma.PrismaClientValidationError) {
          return throwError(
            () =>
              new HttpException(
                'Validation error: Invalid data provided',
                HttpStatus.BAD_REQUEST,
              ),
          );
        }

        // Handle Prisma connection errors
        if (error instanceof Prisma.PrismaClientInitializationError) {
          return throwError(
            () =>
              new HttpException(
                'Database connection error',
                HttpStatus.SERVICE_UNAVAILABLE,
              ),
          );
        }

        // Handle Prisma timeout errors
        if (error instanceof Prisma.PrismaClientRustPanicError) {
          return throwError(
            () =>
              new HttpException(
                'Database operation timeout',
                HttpStatus.REQUEST_TIMEOUT,
              ),
          );
        }

        // Handle existing HTTP exceptions
        if (error instanceof HttpException) {
          return throwError(() => error);
        }

        // Handle generic errors
        const message =
          (error as { message?: string }).message || 'Internal server error';
        return throwError(
          () => new HttpException(message, HttpStatus.INTERNAL_SERVER_ERROR),
        );
      }),
    );
  }

  private handlePrismaError(
    error: Prisma.PrismaClientKnownRequestError,
  ): HttpException {
    switch (error.code) {
      case 'P2002': {
        // Unique constraint violation
        const target = error.meta?.target as string[];
        return new HttpException(
          `A record with this ${target?.join(', ') || 'field'} already exists`,
          HttpStatus.CONFLICT,
        );
      }

      case 'P2025':
        // Record not found
        return new HttpException('Record not found', HttpStatus.NOT_FOUND);

      case 'P2003':
        // Foreign key constraint violation
        return new HttpException(
          'Referenced record does not exist',
          HttpStatus.BAD_REQUEST,
        );

      case 'P2014':
        // Required relation violation
        return new HttpException(
          'Required relation is missing',
          HttpStatus.BAD_REQUEST,
        );

      case 'P2016':
        // Query interpretation error
        return new HttpException(
          'Invalid query parameters',
          HttpStatus.BAD_REQUEST,
        );

      case 'P2021':
        // Table does not exist
        return new HttpException(
          'Database table not found',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );

      case 'P2022':
        // Column does not exist
        return new HttpException(
          'Database column not found',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );

      default:
        return new HttpException(
          'Database operation failed',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
    }
  }
}
