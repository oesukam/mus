#!/bin/bash

# E-Commerce Monorepo - Cleanup Script
# This script cleans up Docker services and optionally removes all setup files

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Stop Docker services
stop_docker_services() {
    print_header "Stopping Docker Services"

    if docker ps | grep -q "mus-"; then
        print_info "Stopping running containers..."
        docker-compose down
        print_success "Containers stopped"
    else
        print_info "No containers are running"
    fi
}

# Remove Docker volumes
remove_docker_volumes() {
    print_header "Removing Docker Volumes"

    read -p "Do you want to remove Docker volumes (database data will be lost)? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_info "Removing volumes..."
        docker-compose down -v
        print_success "Volumes removed"
    else
        print_info "Keeping Docker volumes"
    fi
}

# Clean node_modules
clean_node_modules() {
    print_header "Cleaning Node Modules"

    read -p "Do you want to remove all node_modules directories? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_info "Removing node_modules..."
        find . -name "node_modules" -type d -prune -exec rm -rf '{}' +
        print_success "node_modules removed"
    else
        print_info "Keeping node_modules"
    fi
}

# Clean build artifacts
clean_build_artifacts() {
    print_header "Cleaning Build Artifacts"

    read -p "Do you want to remove build artifacts (.next, dist, .turbo)? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_info "Removing build artifacts..."

        # Remove .next directories
        find . -name ".next" -type d -prune -exec rm -rf '{}' + 2>/dev/null || true

        # Remove dist directories
        find . -name "dist" -type d -prune -exec rm -rf '{}' + 2>/dev/null || true

        # Remove .turbo
        rm -rf .turbo 2>/dev/null || true

        # Remove coverage
        find . -name "coverage" -type d -prune -exec rm -rf '{}' + 2>/dev/null || true

        print_success "Build artifacts removed"
    else
        print_info "Keeping build artifacts"
    fi
}

# Clean environment files
clean_env_files() {
    print_header "Cleaning Environment Files"

    read -p "Do you want to remove environment files (.env, .env.local)? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_warning "This will remove your environment configuration!"
        read -p "Are you sure? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            print_info "Removing environment files..."

            rm -f apps/api/.env 2>/dev/null || true
            rm -f apps/platform/.env.local 2>/dev/null || true
            rm -f apps/dashboard/.env.local 2>/dev/null || true
            rm -f apps/blog/.env.local 2>/dev/null || true

            print_success "Environment files removed"
        else
            print_info "Keeping environment files"
        fi
    else
        print_info "Keeping environment files"
    fi
}

# Display cleanup options
display_options() {
    print_header "Cleanup Options"

    echo -e "${BLUE}What would you like to clean?${NC}\n"
    echo -e "  1. Stop Docker services only"
    echo -e "  2. Stop Docker services and remove volumes"
    echo -e "  3. Full cleanup (Docker + node_modules + builds)"
    echo -e "  4. Complete reset (Everything including env files)"
    echo -e "  5. Custom cleanup"
    echo -e "  6. Cancel\n"

    read -p "Enter your choice (1-6): " choice

    case $choice in
        1)
            stop_docker_services
            ;;
        2)
            stop_docker_services
            remove_docker_volumes
            ;;
        3)
            stop_docker_services
            remove_docker_volumes
            clean_node_modules
            clean_build_artifacts
            ;;
        4)
            print_warning "This will remove EVERYTHING including your environment files!"
            read -p "Are you absolutely sure? (type 'yes' to confirm): " confirm
            if [ "$confirm" = "yes" ]; then
                stop_docker_services
                remove_docker_volumes
                clean_node_modules
                clean_build_artifacts
                clean_env_files
            else
                print_info "Cleanup cancelled"
                exit 0
            fi
            ;;
        5)
            stop_docker_services
            remove_docker_volumes
            clean_node_modules
            clean_build_artifacts
            clean_env_files
            ;;
        6)
            print_info "Cleanup cancelled"
            exit 0
            ;;
        *)
            print_error "Invalid choice"
            exit 1
            ;;
    esac
}

# Display summary
display_summary() {
    print_header "Cleanup Complete!"

    echo -e "${GREEN}Cleanup finished successfully!${NC}\n"

    echo -e "${BLUE}Next Steps:${NC}"
    echo -e "  • To set up again: ${YELLOW}./setup-local.sh${NC}"
    echo -e "  • To install deps:  ${YELLOW}yarn install${NC}"
    echo -e "  • To start Docker:  ${YELLOW}docker-compose up -d postgres redis${NC}\n"
}

# Main execution
main() {
    clear
    print_header "E-Commerce Monorepo - Cleanup Tool"

    display_options
    display_summary
}

# Run main function
main
