#!/bin/bash

# Database Backup Script
set -e

# Configuration
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/evcharging_${DATE}.sql.gz"
RETENTION_DAYS=30

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  EV Charging Database Backup${NC}"
echo -e "${GREEN}========================================${NC}"

# Create backup directory if it doesn't exist
mkdir -p ${BACKUP_DIR}

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_NAME=${DB_NAME:-evcharging}
DB_USER=${DB_USER:-postgres}

echo -e "${YELLOW}Starting backup of database: ${DB_NAME}${NC}"

# Create backup using Docker
docker-compose exec -T postgres pg_dump -U ${DB_USER} ${DB_NAME} | gzip > ${BACKUP_FILE}

if [ $? -eq 0 ]; then
    BACKUP_SIZE=$(du -h ${BACKUP_FILE} | cut -f1)
    echo -e "${GREEN}✓ Backup created successfully${NC}"
    echo -e "  File: ${BACKUP_FILE}"
    echo -e "  Size: ${BACKUP_SIZE}"
else
    echo -e "${RED}✗ Backup failed${NC}"
    exit 1
fi

# Clean up old backups
echo -e "${YELLOW}Cleaning up backups older than ${RETENTION_DAYS} days...${NC}"
find ${BACKUP_DIR} -name "evcharging_*.sql.gz" -mtime +${RETENTION_DAYS} -delete

REMAINING=$(ls -1 ${BACKUP_DIR}/evcharging_*.sql.gz 2>/dev/null | wc -l)
echo -e "${GREEN}✓ Cleanup complete. ${REMAINING} backups remaining.${NC}"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Backup Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
