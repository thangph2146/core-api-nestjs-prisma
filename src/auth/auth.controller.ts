import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Get,
  Request,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request as ExpressRequest } from 'express';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto, RefreshTokenDto } from './dto/auth.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { LocalAuthGuard } from '../common/guards/local-auth.guard';
import { RateLimitGuard } from '../common/guards/rate-limit.guard';
import { Public } from '../common/decorators/public.decorator';
import {
  CreateOperation,
  FindOneOperation,
  DeleteOperation,
} from '../common/decorators/error-handling.decorators';
import {
  AuthRateLimit,
  PublicRateLimit,
} from '../common/decorators/rate-limit.decorator';

type JwtUser = {
  id: string;
  email?: string | null;
  role?: string | null;
} & Record<string, unknown>;

type AuthenticatedRequest = ExpressRequest & {
  user?: JwtUser;
};

const extractBearerToken = (
  authorizationHeader: string | string[] | undefined,
): string | undefined => {
  if (!authorizationHeader) {
    return undefined;
  }

  const headerValue = Array.isArray(authorizationHeader)
    ? authorizationHeader[0]
    : authorizationHeader;

  if (typeof headerValue !== 'string') {
    return undefined;
  }

  const trimmed = headerValue.trim();
  return trimmed.startsWith('Bearer ')
    ? trimmed.slice('Bearer '.length)
    : undefined;
};

const ensureJwtUser = (req: AuthenticatedRequest): JwtUser => {
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

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  @UseGuards(RateLimitGuard, LocalAuthGuard)
  @AuthRateLimit()
  async login(
    @Body() loginDto: LoginDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.authService.login(loginDto, req);
  }

  @Post('register')
  @Public()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(RateLimitGuard)
  @CreateOperation('User')
  @PublicRateLimit()
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('refresh')
  @Public()
  @HttpCode(HttpStatus.OK)
  @UseGuards(RateLimitGuard)
  @AuthRateLimit()
  async refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refresh(refreshTokenDto);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @DeleteOperation('User Session')
  async logout(@Request() req: AuthenticatedRequest) {
    const user = ensureJwtUser(req);
    const accessToken = extractBearerToken(req.headers.authorization);
    return this.authService.logout(user.id, accessToken);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @FindOneOperation('User Profile')
  async getProfile(@Request() req: AuthenticatedRequest) {
    const user = ensureJwtUser(req);
    return this.authService.getProfile(user.id);
  }

  @Get('verify')
  @UseGuards(JwtAuthGuard)
  @FindOneOperation('Token Verification')
  verifyToken(@Request() req: AuthenticatedRequest) {
    const user = ensureJwtUser(req);
    return {
      success: true,
      data: {
        user,
        valid: true,
      },
      timestamp: new Date().toISOString(),
    };
  }
}
