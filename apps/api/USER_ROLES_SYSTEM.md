# User Roles System

## Overview

The application now supports multiple roles per user through a many-to-many relationship between users and roles.

## Database Schema

### Tables

#### `roles`
Stores available system roles.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| name | VARCHAR | Unique role identifier (e.g., 'customer', 'admin') |
| displayName | VARCHAR | Human-readable name (e.g., 'Administrator') |
| description | TEXT | Role description |
| createdAt | TIMESTAMP | Creation date |
| updatedAt | TIMESTAMP | Last update date |

#### `users_roles`
Junction table for many-to-many relationship.

| Column | Type | Description |
|--------|------|-------------|
| userId | INTEGER | Foreign key to users.id (CASCADE DELETE) |
| roleId | INTEGER | Foreign key to roles.id (CASCADE DELETE) |

**Primary Key**: Composite (userId, roleId)

### Default Roles

The system comes with three pre-configured roles:

1. **customer** - Regular customer with basic access
2. **seller** - Can manage products and view orders
3. **admin** - Full system access and management

## Entity Relationships

```typescript
// User Entity
class User {
  role: string;        // Legacy single role column (kept for backwards compatibility)
  roles: Role[];       // New many-to-many relationship
}

// Role Entity
class Role {
  name: string;
  displayName: string;
  description: string;
  users: User[];
}
```

## Usage Examples

### Accessing User Roles

```typescript
// User roles are eagerly loaded
const user = await usersService.findOne(userId);

// Check if user has a specific role
const hasAdminRole = user.roles.some(role => role.name === 'admin');

// Get all role names
const roleNames = user.roles.map(role => role.name);
```

### Assigning Roles to a User

```typescript
import { In } from 'typeorm';

// Find roles by names
const roles = await rolesRepository.find({
  where: { name: In(['customer', 'seller']) }
});

// Assign roles to user
user.roles = roles;
await usersRepository.save(user);
```

### Creating a New Role

```typescript
const role = rolesRepository.create({
  name: 'moderator',
  displayName: 'Moderator',
  description: 'Can moderate content and users'
});

await rolesRepository.save(role);
```

### Role-Based Authorization

```typescript
// Guard example
@UseGuards(RolesGuard)
@Roles('admin', 'seller')
@Get('admin/dashboard')
getDashboard() {
  return this.dashboardService.getStats();
}

// RolesGuard implementation
@Injectable()
export class RolesGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<string[]>('roles', context.getHandler());
    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    return user.roles.some(role => requiredRoles.includes(role.name));
  }
}
```

## Migration Details

### Migration: 1730690000000-CreateRolesSystem

**What it does**:
1. Creates `roles` table
2. Creates `users_roles` junction table
3. Inserts default roles (customer, seller, admin)
4. Migrates existing users to new roles system based on their `role` column

**Backwards Compatibility**:
- The legacy `role` column is kept on the `users` table
- Existing code using the single role will continue to work
- New code should use the `roles` relationship

### Running the Migration

The migration runs automatically on API startup (migrationsRun: true).

Manual execution:
```bash
docker exec mus-api pnpm migration:run
```

## API Examples

### Get User with Roles

```typescript
GET /users/:id

Response:
{
  "id": 1,
  "email": "john@example.com",
  "name": "John Doe",
  "role": "customer",  // Legacy field
  "roles": [           // New roles array
    {
      "id": 1,
      "name": "customer",
      "displayName": "Customer",
      "description": "Regular customer with basic access"
    },
    {
      "id": 2,
      "name": "seller",
      "displayName": "Seller",
      "description": "Can manage products and view orders"
    }
  ],
  "status": "active",
  "createdAt": "2025-01-01T00:00:00Z",
  "updatedAt": "2025-01-01T00:00:00Z"
}
```

### Update User Roles

```typescript
PATCH /users/:id/roles

Request:
{
  "roleNames": ["customer", "seller"]
}

// or

{
  "roleIds": [1, 2]
}
```

## Best Practices

1. **Use roles relation for new features**: The `roles` array is the recommended way to check permissions

2. **Keep legacy role column in sync**: When updating roles, consider updating the `role` column to the primary role for backwards compatibility

3. **Eager loading**: Roles are eagerly loaded by default. If you don't need roles, use:
   ```typescript
   findOne(id, { relations: [] })
   ```

4. **Cache role checks**: For frequently accessed permissions, consider caching role checks

5. **Role hierarchy**: Consider implementing a role hierarchy system for more complex permission structures

## Database Queries

### Get users with specific role
```sql
SELECT u.* FROM users u
JOIN users_roles ur ON u.id = ur."userId"
JOIN roles r ON ur."roleId" = r.id
WHERE r.name = 'admin';
```

### Get user's role names
```sql
SELECT r.name, r."displayName"
FROM roles r
JOIN users_roles ur ON r.id = ur."roleId"
WHERE ur."userId" = 1;
```

### Count users per role
```sql
SELECT r.name, COUNT(ur."userId") as user_count
FROM roles r
LEFT JOIN users_roles ur ON r.id = ur."roleId"
GROUP BY r.id, r.name;
```

## Security Considerations

1. **Role validation**: Always validate role names before assigning them
2. **Permission checks**: Implement proper permission checks in guards and services
3. **Audit logging**: Log role changes for security auditing
4. **Role assignment**: Restrict who can assign roles (typically admin only)
5. **Cascade deletes**: When a role is deleted, all user-role associations are automatically removed

## Future Enhancements

Consider implementing:

1. **Permissions System**: Fine-grained permissions within roles
2. **Role Hierarchy**: Parent-child role relationships
3. **Temporary Roles**: Time-limited role assignments
4. **Role History**: Track when roles were assigned/removed
5. **Custom Roles**: Allow creation of custom roles with specific permissions
6. **Role Templates**: Pre-configured role combinations for common use cases

## Troubleshooting

### Roles not loading
- Check if `eager: true` is set in the ManyToMany decorator
- Ensure TypeORM is configured to load relations

### Migration fails
- Check if the `users` table exists
- Verify database connection
- Check migration logs: `docker logs mus-api`

### Duplicate role assignments
- The composite primary key (userId, roleId) prevents duplicates
- If you get conflicts, check your assignment logic

## Related Files

- Entity: `apps/api/src/modules/users/entities/role.entity.ts`
- Entity: `apps/api/src/modules/users/entities/user.entity.ts`
- Migration: `apps/api/src/migrations/1730690000000-CreateRolesSystem.ts`
- Module: `apps/api/src/modules/users/users.module.ts`
