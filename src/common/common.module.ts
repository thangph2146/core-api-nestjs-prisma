import { Module, Global } from '@nestjs/common';
import { APP_INTERCEPTOR, APP_GUARD } from '@nestjs/core';
import { ErrorHandlingInterceptor } from './interceptors/error-handling.interceptor';
import { AdminAuthGuard } from './guards/admin-auth.guard';
import { JwtStrategy } from './strategies/jwt.strategy';

@Global()
@Module({
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: ErrorHandlingInterceptor,
    },
    JwtStrategy,
    // BẬT BẢO MẬT ADMIN: bỏ comment dòng dưới; TẮT khi test: comment đúng 1 dòng này
    { provide: APP_GUARD, useClass: AdminAuthGuard },
  ],
  exports: [],
})
export class CommonModule {}
