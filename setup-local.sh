#!/bin/bash

# E-Commerce Monorepo - Local Development Setup Script
# This script automates the setup process for local development with Docker

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    print_header "Checking Prerequisites"

    # Check Node.js
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node -v)
        print_success "Node.js $NODE_VERSION installed"
    else
        print_error "Node.js is not installed. Please install Node.js 24+ first."
        exit 1
    fi

    # Check yarn
    if command -v yarn &> /dev/null; then
        YARN_VERSION=$(yarn -v)
        print_success "yarn $YARN_VERSION installed"
    else
        print_warning "yarn is not installed. Installing yarn..."
        corepack enable
        print_success "yarn installed"
    fi

    # Check Docker
    if command -v docker &> /dev/null; then
        DOCKER_VERSION=$(docker --version)
        print_success "Docker installed: $DOCKER_VERSION"
    else
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi

    # Check Docker Compose
    if command -v docker-compose &> /dev/null || docker compose version &> /dev/null; then
        print_success "Docker Compose is available"
    else
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
}

# Install dependencies
install_dependencies() {
    print_header "Installing Dependencies"

    if [ -d "node_modules" ]; then
        print_info "node_modules directory exists. Cleaning..."
        rm -rf node_modules
    fi

    print_info "Installing yarn dependencies..."
    yarn install
    print_success "Dependencies installed successfully"
}

# Setup environment files
setup_env_files() {
    print_header "Setting Up Environment Files"

    # API .env
    if [ ! -f "apps/api/.env" ]; then
        print_info "Creating apps/api/.env from example..."
        cp apps/api/.env.example apps/api/.env

        # Update for Docker setup
        sed -i.bak 's/DB_HOST=localhost/DB_HOST=postgres/' apps/api/.env
        sed -i.bak 's/REDIS_HOST=localhost/REDIS_HOST=redis/' apps/api/.env
        rm apps/api/.env.bak 2>/dev/null || true

        print_success "Created apps/api/.env (configured for Docker)"
    else
        print_warning "apps/api/.env already exists, skipping..."
    fi

    # Platform .env.local
    if [ ! -f "apps/platform/.env.local" ]; then
        print_info "Creating apps/platform/.env.local..."
        cp apps/platform/.env.example apps/platform/.env.local
        print_success "Created apps/platform/.env.local"
    else
        print_warning "apps/platform/.env.local already exists, skipping..."
    fi

    # Dashboard .env.local (create from platform example)
    if [ ! -f "apps/dashboard/.env.local" ]; then
        print_info "Creating apps/dashboard/.env.local..."
        cat > apps/dashboard/.env.local << EOF
API_URL=http://localhost:4000
NEXT_PUBLIC_API_URL=http://localhost:4000
EOF
        print_success "Created apps/dashboard/.env.local"
    else
        print_warning "apps/dashboard/.env.local already exists, skipping..."
    fi

    # Blog .env.local
    if [ ! -f "apps/blog/.env.local" ]; then
        print_info "Creating apps/blog/.env.local..."
        cp apps/blog/.env.example apps/blog/.env.local
        print_warning "Remember to add your Contentful credentials to apps/blog/.env.local"
    else
        print_warning "apps/blog/.env.local already exists, skipping..."
    fi
}

# Start Docker services
start_docker_services() {
    print_header "Starting Docker Services"

    # Check if containers are already running
    if docker ps | grep -q "mus-postgres"; then
        print_warning "PostgreSQL container is already running"
    fi

    if docker ps | grep -q "mus-redis"; then
        print_warning "Redis container is already running"
    fi

    print_info "Starting PostgreSQL, Redis, and MinIO containers..."
    docker-compose up -d postgres redis minio

    print_info "Waiting for services to be ready..."
    sleep 5

    # Check PostgreSQL
    print_info "Checking PostgreSQL connection..."
    for i in {1..30}; do
        if docker exec mus-postgres pg_isready -U postgres &> /dev/null; then
            print_success "PostgreSQL is ready"
            break
        fi
        if [ $i -eq 30 ]; then
            print_error "PostgreSQL failed to start"
            exit 1
        fi
        sleep 1
    done

    # Check Redis
    print_info "Checking Redis connection..."
    if docker exec mus-redis redis-cli ping &> /dev/null; then
        print_success "Redis is ready"
    else
        print_error "Redis failed to start"
        exit 1
    fi

    # Check MinIO
    print_info "Checking MinIO connection..."
    for i in {1..30}; do
        if curl -s http://localhost:9000/minio/health/live > /dev/null 2>&1; then
            print_success "MinIO is ready"
            break
        fi
        if [ $i -eq 30 ]; then
            print_error "MinIO failed to start"
            exit 1
        fi
        sleep 1
    done
}

# Create database
create_database() {
    print_header "Setting Up Database"

    print_info "Checking if database exists..."
    if docker exec mus-postgres psql -U postgres -lqt | cut -d \| -f 1 | grep -qw ecommerce; then
        print_warning "Database 'ecommerce' already exists, skipping creation..."
    else
        print_info "Creating database 'ecommerce'..."
        docker exec mus-postgres psql -U postgres -c "CREATE DATABASE ecommerce;" &> /dev/null
        print_success "Database created successfully"
    fi
}

# Setup MinIO buckets
setup_minio() {
    print_header "Setting Up MinIO Storage"

    print_info "Configuring MinIO using Docker..."

    # Use MinIO client via Docker - no local installation needed!
    # Configure MinIO alias
    print_info "Setting up MinIO connection..."
    docker run --rm --network mus_mus-network \
        --entrypoint /bin/sh \
        minio/mc:latest \
        -c "mc alias set myminio http://minio:9000 minioadmin minioadmin" > /dev/null 2>&1

    # Create buckets
    print_info "Creating 'products' bucket..."
    docker run --rm --network mus_mus-network \
        minio/mc:latest \
        mb myminio/products --ignore-existing > /dev/null 2>&1
    print_success "Bucket 'products' created"

    # Set public download policy
    print_info "Setting public download policy for 'products' bucket..."
    docker run --rm --network mus_mus-network \
        minio/mc:latest \
        anonymous set download myminio/products > /dev/null 2>&1
    print_success "Public policy configured"

    print_success "MinIO setup complete (no local installation required!)"
}

# Display summary
display_summary() {
    print_header "Setup Complete!"

    echo -e "${GREEN}Your development environment is ready!${NC}\n"

    echo -e "${BLUE}Next Steps:${NC}"
    echo -e "  1. Start all development servers:"
    echo -e "     ${YELLOW}yarn dev${NC}\n"

    echo -e "${BLUE}Or start individual apps:${NC}"
    echo -e "  • Platform:  ${YELLOW}cd apps/platform && yarn dev${NC}"
    echo -e "  • Dashboard: ${YELLOW}cd apps/dashboard && yarn dev${NC}"
    echo -e "  • API:       ${YELLOW}cd apps/api && yarn dev${NC}"
    echo -e "  • Blog:      ${YELLOW}cd apps/blog && yarn dev${NC}\n"

    echo -e "${BLUE}Access Points:${NC}"
    echo -e "  • Platform:  ${YELLOW}http://localhost:3000${NC}"
    echo -e "  • Dashboard: ${YELLOW}http://localhost:3001${NC}"
    echo -e "  • Blog:      ${YELLOW}http://localhost:3002${NC}"
    echo -e "  • API:       ${YELLOW}http://localhost:4000${NC}"
    echo -e "  • API Docs:  ${YELLOW}http://localhost:4000/api/docs${NC}\n"

    echo -e "${BLUE}Docker Services:${NC}"
    echo -e "  • PostgreSQL: ${GREEN}Running${NC} (accessible via Docker network)"
    echo -e "  • Redis:      ${GREEN}Running${NC} (accessible via Docker network)"
    echo -e "  • MinIO:      ${GREEN}Running${NC} (S3-compatible object storage)\n"

    echo -e "${BLUE}MinIO Access:${NC}"
    echo -e "  • Console:    ${YELLOW}http://localhost:9001${NC} (user: minioadmin, pass: minioadmin)"
    echo -e "  • API:        ${YELLOW}http://localhost:9000${NC}"
    echo -e "  • Bucket:     ${GREEN}products${NC} (public download access)\n"

    echo -e "${BLUE}Useful Commands:${NC}"
    echo -e "  • Access PostgreSQL: ${YELLOW}docker exec -it mus-postgres psql -U postgres -d ecommerce${NC}"
    echo -e "  • Access Redis:      ${YELLOW}docker exec -it mus-redis redis-cli${NC}"
    echo -e "  • List MinIO files:  ${YELLOW}docker run --rm --network mus_mus-network minio/mc ls myminio/products${NC}"
    echo -e "  • View logs:         ${YELLOW}docker-compose logs -f${NC}"
    echo -e "  • Stop services:     ${YELLOW}docker-compose down${NC}\n"

    if [ ! -f "apps/blog/.env.local" ] || ! grep -q "your_space_id" apps/blog/.env.local 2>/dev/null; then
        print_warning "Don't forget to configure Contentful credentials in apps/blog/.env.local"
    fi
}

# Main execution
main() {
    clear
    print_header "E-Commerce Monorepo - Local Development Setup"

    echo -e "${BLUE}This script will:${NC}"
    echo -e "  1. Check prerequisites (Node.js, yarn, Docker)"
    echo -e "  2. Install yarn dependencies"
    echo -e "  3. Create environment files"
    echo -e "  4. Start Docker services (PostgreSQL, Redis & MinIO)"
    echo -e "  5. Create database"
    echo -e "  6. Setup MinIO buckets for file storage\n"

    read -p "Continue with setup? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "Setup cancelled"
        exit 0
    fi

    check_prerequisites
    install_dependencies
    setup_env_files
    start_docker_services
    create_database
    setup_minio
    display_summary
}

# Run main function
main
