#!/bin/bash

echo "🚀 Khởi động Core API..."

# Kiểm tra file .env
if [ ! -f ".env" ]; then
    echo "❌ File .env không tồn tại!"
    echo "📝 Vui lòng tạo file .env theo hướng dẫn trong SETUP_GUIDE.md"
    exit 1
fi

# Kiểm tra database connection
echo "🔍 Kiểm tra kết nối database..."
pnpm prisma db push --accept-data-loss > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Database connection OK"
else
    echo "❌ Không thể kết nối database!"
    echo "📝 Vui lòng kiểm tra DATABASE_URL trong file .env"
    exit 1
fi

# Generate Prisma Client
echo "🔧 Generating Prisma Client..."
pnpm prisma:generate

# Khởi động API
echo "🚀 Khởi động API server..."
pnpm start:dev
