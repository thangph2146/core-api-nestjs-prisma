import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAcademicResultDto } from './dto/create-academic-result.dto';
import { UpdateAcademicResultDto } from './dto/update-academic-result.dto';
import { AcademicResult, Prisma } from '@prisma/client';
import { BaseService } from '../common/base.service';

@Injectable()
export class AcademicResultsService extends BaseService<
  AcademicResult,
  CreateAcademicResultDto,
  UpdateAcademicResultDto
> {
  constructor(prisma: PrismaService) {
    super(prisma, {
      modelName: 'academicResult',
      searchFields: ['subject', 'semester', 'teacherName'],
      defaultInclude: {
        student: {
          include: {
            parent: true,
          },
        },
      },
      defaultOrderBy: { createdAt: 'desc' },
      columnFilterConfig: {
        subject: { type: 'text' },
        semester: { type: 'text' },
        year: { type: 'number' },
        grade: { type: 'text' },
        teacherName: { type: 'text' },
        createdAt: { type: 'date' },
        updatedAt: { type: 'date' },
      },
    });
  }

  async getResultsByStudentId(studentId: string, filters?: {
    year?: number;
    semester?: string;
    subject?: string;
  }) {
    const where: Prisma.AcademicResultWhereInput = {
      studentId,
      deletedAt: null,
    };

    if (filters?.year) {
      where.year = filters.year;
    }

    if (filters?.semester) {
      where.semester = filters.semester;
    }

    if (filters?.subject) {
      where.subject = { contains: filters.subject, mode: 'insensitive' };
    }

    return this.prisma.academicResult.findMany({
      where,
      orderBy: [
        { year: 'desc' },
        { semester: 'desc' },
        { subject: 'asc' },
      ],
    });
  }

  async getResultsByParentUserId(userId: string, filters?: {
    year?: number;
    semester?: string;
    subject?: string;
  }) {
    const parent = await this.prisma.parent.findFirst({
      where: {
        userId,
        deletedAt: null,
      },
      include: {
        students: {
          where: { deletedAt: null },
        },
      },
    });

    if (!parent) {
      throw new NotFoundException('Không tìm thấy thông tin phụ huynh');
    }

    const studentIds = parent.students.map(s => s.id);

    const where: Prisma.AcademicResultWhereInput = {
      studentId: { in: studentIds },
      deletedAt: null,
    };

    if (filters?.year) {
      where.year = filters.year;
    }

    if (filters?.semester) {
      where.semester = filters.semester;
    }

    if (filters?.subject) {
      where.subject = { contains: filters.subject, mode: 'insensitive' };
    }

    return this.prisma.academicResult.findMany({
      where,
      include: {
        student: true,
      },
      orderBy: [
        { year: 'desc' },
        { semester: 'desc' },
        { subject: 'asc' },
      ],
    });
  }

  async getStatsByStudentId(studentId: string) {
    const results = await this.prisma.academicResult.findMany({
      where: {
        studentId,
        deletedAt: null,
      },
    });

    if (results.length === 0) {
      return {
        totalSubjects: 0,
        averageScore: 0,
        highestScore: 0,
        lowestScore: 0,
      };
    }

    const scores = results.map(r => r.score);
    const sum = scores.reduce((a, b) => a + b, 0);

    return {
      totalSubjects: results.length,
      averageScore: parseFloat((sum / results.length).toFixed(2)),
      highestScore: Math.max(...scores),
      lowestScore: Math.min(...scores),
    };
  }

  async findAll(params?: {
    skip?: number;
    take?: number;
    where?: Prisma.AcademicResultWhereInput;
    orderBy?: Prisma.AcademicResultOrderByWithRelationInput;
    includeDeleted?: boolean;
    search?: string;
    columnFilters?: Record<string, string>;
  }): Promise<AcademicResult[]> {
    const {
      skip,
      take,
      where,
      orderBy,
      includeDeleted,
      search,
      columnFilters,
    } = params || {};

    const result = await this.findManyPaginatedWithFilters('academicResult', {
      page: skip ? Math.floor(skip / (take || 10)) + 1 : 1,
      limit: take || 10,
      where,
      orderBy,
      includeDeleted,
      search,
      columnFilters,
    });

    return result.items;
  }

  async findOne(
    id: string,
    includeDeleted: boolean = false,
  ): Promise<AcademicResult> {
    try {
      return await this.findUnique(
        'academicResult',
        { id },
        {
          student: {
            include: {
              parent: true,
            },
          },
        },
        includeDeleted,
      );
    } catch {
      throw new NotFoundException(`Không tìm thấy kết quả học tập với ID ${id}`);
    }
  }

  async create(
    createAcademicResultDto: CreateAcademicResultDto,
  ): Promise<AcademicResult> {
    // Verify student exists
    const student = await this.prisma.student.findUnique({
      where: { id: createAcademicResultDto.studentId },
    });

    if (!student) {
      throw new NotFoundException('Không tìm thấy học sinh');
    }

    return this.prisma.academicResult.create({
      data: createAcademicResultDto,
      include: {
        student: {
          include: {
            parent: true,
          },
        },
      },
    });
  }

  async update(
    id: string,
    updateAcademicResultDto: UpdateAcademicResultDto,
  ): Promise<AcademicResult> {
    await this.findOne(id);

    return this.prisma.academicResult.update({
      where: { id },
      data: updateAcademicResultDto,
      include: {
        student: {
          include: {
            parent: true,
          },
        },
      },
    });
  }

  async remove(id: string): Promise<AcademicResult> {
    await this.findOne(id);
    return this.softDelete('academicResult', id);
  }

  async hardDelete(id: string): Promise<AcademicResult> {
    await this.findOne(id);
    return this.hardDeleteRecord('academicResult', id);
  }

  async restore(id: string): Promise<AcademicResult> {
    return this.restoreRecord('academicResult', id);
  }

  async findDeleted(params?: {
    search?: string;
    columnFilters?: Record<string, string>;
    page?: number;
    limit?: number;
  }): Promise<{
    items: AcademicResult[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  }> {
    return this.findManyPaginatedWithFilters('academicResult', {
      page: params?.page || 1,
      limit: params?.limit || 10,
      where: { deletedAt: { not: null } },
      includeDeleted: true,
      search: params?.search,
      columnFilters: params?.columnFilters,
    });
  }
}

