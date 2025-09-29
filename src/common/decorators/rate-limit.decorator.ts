import { applyDecorators, SetMetadata } from '@nestjs/common';

export interface RateLimitOptions {
  windowMs: number; // Thời gian window (ms)
  max: number; // Số lượng request tối đa trong window
  message?: string; // Thông báo lỗi
  skipSuccessfulRequests?: boolean; // Bỏ qua các request thành công
  skipFailedRequests?: boolean; // Bỏ qua các request thất bại
}

export const RATE_LIMIT_KEY = 'rateLimit';

export function RateLimit(options: RateLimitOptions) {
  return applyDecorators(
    SetMetadata(RATE_LIMIT_KEY, options),
  );
}

// Predefined rate limit decorators for common use cases
export function AuthRateLimit() {
  return RateLimit({
    windowMs: 15 * 60 * 1000, // 15 phút
    max: 20, // 20 lần thử trong 15 phút
    message: 'Quá nhiều lần thử đăng nhập. Vui lòng thử lại sau 15 phút.',
    skipSuccessfulRequests: true,
  });
}

export function PublicRateLimit() {
  return RateLimit({
    windowMs: 15 * 60 * 1000, // 15 phút
    max: 100, // 100 requests trong 15 phút
    message: 'Quá nhiều requests. Vui lòng thử lại sau 15 phút.',
  });
}

export function StrictRateLimit() {
  return RateLimit({
    windowMs: 60 * 1000, // 1 phút
    max: 10, // 10 requests trong 1 phút
    message: 'Quá nhiều requests. Vui lòng thử lại sau 1 phút.',
  });
}
