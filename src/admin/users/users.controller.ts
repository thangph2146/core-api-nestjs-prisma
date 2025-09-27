import { Controller } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { BaseController } from '../../common/base.controller';
import { User } from '@prisma/client';

@Controller('users')
export class UsersController extends BaseController<
  User,
  CreateUserDto,
  UpdateUserDto
> {
  constructor(private readonly usersService: UsersService) {
    super(usersService, {
      modelName: 'user',
      createDto: CreateUserDto,
      updateDto: UpdateUserDto,
    });
  }
}
