import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { PostsModule } from './posts/posts.module';
import { CategoriesModule } from './categories/categories.module';
import { TagsModule } from './tags/tags.module';
import { CommentsModule } from './comments/comments.module';
import { PublicModule } from './public/public.module';

@Module({
  imports: [
    PrismaModule,
    UsersModule,
    PostsModule,
    CategoriesModule,
    TagsModule,
    CommentsModule,
    PublicModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
