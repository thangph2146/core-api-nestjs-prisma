import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { SessionService } from '../../auth/session.service';
import type { SessionInfo } from '../../auth/session.service';
import type { Request as ExpressRequest } from 'express';

type JwtPayload = {
  sub: unknown;
  email?: unknown;
  role?: unknown;
  [key: string]: unknown;
};

type SessionGuardUser = {
  id: string;
  email?: string;
  role?: string;
} & Record<string, unknown>;

type SessionGuardRequest = ExpressRequest & {
  user?: SessionGuardUser;
  session?: SessionInfo;
};

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly sessionService: SessionService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<SessionGuardRequest>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('Token không được cung cấp');
    }

    try {
      // Verify JWT token
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token);

      if (!payload || typeof payload.sub !== 'string') {
        throw new UnauthorizedException('Token không hợp lệ');
      }

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
        email: typeof payload.email === 'string' ? payload.email : undefined,
        role: typeof payload.role === 'string' ? payload.role : undefined,
      };
      request.session = session;

      return true;
    } catch {
      throw new UnauthorizedException('Token không hợp lệ');
    }
  }

  private extractTokenFromHeader(
    request: SessionGuardRequest,
  ): string | undefined {
    const authorizationHeader = request.headers.authorization;

    if (typeof authorizationHeader !== 'string') {
      return undefined;
    }

    const [type, token] = authorizationHeader.split(' ');
    return type === 'Bearer' ? token : undefined;
  }
}
