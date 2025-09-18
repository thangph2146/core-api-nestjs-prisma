import { Module, Global } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ErrorHandlingInterceptor } from './interceptors/error-handling.interceptor';

@Global()
@Module({
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: ErrorHandlingInterceptor,
    },
  ],
  exports: [],
})
export class CommonModule {}
