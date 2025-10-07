import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto, RegisterDto, RefreshTokenDto } from './dto/auth.dto';
import { SessionService } from './session.service';
import { Request } from 'express';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly sessionService: SessionService,
    private readonly configService: ConfigService,
  ) {}

  async login(loginDto: LoginDto, req?: Request) {
    try {
      const { email, password } = loginDto;

      // Validate input
      if (!email || !password) {
        throw new BadRequestException('Email và mật khẩu là bắt buộc');
      }

      // Tìm user theo email
      const user = await this.prisma.user.findUnique({
        where: { email },
        include: {
          userRoles: {
            include: {
              role: {
                include: {
                  rolePermissions: {
                    include: {
                      permission: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!user) {
        throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
      }

      // Kiểm tra mật khẩu
      if (!user.password) {
        throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
      }
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
      }

      // Kiểm tra user có bị xóa không
      if (user.deletedAt) {
        throw new UnauthorizedException('Tài khoản đã bị vô hiệu hóa');
      }

      // Tạo tokens
      const tokens = await this.generateTokens(user);

      // Tạo session
      const sessionInfo = req
        ? this.sessionService.extractSessionInfoFromRequest(req)
        : {};
      const expiresAt = new Date(Date.now() + tokens.expiresIn * 1000);

      const session = await this.sessionService.createSession({
        userId: user.id,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        userAgent: sessionInfo.userAgent,
        ipAddress: sessionInfo.ipAddress,
        expiresAt,
      });

      // Lấy permissions của user
      const permissions = this.extractUserPermissions(user);

      return {
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
          },
          tokens,
          permissions,
          userRoles: user.userRoles.map((ur) => ({
            id: ur.id,
            role: {
              id: ur.role.id,
              name: ur.role.name,
              displayName: ur.role.displayName,
              description: ur.role.description,
            },
          })),
          session: {
            id: session.id,
            lastActivity: session.lastActivity,
            userAgent: session.userAgent,
            ipAddress: session.ipAddress,
          },
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      if (
        error instanceof UnauthorizedException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Lỗi hệ thống khi đăng nhập');
    }
  }

  async register(registerDto: RegisterDto) {
    try {
      const { email, password, name, role = 'USER' } = registerDto;

      // Validate input
      if (!email || !password) {
        throw new BadRequestException('Email và mật khẩu là bắt buộc');
      }

      // Kiểm tra email đã tồn tại chưa
      const existingUser = await this.prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        throw new ConflictException('Email đã được sử dụng');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Tạo user mới
      const user = await this.prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          role: role as any,
        },
        include: {
          userRoles: {
            include: {
              role: {
                include: {
                  rolePermissions: {
                    include: {
                      permission: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      // Tạo tokens
      const tokens = await this.generateTokens(user);

      // Lấy permissions của user
      const permissions = this.extractUserPermissions(user);

      return {
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
          },
          tokens,
          permissions,
          userRoles: user.userRoles.map((ur) => ({
            id: ur.id,
            role: {
              id: ur.role.id,
              name: ur.role.name,
              displayName: ur.role.displayName,
              description: ur.role.description,
            },
          })),
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      if (
        error instanceof ConflictException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Lỗi hệ thống khi đăng ký');
    }
  }

  async refresh(refreshTokenDto: RefreshTokenDto) {
    try {
      const { refreshToken } = refreshTokenDto;

      if (!refreshToken) {
        throw new BadRequestException('Refresh token là bắt buộc');
      }

      // Verify refresh token
      const refreshSecret = this.configService.get<string>(
        'JWT_REFRESH_SECRET',
        this.configService.get<string>('JWT_SECRET', 'dev-secret'),
      );

      const payload = this.jwtService.verify(refreshToken, {
        secret: refreshSecret,
      });

      // Tìm user
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        include: {
          userRoles: {
            include: {
              role: {
                include: {
                  rolePermissions: {
                    include: {
                      permission: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!user || user.deletedAt) {
        throw new UnauthorizedException('Token không hợp lệ');
      }

      // Tạo tokens mới
      const tokens = await this.generateTokens(user);

      return {
        success: true,
        data: {
          tokens,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      if (
        error instanceof UnauthorizedException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new UnauthorizedException('Token không hợp lệ');
    }
  }

  async logout(userId: string, accessToken?: string) {
    try {
      // Invalidate session
      if (accessToken) {
        await this.sessionService.invalidateSessionByAccessToken(accessToken);
      } else {
        // Invalidate all sessions for user if no specific token provided
        await this.sessionService.invalidateAllUserSessions(userId);
      }

      return {
        success: true,
        data: {
          message: 'Đăng xuất thành công',
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new InternalServerErrorException('Lỗi hệ thống khi đăng xuất');
    }
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('User không tồn tại');
    }

    const permissions = this.extractUserPermissions(user);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      permissions,
      userRoles: user.userRoles.map((ur) => ({
        id: ur.id,
        role: {
          id: ur.role.id,
          name: ur.role.name,
          displayName: ur.role.displayName,
          description: ur.role.description,
        },
      })),
    };
  }

  private async generateTokens(user: any) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessTokenSecret = this.configService.get<string>(
      'JWT_SECRET',
      'dev-secret',
    );
    const refreshTokenSecret = this.configService.get<string>(
      'JWT_REFRESH_SECRET',
      accessTokenSecret,
    );
    const accessTokenExpiresIn = this.configService.get<string>(
      'JWT_ACCESS_TOKEN_EXPIRES_IN',
      '15m',
    );
    const refreshTokenExpiresIn = this.configService.get<string>(
      'JWT_REFRESH_TOKEN_EXPIRES_IN',
      '7d',
    );

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: accessTokenSecret,
        expiresIn: accessTokenExpiresIn,
      }),
      this.jwtService.signAsync(payload, {
        secret: refreshTokenSecret,
        expiresIn: refreshTokenExpiresIn,
      }),
    ]);

    const resolveExpiresInSeconds = (value: string | number): number => {
      if (typeof value === 'number') {
        return value;
      }

      const trimmed = value.trim();
      const directNumber = Number(trimmed);

      if (!Number.isNaN(directNumber) && directNumber > 0) {
        return directNumber;
      }

      const match = trimmed.match(/^(\d+)([smhd])$/i);

      if (!match) {
        return 15 * 60;
      }

      const amount = Number(match[1]);
      const unit = match[2]?.toLowerCase();

      const unitMap: Record<string, number> = {
        s: 1,
        m: 60,
        h: 60 * 60,
        d: 60 * 60 * 24,
      };

      const multiplier = unit ? unitMap[unit] : undefined;

      if (!multiplier) {
        return 15 * 60;
      }

      return amount * multiplier;
    };

    return {
      accessToken,
      refreshToken,
      expiresIn: resolveExpiresInSeconds(accessTokenExpiresIn),
    };
  }

  private extractUserPermissions(user: any) {
    const permissions = new Set();
    const rolePermissions = new Set();

    user.userRoles.forEach((userRole: any) => {
      userRole.role.rolePermissions.forEach((rp: any) => {
        if (rp.permission.isActive) {
          permissions.add(rp.permission);
          rolePermissions.add(rp);
        }
      });
    });

    return {
      permissions: Array.from(permissions),
      rolePermissions: Array.from(rolePermissions),
    };
  }
}
