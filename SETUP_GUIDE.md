# Hướng dẫn thiết lập Core API

## 1. Tạo file .env

Tạo file `.env` trong thư mục `core-api` với nội dung:

```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/core_cms?schema=public"

# Server
PORT=6789

# Environment
NODE_ENV=development
```

## 2. Thiết lập Database

### Cài đặt PostgreSQL
```bash
# macOS với Homebrew
brew install postgresql
brew services start postgresql

# Tạo database
createdb core_cms
```

### Chạy Prisma Migration
```bash
# Cài đặt dependencies
pnpm install

# Generate Prisma Client
pnpm prisma:generate

# Chạy migration
pnpm prisma:migrate

# Seed data
pnpm db:seed
```

## 3. Khởi động API

```bash
pnpm start:dev
```

API sẽ chạy trên http://localhost:6789

## 4. Kiểm tra API

```bash
curl http://localhost:6789/
```

## 5. Troubleshooting

### Lỗi kết nối database
- Kiểm tra PostgreSQL có đang chạy không
- Kiểm tra DATABASE_URL trong file .env
- Đảm bảo database `core_cms` đã được tạo

### Lỗi port đã được sử dụng
- Thay đổi PORT trong file .env
- Hoặc kill process đang sử dụng port: `lsof -ti:6789 | xargs kill -9`

### Lỗi Prisma
- Chạy `pnpm prisma:generate` để generate client
- Chạy `pnpm prisma:migrate` để apply migrations
