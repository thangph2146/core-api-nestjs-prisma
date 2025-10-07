import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Get,
  Request,
} from '@nestjs/common';
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

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  @UseGuards(RateLimitGuard, LocalAuthGuard)
  @AuthRateLimit()
  async login(@Body() loginDto: LoginDto, @Request() req) {
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
  async logout(@Request() req) {
    const accessToken = req.headers.authorization?.replace('Bearer ', '');
    return this.authService.logout(req.user.id, accessToken);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @FindOneOperation('User Profile')
  async getProfile(@Request() req) {
    return this.authService.getProfile(req.user.id);
  }

  @Get('verify')
  @UseGuards(JwtAuthGuard)
  @FindOneOperation('Token Verification')
  async verifyToken(@Request() req) {
    return {
      success: true,
      data: {
        user: req.user,
        valid: true,
      },
      timestamp: new Date().toISOString(),
    };
  }
}
