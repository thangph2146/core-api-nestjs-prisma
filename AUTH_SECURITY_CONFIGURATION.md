# Cấu hình Bảo mật cho Auth Module

## Tổng quan
Module `@auth/` đã được cấu hình bảo mật hoàn chỉnh sử dụng các thành phần từ `@common/` sau khi cleanup và tối ưu hóa.

## Các thành phần bảo mật đã được triển khai

### 1. Authentication & Authorization
- **JwtAuthGuard**: Bảo vệ các endpoint yêu cầu xác thực (từ CommonModule)
- **LocalAuthGuard**: Xử lý xác thực local (email/password) (từ CommonModule)
- **LocalStrategy**: Strategy cho passport local authentication (từ CommonModule, đã tối ưu)
- **JwtStrategy**: Strategy cho JWT authentication (từ CommonModule)

### 2. Rate Limiting
- **RateLimitGuard**: Bảo vệ chống brute force attacks (in-memory)
- **@AuthRateLimit()**: 5 requests trong 15 phút cho login/refresh
- **@PublicRateLimit()**: 100 requests trong 15 phút cho register
- **@StrictRateLimit()**: 10 requests trong 1 phút cho các endpoint nhạy cảm

### 3. Validation & Error Handling
- **Validation Decorators**: Sử dụng các decorator từ `@common/`
  - `IsOptionalString()`: Validation cho string optional
  - `IsOptionalEnum()`: Validation cho enum optional
- **Error Handling Decorators**:
  - `@CreateOperation()`: Cho register endpoint
  - `@FindOneOperation()`: Cho profile và verify endpoints
  - `@DeleteOperation()`: Cho logout endpoint
- **Enhanced Error Handling**: Try-catch blocks với specific error types

### 4. Public Endpoints
- **@Public()**: Đánh dấu các endpoint không cần authentication
  - `/auth/login`
  - `/auth/register`
  - `/auth/refresh`

### 5. Security Features
- **Password Hashing**: Sử dụng bcrypt với salt rounds = 10
- **JWT Tokens**: Access token (15m) và Refresh token (7d)
- **Input Validation**: Kiểm tra email, password, và các trường bắt buộc
- **Account Status Check**: Kiểm tra tài khoản có bị vô hiệu hóa không
- **Global Security Toggle**: Có thể tắt/bật JWT authentication toàn cục

## Cấu trúc Files

### Auth Module
```
src/auth/
├── auth.controller.ts          # Controller với security decorators
├── auth.service.ts            # Service với enhanced error handling (đã tối ưu)
├── auth.module.ts             # Module configuration (đã cleanup)
└── dto/
    └── auth.dto.ts           # DTOs với validation decorators
```

### Common Module (Đã Cleanup)
```
src/common/
├── decorators/
│   ├── rate-limit.decorator.ts    # Rate limiting decorators
│   ├── public.decorator.ts        # Public endpoint decorator
│   ├── error-handling.decorators.ts # Error handling decorators
│   └── validation.decorators.ts   # Validation decorators
├── guards/
│   ├── jwt-auth.guard.ts         # JWT authentication guard
│   ├── local-auth.guard.ts       # Local authentication guard (moved from auth/)
│   └── rate-limit.guard.ts       # Rate limiting guard
├── strategies/
│   ├── jwt.strategy.ts           # JWT strategy
│   └── local.strategy.ts         # Local strategy (moved from auth/, đã tối ưu)
├── base.controller.ts            # Base controller
├── base.service.ts               # Base service
└── common.module.ts              # Global module (đã cleanup)
```

### Các thay đổi quan trọng
- ✅ **LocalAuthGuard & LocalStrategy**: Đã di chuyển từ `@auth/` sang `@common/`
- ✅ **AdminAuthGuard**: Đã xóa (trùng lặp với JwtAuthGuard)
- ✅ **Circular Dependency**: Đã giải quyết (LocalStrategy sử dụng PrismaService trực tiếp)
- ✅ **Global Security Toggle**: Có thể tắt/bật JWT authentication

## API Endpoints với Security

### Public Endpoints (không cần authentication)
- `POST /auth/login` - Đăng nhập (Rate limited: 5/15min)
- `POST /auth/register` - Đăng ký (Rate limited: 100/15min)
- `POST /auth/refresh` - Refresh token (Rate limited: 5/15min)

### Protected Endpoints (cần JWT token)
- `POST /auth/logout` - Đăng xuất
- `GET /auth/profile` - Lấy thông tin profile
- `GET /auth/verify` - Xác thực token

## Environment Variables Required
```env
JWT_SECRET=your-jwt-secret
JWT_REFRESH_SECRET=your-refresh-secret
```

## Global Security Configuration

### Tắt/Bật JWT Authentication
Trong `src/common/common.module.ts`:
```typescript
// 🔒 BẢO MẬT: Bỏ comment dòng dưới để bật JWT authentication cho toàn bộ app
// 🔓 TẮT BẢO MẬT: Comment dòng dưới để tắt JWT authentication (chỉ dùng khi test)
{ provide: APP_GUARD, useClass: JwtAuthGuard },
```

### Cách sử dụng:
- **Production**: Bỏ comment để bật bảo mật
- **Development/Testing**: Comment để tắt bảo mật
- **Debugging**: Dễ dàng tắt/bật để debug

## Security Best Practices Implemented
1. **Rate Limiting**: Chống brute force attacks (in-memory)
2. **Input Validation**: Validate tất cả input data
3. **Error Handling**: Không expose sensitive information
4. **Token Management**: Short-lived access tokens với refresh mechanism
5. **Password Security**: Bcrypt hashing với salt
6. **Account Status**: Kiểm tra tài khoản active/inactive
7. **Public/Private Routes**: Rõ ràng phân biệt endpoint public/private
8. **Global Security Toggle**: Có thể tắt/bật authentication toàn cục
9. **Circular Dependency Resolution**: Tối ưu hóa dependencies
10. **Code Cleanup**: Xóa code trùng lặp và không cần thiết

## Usage Example

### Login Request
```bash
curl -X POST http://localhost:6789/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@phgroup.com",
    "password": "password123"
  }'
```

### Protected Request
```bash
curl -X GET http://localhost:6789/auth/profile \
  -H "Authorization: Bearer <access_token>"
```

### Test Public Endpoint
```bash
curl -X GET http://localhost:6789/public/posts
```

### Test Rate Limiting
```bash
# Test auth rate limiting (5 requests/15min)
for i in {1..6}; do
  curl -X POST http://localhost:6789/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}' \
    -w "Status: %{http_code}\n"
done
```

## Monitoring & Logging
- Tất cả errors được log qua ErrorHandlingInterceptor
- Rate limiting violations được track
- Authentication failures được monitor
- Token validation errors được log

## Recent Improvements (Đã hoàn thành)
1. ✅ **Code Cleanup**: Xóa AdminAuthGuard trùng lặp
2. ✅ **Circular Dependency Resolution**: LocalStrategy sử dụng PrismaService trực tiếp
3. ✅ **Module Organization**: Di chuyển LocalAuthGuard & LocalStrategy vào @common/
4. ✅ **Global Security Toggle**: Có thể tắt/bật JWT authentication
5. ✅ **Performance Optimization**: Tối ưu hóa imports và dependencies

## Future Enhancements
1. **Redis Integration**: Cho rate limiting distributed
2. **Token Blacklisting**: Cho logout functionality
3. **2FA Support**: Two-factor authentication
4. **Audit Logging**: Track authentication events
5. **Session Management**: Advanced session handling
6. **Database Connection Pooling**: Tối ưu hóa database connections
7. **Caching Layer**: Redis cache cho user sessions
