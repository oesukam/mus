# Setting Up Role-Based Permissions

## Prerequisites

1. **Start Docker Desktop**
   - Open Docker Desktop application
   - Wait for it to fully start

## Step-by-Step Instructions

### 1. Start Database Containers

```bash
cd /Users/oesukam/git-projects/mus
docker-compose up -d
```

Wait for the containers to be healthy:
```bash
docker-compose ps
```

### 2. Check Current Migration Status

```bash
cd apps/api
yarn migration:show
```

### 3. Revert Failed Migration (if needed)

If the CreatePermissionsSystem migration shows as run but failed, revert it:

```bash
yarn migration:revert
```

### 4. Run Migrations

```bash
yarn migration:run
```

This will:
- Create the `permissions` table
- Create the `roles_permissions` join table
- Seed 15 default permissions
- Assign permissions to roles:
  - **Admin**: All permissions
  - **Seller**: Product and order permissions
  - **Customer**: Read-only order permission

### 5. Verify Migrations

Check that the tables were created:

```bash
docker exec mus-postgres psql -U postgres -d ecommerce -c "\dt"
```

Check permissions were seeded:

```bash
docker exec mus-postgres psql -U postgres -d ecommerce -c "SELECT COUNT(*) FROM permissions;"
```

Should return 15.

Check roles have permissions:

```bash
docker exec mus-postgres psql -U postgres -d ecommerce -c "SELECT r.name, COUNT(p.id) as permission_count FROM roles r LEFT JOIN roles_permissions rp ON r.id = rp.\"roleId\" LEFT JOIN permissions p ON rp.\"permissionId\" = p.id GROUP BY r.name;"
```

Expected output:
- admin: 15 permissions
- seller: 6 permissions (products + orders)
- customer: 1 permission (orders:read)

### 6. Start the API

```bash
yarn dev
```

### 7. Test the Permissions API

#### Get all permissions:
```bash
curl -X GET http://localhost:4000/api/v1/permissions \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Get all roles with their permissions:
```bash
curl -X GET http://localhost:4000/api/v1/roles \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Get a specific role:
```bash
curl -X GET http://localhost:4000/api/v1/roles/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Troubleshooting

### Migration already exists but failed

```bash
# Connect to the database
docker exec -it mus-postgres psql -U postgres -d ecommerce

# Check migrations table
SELECT * FROM migrations ORDER BY id DESC;

# If CreatePermissionsSystem failed, delete its entry
DELETE FROM migrations WHERE name = 'CreatePermissionsSystem1730720000000';

# Exit psql
\q

# Run migration again
yarn migration:run
```

### Tables already exist

If tables exist but data is missing:

```bash
# Drop the tables manually
docker exec -it mus-postgres psql -U postgres -d ecommerce

DROP TABLE IF EXISTS roles_permissions CASCADE;
DROP TABLE IF EXISTS permissions CASCADE;

\q

# Delete migration entry
docker exec -it mus-postgres psql -U postgres -d ecommerce -c "DELETE FROM migrations WHERE name = 'CreatePermissionsSystem1730720000000';"

# Run migration again
yarn migration:run
```

### Docker not running

- Open Docker Desktop
- Wait for the whale icon to stop animating
- Retry `docker-compose up -d`

## Expected Results

After successful migration:

1. **permissions table**: 15 rows
   - users:read, users:write, users:delete
   - products:read, products:write, products:delete
   - orders:read, orders:write, orders:delete
   - roles:read, roles:write, roles:delete
   - permissions:read, permissions:write, permissions:delete

2. **roles_permissions table**:
   - Admin role: 15 permissions
   - Seller role: 6 permissions
   - Customer role: 1 permission

3. **API endpoints available**:
   - `/api/v1/permissions` - Permission management
   - `/api/v1/roles` - Role management
   - `/api/v1/admin/users/:id/roles` - User role assignment

## Next Steps

1. Test the permission guards by applying them to controllers
2. Create custom roles for your application
3. Assign roles to users
4. Test permission-based access control

See `PERMISSIONS_GUIDE.md` for detailed usage instructions.
