import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ParentsService } from './parents.service';
import { CreateParentDto } from './dto/create-parent.dto';
import { UpdateParentDto } from './dto/update-parent.dto';
import { RegisterParentDto } from './dto/register-parent.dto';
import { LoginParentDto } from './dto/login-parent.dto';
import { BaseController } from '../common/base.controller';
import { Parent } from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Public } from '../common/decorators/public.decorator';

@Controller('parents')
export class ParentsController extends BaseController<
  Parent,
  CreateParentDto,
  UpdateParentDto
> {
  constructor(private readonly parentsService: ParentsService) {
    super(parentsService, {
      modelName: 'parent',
      createDto: CreateParentDto,
      updateDto: UpdateParentDto,
    });
  }

  @Public()
  @Post('register')
  async register(@Body() registerDto: RegisterParentDto) {
    return this.parentsService.register(registerDto);
  }

  @Public()
  @Post('login')
  async login(@Body() loginDto: LoginParentDto) {
    return this.parentsService.login(loginDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Request() req: any) {
    return this.parentsService.getProfile(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  async updateProfile(@Request() req: any, @Body() updateDto: UpdateParentDto) {
    return this.parentsService.updateProfile(req.user.userId, updateDto);
  }
}

