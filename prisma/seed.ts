import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Sample content data phù hợp với Lexical Editor
const samplePostContent = {
  root: {
    children: [
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: "normal",
            style: "",
            text: "Chào mừng đến với Content Editor! 🚀",
            type: "text",
            version: 1,
          },
        ],
        direction: "ltr",
        format: "",
        indent: 0,
        type: "heading",
        tag: "h1",
        version: 1,
      },
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: "normal",
            style: "",
            text: "Đây là một bài viết mẫu được tạo bởi seed script. Nội dung này được thiết kế để tương thích với Lexical Editor được sử dụng trong core-cms.",
            type: "text",
            version: 1,
          },
        ],
        direction: "ltr",
        format: "",
        indent: 0,
        type: "paragraph",
        version: 1,
      },
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: "normal",
            style: "",
            text: "Tính năng chính của Content Editor:",
            type: "text",
            version: 1,
          },
        ],
        direction: "ltr",
        format: "",
        indent: 0,
        type: "heading",
        tag: "h2",
        version: 1,
      },
      {
        children: [
          {
            children: [
              {
                children: [
                  {
                    detail: 0,
                    format: 0,
                    mode: "normal",
                    style: "",
                    text: "WYSIWYG Editor với Lexical",
                    type: "text",
                    version: 1,
                  },
                ],
                direction: "ltr",
                format: "",
                indent: 0,
                type: "listitem",
                version: 1,
              },
              {
                children: [
                  {
                    detail: 0,
                    format: 0,
                    mode: "normal",
                    style: "",
                    text: "Hỗ trợ nhiều định dạng văn bản",
                    type: "text",
                    version: 1,
                  },
                ],
                direction: "ltr",
                format: "",
                indent: 0,
                type: "listitem",
                version: 1,
              },
              {
                children: [
                  {
                    detail: 0,
                    format: 0,
                    mode: "normal",
                    style: "",
                    text: "Tích hợp hình ảnh và media",
                    type: "text",
                    version: 1,
                  },
                ],
                direction: "ltr",
                format: "",
                indent: 0,
                type: "listitem",
                version: 1,
              },
              {
                children: [
                  {
                    detail: 0,
                    format: 0,
                    mode: "normal",
                    style: "",
                    text: "Quản lý categories và tags",
                    type: "text",
                    version: 1,
                  },
                ],
                direction: "ltr",
                format: "",
                indent: 0,
                type: "listitem",
                version: 1,
              },
            ],
            direction: "ltr",
            format: "",
            indent: 0,
            type: "list",
            listType: "bullet",
            version: 1,
          },
        ],
        direction: "ltr",
        format: "",
        indent: 0,
        type: "paragraph",
        version: 1,
      },
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: "normal",
            style: "",
            text: "Hệ thống được xây dựng với NestJS và Prisma, đảm bảo hiệu suất cao và dễ bảo trì.",
            type: "text",
            version: 1,
          },
        ],
        direction: "ltr",
        format: "",
        indent: 0,
        type: "paragraph",
        version: 1,
      },
    ],
    direction: "ltr",
    format: "",
    indent: 0,
    type: "root",
    version: 1,
  },
};

const samplePostContent2 = {
  root: {
    children: [
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: "normal",
            style: "",
            text: "Hướng dẫn sử dụng Content Editor",
            type: "text",
            version: 1,
          },
        ],
        direction: "ltr",
        format: "",
        indent: 0,
        type: "heading",
        tag: "h1",
        version: 1,
      },
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: "normal",
            style: "",
            text: "Trong bài viết này, chúng ta sẽ tìm hiểu cách sử dụng Content Editor một cách hiệu quả nhất.",
            type: "text",
            version: 1,
          },
        ],
        direction: "ltr",
        format: "",
        indent: 0,
        type: "paragraph",
        version: 1,
      },
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: "normal",
            style: "",
            text: "Bước 1: Tạo nội dung mới",
            type: "text",
            version: 1,
          },
        ],
        direction: "ltr",
        format: "",
        indent: 0,
        type: "heading",
        tag: "h2",
        version: 1,
      },
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: "normal",
            style: "",
            text: "Để tạo nội dung mới, bạn cần truy cập vào trang editor và bắt đầu nhập nội dung. Sử dụng thanh công cụ để định dạng văn bản theo ý muốn.",
            type: "text",
            version: 1,
          },
        ],
        direction: "ltr",
        format: "",
        indent: 0,
        type: "paragraph",
        version: 1,
      },
    ],
    direction: "ltr",
    format: "",
    indent: 0,
    type: "root",
    version: 1,
  },
};

async function main() {
  console.log('🌱 Bắt đầu seed database...');

  // Tạo roles
  const roles = await Promise.all([
    prisma.roleModel.upsert({
      where: { name: 'SUPER_ADMIN' },
      update: {},
      create: {
        name: 'SUPER_ADMIN',
        displayName: 'Super Administrator',
        description: 'Toàn quyền hệ thống, có thể thực hiện mọi thao tác',
      },
    }),
    prisma.roleModel.upsert({
      where: { name: 'ADMIN' },
      update: {},
      create: {
        name: 'ADMIN',
        displayName: 'Administrator',
        description: 'Quản trị viên, có quyền quản lý nội dung và người dùng',
      },
    }),
    prisma.roleModel.upsert({
      where: { name: 'EDITOR' },
      update: {},
      create: {
        name: 'EDITOR',
        displayName: 'Editor',
        description: 'Biên tập viên, có quyền tạo và chỉnh sửa nội dung',
      },
    }),
    prisma.roleModel.upsert({
      where: { name: 'USER' },
      update: {},
      create: {
        name: 'USER',
        displayName: 'User',
        description: 'Người dùng thông thường, quyền hạn hạn chế',
      },
    }),
  ]);

  console.log('✅ Đã tạo roles');

  // Tạo permissions dựa trên permission matrix
  const permissions = await Promise.all([
    // Admin permissions
    prisma.permission.upsert({
      where: { name: 'admin:view' },
      update: {},
      create: {
        name: 'admin:view',
        displayName: 'Xem Admin Dashboard',
        description: 'Quyền truy cập vào khu vực quản trị',
        resource: 'admin',
        action: 'view',
        pathPattern: '/admin',
      },
    }),
    prisma.permission.upsert({
      where: { name: 'settings:update' },
      update: {},
      create: {
        name: 'settings:update',
        displayName: 'Cập nhật cài đặt',
        description: 'Quyền cập nhật cài đặt hệ thống',
        resource: 'settings',
        action: 'update',
        pathPattern: '/admin/settings',
      },
    }),

    // Posts permissions
    prisma.permission.upsert({
      where: { name: 'posts:create' },
      update: {},
      create: {
        name: 'posts:create',
        displayName: 'Tạo bài viết',
        description: 'Quyền tạo bài viết mới',
        resource: 'posts',
        action: 'create',
        pathPattern: '/admin/posts',
      },
    }),
    prisma.permission.upsert({
      where: { name: 'posts:update' },
      update: {},
      create: {
        name: 'posts:update',
        displayName: 'Chỉnh sửa bài viết',
        description: 'Quyền chỉnh sửa bài viết',
        resource: 'posts',
        action: 'update',
        pathPattern: '/admin/posts/[id]',
      },
    }),
    prisma.permission.upsert({
      where: { name: 'posts:publish' },
      update: {},
      create: {
        name: 'posts:publish',
        displayName: 'Xuất bản bài viết',
        description: 'Quyền xuất bản và ẩn bài viết',
        resource: 'posts',
        action: 'publish',
        pathPattern: '/admin/posts/[id]',
      },
    }),
    prisma.permission.upsert({
      where: { name: 'posts:delete' },
      update: {},
      create: {
        name: 'posts:delete',
        displayName: 'Xóa bài viết',
        description: 'Quyền xóa bài viết (soft delete)',
        resource: 'posts',
        action: 'delete',
        pathPattern: '/admin/posts/[id]',
      },
    }),
    prisma.permission.upsert({
      where: { name: 'posts:hard-delete' },
      update: {},
      create: {
        name: 'posts:hard-delete',
        displayName: 'Xóa vĩnh viễn bài viết',
        description: 'Quyền xóa vĩnh viễn bài viết',
        resource: 'posts',
        action: 'hard-delete',
        pathPattern: '/admin/posts/[id]',
      },
    }),
    prisma.permission.upsert({
      where: { name: 'posts:restore' },
      update: {},
      create: {
        name: 'posts:restore',
        displayName: 'Khôi phục bài viết',
        description: 'Quyền khôi phục bài viết đã xóa',
        resource: 'posts',
        action: 'restore',
        pathPattern: '/admin/posts/[id]',
      },
    }),
    prisma.permission.upsert({
      where: { name: 'posts:bulk-delete' },
      update: {},
      create: {
        name: 'posts:bulk-delete',
        displayName: 'Xóa hàng loạt bài viết',
        description: 'Quyền xóa nhiều bài viết cùng lúc',
        resource: 'posts',
        action: 'bulk-delete',
        pathPattern: '/admin/posts',
      },
    }),
    prisma.permission.upsert({
      where: { name: 'posts:bulk-restore' },
      update: {},
      create: {
        name: 'posts:bulk-restore',
        displayName: 'Khôi phục hàng loạt bài viết',
        description: 'Quyền khôi phục nhiều bài viết cùng lúc',
        resource: 'posts',
        action: 'bulk-restore',
        pathPattern: '/admin/posts',
      },
    }),
    prisma.permission.upsert({
      where: { name: 'posts:bulk-hard-delete' },
      update: {},
      create: {
        name: 'posts:bulk-hard-delete',
        displayName: 'Xóa vĩnh viễn hàng loạt bài viết',
        description: 'Quyền xóa vĩnh viễn nhiều bài viết cùng lúc',
        resource: 'posts',
        action: 'bulk-hard-delete',
        pathPattern: '/admin/posts',
      },
    }),

    // Users permissions
    prisma.permission.upsert({
      where: { name: 'users:create' },
      update: {},
      create: {
        name: 'users:create',
        displayName: 'Tạo người dùng',
        description: 'Quyền tạo người dùng mới',
        resource: 'users',
        action: 'create',
        pathPattern: '/admin/users',
      },
    }),
    prisma.permission.upsert({
      where: { name: 'users:update' },
      update: {},
      create: {
        name: 'users:update',
        displayName: 'Chỉnh sửa người dùng',
        description: 'Quyền chỉnh sửa thông tin người dùng',
        resource: 'users',
        action: 'update',
        pathPattern: '/admin/users/[id]',
      },
    }),
    prisma.permission.upsert({
      where: { name: 'users:delete' },
      update: {},
      create: {
        name: 'users:delete',
        displayName: 'Xóa người dùng',
        description: 'Quyền xóa người dùng',
        resource: 'users',
        action: 'delete',
        pathPattern: '/admin/users/[id]',
      },
    }),

    // Categories permissions
    prisma.permission.upsert({
      where: { name: 'categories:create' },
      update: {},
      create: {
        name: 'categories:create',
        displayName: 'Tạo danh mục',
        description: 'Quyền tạo danh mục mới',
        resource: 'categories',
        action: 'create',
        pathPattern: '/admin/categories',
      },
    }),
    prisma.permission.upsert({
      where: { name: 'categories:update' },
      update: {},
      create: {
        name: 'categories:update',
        displayName: 'Chỉnh sửa danh mục',
        description: 'Quyền chỉnh sửa danh mục',
        resource: 'categories',
        action: 'update',
        pathPattern: '/admin/categories/[id]',
      },
    }),
    prisma.permission.upsert({
      where: { name: 'categories:delete' },
      update: {},
      create: {
        name: 'categories:delete',
        displayName: 'Xóa danh mục',
        description: 'Quyền xóa danh mục',
        resource: 'categories',
        action: 'delete',
        pathPattern: '/admin/categories/[id]',
      },
    }),

    // Tags permissions
    prisma.permission.upsert({
      where: { name: 'tags:create' },
      update: {},
      create: {
        name: 'tags:create',
        displayName: 'Tạo tag',
        description: 'Quyền tạo tag mới',
        resource: 'tags',
        action: 'create',
        pathPattern: '/admin/tags',
      },
    }),
    prisma.permission.upsert({
      where: { name: 'tags:update' },
      update: {},
      create: {
        name: 'tags:update',
        displayName: 'Chỉnh sửa tag',
        description: 'Quyền chỉnh sửa tag',
        resource: 'tags',
        action: 'update',
        pathPattern: '/admin/tags/[id]',
      },
    }),
    prisma.permission.upsert({
      where: { name: 'tags:delete' },
      update: {},
      create: {
        name: 'tags:delete',
        displayName: 'Xóa tag',
        description: 'Quyền xóa tag',
        resource: 'tags',
        action: 'delete',
        pathPattern: '/admin/tags/[id]',
      },
    }),

    // Comments permissions
    prisma.permission.upsert({
      where: { name: 'comments:moderate' },
      update: {},
      create: {
        name: 'comments:moderate',
        displayName: 'Kiểm duyệt bình luận',
        description: 'Quyền phê duyệt và từ chối bình luận',
        resource: 'comments',
        action: 'moderate',
        pathPattern: '/admin/comments',
      },
    }),
    prisma.permission.upsert({
      where: { name: 'comments:delete' },
      update: {},
      create: {
        name: 'comments:delete',
        displayName: 'Xóa bình luận',
        description: 'Quyền xóa bình luận',
        resource: 'comments',
        action: 'delete',
        pathPattern: '/admin/comments/[id]',
      },
    }),

    // Trash permissions
    prisma.permission.upsert({
      where: { name: 'trash:restore' },
      update: {},
      create: {
        name: 'trash:restore',
        displayName: 'Khôi phục từ thùng rác',
        description: 'Quyền khôi phục các item từ thùng rác',
        resource: 'trash',
        action: 'restore',
        pathPattern: '/admin/trash',
      },
    }),
    prisma.permission.upsert({
      where: { name: 'trash:delete' },
      update: {},
      create: {
        name: 'trash:delete',
        displayName: 'Xóa vĩnh viễn từ thùng rác',
        description: 'Quyền xóa vĩnh viễn các item từ thùng rác',
        resource: 'trash',
        action: 'delete',
        pathPattern: '/admin/trash',
      },
    }),
  ]);

  console.log('✅ Đã tạo permissions');

  // Gán permissions cho roles theo permission matrix
  const rolePermissions = [
    // SUPER_ADMIN - có tất cả quyền
    ...permissions.map(permission => ({
      roleId: roles.find(r => r.name === 'SUPER_ADMIN')!.id,
      permissionId: permission.id,
    })),

    // ADMIN - quyền quản lý nội dung và người dùng
    ...permissions.filter(p => 
      p.name.startsWith('admin:') ||
      p.name.startsWith('posts:') ||
      p.name.startsWith('categories:') ||
      p.name.startsWith('tags:') ||
      p.name.startsWith('comments:') ||
      p.name.startsWith('trash:')
    ).map(permission => ({
      roleId: roles.find(r => r.name === 'ADMIN')!.id,
      permissionId: permission.id,
    })),

    // EDITOR - quyền tạo và chỉnh sửa nội dung
    ...permissions.filter(p => 
      p.name === 'admin:view' ||
      p.name === 'posts:create' ||
      p.name === 'posts:update' ||
      p.name === 'categories:create' ||
      p.name === 'categories:update' ||
      p.name === 'tags:create' ||
      p.name === 'tags:update' ||
      p.name === 'comments:moderate'
    ).map(permission => ({
      roleId: roles.find(r => r.name === 'EDITOR')!.id,
      permissionId: permission.id,
    })),

    // USER - quyền hạn hạn chế
    ...permissions.filter(p => 
      p.name === 'admin:view'
    ).map(permission => ({
      roleId: roles.find(r => r.name === 'USER')!.id,
      permissionId: permission.id,
    })),
  ];

  await prisma.rolePermission.createMany({
    data: rolePermissions,
    skipDuplicates: true,
  });

  console.log('✅ Đã gán permissions cho roles');

  // Tạo users
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@phgroup.com' },
    update: {},
    create: {
      email: 'admin@phgroup.com',
      name: 'PHGroup Admin',
      password: hashedPassword,
      role: Role.SUPER_ADMIN,
    },
  });

  const editorUser = await prisma.user.upsert({
    where: { email: 'editor@phgroup.com' },
    update: {},
    create: {
      email: 'editor@phgroup.com',
      name: 'PHGroup Editor',
      password: hashedPassword,
      role: Role.EDITOR,
    },
  });

  const authorUser = await prisma.user.upsert({
    where: { email: 'author@phgroup.com' },
    update: {},
    create: {
      email: 'author@phgroup.com',
      name: 'PHGroup Author',
      password: hashedPassword,
      role: Role.USER,
    },
  });

  // Gán roles mới cho users
  await prisma.userRole.createMany({
    data: [
      {
        userId: adminUser.id,
        roleId: roles.find(r => r.name === 'SUPER_ADMIN')!.id,
      },
      {
        userId: editorUser.id,
        roleId: roles.find(r => r.name === 'EDITOR')!.id,
      },
      {
        userId: authorUser.id,
        roleId: roles.find(r => r.name === 'USER')!.id,
      },
    ],
    skipDuplicates: true,
  });

  console.log('✅ Đã tạo users');

  // Tạo categories
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: 'huong-dan' },
      update: {},
      create: {
        name: 'Hướng dẫn',
        slug: 'huong-dan',
        description: 'Các bài viết hướng dẫn sử dụng hệ thống',
      },
    }),
    prisma.category.upsert({
      where: { slug: 'cong-nghe' },
      update: {},
      create: {
        name: 'Công nghệ',
        slug: 'cong-nghe',
        description: 'Tin tức và xu hướng công nghệ',
      },
    }),
    prisma.category.upsert({
      where: { slug: 'seo' },
      update: {},
      create: {
        name: 'SEO',
        slug: 'seo',
        description: 'Tối ưu hóa công cụ tìm kiếm',
      },
    }),
    prisma.category.upsert({
      where: { slug: 'ui-ux' },
      update: {},
      create: {
        name: 'UI/UX',
        slug: 'ui-ux',
        description: 'Thiết kế giao diện và trải nghiệm người dùng',
      },
    }),
  ]);

  console.log('✅ Đã tạo categories');

  // Tạo tags
  const tags = await Promise.all([
    prisma.tag.upsert({
      where: { slug: 'content-editor' },
      update: {},
      create: {
        name: 'Content Editor',
        slug: 'content-editor',
      },
    }),
    prisma.tag.upsert({
      where: { slug: 'wysiwyg' },
      update: {},
      create: {
        name: 'WYSIWYG',
        slug: 'wysiwyg',
      },
    }),
    prisma.tag.upsert({
      where: { slug: 'lexical' },
      update: {},
      create: {
        name: 'Lexical',
        slug: 'lexical',
      },
    }),
    prisma.tag.upsert({
      where: { slug: 'react' },
      update: {},
      create: {
        name: 'React',
        slug: 'react',
      },
    }),
    prisma.tag.upsert({
      where: { slug: 'nextjs' },
      update: {},
      create: {
        name: 'Next.js',
        slug: 'nextjs',
      },
    }),
    prisma.tag.upsert({
      where: { slug: 'typescript' },
      update: {},
      create: {
        name: 'TypeScript',
        slug: 'typescript',
      },
    }),
    prisma.tag.upsert({
      where: { slug: 'nestjs' },
      update: {},
      create: {
        name: 'NestJS',
        slug: 'nestjs',
      },
    }),
    prisma.tag.upsert({
      where: { slug: 'prisma' },
      update: {},
      create: {
        name: 'Prisma',
        slug: 'prisma',
      },
    }),
  ]);

  console.log('✅ Đã tạo tags');

  // Tạo posts
  const post1 = await prisma.post.upsert({
    where: { slug: 'chao-mung-den-voi-content-editor' },
    update: {},
    create: {
      title: 'Chào mừng đến với Content Editor! 🚀',
      content: samplePostContent,
      excerpt: 'Đây là một bài viết mẫu được tạo bởi seed script. Nội dung này được thiết kế để tương thích với Lexical Editor được sử dụng trong core-cms.',
      slug: 'chao-mung-den-voi-content-editor',
      image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&h=400&fit=crop',
      published: true,
      publishedAt: new Date(),
      authorId: adminUser.id,
    },
  });

  const post2 = await prisma.post.upsert({
    where: { slug: 'huong-dan-su-dung-content-editor' },
    update: {},
    create: {
      title: 'Hướng dẫn sử dụng Content Editor',
      content: samplePostContent2,
      excerpt: 'Trong bài viết này, chúng ta sẽ tìm hiểu cách sử dụng Content Editor một cách hiệu quả nhất.',
      slug: 'huong-dan-su-dung-content-editor',
      image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=400&fit=crop',
      published: true,
      publishedAt: new Date(),
      authorId: editorUser.id,
    },
  });

  const post3 = await prisma.post.upsert({
    where: { slug: 'tich-hop-lexical-voi-nestjs' },
    update: {},
    create: {
      title: 'Tích hợp Lexical với NestJS và Prisma',
      content: samplePostContent,
      excerpt: 'Hướng dẫn chi tiết về cách tích hợp Lexical Editor với NestJS backend và Prisma ORM.',
      slug: 'tich-hop-lexical-voi-nestjs',
      image: 'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=800&h=400&fit=crop',
      published: true,
      authorId: authorUser.id,
    },
  });

  console.log('✅ Đã tạo posts');

  // Liên kết posts với categories
  await prisma.postCategory.createMany({
    data: [
      { postId: post1.id, categoryId: categories[0].id }, // Hướng dẫn
      { postId: post1.id, categoryId: categories[1].id }, // Công nghệ
      { postId: post2.id, categoryId: categories[0].id }, // Hướng dẫn
      { postId: post3.id, categoryId: categories[1].id }, // Công nghệ
    ],
    skipDuplicates: true,
  });

  // Liên kết posts với tags
  await prisma.postTag.createMany({
    data: [
      { postId: post1.id, tagId: tags[0].id }, // Content Editor
      { postId: post1.id, tagId: tags[1].id }, // WYSIWYG
      { postId: post1.id, tagId: tags[2].id }, // Lexical
      { postId: post1.id, tagId: tags[3].id }, // React
      { postId: post2.id, tagId: tags[0].id }, // Content Editor
      { postId: post2.id, tagId: tags[1].id }, // WYSIWYG
      { postId: post3.id, tagId: tags[2].id }, // Lexical
      { postId: post3.id, tagId: tags[6].id }, // NestJS
      { postId: post3.id, tagId: tags[7].id }, // Prisma
    ],
    skipDuplicates: true,
  });

  console.log('✅ Đã liên kết posts với categories và tags');

  // Tạo comments
  await prisma.comment.createMany({
    data: [
      {
        content: 'Bài viết rất hay và hữu ích! Cảm ơn tác giả đã chia sẻ.',
        approved: true,
        authorId: authorUser.id,
        postId: post1.id,
      },
      {
        content: 'Tôi đã thử và thấy rất dễ sử dụng. Recommend cho mọi người!',
        approved: true,
        authorId: editorUser.id,
        postId: post1.id,
      },
      {
        content: 'Có thể chia sẻ thêm về cách customize editor không?',
        approved: false,
        authorId: authorUser.id,
        postId: post2.id,
      },
    ],
  });

  console.log('✅ Đã tạo comments');

  console.log('🎉 Seed database hoàn thành!');
  console.log('\n📊 Thống kê:');
  console.log(`- Roles: ${roles.length} (SUPER_ADMIN, ADMIN, EDITOR, USER)`);
  console.log(`- Permissions: ${permissions.length} (tất cả permissions từ permission matrix)`);
  console.log(`- Users: 3 (1 Super Admin, 1 Editor, 1 User)`);
  console.log(`- Categories: ${categories.length}`);
  console.log(`- Tags: ${tags.length}`);
  console.log(`- Posts: 3 (2 published, 1 draft)`);
  console.log(`- Comments: 3 (2 approved, 1 pending)`);
  console.log('\n🔐 Permission System:');
  console.log('✅ SUPER_ADMIN: Toàn quyền hệ thống');
  console.log('✅ ADMIN: Quản lý nội dung và người dùng');
  console.log('✅ EDITOR: Tạo và chỉnh sửa nội dung');
  console.log('✅ USER: Quyền hạn hạn chế');
  console.log('\n🔑 Thông tin đăng nhập:');
  console.log('Email: admin@phgroup.com | Password: password123 (SUPER_ADMIN)');
  console.log('Email: editor@phgroup.com | Password: password123 (EDITOR)');
  console.log('Email: author@phgroup.com | Password: password123 (USER)');
}

main()
  .catch((e) => {
    console.error('❌ Lỗi khi seed database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
