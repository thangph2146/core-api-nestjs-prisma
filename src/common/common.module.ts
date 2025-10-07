import { Module, Global } from '@nestjs/common';
import { APP_INTERCEPTOR, APP_GUARD } from '@nestjs/core';
import { ErrorHandlingInterceptor } from './interceptors/error-handling.interceptor';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { RateLimitGuard } from './guards/rate-limit.guard';
import { PrismaModule } from '../prisma/prisma.module';

@Global()
@Module({
  imports: [PrismaModule], // Cần PrismaModule cho LocalStrategy
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: ErrorHandlingInterceptor,
    },
    JwtStrategy,
    LocalStrategy,
    JwtAuthGuard,
    LocalAuthGuard,
    RateLimitGuard,
    // 🔒 BẢO MẬT: Bỏ comment dòng dưới để bật JWT authentication cho toàn bộ app
    // 🔓 TẮT BẢO MẬT: Comment dòng dưới để tắt JWT authentication (chỉ dùng khi test)
    // { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
  exports: [
    JwtAuthGuard,
    LocalAuthGuard,
    JwtStrategy,
    LocalStrategy,
    RateLimitGuard,
  ], // Export để các module khác có thể sử dụng
})
export class CommonModule {}
