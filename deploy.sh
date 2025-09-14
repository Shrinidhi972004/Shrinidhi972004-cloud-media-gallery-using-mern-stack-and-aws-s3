#!/bin/bash

# Cloud Media Gallery - Docker Deployment Script
# This script automates the deployment process

set -e

echo "🚀 Cloud Media Gallery - Docker Deployment"
echo "==========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is installed
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    print_success "Docker and Docker Compose are installed"
}

# Check if .env file exists
check_env() {
    if [ ! -f ".env" ]; then
        print_warning ".env file not found. Creating template..."
        cat > .env << EOF
# Database
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/gallery

# JWT
JWT_SECRET=your_64_character_jwt_secret_key_here

# AWS S3
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=ap-south-1
AWS_BUCKET_NAME=your-s3-bucket-name

# Application
NODE_ENV=production
PORT=5002
FRONTEND_URL=http://localhost:3000
EOF
        print_warning "Please update the .env file with your actual values and run this script again."
        exit 1
    fi
    
    print_success ".env file found"
}

# Main deployment function
deploy() {
    print_status "Starting production deployment..."
    
    print_status "Building and starting production containers..."
    docker-compose down --remove-orphans
    docker-compose build --no-cache
    docker-compose up -d
    
    print_status "Waiting for application to start..."
    sleep 30
    
    # Health check
    if curl -f http://localhost:5002/health > /dev/null 2>&1; then
        print_success "Application is running and healthy!"
        print_status "Access your application at: http://localhost:5002"
    else
        print_error "Health check failed. Check logs with: docker-compose logs"
    fi
}

# Show logs function
show_logs() {
    docker-compose logs -f
}

# Stop services function
stop_services() {
    print_status "Stopping services..."
    docker-compose down
    print_success "Services stopped"
}

# Clean up function
cleanup() {
    print_status "Cleaning up Docker resources..."
    
    # Stop all containers
    docker-compose down --remove-orphans 2>/dev/null || true
    
    # Remove unused images
    docker image prune -f
    
    # Remove unused volumes (optional)
    read -p "Do you want to remove unused volumes? This will delete data! (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker volume prune -f
        print_warning "Volumes removed"
    fi
    
    print_success "Cleanup completed"
}

# Show help
show_help() {
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  deploy     - Deploy the application"
    echo "  logs       - Show application logs"
    echo "  stop       - Stop the application"
    echo "  cleanup    - Clean up Docker resources"
    echo "  help       - Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 deploy              - Deploy the application"
    echo "  $0 logs                - Show application logs"
    echo "  $0 stop                - Stop the application"
    echo "  $0 cleanup             - Clean up Docker resources"
}

# Main script logic
main() {
    case $1 in
        "deploy")
            check_docker
            check_env
            deploy
            ;;
        "logs")
            show_logs
            ;;
        "stop")
            stop_services
            ;;
        "cleanup")
            cleanup
            ;;
        "help"|"--help"|"-h")
            show_help
            ;;
        *)
            print_error "Unknown command: $1"
            show_help
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"
