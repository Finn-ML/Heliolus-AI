# Heliolus Platform - Docker Development Setup

This guide covers the Docker-based development environment for the Heliolus Platform backend.

## Quick Start

```bash
# Setup development environment
npm run docker:dev

# Start application
npm run dev
```

## What's Included

The Docker setup provides a complete development environment with:

### Core Services

- **PostgreSQL 15** - Primary database with health checks
- **Redis 7** - Caching and session storage
- **LocalStack** - AWS S3 local simulation for file storage

### Management Tools

- **pgAdmin** - Database management interface at `http://localhost:5050`
- **Redis Commander** - Redis management interface at `http://localhost:8081`

### Development Features

- Automatic service health monitoring
- Data persistence across restarts
- Hot-reload friendly configuration
- Production-like environment simulation

## Available Scripts

### Docker Management

```bash
npm run docker:dev      # Complete setup (recommended for first time)
npm run docker:up       # Start services only
npm run docker:stop     # Stop all services
npm run docker:reset    # Reset all data and restart
npm run docker:logs     # View service logs
npm run docker:test     # Start test environment
```

### Database Management

```bash
npm run db:migrate      # Run Prisma migrations
npm run db:generate     # Generate Prisma client
npm run db:reset        # Reset database schema
npm run db:seed         # Run database seeders
npm run db:studio       # Open Prisma Studio
```

### AWS Setup

```bash
npm run aws:setup       # Configure production S3 bucket
```

## Service Details

### PostgreSQL Database

- **URL**: `postgresql://postgres:password@localhost:5432/heliumdb`
- **Port**: 5432
- **Management**: pgAdmin at `http://localhost:5050`
- **Credentials**: `admin@heliolus.com` / `admin`

### Redis Cache

- **URL**: `redis://localhost:6379`
- **Port**: 6379
- **Management**: Redis Commander at `http://localhost:8081`

### AWS S3 (LocalStack)

- **Endpoint**: `http://localhost:4566`
- **Bucket**: `heliolus-documents`
- **Access Key**: `test`
- **Secret Key**: `test`

## Environment Configuration

### For Replit (Default)

Uses Replit's managed PostgreSQL. No Docker required.

### For Local Development

```env
# Copy and modify
cp .env.example .env.local

# Update for Docker services
DATABASE_URL="postgresql://postgres:password@localhost:5432/heliumdb"
REDIS_URL="redis://localhost:6379"
AWS_ENDPOINT_URL="http://localhost:4566"
AWS_ACCESS_KEY_ID="test"
AWS_SECRET_ACCESS_KEY="test"
```

### For Production

See `docs/deployment/environment-setup.md` for complete production setup.

## File Structure

```
backend/
├── docker-compose.yml              # Main Docker configuration
├── docker-compose.override.yml     # Development overrides
├── docker-compose.prod.yml         # Production configuration
├── docker-compose.test.yml         # Testing configuration
├── docker/
│   ├── postgres/
│   │   └── init.sql                # Database initialization
│   └── localstack/
│       └── init-aws.sh            # S3 bucket setup
├── aws/
│   ├── s3/
│   │   ├── bucket-policy.json     # S3 bucket policies
│   │   ├── cors-configuration.json # CORS settings
│   │   └── lifecycle-configuration.json # Lifecycle rules
│   └── iam-policy.json            # IAM permissions
├── scripts/
│   ├── dev-setup.sh               # Development setup
│   ├── dev-reset.sh               # Environment reset
│   └── aws-setup.sh               # AWS S3 production setup
└── docs/deployment/
    ├── environment-setup.md        # Complete environment guide
    └── docker-guide.md            # Detailed Docker documentation
```

## Data Persistence

Docker volumes ensure data survives container restarts:

- `postgres_data` - Database files
- `redis_data` - Cache data
- `pgadmin_data` - pgAdmin settings
- `localstack_data` - S3 mock data

To completely reset: `npm run docker:reset`

## Development Workflow

1. **Initial Setup**

   ```bash
   npm run docker:dev
   ```

2. **Daily Development**

   ```bash
   npm run docker:up    # Start services
   npm run dev          # Start application
   ```

3. **Database Changes**

   ```bash
   npm run db:migrate   # Apply schema changes
   ```

4. **Troubleshooting**
   ```bash
   npm run docker:logs  # Check service logs
   npm run docker:reset # Nuclear option
   ```

## Production Deployment

### AWS S3 Setup

```bash
# Configure AWS CLI first
aws configure

# Setup S3 bucket and IAM
npm run aws:setup
```

### Docker Production

```bash
# Use production configuration
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

## Monitoring and Health

All services include health checks:

- PostgreSQL: `pg_isready` validation
- Redis: Ping response check
- Automatic restart on failure

View status: `docker-compose ps`

## Security Considerations

### Development

- Default passwords for local development
- Open access for debugging
- No SSL/TLS requirements

### Production

- Strong passwords required
- IAM-based access control
- SSL/TLS encryption
- Regular security updates

## Performance Tips

- Use SSD storage for Docker volumes
- Allocate sufficient RAM (4GB+ recommended)
- Monitor resource usage with `docker stats`
- Use tmpfs for test databases

## Troubleshooting

### Common Issues

#### Port Conflicts

```bash
# Check what's using port 5432
sudo lsof -i :5432

# Use different ports in docker-compose.override.yml
```

#### Service Won't Start

```bash
# Check logs
npm run docker:logs

# Reset everything
npm run docker:reset
```

#### Permission Issues (Linux)

```bash
# Fix script permissions
chmod +x scripts/*.sh docker/localstack/init-aws.sh
```

#### Database Connection Failed

```bash
# Wait for health check
docker-compose ps

# Manual connection test
docker exec heliolus-postgres pg_isready -U postgres
```

## Support

- **Documentation**: `docs/deployment/`
- **Docker Guide**: `docs/deployment/docker-guide.md`
- **Environment Setup**: `docs/deployment/environment-setup.md`

For additional help, check service logs or review the comprehensive documentation.
