import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  RATE_LIMIT_KEY,
  RateLimitOptions,
} from '../decorators/rate-limit.decorator';

// Simple in-memory rate limiter (trong production nên dùng Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const rateLimitOptions = this.reflector.getAllAndOverride<RateLimitOptions>(
      RATE_LIMIT_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!rateLimitOptions) {
      return true; // Không có rate limit
    }

    const request = context.switchToHttp().getRequest();
    const clientId = this.getClientId(request);
    const now = Date.now();
    const windowMs = rateLimitOptions.windowMs;
    const max = rateLimitOptions.max;

    // Lấy thông tin rate limit hiện tại
    const current = rateLimitStore.get(clientId);

    if (!current || now > current.resetTime) {
      // Tạo mới hoặc reset window
      rateLimitStore.set(clientId, {
        count: 1,
        resetTime: now + windowMs,
      });
      return true;
    }

    if (current.count >= max) {
      // Vượt quá giới hạn
      const message =
        rateLimitOptions.message || 'Quá nhiều requests. Vui lòng thử lại sau.';
      throw new HttpException(
        {
          success: false,
          message,
          timestamp: new Date().toISOString(),
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Tăng counter
    current.count++;
    rateLimitStore.set(clientId, current);

    return true;
  }

  private getClientId(request: any): string {
    // Ưu tiên IP address, fallback về user ID nếu có
    const ip = request.ip || request.connection?.remoteAddress || 'unknown';
    const userId = request.user?.id;
    return userId ? `${userId}:${ip}` : ip;
  }
}
