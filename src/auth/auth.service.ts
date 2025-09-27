import { Injectable, UnauthorizedException, ConflictException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto, RegisterDto, RefreshTokenDto } from './dto/auth.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
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
          userRoles: user.userRoles.map(ur => ({
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
      if (error instanceof UnauthorizedException || error instanceof BadRequestException) {
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
          userRoles: user.userRoles.map(ur => ({
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
      if (error instanceof ConflictException || error instanceof BadRequestException) {
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
      const payload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
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
      if (error instanceof UnauthorizedException || error instanceof BadRequestException) {
        throw error;
      }
      throw new UnauthorizedException('Token không hợp lệ');
    }
  }

  async logout(userId: string) {
    // Trong thực tế, bạn có thể lưu token vào blacklist
    // Ở đây chúng ta chỉ trả về success
    return {
      success: true,
      data: {
        message: 'Đăng xuất thành công',
      },
      timestamp: new Date().toISOString(),
    };
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
        permissions,
        userRoles: user.userRoles.map(ur => ({
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
  }

  private async generateTokens(user: any) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_SECRET,
        expiresIn: '15m',
      }),
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_REFRESH_SECRET,
        expiresIn: '7d',
      }),
    ]);

    return {
      accessToken,
      refreshToken,
      expiresIn: 15 * 60, // 15 minutes in seconds
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
