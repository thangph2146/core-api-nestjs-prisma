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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
