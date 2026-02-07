# Role-Based Permissions System

This guide explains how to use the role-based permissions system in the MUS API.

## Overview

The system uses a flexible role-based access control (RBAC) model with the following components:

- **Users**: Can have multiple roles
- **Roles**: Can have multiple permissions
- **Permissions**: Define specific actions on resources (format: `resource:action`)

## Entities

### Permission
- **name**: Unique identifier (e.g., `users:read`, `products:write`)
- **resource**: The entity/resource (e.g., `users`, `products`, `orders`)
- **action**: The operation (e.g., `read`, `write`, `delete`)
- **displayName**: Human-readable name
- **description**: What the permission allows

### Role
- **name**: Unique identifier (e.g., `admin`, `seller`, `customer`)
- **displayName**: Human-readable name
- **description**: Role description
- **permissions**: Array of assigned permissions

## API Endpoints

### Permissions Management

#### Create Permission
```http
POST /api/v1/permissions
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "products:read",
  "resource": "products",
  "action": "read",
  "displayName": "View Products",
  "description": "Allows viewing product information"
}
```

#### Get All Permissions
```http
GET /api/v1/permissions
Authorization: Bearer {token}
```

#### Get Permission by ID
```http
GET /api/v1/permissions/{id}
Authorization: Bearer {token}
```

#### Get Permissions by Resource
```http
GET /api/v1/permissions/resource/{resource}
Authorization: Bearer {token}
```

#### Update Permission
```http
PUT /api/v1/permissions/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "displayName": "View All Products",
  "description": "Updated description"
}
```

#### Delete Permission
```http
DELETE /api/v1/permissions/{id}
Authorization: Bearer {token}
```

#### Seed Default Permissions
```http
POST /api/v1/permissions/seed
Authorization: Bearer {token}
```

### Roles Management

#### Create Role
```http
POST /api/v1/roles
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "manager",
  "displayName": "Manager",
  "description": "Store manager with elevated privileges",
  "permissionIds": [1, 2, 3, 4, 5]
}
```

#### Get All Roles
```http
GET /api/v1/roles
Authorization: Bearer {token}
```

#### Get Role by ID
```http
GET /api/v1/roles/{id}
Authorization: Bearer {token}
```

#### Update Role
```http
PUT /api/v1/roles/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "displayName": "Senior Manager",
  "description": "Updated description",
  "permissionIds": [1, 2, 3, 4, 5, 6]
}
```

#### Assign Permissions to Role
```http
PUT /api/v1/roles/{id}/permissions
Authorization: Bearer {token}
Content-Type: application/json

{
  "permissionIds": [1, 2, 3, 4, 5]
}
```

#### Delete Role
```http
DELETE /api/v1/roles/{id}
Authorization: Bearer {token}
```

Note: System roles (admin, seller, customer) cannot be deleted.

### User Role Assignment

#### Assign Roles to User
```http
PUT /api/v1/admin/users/{userId}/roles
Authorization: Bearer {token}
Content-Type: application/json

{
  "roleIds": [1, 2]
}
```

## Using Permissions in Code

### Permission Guard

The `PermissionsGuard` checks if a user has the required permissions.

```typescript
import { UseGuards } from '@nestjs/common';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';

@Controller('products')
@UseGuards(PermissionsGuard)
export class ProductsController {

  @Get()
  @Permissions('products:read')
  async findAll() {
    // Only users with 'products:read' permission can access
  }

  @Post()
  @Permissions('products:write')
  async create() {
    // Only users with 'products:write' permission can access
  }

  @Delete(':id')
  @Permissions('products:delete')
  async remove() {
    // Only users with 'products:delete' permission can access
  }
}
```

### Multiple Permissions (OR logic)

```typescript
@Get('sensitive')
@Permissions('admin:read', 'manager:read')
async getSensitiveData() {
  // User needs either 'admin:read' OR 'manager:read' permission
}
```

### Combining with Role Guard

```typescript
@Controller('admin')
@UseGuards(RolesGuard, PermissionsGuard)
@Roles('admin')
export class AdminController {

  @Get('users')
  @Permissions('users:read')
  async getUsers() {
    // User must have 'admin' role AND 'users:read' permission
  }
}
```

### Checking Permissions in Service Layer

```typescript
import { User } from './entities/user.entity';

async doSomething(user: User) {
  if (user.hasPermission('products:write')) {
    // User has permission
  }

  if (user.hasAnyPermission(['products:write', 'products:delete'])) {
    // User has at least one of the permissions
  }

  const permissions = user.getPermissionNames();
  // Returns: ['users:read', 'products:write', ...]
}
```

## Default Permissions

The system seeds the following default permissions:

### User Permissions
- `users:read` - View user information
- `users:write` - Create and update users
- `users:delete` - Delete users

### Product Permissions
- `products:read` - View product information
- `products:write` - Create and update products
- `products:delete` - Delete products

### Order Permissions
- `orders:read` - View order information
- `orders:write` - Create and update orders
- `orders:delete` - Delete orders

### Role Permissions
- `roles:read` - View role information
- `roles:write` - Create and update roles
- `roles:delete` - Delete roles

### Permission Permissions
- `permissions:read` - View permission information
- `permissions:write` - Create and update permissions
- `permissions:delete` - Delete permissions

## Default Role Permissions

### Admin Role
- Has ALL permissions

### Seller Role
- All product permissions (read, write, delete)
- All order permissions (read, write, delete)

### Customer Role
- `orders:read` - Can view their own orders

## Database Schema

### permissions table
```sql
- id (PK)
- name (unique)
- resource
- action
- displayName
- description
- createdAt
- updatedAt
```

### roles table
```sql
- id (PK)
- name (unique)
- displayName
- description
- createdAt
- updatedAt
```

### roles_permissions (join table)
```sql
- roleId (FK -> roles.id)
- permissionId (FK -> permissions.id)
```

### users_roles (join table)
```sql
- userId (FK -> users.id)
- roleId (FK -> roles.id)
```

## Running Migrations

To apply the permissions system migrations:

```bash
# Generate new migration
yarn workspace @mus/api migration:generate

# Run migrations
yarn workspace @mus/api migration:run

# Revert last migration
yarn workspace @mus/api migration:revert
```

## Best Practices

1. **Use granular permissions**: Instead of one "admin" permission, use specific permissions like `users:write`, `products:delete`

2. **Follow naming convention**: Use `resource:action` format (e.g., `orders:read`, `products:write`)

3. **Group related permissions**: Create roles that group related permissions together

4. **Avoid hardcoding**: Use constants for permission names

5. **Check permissions in services**: Don't rely solely on guards; validate permissions in business logic too

6. **Audit permission changes**: Log when permissions are added/removed from roles

## Example: Creating a Custom Role

```typescript
// 1. Create permissions for blog posts
await permissionsService.create({
  name: 'blog:read',
  resource: 'blog',
  action: 'read',
  displayName: 'View Blog Posts',
  description: 'Can view blog posts'
});

await permissionsService.create({
  name: 'blog:write',
  resource: 'blog',
  action: 'write',
  displayName: 'Manage Blog Posts',
  description: 'Can create and edit blog posts'
});

// 2. Create a blogger role with these permissions
const permissions = await permissionsService.findByResource('blog');
const permissionIds = permissions.map(p => p.id);

await rolesService.create({
  name: 'blogger',
  displayName: 'Blogger',
  description: 'Can manage blog posts',
  permissionIds
});

// 3. Assign the role to a user
await usersService.assignRoles(userId, {
  roleIds: [bloggerRoleId]
});
```

## Troubleshooting

### User has role but permission denied
- Check if the role has the required permission assigned
- Verify the permission name matches exactly (case-sensitive)
- Ensure the user's roles are being loaded (check eager loading)

### Cannot delete role
- System roles (admin, seller, customer) cannot be deleted
- Check if users are still assigned to the role

### Permission not working in controller
- Ensure `PermissionsGuard` is applied via `@UseGuards()`
- Check that JWT authentication is working
- Verify the user object is being populated correctly
