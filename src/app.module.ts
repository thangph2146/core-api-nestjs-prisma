import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { CommonModule } from './common/common.module';
import { UsersModule } from './admin/users/users.module';
import { PostsModule } from './admin/posts/posts.module';
import { CategoriesModule } from './admin/categories/categories.module';
import { TagsModule } from './admin/tags/tags.module';
import { CommentsModule } from './admin/comments/comments.module';
import { PublicModule } from './public/public.module';
import { DashboardModule } from './admin/dashboard/dashboard.module';
import { RolesModule } from './admin/roles/roles.module';
import { PermissionsModule } from './admin/permissions/permissions.module';
import { UserRolesModule } from './admin/user-roles/user-roles.module';
import { AuthModule } from './auth/auth.module';
import { ParentsModule } from './parents/parents.module';
import { StudentsModule } from './students/students.module';
import { AcademicResultsModule } from './academic-results/academic-results.module';
import { MessagesModule } from './messages/messages.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CommonModule,
    PrismaModule,
    UsersModule,
    PostsModule,
    CategoriesModule,
    TagsModule,
    CommentsModule,
    PublicModule,
    DashboardModule,
    RolesModule,
    PermissionsModule,
    UserRolesModule,
    AuthModule,
    ParentsModule,
    StudentsModule,
    AcademicResultsModule,
    MessagesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
