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
  Query,
} from '@nestjs/common';
import { AcademicResultsService } from './academic-results.service';
import { CreateAcademicResultDto } from './dto/create-academic-result.dto';
import { UpdateAcademicResultDto } from './dto/update-academic-result.dto';
import { BaseController } from '../common/base.controller';
import { AcademicResult } from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('academic-results')
export class AcademicResultsController extends BaseController<
  AcademicResult,
  CreateAcademicResultDto,
  UpdateAcademicResultDto
> {
  constructor(
    private readonly academicResultsService: AcademicResultsService,
  ) {
    super(academicResultsService, {
      modelName: 'academicResult',
      createDto: CreateAcademicResultDto,
      updateDto: UpdateAcademicResultDto,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get('my-results')
  async getMyResults(
    @Request() req: any,
    @Query('year') year?: string,
    @Query('semester') semester?: string,
    @Query('subject') subject?: string,
  ) {
    const filters = {
      year: year ? parseInt(year) : undefined,
      semester,
      subject,
    };
    return this.academicResultsService.getResultsByParentUserId(
      req.user.userId,
      filters,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('student/:studentId')
  async getResultsByStudent(
    @Param('studentId') studentId: string,
    @Query('year') year?: string,
    @Query('semester') semester?: string,
    @Query('subject') subject?: string,
  ) {
    const filters = {
      year: year ? parseInt(year) : undefined,
      semester,
      subject,
    };
    return this.academicResultsService.getResultsByStudentId(
      studentId,
      filters,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('student/:studentId/stats')
  async getStatsByStudent(@Param('studentId') studentId: string) {
    return this.academicResultsService.getStatsByStudentId(studentId);
  }
}

