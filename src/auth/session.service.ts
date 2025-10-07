import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

export interface CreateSessionData {
  userId: string;
  accessToken: string;
  refreshToken: string;
  userAgent?: string;
  ipAddress?: string;
  expiresAt: Date;
}

export interface SessionInfo {
  id: string;
  userId: string;
  userAgent?: string | null;
  ipAddress?: string | null;
  isActive: boolean;
  expiresAt: Date;
  lastActivity: Date;
  createdAt: Date;
  user: {
    id: string;
    email: string;
    name: string | null;
    role: string;
  };
}

@Injectable()
export class SessionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Tạo session mới cho user
   */
  async createSession(data: CreateSessionData): Promise<SessionInfo> {
    const session = await this.prisma.session.create({
      data: {
        userId: data.userId,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        userAgent: data.userAgent,
        ipAddress: data.ipAddress,
        expiresAt: data.expiresAt,
        lastActivity: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        },
      },
    });

    return session;
  }

  /**
   * Tìm session theo access token
   */
  async findSessionByAccessToken(
    accessToken: string,
  ): Promise<SessionInfo | null> {
    const session = await this.prisma.session.findUnique({
      where: {
        accessToken,
        isActive: true,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        },
      },
    });

    if (!session) {
      return null;
    }

    // Kiểm tra session có hết hạn không
    if (session.expiresAt < new Date()) {
      await this.invalidateSession(session.id);
      return null;
    }

    return session;
  }

  /**
   * Tìm session theo refresh token
   */
  async findSessionByRefreshToken(
    refreshToken: string,
  ): Promise<SessionInfo | null> {
    const session = await this.prisma.session.findUnique({
      where: {
        refreshToken,
        isActive: true,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        },
      },
    });

    if (!session) {
      return null;
    }

    // Kiểm tra session có hết hạn không
    if (session.expiresAt < new Date()) {
      await this.invalidateSession(session.id);
      return null;
    }

    return session;
  }

  /**
   * Cập nhật last activity của session
   */
  async updateLastActivity(sessionId: string): Promise<void> {
    await this.prisma.session.update({
      where: { id: sessionId },
      data: { lastActivity: new Date() },
    });
  }

  /**
   * Vô hiệu hóa session (logout)
   */
  async invalidateSession(sessionId: string): Promise<void> {
    await this.prisma.session.update({
      where: { id: sessionId },
      data: { isActive: false },
    });
  }

  /**
   * Vô hiệu hóa session theo access token
   */
  async invalidateSessionByAccessToken(accessToken: string): Promise<void> {
    await this.prisma.session.updateMany({
      where: { accessToken, isActive: true },
      data: { isActive: false },
    });
  }

  /**
   * Vô hiệu hóa tất cả sessions của user
   */
  async invalidateAllUserSessions(userId: string): Promise<void> {
    await this.prisma.session.updateMany({
      where: { userId, isActive: true },
      data: { isActive: false },
    });
  }

  /**
   * Lấy tất cả active sessions của user
   */
  async getUserActiveSessions(userId: string): Promise<SessionInfo[]> {
    const sessions = await this.prisma.session.findMany({
      where: {
        userId,
        isActive: true,
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        },
      },
      orderBy: {
        lastActivity: 'desc',
      },
    });

    return sessions;
  }

  /**
   * Lấy thông tin session từ request
   */
  extractSessionInfoFromRequest(req: Request): {
    userAgent?: string;
    ipAddress?: string;
  } {
    const userAgent = req.headers['user-agent'];
    const ipAddress =
      req.ip || req.connection.remoteAddress || req.socket.remoteAddress;

    return {
      userAgent: userAgent || undefined,
      ipAddress: ipAddress || undefined,
    };
  }

  /**
   * Làm sạch expired sessions
   */
  async cleanupExpiredSessions(): Promise<number> {
    const result = await this.prisma.session.updateMany({
      where: {
        isActive: true,
        expiresAt: {
          lt: new Date(),
        },
      },
      data: {
        isActive: false,
      },
    });

    return result.count;
  }

  /**
   * Kiểm tra và refresh session nếu cần
   */
  async refreshSessionIfNeeded(
    sessionId: string,
    newAccessToken: string,
    newRefreshToken: string,
    newExpiresAt: Date,
  ): Promise<SessionInfo | null> {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId, isActive: true },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        },
      },
    });

    if (!session) {
      return null;
    }

    // Cập nhật tokens mới
    const updatedSession = await this.prisma.session.update({
      where: { id: sessionId },
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        expiresAt: newExpiresAt,
        lastActivity: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        },
      },
    });

    return updatedSession;
  }

  /**
   * Lấy thống kê sessions
   */
  async getSessionStats(userId?: string): Promise<{
    totalActive: number;
    totalExpired: number;
    totalInactive: number;
  }> {
    const where = userId ? { userId } : {};

    const [active, expired, inactive] = await Promise.all([
      this.prisma.session.count({
        where: {
          ...where,
          isActive: true,
          expiresAt: { gt: new Date() },
        },
      }),
      this.prisma.session.count({
        where: {
          ...where,
          isActive: true,
          expiresAt: { lte: new Date() },
        },
      }),
      this.prisma.session.count({
        where: {
          ...where,
          isActive: false,
        },
      }),
    ]);

    return {
      totalActive: active,
      totalExpired: expired,
      totalInactive: inactive,
    };
  }
}
