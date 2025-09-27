# 🔐 Permission System API Documentation

## Tổng quan

API endpoints cho hệ thống permission được thiết kế theo pattern của users module, cung cấp đầy đủ CRUD operations và các tính năng quản lý permission nâng cao.

## 📋 API Endpoints

### 1. **Roles API** (`/roles`)

#### **CRUD Operations**
```typescript
// GET /roles - Lấy danh sách roles
GET /roles?skip=0&take=10&search=admin&columnFilters[isActive]=true

// GET /roles/:id - Lấy role theo ID
GET /roles/role_123

// POST /roles - Tạo role mới
POST /roles
{
  "name": "CONTENT_MANAGER",
  "displayName": "Content Manager",
  "description": "Quản lý nội dung",
  "isActive": true
}

// PUT /roles/:id - Cập nhật role
PUT /roles/role_123
{
  "displayName": "Senior Content Manager",
  "description": "Quản lý nội dung cấp cao"
}

// DELETE /roles/:id - Xóa role (soft delete)
DELETE /roles/role_123

// POST /roles/:id/restore - Khôi phục role đã xóa
POST /roles/role_123/restore
```

#### **Permission Management**
```typescript
// POST /roles/:id/permissions - Gán permissions cho role
POST /roles/role_123/permissions
{
  "permissionIds": ["perm_1", "perm_2", "perm_3"]
}

// GET /roles/:id/permissions - Lấy permissions của role
GET /roles/role_123/permissions

// POST /roles/:id/permissions/:permissionId - Thêm permission cho role
POST /roles/role_123/permissions/perm_456

// DELETE /roles/:id/permissions/:permissionId - Xóa permission khỏi role
DELETE /roles/role_123/permissions/perm_456
```

#### **User Management**
```typescript
// GET /roles/:id/users - Lấy users có role này
GET /roles/role_123/users

// POST /roles/:id/users/:userId - Gán user cho role
POST /roles/role_123/users/user_456

// DELETE /roles/:id/users/:userId - Xóa user khỏi role
DELETE /roles/role_123/users/user_456
```

### 2. **Permissions API** (`/permissions`)

#### **CRUD Operations**
```typescript
// GET /permissions - Lấy danh sách permissions
GET /permissions?skip=0&take=10&search=posts&columnFilters[resource]=posts

// GET /permissions/:id - Lấy permission theo ID
GET /permissions/perm_123

// POST /permissions - Tạo permission mới
POST /permissions
{
  "name": "posts:bulk-publish",
  "displayName": "Xuất bản hàng loạt bài viết",
  "description": "Quyền xuất bản nhiều bài viết cùng lúc",
  "resource": "posts",
  "action": "bulk-publish",
  "pathPattern": "/admin/posts",
  "isActive": true
}

// PUT /permissions/:id - Cập nhật permission
PUT /permissions/perm_123
{
  "displayName": "Xuất bản hàng loạt bài viết (Updated)"
}

// DELETE /permissions/:id - Xóa permission (soft delete)
DELETE /permissions/perm_123

// POST /permissions/:id/restore - Khôi phục permission đã xóa
POST /permissions/perm_123/restore
```

#### **Advanced Queries**
```typescript
// GET /permissions/:id/roles - Lấy roles có permission này
GET /permissions/perm_123/roles

// GET /permissions/resources/list - Lấy danh sách resources
GET /permissions/resources/list

// GET /permissions/actions/list - Lấy danh sách actions
GET /permissions/actions/list

// GET /permissions/resource/:resource - Lấy permissions theo resource
GET /permissions/resource/posts

// GET /permissions/action/:action - Lấy permissions theo action
GET /permissions/action/create

// GET /permissions/resource/:resource/action/:action - Lấy permissions theo resource và action
GET /permissions/resource/posts/action/create
```

### 3. **User-Roles API** (`/user-roles`)

#### **User Permission Management**
```typescript
// GET /user-roles/user/:userId - Lấy user với roles và permissions
GET /user-roles/user/user_123

// GET /user-roles/user/:userId/permissions - Lấy permissions của user
GET /user-roles/user/user_123/permissions

// GET /user-roles/user/:userId/roles - Lấy roles của user
GET /user-roles/user/user_123/roles

// GET /user-roles/user/:userId/has-permission/:permissionName - Kiểm tra user có permission
GET /user-roles/user/user_123/has-permission/posts:create

// POST /user-roles/user/:userId/has-any-permission - Kiểm tra user có bất kỳ permission nào
POST /user-roles/user/user_123/has-any-permission
{
  "permissions": ["posts:create", "posts:update", "posts:delete"]
}

// POST /user-roles/user/:userId/has-all-permissions - Kiểm tra user có tất cả permissions
POST /user-roles/user/user_123/has-all-permissions
{
  "permissions": ["posts:create", "posts:update"]
}
```

#### **Role Assignment**
```typescript
// POST /user-roles/user/:userId/assign-role - Gán role cho user
POST /user-roles/user/user_123/assign-role
{
  "roleId": "role_456"
}

// POST /user-roles/user/:userId/assign-roles - Gán nhiều roles cho user
POST /user-roles/user/user_123/assign-roles
{
  "roleIds": ["role_456", "role_789"]
}

// DELETE /user-roles/user/:userId/role/:roleId - Xóa role khỏi user
DELETE /user-roles/user/user_123/role/role_456

// DELETE /user-roles/user/:userId/roles - Xóa tất cả roles khỏi user
DELETE /user-roles/user/user_123/roles
```

#### **Advanced Queries**
```typescript
// GET /user-roles/role/:roleId/users - Lấy users có role này
GET /user-roles/role/role_123/users

// GET /user-roles/permission/:permissionName/users - Lấy users có permission này
GET /user-roles/permission/posts:create/users

// GET /user-roles/statistics/roles - Lấy thống kê roles
GET /user-roles/statistics/roles

// GET /user-roles/statistics/permissions - Lấy thống kê permissions
GET /user-roles/statistics/permissions
```

## 🔧 **Service Methods**

### **RolesService**
```typescript
class RolesService {
  // CRUD
  create(createRoleDto: CreateRoleDto): Promise<RoleModel>
  findAll(params?: QueryParams): Promise<RoleModel[]>
  findOne(id: string): Promise<RoleModel>
  update(id: string, updateRoleDto: UpdateRoleDto): Promise<RoleModel>
  remove(id: string): Promise<RoleModel>
  restore(id: string): Promise<RoleModel>

  // Permission Management
  assignPermissions(roleId: string, assignPermissionsDto: AssignPermissionsDto): Promise<RoleModel>
  getPermissions(roleId: string): Promise<Permission[]>
  addPermission(roleId: string, permissionId: string): Promise<RoleModel>
  removePermission(roleId: string, permissionId: string): Promise<RoleModel>

  // User Management
  getUsers(roleId: string): Promise<User[]>
  assignUserToRole(roleId: string, userId: string): Promise<RoleModel>
  removeUserFromRole(roleId: string, userId: string): Promise<RoleModel>
}
```

### **PermissionsService**
```typescript
class PermissionsService {
  // CRUD
  create(createPermissionDto: CreatePermissionDto): Promise<Permission>
  findAll(params?: QueryParams): Promise<Permission[]>
  findOne(id: string): Promise<Permission>
  update(id: string, updatePermissionDto: UpdatePermissionDto): Promise<Permission>
  remove(id: string): Promise<Permission>
  restore(id: string): Promise<Permission>

  // Advanced Queries
  findByResource(resource: string): Promise<Permission[]>
  findByAction(action: string): Promise<Permission[]>
  findByResourceAndAction(resource: string, action: string): Promise<Permission[]>
  getResources(): Promise<string[]>
  getActions(): Promise<string[]>
  getRoles(permissionId: string): Promise<RoleModel[]>
}
```

### **UserRolesService**
```typescript
class UserRolesService {
  // User Permission Management
  getUserWithRolesAndPermissions(userId: string): Promise<User>
  getUserPermissions(userId: string): Promise<string[]>
  hasPermission(userId: string, permissionName: string): Promise<boolean>
  hasAnyPermission(userId: string, permissionNames: string[]): Promise<boolean>
  hasAllPermissions(userId: string, permissionNames: string[]): Promise<boolean>

  // Role Assignment
  assignRole(userId: string, assignRoleDto: AssignRoleDto): Promise<UserRole>
  assignRoles(userId: string, assignRolesDto: AssignRolesDto): Promise<UserRole[]>
  removeRole(userId: string, roleId: string): Promise<void>
  removeAllRoles(userId: string): Promise<void>

  // Advanced Queries
  getUsersWithRole(roleId: string): Promise<User[]>
  getUsersWithPermission(permissionName: string): Promise<User[]>
  getRoleStatistics(): Promise<RoleStats[]>
  getPermissionStatistics(): Promise<PermissionStats[]>
}
```

## 📊 **Response Examples**

### **Role Response**
```json
{
  "id": "role_123",
  "name": "ADMIN",
  "displayName": "Administrator",
  "description": "Quản trị viên hệ thống",
  "isActive": true,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z",
  "deletedAt": null,
  "userRoles": [
    {
      "id": "ur_123",
      "user": {
        "id": "user_456",
        "name": "John Doe",
        "email": "john@example.com"
      }
    }
  ],
  "rolePermissions": [
    {
      "id": "rp_123",
      "permission": {
        "id": "perm_789",
        "name": "posts:create",
        "displayName": "Tạo bài viết",
        "resource": "posts",
        "action": "create"
      }
    }
  ]
}
```

### **Permission Response**
```json
{
  "id": "perm_123",
  "name": "posts:create",
  "displayName": "Tạo bài viết",
  "description": "Quyền tạo bài viết mới",
  "resource": "posts",
  "action": "create",
  "pathPattern": "/admin/posts",
  "isActive": true,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z",
  "deletedAt": null,
  "rolePermissions": [
    {
      "id": "rp_123",
      "role": {
        "id": "role_456",
        "name": "ADMIN",
        "displayName": "Administrator"
      }
    }
  ]
}
```

### **User with Roles and Permissions Response**
```json
{
  "id": "user_123",
  "email": "admin@example.com",
  "name": "Admin User",
  "role": "SUPER_ADMIN",
  "userRoles": [
    {
      "id": "ur_123",
      "role": {
        "id": "role_456",
        "name": "ADMIN",
        "displayName": "Administrator",
        "rolePermissions": [
          {
            "id": "rp_123",
            "permission": {
              "id": "perm_789",
              "name": "posts:create",
              "displayName": "Tạo bài viết",
              "resource": "posts",
              "action": "create"
            }
          }
        ]
      }
    }
  ]
}
```

## 🚀 **Usage Examples**

### **1. Tạo Role và Gán Permissions**
```typescript
// 1. Tạo role mới
const role = await rolesService.create({
  name: "CONTENT_MANAGER",
  displayName: "Content Manager",
  description: "Quản lý nội dung"
});

// 2. Gán permissions cho role
await rolesService.assignPermissions(role.id, {
  permissionIds: ["perm_posts_create", "perm_posts_update", "perm_categories_create"]
});
```

### **2. Gán Role cho User**
```typescript
// Gán role cho user
await userRolesService.assignRole(userId, {
  roleId: "role_content_manager"
});

// Kiểm tra user có permission không
const hasPermission = await userRolesService.hasPermission(userId, "posts:create");
```

### **3. Kiểm tra Permissions**
```typescript
// Lấy tất cả permissions của user
const userPermissions = await userRolesService.getUserPermissions(userId);

// Kiểm tra user có bất kỳ permission nào trong danh sách
const hasAnyPermission = await userRolesService.hasAnyPermission(userId, [
  "posts:create",
  "posts:update",
  "posts:delete"
]);
```

## 🔒 **Security Features**

### **1. Validation**
- ✅ Input validation với class-validator
- ✅ Unique constraints cho name fields
- ✅ Foreign key constraints

### **2. Error Handling**
- ✅ NotFoundException cho resources không tồn tại
- ✅ Proper HTTP status codes
- ✅ Detailed error messages

### **3. Soft Delete**
- ✅ Soft delete cho tất cả entities
- ✅ Restore functionality
- ✅ Include deleted records option

### **4. Audit Trail**
- ✅ CreatedAt/UpdatedAt timestamps
- ✅ DeletedAt tracking
- ✅ Full relationship tracking

## 🎯 **Benefits**

1. **Consistent API**: Theo pattern của users module
2. **Flexible**: Hỗ trợ nhiều use cases khác nhau
3. **Scalable**: Dễ dàng mở rộng và customize
4. **Type-safe**: Full TypeScript support
5. **Well-documented**: Comprehensive API documentation

---

*API được thiết kế để đáp ứng đầy đủ nhu cầu quản lý permission trong hệ thống CMS.*
