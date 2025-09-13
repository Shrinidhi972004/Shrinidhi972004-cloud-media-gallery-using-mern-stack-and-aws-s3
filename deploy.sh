#!/bin/bash

# Production deployment script for Cloud Media Gallery

set -e

echo "🚀 Starting production deployment..."

# Check if environment files exist
if [ ! -f "./backend/.env" ]; then
    echo "❌ Backend .env file not found!"
    echo "📝 Please create backend/.env with your configuration"
    exit 1
fi

echo "✅ Environment files found"

# Build and start services
echo "🔨 Building Docker images..."
docker-compose build

echo "📦 Starting services..."
docker-compose up -d

echo "⏳ Waiting for services to be healthy..."
sleep 30

# Check backend health
echo "🔍 Checking backend health..."
if curl -f http://localhost:5000/ > /dev/null 2>&1; then
    echo "✅ Backend is running"
else
    echo "❌ Backend health check failed"
    docker-compose logs backend
    exit 1
fi

# Check frontend health
echo "🔍 Checking frontend health..."
if curl -f http://localhost:80/ > /dev/null 2>&1; then
    echo "✅ Frontend is running"
else
    echo "❌ Frontend health check failed"
    docker-compose logs frontend
    exit 1
fi

echo "🎉 Deployment completed successfully!"
echo "📱 Frontend: http://localhost"
echo "🔧 Backend API: http://localhost:5000"
echo ""
echo "📊 To view logs: docker-compose logs -f"
echo "🛑 To stop: docker-compose down"
