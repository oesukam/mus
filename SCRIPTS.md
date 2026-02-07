# Development Scripts Documentation

This document describes the automated setup and maintenance scripts for the e-commerce monorepo.

## Setup Script

### `./setup-local.sh`

Automated setup script for local development with Docker.

#### What it does:

1. **Checks Prerequisites**
   - Verifies Node.js is installed (18+)
   - Checks for pnpm (installs if missing)
   - Verifies Docker and Docker Compose are available

2. **Installs Dependencies**
   - Cleans existing node_modules if present
   - Runs `pnpm install` to install all workspace dependencies

3. **Sets Up Environment Files**
   - Creates `apps/api/.env` from example (configured for Docker)
   - Creates `apps/platform/.env.local`
   - Creates `apps/dashboard/.env.local`
   - Creates `apps/blog/.env.local` (requires manual Contentful setup)

4. **Starts Docker Services**
   - Starts PostgreSQL container (mus-postgres)
   - Starts Redis container (mus-redis)
   - Waits for services to be ready
   - Services are accessible via Docker network only (no port exposure)

5. **Creates Database**
   - Creates the `ecommerce` database if it doesn't exist
   - Skips if database already exists

#### Usage:

```bash
# Make executable (first time only)
chmod +x setup-local.sh

# Run setup
./setup-local.sh
```

#### Environment Configuration:

The script automatically configures the API to use Docker network:
- `DB_HOST=postgres` (Docker container name)
- `REDIS_HOST=redis` (Docker container name)

For local PostgreSQL/Redis, manually change these to `localhost` in `apps/api/.env`.

#### Output:

The script provides colored output showing:
- ✓ Success messages (green)
- ⚠ Warning messages (yellow)
- ✗ Error messages (red)
- ℹ Info messages (blue)

---

## Cleanup Script

### `./cleanup.sh`

Interactive cleanup script to remove development artifacts and reset the environment.

#### Cleanup Options:

**1. Stop Docker services only**
- Stops all running containers
- Keeps volumes and data intact
- Quick way to free up resources

**2. Stop Docker services and remove volumes**
- Stops containers
- Removes Docker volumes (database data will be lost)
- Use when you want a fresh database

**3. Full cleanup**
- Stops Docker services
- Removes volumes
- Deletes all node_modules directories
- Removes build artifacts (.next, dist, .turbo, coverage)
- Keeps environment files

**4. Complete reset**
- Does everything from option 3
- Additionally removes all environment files
- Requires typing 'yes' to confirm
- Use when starting completely fresh

**5. Custom cleanup**
- Interactive prompts for each cleanup step
- Choose exactly what to clean

**6. Cancel**
- Exit without doing anything

#### Usage:

```bash
# Make executable (first time only)
chmod +x cleanup.sh

# Run cleanup
./cleanup.sh
```

#### What Gets Cleaned:

| Item | Option 1 | Option 2 | Option 3 | Option 4 | Option 5 |
|------|----------|----------|----------|----------|----------|
| Stop Docker | ✓ | ✓ | ✓ | ✓ | Choice |
| Remove volumes | | ✓ | ✓ | ✓ | Choice |
| Remove node_modules | | | ✓ | ✓ | Choice |
| Remove builds | | | ✓ | ✓ | Choice |
| Remove env files | | | | ✓ | Choice |

#### Removed Items Detail:

**Docker Services:**
- Containers: `mus-postgres`, `mus-redis`, `mus-api`

**Docker Volumes:**
- `postgres_data` - PostgreSQL database
- `redis_data` - Redis cache

**Node Modules:**
- All `node_modules` directories in the monorepo

**Build Artifacts:**
- `.next/` - Next.js build output
- `dist/` - NestJS build output
- `.turbo/` - Turborepo cache
- `coverage/` - Test coverage reports

**Environment Files:**
- `apps/api/.env`
- `apps/platform/.env.local`
- `apps/dashboard/.env.local`
- `apps/blog/.env.local`

---

## Common Workflows

### First-Time Setup

```bash
# 1. Clone the repository
git clone <repo-url>
cd mus

# 2. Run automated setup
./setup-local.sh

# 3. Start development
pnpm dev
```

### Reset Everything

```bash
# 1. Clean everything
./cleanup.sh
# Choose option 4 (Complete reset)

# 2. Set up again
./setup-local.sh
```

### Fresh Database

```bash
# 1. Stop and remove volumes
./cleanup.sh
# Choose option 2

# 2. Start services again
docker-compose up -d postgres redis

# 3. Database will be recreated on next API start
```

### Clean Build Artifacts

```bash
# Run cleanup with option 3 or custom
./cleanup.sh
# This keeps your data and env files
```

---

## Manual Commands (Alternative to Scripts)

If you prefer manual setup or the scripts don't work:

### Manual Setup

```bash
# Install pnpm
npm install -g pnpm@8.15.0

# Install dependencies
pnpm install

# Create environment files
cd apps/api && cp .env.example .env
cd ../platform && cp .env.example .env.local
cd ../dashboard && cat > .env.local << EOF
API_URL=http://localhost:4000
NEXT_PUBLIC_API_URL=http://localhost:4000
EOF
cd ../blog && cp .env.example .env.local

# Start Docker services
docker-compose up -d postgres redis

# Create database
docker exec mus-postgres psql -U postgres -c "CREATE DATABASE ecommerce;"

# Start development
pnpm dev
```

### Manual Cleanup

```bash
# Stop Docker
docker-compose down

# Remove volumes
docker-compose down -v

# Remove node_modules
find . -name "node_modules" -type d -prune -exec rm -rf '{}' +

# Remove builds
find . -name ".next" -type d -prune -exec rm -rf '{}' +
find . -name "dist" -type d -prune -exec rm -rf '{}' +
rm -rf .turbo

# Remove env files
rm apps/api/.env
rm apps/platform/.env.local
rm apps/dashboard/.env.local
rm apps/blog/.env.local
```

---

## Troubleshooting

### Script Permission Denied

```bash
chmod +x setup-local.sh cleanup.sh
```

### Docker Not Running

```bash
# Start Docker Desktop (macOS/Windows)
# Or start Docker daemon (Linux)
sudo systemctl start docker
```

### Port Already in Use

The Docker setup doesn't expose ports, so this shouldn't happen. If using local PostgreSQL/Redis:

```bash
# Check what's using the port
lsof -i :5432  # PostgreSQL
lsof -i :6379  # Redis

# Stop local services
brew services stop postgresql
brew services stop redis
```

### Database Connection Failed

```bash
# Check if container is running
docker ps | grep mus-postgres

# Check container logs
docker logs mus-postgres

# Verify database exists
docker exec -it mus-postgres psql -U postgres -l
```

### Script Hangs on PostgreSQL Check

```bash
# Kill and restart container
docker-compose down
docker-compose up -d postgres

# Check logs
docker logs -f mus-postgres
```

---

## Script Features

### Color-Coded Output

- 🟢 Green ✓ - Success
- 🟡 Yellow ⚠ - Warning
- 🔴 Red ✗ - Error
- 🔵 Blue ℹ - Information

### Safety Features

- Confirmation prompts for destructive actions
- Checks existing files before overwriting
- Verifies prerequisites before proceeding
- Graceful error handling
- Clear status messages

### Smart Behavior

- Skips steps if already completed
- Detects running services
- Waits for services to be ready
- Creates backups when modifying files
- Interactive mode for custom cleanup

---

## Advanced Usage

### Running Setup Non-Interactively

The current scripts are interactive. For CI/CD or automation, use:

```bash
# Direct commands
pnpm install
docker-compose up -d postgres redis
docker exec mus-postgres psql -U postgres -c "CREATE DATABASE ecommerce;"
```

### Customizing Setup

Edit the scripts to:
- Change database names
- Modify default ports
- Add additional services
- Include custom setup steps

### Integrating with CI/CD

```yaml
# Example GitHub Actions
- name: Setup environment
  run: |
    chmod +x setup-local.sh
    ./setup-local.sh
```

---

## Best Practices

1. **Always use setup script** for first-time setup
2. **Run cleanup option 3** periodically to free disk space
3. **Use option 2** when you need a fresh database
4. **Avoid option 4** unless starting completely fresh
5. **Keep environment files** unless you want to reconfigure

## Related Documentation

- [README.md](README.md) - Project overview
- [SETUP.md](SETUP.md) - Detailed manual setup instructions
- [QUICK_REFERENCE.md](QUICK_REFERENCE.md) - Command reference
- [ARCHITECTURE.md](ARCHITECTURE.md) - Architecture documentation
