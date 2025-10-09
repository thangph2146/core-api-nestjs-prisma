import {
  Injectable,
  NotFoundException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateParentDto } from './dto/create-parent.dto';
import { UpdateParentDto } from './dto/update-parent.dto';
import { RegisterParentDto } from './dto/register-parent.dto';
import { LoginParentDto } from './dto/login-parent.dto';
import { Parent, Prisma, Role } from '@prisma/client';
import { BaseService } from '../common/base.service';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class ParentsService extends BaseService<
  Parent,
  CreateParentDto,
  UpdateParentDto
> {
  constructor(
    prisma: PrismaService,
    private jwtService: JwtService,
  ) {
    super(prisma, {
      modelName: 'parent',
      searchFields: ['fullName', 'email', 'phone'],
      defaultInclude: {
        students: true,
      },
      defaultOrderBy: { createdAt: 'desc' },
      columnFilterConfig: {
        fullName: { type: 'text' },
        email: { type: 'text' },
        phone: { type: 'text' },
        isActive: { type: 'boolean' },
        createdAt: { type: 'date' },
        updatedAt: { type: 'date' },
      },
    });
  }

  async register(registerDto: RegisterParentDto) {
    // Check if email or phone already exists
    const existingParent = await this.prisma.parent.findFirst({
      where: {
        OR: [{ email: registerDto.email }, { phone: registerDto.phone }],
      },
    });

    if (existingParent) {
      throw new ConflictException('Email hoặc số điện thoại đã được sử dụng');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    // Create user account
    const user = await this.prisma.user.create({
      data: {
        email: registerDto.email,
        name: registerDto.fullName,
        password: hashedPassword,
        role: Role.PARENT,
      },
    });

    // Create parent record
    const parent = await this.prisma.parent.create({
      data: {
        userId: user.id,
        fullName: registerDto.fullName,
        phone: registerDto.phone,
        email: registerDto.email,
        address: registerDto.address,
      },
      include: {
        user: true,
        students: true,
      },
    });

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.email);

    return {
      parent,
      ...tokens,
    };
  }

  async login(loginDto: LoginParentDto) {
    // Find parent by email or phone
    const parent = await this.prisma.parent.findFirst({
      where: {
        OR: [
          { email: loginDto.emailOrPhone },
          { phone: loginDto.emailOrPhone },
        ],
        isActive: true,
        deletedAt: null,
      },
      include: {
        user: true,
        students: true,
      },
    });

    if (!parent || !parent.user) {
      throw new UnauthorizedException('Thông tin đăng nhập không chính xác');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      parent.user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Thông tin đăng nhập không chính xác');
    }

    // Generate tokens
    const tokens = await this.generateTokens(parent.user.id, parent.user.email);

    return {
      parent,
      ...tokens,
    };
  }

  async getProfile(userId: string) {
    const parent = await this.prisma.parent.findFirst({
      where: {
        userId,
        deletedAt: null,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            avatar: true,
            createdAt: true,
          },
        },
        students: {
          where: {
            deletedAt: null,
          },
          include: {
            academicResults: {
              where: {
                deletedAt: null,
              },
              orderBy: {
                createdAt: 'desc',
              },
              take: 5,
            },
          },
        },
      },
    });

    if (!parent) {
      throw new NotFoundException('Không tìm thấy thông tin phụ huynh');
    }

    return parent;
  }

  async updateProfile(userId: string, updateDto: UpdateParentDto) {
    const parent = await this.prisma.parent.findFirst({
      where: {
        userId,
        deletedAt: null,
      },
    });

    if (!parent) {
      throw new NotFoundException('Không tìm thấy thông tin phụ huynh');
    }

    // Check for conflicts if email or phone is being updated
    if (updateDto.email || updateDto.phone) {
      const conflictWhere: Prisma.ParentWhereInput = {
        id: { not: parent.id },
        OR: [],
      };

      if (updateDto.email) {
        conflictWhere.OR!.push({ email: updateDto.email });
      }
      if (updateDto.phone) {
        conflictWhere.OR!.push({ phone: updateDto.phone });
      }

      const existingParent = await this.prisma.parent.findFirst({
        where: conflictWhere,
      });

      if (existingParent) {
        throw new ConflictException('Email hoặc số điện thoại đã được sử dụng');
      }
    }

    return this.prisma.parent.update({
      where: { id: parent.id },
      data: updateDto,
      include: {
        user: true,
        students: true,
      },
    });
  }

  async findAll(params?: {
    skip?: number;
    take?: number;
    where?: Prisma.ParentWhereInput;
    orderBy?: Prisma.ParentOrderByWithRelationInput;
    includeDeleted?: boolean;
    search?: string;
    columnFilters?: Record<string, string>;
  }): Promise<Parent[]> {
    const {
      skip,
      take,
      where,
      orderBy,
      includeDeleted,
      search,
      columnFilters,
    } = params || {};

    const result = await this.findManyPaginatedWithFilters('parent', {
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

  async findOne(id: string, includeDeleted: boolean = false): Promise<Parent> {
    try {
      return await this.findUnique(
        'parent',
        { id },
        {
          user: true,
          students: {
            where: { deletedAt: null },
            include: {
              academicResults: {
                where: { deletedAt: null },
                orderBy: { createdAt: 'desc' },
              },
            },
          },
        },
        includeDeleted,
      );
    } catch {
      throw new NotFoundException(`Không tìm thấy phụ huynh với ID ${id}`);
    }
  }

  async create(createParentDto: CreateParentDto): Promise<Parent> {
    // Check for conflicts
    const existingParent = await this.prisma.parent.findFirst({
      where: {
        OR: [
          { email: createParentDto.email },
          { phone: createParentDto.phone },
        ],
      },
    });

    if (existingParent) {
      throw new ConflictException('Email hoặc số điện thoại đã được sử dụng');
    }

    let userId: string | undefined;

    // Create user if password is provided
    if (createParentDto.password) {
      const hashedPassword = await bcrypt.hash(createParentDto.password, 10);
      const user = await this.prisma.user.create({
        data: {
          email: createParentDto.email,
          name: createParentDto.fullName,
          password: hashedPassword,
          role: Role.PARENT,
        },
      });
      userId = user.id;
    }

    return this.prisma.parent.create({
      data: {
        userId,
        fullName: createParentDto.fullName,
        phone: createParentDto.phone,
        email: createParentDto.email,
        address: createParentDto.address,
        isActive: createParentDto.isActive ?? true,
      },
      include: {
        user: true,
        students: true,
      },
    });
  }

  async update(id: string, updateParentDto: UpdateParentDto): Promise<Parent> {
    await this.findOne(id);

    // Check for conflicts if email or phone is being updated
    if (updateParentDto.email || updateParentDto.phone) {
      const conflictWhere: Prisma.ParentWhereInput = {
        id: { not: id },
        OR: [],
      };

      if (updateParentDto.email) {
        conflictWhere.OR!.push({ email: updateParentDto.email });
      }
      if (updateParentDto.phone) {
        conflictWhere.OR!.push({ phone: updateParentDto.phone });
      }

      const existingParent = await this.prisma.parent.findFirst({
        where: conflictWhere,
      });

      if (existingParent) {
        throw new ConflictException('Email hoặc số điện thoại đã được sử dụng');
      }
    }

    return this.prisma.parent.update({
      where: { id },
      data: updateParentDto,
      include: {
        user: true,
        students: true,
      },
    });
  }

  async remove(id: string): Promise<Parent> {
    await this.findOne(id);
    return this.softDelete('parent', id);
  }

  async hardDelete(id: string): Promise<Parent> {
    await this.findOne(id);
    return this.hardDeleteRecord('parent', id);
  }

  async restore(id: string): Promise<Parent> {
    return this.restoreRecord('parent', id);
  }

  async findDeleted(params?: {
    search?: string;
    columnFilters?: Record<string, string>;
    page?: number;
    limit?: number;
  }): Promise<{
    items: Parent[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  }> {
    return this.findManyPaginatedWithFilters('parent', {
      page: params?.page || 1,
      limit: params?.limit || 10,
      where: { deletedAt: { not: null } },
      includeDeleted: true,
      search: params?.search,
      columnFilters: params?.columnFilters,
    });
  }

  private async generateTokens(userId: string, email: string) {
    const payload = { sub: userId, email };

    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: '7d',
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      expiresIn: '30d',
    });

    return {
      accessToken,
      refreshToken,
    };
  }
}

