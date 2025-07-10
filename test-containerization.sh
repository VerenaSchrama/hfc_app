#!/bin/bash

# Test script for HerFoodCode containerization setup
echo "🧪 Testing HerFoodCode containerization setup..."

# Check if required files exist
echo "📁 Checking required files..."

required_files=(
    "backend/Dockerfile"
    "backend/docker-compose.yml"
    "backend/.dockerignore"
    "backend/env.example"
    "frontend/pcos-advice-app/Dockerfile"
    "frontend/pcos-advice-app/.dockerignore"
    "docker-compose.yml"
    "deploy.sh"
    "DOCKER_README.md"
    "backend/requirements.txt"
    "frontend/pcos-advice-app/package.json"
    "backend/main.py"
    "backend/rag_pipeline.py"
)

missing_files=()

for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ $file (missing)"
        missing_files+=("$file")
    fi
done

echo ""

# Check if data directories exist
echo "📊 Checking data directories..."

data_dirs=(
    "data/vectorstore"
    "data/processed"
    "backend/data"
)

for dir in "${data_dirs[@]}"; do
    if [ -d "$dir" ]; then
        echo "✅ $dir"
    else
        echo "⚠️  $dir (missing - will be created by Docker)"
    fi
done

echo ""

# Check Dockerfile configurations
echo "🐳 Checking Dockerfile configurations..."

# Check backend Dockerfile
if grep -q "FROM python:3.10-slim" backend/Dockerfile; then
    echo "✅ Backend Dockerfile uses correct base image"
else
    echo "❌ Backend Dockerfile base image issue"
fi

if grep -q "HEALTHCHECK" backend/Dockerfile; then
    echo "✅ Backend Dockerfile includes health check"
else
    echo "❌ Backend Dockerfile missing health check"
fi

# Check frontend Dockerfile
if grep -q "FROM node:18-alpine" frontend/pcos-advice-app/Dockerfile; then
    echo "✅ Frontend Dockerfile uses correct base image"
else
    echo "❌ Frontend Dockerfile base image issue"
fi

if grep -q "output: 'standalone'" frontend/pcos-advice-app/next.config.ts; then
    echo "✅ Next.js configured for standalone output"
else
    echo "❌ Next.js not configured for standalone output"
fi

echo ""

# Check docker-compose configuration
echo "🔧 Checking Docker Compose configuration..."

if grep -q "healthcheck:" docker-compose.yml; then
    echo "✅ Main docker-compose.yml includes health checks"
else
    echo "❌ Main docker-compose.yml missing health checks"
fi

if grep -q "vectorstore" docker-compose.yml; then
    echo "✅ RAG model data volume configured"
else
    echo "❌ RAG model data volume not configured"
fi

echo ""

# Summary
if [ ${#missing_files[@]} -eq 0 ]; then
    echo "🎉 All required files are present!"
    echo ""
    echo "📋 Next steps:"
    echo "1. Install Docker Desktop or Docker Engine"
    echo "2. Create backend/.env file from backend/env.example"
    echo "3. Run ./deploy.sh to start the application"
    echo ""
    echo "📚 For detailed instructions, see DOCKER_README.md"
else
    echo "⚠️  Some files are missing:"
    for file in "${missing_files[@]}"; do
        echo "  - $file"
    done
    echo ""
    echo "Please ensure all required files are present before deployment."
fi

echo ""
echo "🔍 Containerization setup test completed!" 