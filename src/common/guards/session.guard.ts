import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { SessionService } from '../../auth/session.service';

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly sessionService: SessionService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('Token không được cung cấp');
    }

    try {
      // Verify JWT token
      const payload = await this.jwtService.verifyAsync(token);
      
      // Check if session exists and is active
      const session = await this.sessionService.findSessionByAccessToken(token);
      
      if (!session) {
        throw new UnauthorizedException('Session không hợp lệ hoặc đã hết hạn');
      }

      // Update last activity
      await this.sessionService.updateLastActivity(session.id);

      // Attach user and session to request
      request.user = {
        id: payload.sub,
        email: payload.email,
        role: payload.role,
      };
      request.session = session;

      return true;
    } catch (error) {
      throw new UnauthorizedException('Token không hợp lệ');
    }
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
