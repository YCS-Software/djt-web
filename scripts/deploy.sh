#!/bin/bash

# EV Charging Platform Deployment Script
set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  EV Charging Platform Deployment${NC}"
echo -e "${GREEN}========================================${NC}"

# Check if docker and docker-compose are installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Docker is not installed. Please install Docker first.${NC}"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}Docker Compose is not installed. Please install Docker Compose first.${NC}"
    exit 1
fi

# Load environment variables
if [ -f .env ]; then
    echo -e "${YELLOW}Loading environment variables...${NC}"
    export $(cat .env | grep -v '^#' | xargs)
else
    echo -e "${RED}.env file not found. Please create one from .env.example${NC}"
    exit 1
fi

# Build and deploy
echo -e "${YELLOW}Building Docker images...${NC}"
docker-compose build --no-cache

echo -e "${YELLOW}Starting services...${NC}"
docker-compose up -d

# Wait for services to be healthy
echo -e "${YELLOW}Waiting for services to be healthy...${NC}"
sleep 10

# Check service health
echo -e "${YELLOW}Checking service health...${NC}"

# Check postgres
if docker-compose exec -T postgres pg_isready -U postgres > /dev/null 2>&1; then
    echo -e "${GREEN}✓ PostgreSQL is healthy${NC}"
else
    echo -e "${RED}✗ PostgreSQL is not healthy${NC}"
fi

# Check redis
if docker-compose exec -T redis redis-cli ping > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Redis is healthy${NC}"
else
    echo -e "${RED}✗ Redis is not healthy${NC}"
fi

# Check backend
if curl -s http://localhost:3000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Backend is healthy${NC}"
else
    echo -e "${RED}✗ Backend is not healthy${NC}"
fi

# Check frontend
if curl -s http://localhost:3001/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Frontend is healthy${NC}"
else
    echo -e "${RED}✗ Frontend is not healthy${NC}"
fi

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Deployment Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "Frontend: http://localhost:80"
echo -e "Backend API: http://localhost:3000"
echo -e "OCPP Server: ws://localhost:9000/ocpp"
echo ""
