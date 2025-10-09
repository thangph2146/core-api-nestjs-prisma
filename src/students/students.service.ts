import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { Student, Prisma } from '@prisma/client';
import { BaseService } from '../common/base.service';

@Injectable()
export class StudentsService extends BaseService<
  Student,
  CreateStudentDto,
  UpdateStudentDto
> {
  constructor(prisma: PrismaService) {
    super(prisma, {
      modelName: 'student',
      searchFields: ['fullName', 'studentCode'],
      defaultInclude: {
        parent: true,
        academicResults: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
        },
      },
      defaultOrderBy: { createdAt: 'desc' },
      columnFilterConfig: {
        fullName: { type: 'text' },
        studentCode: { type: 'text' },
        className: { type: 'text' },
        grade: { type: 'text' },
        gender: { type: 'select' },
        isActive: { type: 'boolean' },
        createdAt: { type: 'date' },
        updatedAt: { type: 'date' },
      },
    });
  }

  async getStudentsByParentId(parentId: string) {
    return this.prisma.student.findMany({
      where: {
        parentId,
        deletedAt: null,
      },
      include: {
        academicResults: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  async getStudentsByParentUserId(userId: string) {
    const parent = await this.prisma.parent.findFirst({
      where: {
        userId,
        deletedAt: null,
      },
    });

    if (!parent) {
      throw new NotFoundException('Không tìm thấy thông tin phụ huynh');
    }

    return this.getStudentsByParentId(parent.id);
  }

  async verifyParentOwnership(studentId: string, userId: string): Promise<boolean> {
    const student = await this.prisma.student.findFirst({
      where: {
        id: studentId,
        deletedAt: null,
      },
      include: {
        parent: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!student) {
      return false;
    }

    return student.parent.user?.id === userId;
  }

  async findAll(params?: {
    skip?: number;
    take?: number;
    where?: Prisma.StudentWhereInput;
    orderBy?: Prisma.StudentOrderByWithRelationInput;
    includeDeleted?: boolean;
    search?: string;
    columnFilters?: Record<string, string>;
  }): Promise<Student[]> {
    const {
      skip,
      take,
      where,
      orderBy,
      includeDeleted,
      search,
      columnFilters,
    } = params || {};

    const result = await this.findManyPaginatedWithFilters('student', {
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

  async findOne(id: string, includeDeleted: boolean = false): Promise<Student> {
    try {
      return await this.findUnique(
        'student',
        { id },
        {
          parent: true,
          academicResults: {
            where: { deletedAt: null },
            orderBy: { createdAt: 'desc' },
          },
        },
        includeDeleted,
      );
    } catch {
      throw new NotFoundException(`Không tìm thấy học sinh với ID ${id}`);
    }
  }

  async create(createStudentDto: CreateStudentDto): Promise<Student> {
    // Check if student code already exists
    const existingStudent = await this.prisma.student.findUnique({
      where: { studentCode: createStudentDto.studentCode },
    });

    if (existingStudent) {
      throw new ConflictException('Mã học sinh đã được sử dụng');
    }

    // Verify parent exists
    const parent = await this.prisma.parent.findUnique({
      where: { id: createStudentDto.parentId },
    });

    if (!parent) {
      throw new NotFoundException('Không tìm thấy phụ huynh');
    }

    return this.prisma.student.create({
      data: {
        ...createStudentDto,
        dateOfBirth: new Date(createStudentDto.dateOfBirth),
      },
      include: {
        parent: true,
        academicResults: true,
      },
    });
  }

  async update(id: string, updateStudentDto: UpdateStudentDto): Promise<Student> {
    await this.findOne(id);

    // Check if student code is being updated and already exists
    if (updateStudentDto.studentCode) {
      const existingStudent = await this.prisma.student.findFirst({
        where: {
          studentCode: updateStudentDto.studentCode,
          id: { not: id },
        },
      });

      if (existingStudent) {
        throw new ConflictException('Mã học sinh đã được sử dụng');
      }
    }

    const updateData: any = { ...updateStudentDto };
    if (updateData.dateOfBirth) {
      updateData.dateOfBirth = new Date(updateData.dateOfBirth);
    }

    return this.prisma.student.update({
      where: { id },
      data: updateData,
      include: {
        parent: true,
        academicResults: true,
      },
    });
  }

  async remove(id: string): Promise<Student> {
    await this.findOne(id);
    return this.softDelete('student', id);
  }

  async hardDelete(id: string): Promise<Student> {
    await this.findOne(id);
    return this.hardDeleteRecord('student', id);
  }

  async restore(id: string): Promise<Student> {
    return this.restoreRecord('student', id);
  }

  async findDeleted(params?: {
    search?: string;
    columnFilters?: Record<string, string>;
    page?: number;
    limit?: number;
  }): Promise<{
    items: Student[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  }> {
    return this.findManyPaginatedWithFilters('student', {
      page: params?.page || 1,
      limit: params?.limit || 10,
      where: { deletedAt: { not: null } },
      includeDeleted: true,
      search: params?.search,
      columnFilters: params?.columnFilters,
    });
  }
}

