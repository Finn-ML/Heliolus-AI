# Docker Development Guide

This guide provides detailed information about using Docker for local development of the Heliolus Platform.

## Overview

The Docker setup provides:

- **PostgreSQL 15**: Primary database
- **Redis 7**: Caching and session storage
- **pgAdmin**: Database management UI
- **LocalStack**: AWS S3 local simulation
- **Redis Commander**: Redis management UI

## Quick Start Commands

```bash
# Start all development services
docker-compose up -d

# View service status
docker-compose ps

# View logs (all services)
docker-compose logs -f

# View logs (specific service)
docker-compose logs -f postgres

# Stop all services
docker-compose down

# Stop and remove volumes (reset all data)
docker-compose down -v

# Restart specific service
docker-compose restart redis
```

## Service Details

### PostgreSQL Database

- **Container**: `heliolus-postgres`
- **Port**: `5432`
- **Database**: `heliumdb`
- **User**: `postgres`
- **Password**: `password`
- **Connection**: `postgresql://postgres:password@localhost:5432/heliumdb`

#### Management:

```bash
# Connect to database
docker exec -it heliolus-postgres psql -U postgres -d heliumdb

# Backup database
docker exec heliolus-postgres pg_dump -U postgres heliumdb > backup.sql

# Restore database
docker exec -i heliolus-postgres psql -U postgres heliumdb < backup.sql

# View database size
docker exec heliolus-postgres psql -U postgres -d heliumdb -c "SELECT pg_size_pretty(pg_database_size('heliumdb'));"
```

### Redis Cache

- **Container**: `heliolus-redis`
- **Port**: `6379`
- **Connection**: `redis://localhost:6379`

#### Management:

```bash
# Connect to Redis CLI
docker exec -it heliolus-redis redis-cli

# Monitor Redis commands
docker exec heliolus-redis redis-cli monitor

# Get Redis info
docker exec heliolus-redis redis-cli info

# Clear all keys
docker exec heliolus-redis redis-cli flushall
```

### pgAdmin (Database UI)

- **Container**: `heliolus-pgadmin`
- **URL**: `http://localhost:5050`
- **Email**: `admin@heliolus.com`
- **Password**: `admin`

#### Setup:

1. Open `http://localhost:5050`
2. Login with credentials above
3. Add new server:
   - Name: `Heliolus Local`
   - Host: `postgres` (Docker internal name)
   - Port: `5432`
   - Database: `heliumdb`
   - Username: `postgres`
   - Password: `password`

### LocalStack (AWS S3 Mock)

- **Container**: `heliolus-localstack`
- **Port**: `4566`
- **Endpoint**: `http://localhost:4566`
- **Access Key**: `test`
- **Secret Key**: `test`

#### Usage:

```bash
# List buckets
aws --endpoint-url=http://localhost:4566 s3 ls

# Upload file
aws --endpoint-url=http://localhost:4566 s3 cp file.txt s3://heliolus-documents/

# Download file
aws --endpoint-url=http://localhost:4566 s3 cp s3://heliolus-documents/file.txt ./

# Create bucket
aws --endpoint-url=http://localhost:4566 s3 mb s3://new-bucket
```

### Redis Commander (Redis UI)

- **Container**: `heliolus-redis-commander`
- **URL**: `http://localhost:8081`

## Environment-Specific Configurations

### Development (docker-compose.override.yml)

Automatically loaded with `docker-compose up`:

- Debug mode enabled
- Development passwords
- Exposed ports for debugging

### Testing (docker-compose.test.yml)

Use for integration tests:

```bash
# Start test environment
docker-compose -f docker-compose.test.yml up -d

# Run tests
npm run test

# Clean up
docker-compose -f docker-compose.test.yml down -v
```

### Production (docker-compose.prod.yml)

Use for production-like testing:

```bash
# Start production environment
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Requires production environment variables
```

## Data Persistence

### Volumes:

- `postgres_data`: PostgreSQL database files
- `redis_data`: Redis persistence files
- `pgadmin_data`: pgAdmin settings and connections
- `localstack_data`: LocalStack S3 data

### Backup and Restore:

```bash
# Backup volumes
docker run --rm -v heliolus_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres-backup.tar.gz -C /data .

# Restore volumes
docker run --rm -v heliolus_postgres_data:/data -v $(pwd):/backup alpine tar xzf /backup/postgres-backup.tar.gz -C /data
```

## Networking

All services are connected via the `heliolus-network` bridge network:

- Services can communicate using container names
- External access via mapped ports
- Isolated from other Docker networks

## Health Checks

All services include health checks:

- **PostgreSQL**: `pg_isready` command
- **Redis**: `redis-cli ping` command
- **pgAdmin**: Depends on PostgreSQL health

View health status:

```bash
docker-compose ps
```

## Resource Usage

### Default Limits (Development):

- PostgreSQL: 2GB RAM, 2 CPUs
- Redis: 1GB RAM, 1 CPU
- Other services: Default Docker limits

### Monitoring:

```bash
# View resource usage
docker stats

# View specific container usage
docker stats heliolus-postgres
```

## Troubleshooting

### Common Issues:

#### Port Conflicts:

```bash
# Find process using port
sudo lsof -i :5432

# Kill process
sudo kill -9 <PID>

# Use different ports in docker-compose.override.yml
```

#### Permission Issues:

```bash
# Fix script permissions
chmod +x docker/localstack/init-aws.sh

# Fix volume permissions (Linux)
sudo chown -R $(id -u):$(id -g) ./docker
```

#### Service Won't Start:

```bash
# Check logs
docker-compose logs service-name

# Rebuild container
docker-compose up -d --build service-name

# Remove and recreate
docker-compose rm service-name
docker-compose up -d service-name
```

#### Database Connection Issues:

```bash
# Wait for health check
docker-compose ps

# Test connection manually
docker exec heliolus-postgres pg_isready -U postgres

# Check network connectivity
docker network inspect heliolus_heliolus-network
```

#### Out of Disk Space:

```bash
# Clean up Docker
docker system prune -a

# Remove unused volumes
docker volume prune

# Check volume sizes
docker system df
```

### Performance Tips:

- Use SSD storage for better I/O performance
- Allocate sufficient RAM to Docker
- Use tmpfs for test databases
- Monitor container resource usage

### Development Workflow:

1. Start services: `docker-compose up -d`
2. Check health: `docker-compose ps`
3. View logs: `docker-compose logs -f`
4. Run application: `npm run dev`
5. Make changes and test
6. Stop services: `docker-compose down`

### Production Considerations:

- Use managed services (RDS, ElastiCache) in production
- Implement proper logging and monitoring
- Use secrets management for sensitive data
- Set up backup strategies
- Configure resource limits based on load
