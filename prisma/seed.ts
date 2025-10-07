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

type PermissionActionSpec = {
  action: string;
  roles: Role[];
  path?: string;
  displayName?: string;
  description?: string;
};

type PermissionResourceSpec = {
  resource: string;
  label: string;
  description: string;
  basePath: string;
  detailPath?: string;
  newPath?: string;
  actions: PermissionActionSpec[];
};

type PermissionSeedDefinition = {
  name: string;
  displayName: string;
  description: string;
  resource: string;
  action: string;
  pathPattern: string;
  roles: Role[];
};

const ROLE_SETS: Record<string, Role[]> = {
  all: [Role.USER, Role.ADMIN, Role.EDITOR, Role.SUPER_ADMIN],
  adminAndSuper: [Role.ADMIN, Role.SUPER_ADMIN],
  editorial: [Role.ADMIN, Role.EDITOR, Role.SUPER_ADMIN],
  superOnly: [Role.SUPER_ADMIN],
};

const ACTION_METADATA: Record<string, { label: string; description: string }> = {
  view: { label: "Xem", description: "Cho phép xem {resource}." },
  create: { label: "Tạo", description: "Cho phép tạo {resource}." },
  update: { label: "Cập nhật", description: "Cho phép cập nhật {resource}." },
  delete: {
    label: "Xóa",
    description: "Cho phép xóa {resource} (soft delete).",
  },
  restore: {
    label: "Khôi phục",
    description: "Cho phép khôi phục {resource}.",
  },
  "hard-delete": {
    label: "Xóa vĩnh viễn",
    description: "Cho phép xóa vĩnh viễn {resource}.",
  },
  "bulk-delete": {
    label: "Xóa hàng loạt",
    description: "Cho phép xóa nhiều {resource} cùng lúc.",
  },
  "bulk-restore": {
    label: "Khôi phục hàng loạt",
    description: "Cho phép khôi phục nhiều {resource} cùng lúc.",
  },
  "bulk-hard-delete": {
    label: "Xóa vĩnh viễn hàng loạt",
    description: "Cho phép xóa vĩnh viễn nhiều {resource} cùng lúc.",
  },
  publish: {
    label: "Xuất bản",
    description: "Cho phép xuất bản {resource}.",
  },
  analytics: {
    label: "Xem phân tích",
    description: "Cho phép xem dữ liệu phân tích của {resource}.",
  },
  system: {
    label: "Quản lý cấu hình",
    description: "Cho phép cấu hình hệ thống nâng cao.",
  },
  security: {
    label: "Quản lý bảo mật",
    description: "Cho phép cấu hình các thiết lập bảo mật.",
  },
  "change-password": {
    label: "Đổi mật khẩu",
    description: "Cho phép đổi mật khẩu tài khoản.",
  },
  "upload-avatar": {
    label: "Cập nhật ảnh đại diện",
    description: "Cho phép cập nhật ảnh đại diện tài khoản.",
  },
  "manage-subscriptions": {
    label: "Quản lý đăng ký",
    description: "Cho phép quản lý gói đăng ký và thanh toán.",
  },
  "view-invoices": {
    label: "Xem hóa đơn",
    description: "Cho phép xem hóa đơn và lịch sử thanh toán.",
  },
  manage: {
    label: "Quản lý",
    description: "Cho phép quản lý {resource}.",
  },
  request: {
    label: "Gửi yêu cầu",
    description: "Cho phép gửi yêu cầu liên quan đến {resource}.",
  },
  "mark-read": {
    label: "Đánh dấu đã đọc",
    description: "Cho phép đánh dấu thông báo là đã đọc.",
  },
  revoke: {
    label: "Thu hồi",
    description: "Cho phép thu hồi {resource}.",
  },
  "revoke-all": {
    label: "Thu hồi tất cả",
    description: "Cho phép thu hồi tất cả {resource}.",
  },
  moderate: {
    label: "Kiểm duyệt",
    description: "Cho phép kiểm duyệt {resource}.",
  },
  approve: {
    label: "Phê duyệt",
    description: "Cho phép phê duyệt {resource}.",
  },
  reject: {
    label: "Từ chối",
    description: "Cho phép từ chối {resource}.",
  },
  "bulk-approve": {
    label: "Phê duyệt hàng loạt",
    description: "Cho phép phê duyệt hàng loạt {resource}.",
  },
  "bulk-reject": {
    label: "Từ chối hàng loạt",
    description: "Cho phép từ chối hàng loạt {resource}.",
  },
  "assign-role": {
    label: "Gán vai trò",
    description: "Cho phép gán vai trò cho người dùng.",
  },
  "revoke-role": {
    label: "Thu hồi vai trò",
    description: "Cho phép thu hồi vai trò của người dùng.",
  },
  assign: {
    label: "Gán",
    description: "Cho phép gán {resource}.",
  },
};

const DETAIL_ACTIONS = new Set([
  "update",
  "delete",
  "restore",
  "hard-delete",
  "publish",
  "approve",
  "reject",
  "assign-role",
  "revoke-role",
]);

const toTitleCase = (value: string) =>
  value
    .split(/[-_ ]+/)
    .filter(Boolean)
    .map(
      (segment) => segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase(),
    )
    .join(" ");

const toSentenceCase = (value: string) => toTitleCase(value).toLowerCase();

const ensurePeriod = (value: string) => {
  const trimmed = value.trim();
  return trimmed.endsWith('.') ? trimmed : `${trimmed}.`;
};

const permissionResourceSpecs: PermissionResourceSpec[] = [
  {
    resource: 'dashboard',
    label: 'Dashboard',
    description: 'trang tổng quan quản trị',
    basePath: '/admin',
    actions: [
      { action: 'view', roles: ROLE_SETS.all },
      { action: 'analytics', roles: ROLE_SETS.adminAndSuper },
    ],
  },
  {
    resource: 'settings',
    label: 'Cài đặt hệ thống',
    description: 'các cài đặt hệ thống',
    basePath: '/admin/settings',
    actions: [
      { action: 'view', roles: ROLE_SETS.adminAndSuper },
      { action: 'update', roles: ROLE_SETS.superOnly },
      { action: 'system', roles: ROLE_SETS.superOnly },
      { action: 'security', roles: ROLE_SETS.superOnly },
    ],
  },
  {
    resource: 'profile',
    label: 'Hồ sơ',
    description: 'hồ sơ tài khoản',
    basePath: '/admin/profile',
    actions: [
      { action: 'view', roles: ROLE_SETS.all },
      { action: 'update', roles: ROLE_SETS.all },
      { action: 'change-password', roles: ROLE_SETS.all },
      { action: 'upload-avatar', roles: ROLE_SETS.all },
    ],
  },
  {
    resource: 'billing',
    label: 'Thanh toán',
    description: 'thiết lập thanh toán',
    basePath: '/admin/billing',
    actions: [
      { action: 'view', roles: ROLE_SETS.adminAndSuper },
      { action: 'update', roles: ROLE_SETS.superOnly },
      { action: 'manage-subscriptions', roles: ROLE_SETS.superOnly },
      { action: 'view-invoices', roles: ROLE_SETS.adminAndSuper },
    ],
  },
  {
    resource: 'notifications',
    label: 'Thông báo',
    description: 'các thông báo hệ thống',
    basePath: '/admin/notifications',
    actions: [
      { action: 'view', roles: ROLE_SETS.all },
      { action: 'update', roles: ROLE_SETS.all },
      { action: 'mark-read', roles: ROLE_SETS.all },
      { action: 'delete', roles: ROLE_SETS.all },
    ],
  },
  {
    resource: 'sessions',
    label: 'Phiên đăng nhập',
    description: 'các phiên đăng nhập',
    basePath: '/admin/sessions',
    actions: [
      { action: 'view', roles: ROLE_SETS.all },
      { action: 'manage', roles: ROLE_SETS.all },
      { action: 'revoke', roles: ROLE_SETS.all },
      { action: 'revoke-all', roles: ROLE_SETS.all },
    ],
  },
  {
    resource: 'upgrade',
    label: 'Nâng cấp',
    description: 'chức năng nâng cấp hệ thống',
    basePath: '/admin/upgrade',
    actions: [
      { action: 'view', roles: ROLE_SETS.all },
      { action: 'request', roles: ROLE_SETS.all },
      { action: 'manage', roles: ROLE_SETS.superOnly },
    ],
  },
  {
    resource: 'posts',
    label: 'Bài viết',
    description: 'các bài viết nội dung',
    basePath: '/admin/posts',
    detailPath: '/admin/posts/[id]',
    newPath: '/admin/posts/new',
    actions: [
      { action: 'view', roles: ROLE_SETS.editorial },
      { action: 'create', roles: ROLE_SETS.editorial },
      { action: 'update', roles: ROLE_SETS.editorial },
      { action: 'publish', roles: ROLE_SETS.adminAndSuper },
      { action: 'delete', roles: ROLE_SETS.adminAndSuper },
      { action: 'restore', roles: ROLE_SETS.adminAndSuper },
      { action: 'hard-delete', roles: ROLE_SETS.superOnly },
      { action: 'bulk-delete', roles: ROLE_SETS.adminAndSuper },
      { action: 'bulk-restore', roles: ROLE_SETS.adminAndSuper },
      { action: 'bulk-hard-delete', roles: ROLE_SETS.superOnly },
    ],
  },
  {
    resource: 'users',
    label: 'Người dùng',
    description: 'tài khoản người dùng',
    basePath: '/admin/users',
    detailPath: '/admin/users/[id]',
    newPath: '/admin/users/new',
    actions: [
      { action: 'view', roles: ROLE_SETS.adminAndSuper },
      { action: 'create', roles: ROLE_SETS.superOnly },
      { action: 'update', roles: ROLE_SETS.superOnly },
      { action: 'delete', roles: ROLE_SETS.adminAndSuper },
      { action: 'restore', roles: ROLE_SETS.adminAndSuper },
      { action: 'hard-delete', roles: ROLE_SETS.superOnly },
      { action: 'bulk-delete', roles: ROLE_SETS.adminAndSuper },
      { action: 'bulk-restore', roles: ROLE_SETS.adminAndSuper },
      { action: 'bulk-hard-delete', roles: ROLE_SETS.superOnly },
      {
        action: 'assign-role',
        roles: ROLE_SETS.superOnly,
        displayName: 'Gán vai trò cho người dùng',
        description: 'Cho phép gán vai trò cho người dùng.',
      },
      {
        action: 'revoke-role',
        roles: ROLE_SETS.superOnly,
        displayName: 'Thu hồi vai trò của người dùng',
        description: 'Cho phép thu hồi vai trò của người dùng.',
      },
    ],
  },
  {
    resource: 'roles',
    label: 'Vai trò',
    description: 'các vai trò người dùng',
    basePath: '/admin/roles',
    detailPath: '/admin/roles/[id]',
    newPath: '/admin/roles/new',
    actions: [
      { action: 'view', roles: ROLE_SETS.adminAndSuper },
      { action: 'create', roles: ROLE_SETS.superOnly },
      { action: 'update', roles: ROLE_SETS.superOnly },
      { action: 'delete', roles: ROLE_SETS.superOnly },
      { action: 'restore', roles: ROLE_SETS.superOnly },
      { action: 'hard-delete', roles: ROLE_SETS.superOnly },
      { action: 'bulk-delete', roles: ROLE_SETS.superOnly },
      { action: 'bulk-restore', roles: ROLE_SETS.superOnly },
      { action: 'bulk-hard-delete', roles: ROLE_SETS.superOnly },
    ],
  },
  {
    resource: 'permissions',
    label: 'Quyền hệ thống',
    description: 'các quyền hệ thống',
    basePath: '/admin/permissions',
    detailPath: '/admin/permissions/[id]',
    newPath: '/admin/permissions/new',
    actions: [
      { action: 'view', roles: ROLE_SETS.adminAndSuper },
      { action: 'create', roles: ROLE_SETS.superOnly },
      { action: 'update', roles: ROLE_SETS.superOnly },
      { action: 'delete', roles: ROLE_SETS.superOnly },
      { action: 'restore', roles: ROLE_SETS.superOnly },
      { action: 'hard-delete', roles: ROLE_SETS.superOnly },
      { action: 'bulk-delete', roles: ROLE_SETS.superOnly },
      { action: 'bulk-restore', roles: ROLE_SETS.superOnly },
      { action: 'bulk-hard-delete', roles: ROLE_SETS.superOnly },
      {
        action: 'assign',
        roles: ROLE_SETS.superOnly,
        displayName: 'Gán quyền hệ thống',
        description: 'Cho phép gán các quyền hệ thống.',
      },
      {
        action: 'revoke',
        roles: ROLE_SETS.superOnly,
        displayName: 'Thu hồi quyền hệ thống',
        description: 'Cho phép thu hồi các quyền hệ thống.',
      },
      {
        action: 'manage',
        roles: ROLE_SETS.superOnly,
        displayName: 'Quản lý quyền hệ thống',
        description: 'Cho phép quản lý toàn bộ quyền hệ thống.',
      },
    ],
  },
  {
    resource: 'categories',
    label: 'Danh mục',
    description: 'các danh mục nội dung',
    basePath: '/admin/categories',
    detailPath: '/admin/categories/[id]',
    newPath: '/admin/categories/new',
    actions: [
      { action: 'view', roles: ROLE_SETS.editorial },
      { action: 'create', roles: ROLE_SETS.editorial },
      { action: 'update', roles: ROLE_SETS.editorial },
      { action: 'moderate', roles: ROLE_SETS.editorial },
      { action: 'delete', roles: ROLE_SETS.adminAndSuper },
      { action: 'restore', roles: ROLE_SETS.adminAndSuper },
      { action: 'hard-delete', roles: ROLE_SETS.superOnly },
      { action: 'bulk-delete', roles: ROLE_SETS.adminAndSuper },
      { action: 'bulk-restore', roles: ROLE_SETS.adminAndSuper },
      { action: 'bulk-hard-delete', roles: ROLE_SETS.superOnly },
    ],
  },
  {
    resource: 'tags',
    label: 'Thẻ nội dung',
    description: 'các thẻ nội dung',
    basePath: '/admin/tags',
    detailPath: '/admin/tags/[id]',
    newPath: '/admin/tags/new',
    actions: [
      { action: 'view', roles: ROLE_SETS.editorial },
      { action: 'create', roles: ROLE_SETS.editorial },
      { action: 'update', roles: ROLE_SETS.editorial },
      { action: 'delete', roles: ROLE_SETS.adminAndSuper },
      { action: 'restore', roles: ROLE_SETS.adminAndSuper },
      { action: 'hard-delete', roles: ROLE_SETS.superOnly },
      { action: 'bulk-delete', roles: ROLE_SETS.adminAndSuper },
      { action: 'bulk-restore', roles: ROLE_SETS.adminAndSuper },
      { action: 'bulk-hard-delete', roles: ROLE_SETS.superOnly },
    ],
  },
  {
    resource: 'comments',
    label: 'Bình luận',
    description: 'các bình luận người dùng',
    basePath: '/admin/comments',
    detailPath: '/admin/comments/[id]',
    actions: [
      { action: 'view', roles: ROLE_SETS.editorial },
      { action: 'create', roles: ROLE_SETS.editorial },
      { action: 'update', roles: ROLE_SETS.editorial },
      { action: 'moderate', roles: ROLE_SETS.editorial },
      { action: 'approve', roles: ROLE_SETS.editorial },
      { action: 'reject', roles: ROLE_SETS.editorial },
      { action: 'delete', roles: ROLE_SETS.adminAndSuper },
      { action: 'restore', roles: ROLE_SETS.adminAndSuper },
      { action: 'hard-delete', roles: ROLE_SETS.superOnly },
      { action: 'bulk-delete', roles: ROLE_SETS.adminAndSuper },
      { action: 'bulk-restore', roles: ROLE_SETS.adminAndSuper },
      { action: 'bulk-hard-delete', roles: ROLE_SETS.superOnly },
      { action: 'bulk-approve', roles: ROLE_SETS.editorial },
      { action: 'bulk-reject', roles: ROLE_SETS.editorial },
    ],
  },
  {
    resource: 'trash',
    label: 'Thùng rác',
    description: 'mục đã xóa trong thùng rác',
    basePath: '/admin/trash',
    actions: [
      { action: 'view', roles: ROLE_SETS.adminAndSuper },
      { action: 'restore', roles: ROLE_SETS.adminAndSuper },
      { action: 'delete', roles: ROLE_SETS.superOnly },
      { action: 'hard-delete', roles: ROLE_SETS.superOnly },
    ],
  },
];

const buildPermissionEntries = (): PermissionSeedDefinition[] => {
  const entries: PermissionSeedDefinition[] = [];

  for (const resourceSpec of permissionResourceSpecs) {
    for (const actionSpec of resourceSpec.actions) {
      const actionMeta =
        ACTION_METADATA[actionSpec.action] ?? {
          label: toTitleCase(actionSpec.action),
          description: `Cho phép ${toSentenceCase(actionSpec.action)} {resource}.`,
        };

      const baseDisplayLabel = actionMeta.label || toTitleCase(actionSpec.action);
      const displayName =
        actionSpec.displayName ?? `${baseDisplayLabel} ${resourceSpec.label}`;

      const descriptionTemplate =
        actionSpec.description ?? actionMeta.description;

      const description = ensurePeriod(
        descriptionTemplate.includes('{resource}')
          ? descriptionTemplate.replace('{resource}', resourceSpec.description)
          : descriptionTemplate,
      );

      const uniqueRoles = Array.from(new Set(actionSpec.roles));

      const pathPattern =
        actionSpec.path ??
        (actionSpec.action === 'create' && resourceSpec.newPath
          ? resourceSpec.newPath
          : DETAIL_ACTIONS.has(actionSpec.action) && resourceSpec.detailPath
            ? resourceSpec.detailPath
            : resourceSpec.basePath);

      entries.push({
        name: `${resourceSpec.resource}:${actionSpec.action}`,
        displayName,
        description,
        resource: resourceSpec.resource,
        action: actionSpec.action,
        pathPattern,
        roles: uniqueRoles,
      });
    }
  }

  return entries;
};

const permissionEntries = buildPermissionEntries();

const resetDatabase = async () => {
  await prisma.$transaction(async (tx) => {
    await tx.rolePermission.deleteMany();
    await tx.userRole.deleteMany();
    await tx.session.deleteMany();
    await tx.comment.deleteMany();
    await tx.postTag.deleteMany();
    await tx.postCategory.deleteMany();
    await tx.post.deleteMany();
    await tx.tag.deleteMany();
    await tx.category.deleteMany();
    await tx.permission.deleteMany();
    await tx.roleModel.deleteMany();
    await tx.user.deleteMany();
  });
};

async function main() {
  console.log('🌱 Bắt đầu seed database...');

  console.log('🧹 Đang xóa dữ liệu cũ...');
  await resetDatabase();
  console.log('🧼 Đã xóa dữ liệu cũ');

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
  const permissions = await Promise.all(
    permissionEntries.map(({ roles: _roles, ...permissionData }) =>
      prisma.permission.upsert({
        where: { name: permissionData.name },
        update: {
          displayName: permissionData.displayName,
          description: permissionData.description,
          resource: permissionData.resource,
          action: permissionData.action,
          pathPattern: permissionData.pathPattern,
          isActive: true,
        },
        create: {
          ...permissionData,
          isActive: true,
        },
      })
    )
  );

  console.log(`✅ Đã tạo permissions (${permissions.length})`);

  const permissionMap = new Map(permissions.map((permission) => [permission.name, permission]));
  const roleMap = new Map(roles.map((roleModel) => [roleModel.name, roleModel]));
  const rolePermissionsData: { roleId: string; permissionId: string }[] = [];

  for (const entry of permissionEntries) {
    const permissionRecord = permissionMap.get(entry.name);
    if (!permissionRecord) {
      continue;
    }

    const uniqueRoles = Array.from(new Set(entry.roles));
    for (const roleName of uniqueRoles) {
      const roleRecord = roleMap.get(roleName);
      if (!roleRecord) {
        continue;
      }

      rolePermissionsData.push({
        roleId: roleRecord.id,
        permissionId: permissionRecord.id,
      });
    }
  }

  await prisma.rolePermission.createMany({
    data: rolePermissionsData,
    skipDuplicates: true,
  });

  console.log(`✅ Đã gán permissions cho roles (${rolePermissionsData.length})`);

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
