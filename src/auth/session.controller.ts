import {
  Controller,
  Get,
  Delete,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { SessionService } from './session.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { SessionGuard } from '../common/guards/session.guard';
import {
  FindOneOperation,
  DeleteOperation,
} from '../common/decorators/error-handling.decorators';
import type { Request as ExpressRequest } from 'express';

type JwtUser = {
  id: string;
  role?: string | null;
} & Record<string, unknown>;

type SessionContext = {
  id: string;
} & Record<string, unknown>;

type SessionControllerRequest = ExpressRequest & {
  user?: JwtUser;
  session?: SessionContext;
};

const ensureJwtUser = (req: SessionControllerRequest): JwtUser => {
  const { user } = req;

  if (
    user &&
    typeof user === 'object' &&
    'id' in user &&
    typeof (user as { id: unknown }).id === 'string'
  ) {
    return user as JwtUser;
  }

  throw new UnauthorizedException('User context is missing');
};

const ensureSessionContext = (
  req: SessionControllerRequest,
): SessionContext => {
  const { session } = req;

  if (
    session &&
    typeof session === 'object' &&
    'id' in session &&
    typeof (session as { id: unknown }).id === 'string'
  ) {
    return session;
  }

  throw new UnauthorizedException('Session context is missing');
};

@Controller('sessions')
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}

  /**
   * Lấy tất cả active sessions của user hiện tại
   */
  @Get('my-sessions')
  @UseGuards(JwtAuthGuard)
  @FindOneOperation('User Sessions')
  async getMySessions(@Request() req: SessionControllerRequest) {
    const user = ensureJwtUser(req);
    const sessions = await this.sessionService.getUserActiveSessions(user.id);

    return {
      success: true,
      data: {
        sessions: sessions.map((session) => ({
          id: session.id,
          userAgent: session.userAgent,
          ipAddress: session.ipAddress,
          isActive: session.isActive,
          expiresAt: session.expiresAt,
          lastActivity: session.lastActivity,
          createdAt: session.createdAt,
        })),
      },
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Lấy thống kê sessions của user hiện tại
   */
  @Get('stats')
  @UseGuards(JwtAuthGuard)
  @FindOneOperation('Session Stats')
  async getSessionStats(@Request() req: SessionControllerRequest) {
    const user = ensureJwtUser(req);
    const stats = await this.sessionService.getSessionStats(user.id);

    return {
      success: true,
      data: {
        stats,
      },
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Xóa session cụ thể
   */
  @Delete(':sessionId')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @DeleteOperation('Session')
  async deleteSession(
    @Param('sessionId') sessionId: string,
    @Request() req: SessionControllerRequest,
  ) {
    // Kiểm tra session thuộc về user hiện tại
    const user = ensureJwtUser(req);
    const userSessions = await this.sessionService.getUserActiveSessions(
      user.id,
    );
    const sessionExists = userSessions.some(
      (session) => session.id === sessionId,
    );

    if (!sessionExists) {
      throw new ForbiddenException(
        'Session không tồn tại hoặc không thuộc về bạn',
      );
    }

    await this.sessionService.invalidateSession(sessionId);

    return {
      success: true,
      data: {
        message: 'Session đã được xóa thành công',
      },
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Xóa tất cả sessions của user hiện tại (trừ session hiện tại)
   */
  @Delete('all-others')
  @HttpCode(HttpStatus.OK)
  @UseGuards(SessionGuard)
  @DeleteOperation('All Other Sessions')
  async deleteAllOtherSessions(@Request() req: SessionControllerRequest) {
    const user = ensureJwtUser(req);
    const session = ensureSessionContext(req);
    const currentSessionId = session.id;
    const userSessions = await this.sessionService.getUserActiveSessions(
      user.id,
    );

    // Xóa tất cả sessions trừ session hiện tại
    const sessionsToDelete = userSessions.filter(
      (session) => session.id !== currentSessionId,
    );

    for (const session of sessionsToDelete) {
      await this.sessionService.invalidateSession(session.id);
    }

    return {
      success: true,
      data: {
        message: `Đã xóa ${sessionsToDelete.length} session(s) khác`,
        deletedCount: sessionsToDelete.length,
      },
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Làm sạch expired sessions (admin only)
   */
  @Delete('cleanup/expired')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @DeleteOperation('Expired Sessions')
  async cleanupExpiredSessions(@Request() req: SessionControllerRequest) {
    // Chỉ admin mới có thể cleanup
    const user = ensureJwtUser(req);
    if (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN') {
      throw new ForbiddenException('Không có quyền thực hiện hành động này');
    }

    const deletedCount = await this.sessionService.cleanupExpiredSessions();

    return {
      success: true,
      data: {
        message: `Đã xóa ${deletedCount} session(s) hết hạn`,
        deletedCount,
      },
      timestamp: new Date().toISOString(),
    };
  }
}
