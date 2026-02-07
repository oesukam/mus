# Docker Hot Reload Guide

This document explains how to work with the Docker Compose setup for development with hot reload enabled.

## How It Works

The Docker Compose configuration is set up with:

1. **Volume Mounts**: Source code is mounted from your host machine into the container
2. **Watch Mode**: NestJS runs with `--watch` flag to detect file changes
3. **Polling**: File watching uses polling to work reliably in Docker environments

## Starting the Development Environment

```bash
# Start all services with hot reload
docker-compose up

# Start in detached mode (background)
docker-compose up -d

# View logs
docker-compose logs -f api

# View logs for specific service
docker-compose logs -f api
```

## Hot Reload Behavior

### What Triggers Reload:
- ✅ Changes to `.ts` files in `apps/api/src/`
- ✅ Changes to `.json` config files
- ✅ Changes to environment variables (requires restart)

### What Requires Rebuild:
- ❌ Changes to `package.json` (new dependencies)
- ❌ Changes to `Dockerfile`
- ❌ Changes to `nest-cli.json` structure

## Rebuilding Containers

When you need to rebuild (e.g., after adding new dependencies):

```bash
# Rebuild and restart all services
docker-compose up --build

# Rebuild specific service
docker-compose up --build api

# Rebuild without cache (fresh build)
docker-compose build --no-cache api
docker-compose up api
```

## Quick Restart

To restart a service without rebuilding:

```bash
# Restart specific service
docker-compose restart api

# Stop and start (clears state)
docker-compose stop api
docker-compose start api
```

## Troubleshooting

### Changes Not Detected

If file changes aren't being detected:

1. **Check if container is running:**
   ```bash
   docker-compose ps
   ```

2. **Check logs for watch errors:**
   ```bash
   docker-compose logs -f api
   ```

3. **Restart the service:**
   ```bash
   docker-compose restart api
   ```

4. **Verify volume mounts:**
   ```bash
   docker-compose exec api ls -la /app/apps/api/src
   ```

### Permission Issues

If you encounter permission errors:

```bash
# Reset ownership (macOS/Linux)
sudo chown -R $USER:$USER apps/api/node_modules
```

### Port Already in Use

If port 4000 is already in use:

```bash
# Find and kill the process
lsof -ti:4000 | xargs kill -9

# Or change the port in docker-compose.yml
ports:
  - '4001:4000'  # Maps host 4001 to container 4000
```

## Development Workflow

### 1. Make Code Changes
Edit files in `apps/api/src/` - changes will be automatically detected.

### 2. Watch Logs
```bash
docker-compose logs -f api
```

You should see:
```
File change detected. Starting incremental compilation...
Compilation successful.
```

### 3. Test Changes
The API will automatically restart and be available at `http://localhost:4000/api/v1`

### 4. Adding Dependencies

When adding new packages:

```bash
# Option 1: Add via pnpm locally, then rebuild Docker
pnpm add --filter @mus/api <package-name>
docker-compose up --build api

# Option 2: Add inside container
docker-compose exec api pnpm add <package-name>
docker-compose restart api
```

## Performance Tips

### Exclude node_modules from Scanning

The configuration already excludes `node_modules` via named volumes:
- `api_node_modules:/app/node_modules`
- `api_app_node_modules:/app/apps/api/node_modules`

This prevents the file watcher from scanning thousands of files.

### Adjust Polling Interval

If CPU usage is high, increase the polling interval in `apps/api/nest-cli.json`:

```json
{
  "watchOptions": {
    "usePolling": true,
    "interval": 1000  // Increase from 100ms to 1000ms
  }
}
```

## Configuration Files

### nest-cli.json
```json
{
  "compilerOptions": {
    "deleteOutDir": true,
    "watchAssets": true
  },
  "watchOptions": {
    "usePolling": true,
    "interval": 100
  }
}
```

### docker-compose.yml
```yaml
api:
  volumes:
    - ./apps/api:/app/apps/api  # Source code mount
    - api_node_modules:/app/node_modules  # Prevent scanning
  command: pnpm --filter @mus/api dev  # Watch mode
```

## Debug Mode

To run with debugger attached:

```bash
# Update docker-compose.yml command temporarily:
command: pnpm --filter @mus/api dev:debug

# Then expose debug port:
ports:
  - '4000:4000'
  - '9229:9229'  # Debug port
```

Connect your IDE debugger to `localhost:9229`.

## Common Commands

```bash
# View all running containers
docker-compose ps

# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v

# Rebuild everything from scratch
docker-compose down
docker-compose build --no-cache
docker-compose up

# Execute command in running container
docker-compose exec api pnpm run test

# Open shell in container
docker-compose exec api sh
```

## Environment Variables

Hot reload works for code changes, but environment variable changes require restart:

```bash
# After updating .env or docker-compose.yml env vars:
docker-compose restart api

# Or with rebuild if needed:
docker-compose up --build api
```

## Next Steps

- Check `docker-compose.yml` for volume configuration
- Review `apps/api/nest-cli.json` for watch settings
- Monitor `docker-compose logs -f api` for reload messages
