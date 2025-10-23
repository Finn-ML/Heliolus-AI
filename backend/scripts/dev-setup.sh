#!/bin/bash

# Heliolus Platform - Development Environment Setup Script
# This script sets up the local development environment with Docker

set -e

echo "🚀 Setting up Heliolus Platform development environment..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Create environment file if it doesn't exist
if [ ! -f .env.local ]; then
    echo "📋 Creating local environment file..."
    cp .env.example .env.local
    echo "✅ Created .env.local - please review and update as needed"
fi

# Make LocalStack init script executable
chmod +x docker/localstack/init-aws.sh

# Stop any existing containers
echo "🛑 Stopping existing containers..."
docker-compose down

# Start all services
echo "🐳 Starting Docker services..."
docker-compose up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be ready..."
timeout=60
counter=0

while [ $counter -lt $timeout ]; do
    if docker-compose ps | grep -q "healthy"; then
        break
    fi
    echo "Waiting... ($counter/$timeout)"
    sleep 2
    counter=$((counter + 2))
done

# Check service status
echo "📊 Service Status:"
docker-compose ps

# Install Node.js dependencies
echo "📦 Installing Node.js dependencies..."
npm install

# Run database migrations if Prisma is configured
if [ -d "prisma" ]; then
    echo "🗄️ Running database migrations..."
    npx prisma generate
    npx prisma db push
fi

# Print service URLs
echo ""
echo "✅ Development environment is ready!"
echo ""
echo "📍 Service URLs:"
echo "  - Application:     http://localhost:3001"
echo "  - PostgreSQL:      localhost:5432"
echo "  - Redis:          localhost:6379"
echo "  - pgAdmin:        http://localhost:5050 (admin@heliolus.com / admin)"
echo "  - Redis Commander: http://localhost:8081"
echo "  - LocalStack S3:  http://localhost:4566"
echo ""
echo "🔧 Useful commands:"
echo "  - View logs:      docker-compose logs -f"
echo "  - Stop services:  docker-compose down"
echo "  - Reset data:     docker-compose down -v"
echo "  - Start app:      npm run dev"
echo ""
echo "📚 For more information, see docs/deployment/docker-guide.md"