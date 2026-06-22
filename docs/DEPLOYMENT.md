# Deployment Guide
# EV Charging Management Platform

**Version:** 1.0
**Date:** June 2026

---

## Table of Contents
1. [Prerequisites](#1-prerequisites)
2. [Environment Configuration](#2-environment-configuration)
3. [Docker Deployment](#3-docker-deployment)
4. [Production Deployment](#4-production-deployment)
5. [SSL/TLS Configuration](#5-ssltls-configuration)
6. [Database Setup](#6-database-setup)
7. [Monitoring & Logging](#7-monitoring--logging)
8. [Backup & Recovery](#8-backup--recovery)
9. [Scaling](#9-scaling)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. Prerequisites

### 1.1 System Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| CPU | 2 cores | 4+ cores |
| RAM | 4 GB | 8+ GB |
| Storage | 50 GB SSD | 100+ GB SSD |
| OS | Ubuntu 22.04 LTS | Ubuntu 22.04 LTS |

### 1.2 Software Requirements

```bash
# Docker & Docker Compose
Docker Engine: 24.x+
Docker Compose: 2.x+

# Node.js (for local development)
Node.js: 20 LTS
npm: 10.x+

# Database (if running outside Docker)
PostgreSQL: 15+
Redis: 7+
```

### 1.3 Required Ports

| Port | Service | Protocol |
|------|---------|----------|
| 80 | HTTP (Nginx) | TCP |
| 443 | HTTPS (Nginx) | TCP |
| 9000 | OCPP WebSocket | WSS |
| 5432 | PostgreSQL (internal) | TCP |
| 6379 | Redis (internal) | TCP |

---

## 2. Environment Configuration

### 2.1 Environment Variables

Create `.env` file in project root:

```bash
# Application
NODE_ENV=production
APP_NAME=EVCharging
APP_URL=https://yourplatform.com
APP_SECRET=your-256-bit-secret-key

# Database
DATABASE_HOST=postgres
DATABASE_PORT=5432
DATABASE_NAME=evcharging
DATABASE_USER=evcharging
DATABASE_PASSWORD=secure-password-here

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT
JWT_ACCESS_SECRET=your-access-token-secret
JWT_REFRESH_SECRET=your-refresh-token-secret
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# OCPP
OCPP_PORT=9000
OCPP_HEARTBEAT_INTERVAL=300

# Razorpay
RAZORPAY_KEY_ID=rzp_live_xxxxx
RAZORPAY_KEY_SECRET=your-secret-key
RAZORPAY_WEBHOOK_SECRET=webhook-secret

# SMS (Twilio/MSG91)
SMS_PROVIDER=msg91
SMS_API_KEY=your-api-key
SMS_SENDER_ID=EVCHG

# Email (SendGrid/SMTP)
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=your-sendgrid-key
EMAIL_FROM=noreply@yourplatform.com

# Storage
STORAGE_TYPE=local
STORAGE_PATH=/app/uploads
# For S3:
# AWS_ACCESS_KEY_ID=
# AWS_SECRET_ACCESS_KEY=
# AWS_S3_BUCKET=
# AWS_S3_REGION=

# Logging
LOG_LEVEL=info
LOG_FORMAT=json

# Monitoring
ENABLE_METRICS=true
METRICS_PORT=9090
```

### 2.2 Secrets Management

For production, use proper secrets management:

```bash
# Docker Secrets
docker secret create db_password ./secrets/db_password.txt
docker secret create jwt_secret ./secrets/jwt_secret.txt

# Or use environment variable files
# .env.production (not committed to git)
```

---

## 3. Docker Deployment

### 3.1 Development Deployment

```bash
# Clone repository
git clone https://github.com/yourorg/ev-charging-platform.git
cd ev-charging-platform

# Copy environment file
cp .env.example .env
# Edit .env with your settings

# Build and start services
docker-compose up -d --build

# Check status
docker-compose ps

# View logs
docker-compose logs -f

# Access application
# Frontend: http://localhost:3001
# Backend API: http://localhost:3000
# OCPP: ws://localhost:9000
```

### 3.2 docker-compose.yml (Development)

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: evcharging-db
    environment:
      POSTGRES_DB: ${DATABASE_NAME}
      POSTGRES_USER: ${DATABASE_USER}
      POSTGRES_PASSWORD: ${DATABASE_PASSWORD}
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./database/schema.sql:/docker-entrypoint-initdb.d/01-schema.sql
    ports:
      - "5432:5432"
    networks:
      - ev-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DATABASE_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: evcharging-redis
    command: redis-server --appendonly yes
    volumes:
      - redis-data:/data
    ports:
      - "6379:6379"
    networks:
      - ev-network
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: evcharging-backend
    environment:
      NODE_ENV: development
      DATABASE_URL: postgresql://${DATABASE_USER}:${DATABASE_PASSWORD}@postgres:5432/${DATABASE_NAME}
      REDIS_URL: redis://redis:6379
    env_file:
      - .env
    volumes:
      - ./backend/src:/app/src
      - ./backend/uploads:/app/uploads
    ports:
      - "3000:3000"
      - "9000:9000"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - ev-network
    command: npm run dev

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: evcharging-frontend
    environment:
      VITE_API_URL: http://localhost:3000/api/v1
      VITE_SOCKET_URL: http://localhost:3000
    volumes:
      - ./frontend/src:/app/src
    ports:
      - "3001:3001"
    depends_on:
      - backend
    networks:
      - ev-network
    command: npm run dev

volumes:
  postgres-data:
  redis-data:

networks:
  ev-network:
    driver: bridge
```

### 3.3 Backend Dockerfile

```dockerfile
# backend/Dockerfile
FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source
COPY . .

# Build (if TypeScript)
# RUN npm run build

# Expose ports
EXPOSE 3000 9000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Start
CMD ["node", "src/app.js"]
```

### 3.4 Frontend Dockerfile

```dockerfile
# frontend/Dockerfile
FROM node:20-alpine as build

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source
COPY . .

# Build
RUN npm run build

# Production stage
FROM nginx:1.25-alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

---

## 4. Production Deployment

### 4.1 docker-compose.prod.yml

```yaml
version: '3.8'

services:
  nginx:
    image: nginx:1.25-alpine
    container_name: evcharging-nginx
    volumes:
      - ./nginx/nginx.prod.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
      - ./nginx/logs:/var/log/nginx
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - backend
      - frontend
    networks:
      - ev-network
    restart: unless-stopped

  postgres:
    image: postgres:15-alpine
    container_name: evcharging-db
    environment:
      POSTGRES_DB: ${DATABASE_NAME}
      POSTGRES_USER: ${DATABASE_USER}
      POSTGRES_PASSWORD: ${DATABASE_PASSWORD}
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./backups:/backups
    networks:
      - ev-network
    restart: unless-stopped
    deploy:
      resources:
        limits:
          memory: 2G

  redis:
    image: redis:7-alpine
    container_name: evcharging-redis
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis-data:/data
    networks:
      - ev-network
    restart: unless-stopped
    deploy:
      resources:
        limits:
          memory: 512M

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.prod
    container_name: evcharging-backend
    environment:
      NODE_ENV: production
    env_file:
      - .env.production
    volumes:
      - ./uploads:/app/uploads
      - ./logs:/app/logs
    depends_on:
      - postgres
      - redis
    networks:
      - ev-network
    restart: unless-stopped
    deploy:
      resources:
        limits:
          memory: 1G
      replicas: 2

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.prod
    container_name: evcharging-frontend
    networks:
      - ev-network
    restart: unless-stopped

volumes:
  postgres-data:
  redis-data:

networks:
  ev-network:
    driver: bridge
```

### 4.2 Production Deployment Steps

```bash
# 1. Connect to production server
ssh user@your-server.com

# 2. Clone repository
git clone https://github.com/yourorg/ev-charging-platform.git
cd ev-charging-platform

# 3. Create production environment file
cp .env.example .env.production
nano .env.production  # Edit with production values

# 4. Create SSL directory
mkdir -p nginx/ssl
# Copy your SSL certificates

# 5. Build and deploy
docker-compose -f docker-compose.prod.yml up -d --build

# 6. Run database migrations
docker-compose exec backend npm run migrate

# 7. Seed initial data (first time only)
docker-compose exec backend npm run seed

# 8. Verify deployment
curl https://yourplatform.com/health
```

### 4.3 Production Nginx Configuration

```nginx
# nginx/nginx.prod.conf
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 4096;
    use epoll;
    multi_accept on;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for" '
                    'rt=$request_time uct="$upstream_connect_time" '
                    'uht="$upstream_header_time" urt="$upstream_response_time"';

    access_log /var/log/nginx/access.log main;

    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 50M;

    # Gzip
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml application/json application/javascript
               application/xml application/xml+rss text/javascript;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_conn_zone $binary_remote_addr zone=conn:10m;

    # Upstream backends
    upstream backend {
        least_conn;
        server backend:3000 weight=5;
        keepalive 32;
    }

    upstream frontend {
        server frontend:80;
    }

    # Redirect HTTP to HTTPS
    server {
        listen 80;
        server_name yourplatform.com www.yourplatform.com;
        return 301 https://$server_name$request_uri;
    }

    # HTTPS Server
    server {
        listen 443 ssl http2;
        server_name yourplatform.com www.yourplatform.com;

        # SSL Configuration
        ssl_certificate /etc/nginx/ssl/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/privkey.pem;
        ssl_session_timeout 1d;
        ssl_session_cache shared:SSL:50m;
        ssl_session_tickets off;

        # Modern SSL Configuration
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
        ssl_prefer_server_ciphers off;

        # HSTS
        add_header Strict-Transport-Security "max-age=63072000" always;

        # Security Headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;

        # API Routes
        location /api {
            limit_req zone=api burst=20 nodelay;
            limit_conn conn 10;

            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
            proxy_read_timeout 90;
        }

        # Socket.IO
        location /socket.io {
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_read_timeout 86400;
        }

        # Health Check
        location /health {
            proxy_pass http://backend;
            proxy_http_version 1.1;
        }

        # Frontend
        location / {
            proxy_pass http://frontend;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;

            # SPA fallback
            try_files $uri $uri/ /index.html;
        }

        # Static files caching
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
            proxy_pass http://frontend;
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # OCPP WebSocket Server
    server {
        listen 443 ssl http2;
        server_name ocpp.yourplatform.com;

        ssl_certificate /etc/nginx/ssl/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/privkey.pem;

        location / {
            proxy_pass http://backend:9000;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_read_timeout 86400;
            proxy_send_timeout 86400;
        }
    }
}
```

---

## 5. SSL/TLS Configuration

### 5.1 Let's Encrypt with Certbot

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d yourplatform.com -d www.yourplatform.com -d ocpp.yourplatform.com

# Auto-renewal (added automatically by certbot)
# Test renewal
sudo certbot renew --dry-run
```

### 5.2 Manual Certificate Setup

```bash
# Create SSL directory
mkdir -p nginx/ssl

# Copy certificates
cp /path/to/fullchain.pem nginx/ssl/
cp /path/to/privkey.pem nginx/ssl/

# Set permissions
chmod 600 nginx/ssl/*.pem
```

---

## 6. Database Setup

### 6.1 Initial Setup

```bash
# Connect to database container
docker-compose exec postgres psql -U evcharging -d evcharging

# Or run schema directly
docker-compose exec postgres psql -U evcharging -d evcharging -f /docker-entrypoint-initdb.d/01-schema.sql
```

### 6.2 Database Migrations

```bash
# Run pending migrations
docker-compose exec backend npm run migrate

# Rollback last migration
docker-compose exec backend npm run migrate:rollback

# Create new migration
docker-compose exec backend npm run migrate:create -- --name add_new_table
```

### 6.3 Seeding Data

```bash
# Seed all
docker-compose exec backend npm run seed

# Seed specific
docker-compose exec backend npm run seed:roles
docker-compose exec backend npm run seed:admin
```

---

## 7. Monitoring & Logging

### 7.1 Container Logs

```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend

# View last 100 lines
docker-compose logs --tail=100 backend
```

### 7.2 Application Logging

```javascript
// Structured logging with Winston
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: '/app/logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: '/app/logs/combined.log' })
  ]
});
```

### 7.3 Health Check Endpoint

```javascript
// GET /health
app.get('/health', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {}
  };

  // Check database
  try {
    await sequelize.authenticate();
    health.services.database = 'ok';
  } catch (error) {
    health.services.database = 'error';
    health.status = 'degraded';
  }

  // Check Redis
  try {
    await redis.ping();
    health.services.redis = 'ok';
  } catch (error) {
    health.services.redis = 'error';
    health.status = 'degraded';
  }

  const statusCode = health.status === 'ok' ? 200 : 503;
  res.status(statusCode).json(health);
});
```

### 7.4 Prometheus Metrics (Optional)

```javascript
// Add to backend for Prometheus scraping
const promBundle = require('express-prom-bundle');
const metricsMiddleware = promBundle({
  includeMethod: true,
  includePath: true,
  customLabels: { app: 'evcharging' }
});
app.use(metricsMiddleware);
```

---

## 8. Backup & Recovery

### 8.1 Database Backup Script

```bash
#!/bin/bash
# scripts/backup.sh

set -e

BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/evcharging_$DATE.sql.gz"

# Create backup
docker-compose exec -T postgres pg_dump -U evcharging evcharging | gzip > $BACKUP_FILE

# Keep last 30 days of backups
find $BACKUP_DIR -name "evcharging_*.sql.gz" -mtime +30 -delete

echo "Backup completed: $BACKUP_FILE"
```

### 8.2 Automated Backups (Cron)

```bash
# Add to crontab
crontab -e

# Daily backup at 2 AM
0 2 * * * /opt/evcharging/scripts/backup.sh >> /var/log/evcharging-backup.log 2>&1
```

### 8.3 Database Restore

```bash
#!/bin/bash
# scripts/restore.sh

BACKUP_FILE=$1

if [ -z "$BACKUP_FILE" ]; then
    echo "Usage: ./restore.sh <backup_file.sql.gz>"
    exit 1
fi

# Stop application
docker-compose stop backend

# Restore database
gunzip -c $BACKUP_FILE | docker-compose exec -T postgres psql -U evcharging -d evcharging

# Start application
docker-compose start backend

echo "Restore completed from: $BACKUP_FILE"
```

---

## 9. Scaling

### 9.1 Horizontal Scaling

```yaml
# docker-compose.scale.yml
services:
  backend:
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: '1'
          memory: 1G
```

```bash
# Scale manually
docker-compose up -d --scale backend=3
```

### 9.2 Load Balancer Configuration

```nginx
upstream backend {
    least_conn;
    server backend_1:3000 weight=5;
    server backend_2:3000 weight=5;
    server backend_3:3000 weight=5;
    keepalive 32;
}
```

### 9.3 Redis Cluster (Future)

For high availability, consider Redis Sentinel or Redis Cluster configuration.

### 9.4 Database Read Replicas (Future)

For read-heavy workloads, add PostgreSQL read replicas.

---

## 10. Troubleshooting

### 10.1 Common Issues

**Container won't start:**
```bash
# Check logs
docker-compose logs backend

# Check container status
docker-compose ps

# Restart container
docker-compose restart backend
```

**Database connection issues:**
```bash
# Check database is running
docker-compose exec postgres pg_isready

# Check connection from backend
docker-compose exec backend nc -zv postgres 5432
```

**OCPP connections failing:**
```bash
# Check OCPP server logs
docker-compose logs backend | grep OCPP

# Test WebSocket connection
wscat -c wss://ocpp.yourplatform.com/CHARGER_ID
```

### 10.2 Performance Issues

```bash
# Check container resources
docker stats

# Check database slow queries
docker-compose exec postgres psql -U evcharging -c "SELECT * FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;"

# Check Redis memory
docker-compose exec redis redis-cli info memory
```

### 10.3 Debug Mode

```bash
# Enable debug logging
docker-compose exec backend npm run debug

# Or set environment variable
LOG_LEVEL=debug docker-compose up backend
```

### 10.4 Emergency Commands

```bash
# Force restart all services
docker-compose down && docker-compose up -d

# Clear Redis cache
docker-compose exec redis redis-cli FLUSHALL

# Rebuild containers
docker-compose build --no-cache

# Remove all volumes (CAUTION: Data loss!)
docker-compose down -v
```

---

## CI/CD Pipeline

### GitHub Actions Workflow

```yaml
# .github/workflows/ci-cd.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: |
          cd backend && npm ci
          cd ../frontend && npm ci

      - name: Run backend tests
        run: cd backend && npm test

      - name: Run frontend tests
        run: cd frontend && npm test

      - name: Lint
        run: |
          cd backend && npm run lint
          cd ../frontend && npm run lint

  build:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4

      - name: Login to Docker Hub
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}

      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: yourdocker/evcharging:latest

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Deploy to production
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: ${{ secrets.PROD_HOST }}
          username: ${{ secrets.PROD_USER }}
          key: ${{ secrets.PROD_SSH_KEY }}
          script: |
            cd /opt/evcharging
            docker-compose -f docker-compose.prod.yml pull
            docker-compose -f docker-compose.prod.yml up -d
            docker system prune -f
```

---

*End of Deployment Guide*
