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
  console.log(`- Users: 3 (1 Super Admin, 1 Editor, 1 User)`);
  console.log(`- Categories: ${categories.length}`);
  console.log(`- Tags: ${tags.length}`);
  console.log(`- Posts: 3 (2 published, 1 draft)`);
  console.log(`- Comments: 3 (2 approved, 1 pending)`);
  console.log('\n🔑 Thông tin đăng nhập:');
  console.log('Email: admin@phgroup.com | Password: password123');
  console.log('Email: editor@phgroup.com | Password: password123');
  console.log('Email: author@phgroup.com | Password: password123');
}

main()
  .catch((e) => {
    console.error('❌ Lỗi khi seed database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
