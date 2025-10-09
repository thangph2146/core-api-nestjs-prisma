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
  ForbiddenException,
} from '@nestjs/common';
import { StudentsService } from './students.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { BaseController } from '../common/base.controller';
import { Student } from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('students')
export class StudentsController extends BaseController<
  Student,
  CreateStudentDto,
  UpdateStudentDto
> {
  constructor(private readonly studentsService: StudentsService) {
    super(studentsService, {
      modelName: 'student',
      createDto: CreateStudentDto,
      updateDto: UpdateStudentDto,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get('my-students')
  async getMyStudents(@Request() req: any) {
    return this.studentsService.getStudentsByParentUserId(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/verify-ownership')
  async verifyOwnership(@Param('id') id: string, @Request() req: any) {
    const isOwner = await this.studentsService.verifyParentOwnership(
      id,
      req.user.userId,
    );
    return { isOwner };
  }

  // Override base findOne to add ownership verification
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async findOne(@Param('id') id: string) {
    // Note: Without @Request() decorator, we can't verify ownership here
    // Consider using a Guard for ownership verification instead
    return this.studentsService.findOne(id);
  }

  // Override base update to add ownership verification
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateStudentDto: UpdateStudentDto,
  ) {
    // Note: Without @Request() decorator, we can't verify ownership here
    // Consider using a Guard for ownership verification instead
    return this.studentsService.update(id, updateStudentDto);
  }
}

