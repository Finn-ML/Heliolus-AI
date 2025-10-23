#!/bin/bash

# Heliolus Platform - Development Environment Reset Script
# This script resets the local development environment

set -e

echo "🔄 Resetting Heliolus Platform development environment..."

# Confirmation prompt
read -p "⚠️  This will destroy all local data. Continue? [y/N] " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Reset cancelled."
    exit 1
fi

# Stop all services
echo "🛑 Stopping all services..."
docker-compose down

# Remove volumes (this destroys all data)
echo "🗑️ Removing all data volumes..."
docker-compose down -v

# Remove any orphaned containers
echo "🧹 Cleaning up orphaned containers..."
docker-compose down --remove-orphans

# Prune Docker system (optional)
read -p "🧹 Also clean up unused Docker images and networks? [y/N] " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    docker system prune -f
fi

# Restart services
echo "🐳 Starting fresh services..."
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

# Reinitialize database if Prisma is configured
if [ -d "prisma" ]; then
    echo "🗄️ Reinitializing database..."
    npx prisma generate
    npx prisma db push
    
    # Run seeders if they exist
    if [ -f "prisma/seed.js" ] || [ -f "prisma/seed.ts" ]; then
        echo "🌱 Running database seeders..."
        npx prisma db seed
    fi
fi

# Print status
echo ""
echo "✅ Development environment has been reset!"
echo ""
echo "📊 Service Status:"
docker-compose ps

echo ""
echo "🚀 You can now start the application with: npm run dev"