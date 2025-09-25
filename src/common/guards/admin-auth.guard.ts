import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

/**
 * AdminAuthGuard: Bảo vệ tất cả route TRỪ các route bắt đầu bằng /public
 * - Kiểm tra header Authorization: Bearer <token>
 * - Tùy biến validateToken() theo nhu cầu (JWT, API key, v.v.)
 *
 * TẮT bảo mật khi test: vào CommonModule và comment đúng 1 dòng APP_GUARD.
 */
@Injectable()
export class AdminAuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request & { headers: Record<string, string | undefined> }>();

    // Bỏ qua các route được đánh dấu @Public()
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const authHeader = req.headers['authorization'] || req.headers['Authorization' as any] as string | undefined;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return false;

    const token = authHeader.slice('Bearer '.length).trim();
    return await this.validateToken(token);
  }

  private async validateToken(token: string): Promise<boolean> {
    // TODO: Thay thế bằng xác thực JWT/Key thực tế.
    // Tạm thời: token phải có độ dài tối thiểu để tránh rỗng.
    return token.length > 10;
  }
}


