#!/bin/bash

# HerFoodCode Deployment Script
set -e

echo "🚀 Starting HerFoodCode deployment..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed or not in PATH."
    echo ""
    echo "📦 Please install Docker:"
    echo "  - macOS: https://docs.docker.com/desktop/install/mac-install/"
    echo "  - Linux: https://docs.docker.com/engine/install/"
    echo "  - Windows: https://docs.docker.com/desktop/install/windows-install/"
    echo ""
    echo "After installation, restart your terminal and try again."
    exit 1
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    echo ""
    echo "💡 On macOS/Windows, start Docker Desktop."
    echo "💡 On Linux, run: sudo systemctl start docker"
    exit 1
fi

# Check if Docker Compose is available
if ! docker compose version > /dev/null 2>&1; then
    echo "❌ Docker Compose is not available."
    echo ""
    echo "📦 Please install Docker Compose or use Docker Desktop which includes it."
    exit 1
fi

# Check if .env file exists
if [ ! -f "backend/.env" ]; then
    echo "⚠️  Warning: backend/.env file not found."
    echo "Please create backend/.env file with the following variables:"
    echo "  - OPENAI_API_KEY"
    echo "  - SECRET_KEY"
    echo "  - DATABASE_URL (optional)"
    echo "  - ENVIRONMENT (optional)"
    echo "  - ALLOWED_ORIGINS (optional)"
    echo ""
    echo "You can copy from backend/env.example as a template:"
    echo "  cp backend/env.example backend/.env"
    echo ""
    read -p "Do you want to continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker compose down --remove-orphans

# Build and start services
echo "🔨 Building and starting services..."
docker compose up --build -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be healthy..."
sleep 10

# Check service health
echo "🏥 Checking service health..."
if curl -f http://localhost:8000/health > /dev/null 2>&1; then
    echo "✅ Backend is healthy"
else
    echo "❌ Backend health check failed"
    docker compose logs backend
    exit 1
fi

if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Frontend is healthy"
else
    echo "❌ Frontend health check failed"
    docker compose logs frontend
    exit 1
fi

echo "🎉 Deployment completed successfully!"
echo ""
echo "📱 Application URLs:"
echo "  Frontend: http://localhost:3000"
echo "  Backend API: http://localhost:8000"
echo "  API Health: http://localhost:8000/health"
echo "  API Docs: http://localhost:8000/docs"
echo ""
echo "📋 Useful commands:"
echo "  View logs: docker compose logs -f"
echo "  Stop services: docker compose down"
echo "  Restart services: docker compose restart"
echo "  Update services: docker compose up --build -d" 