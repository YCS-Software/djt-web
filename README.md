# EV Charging Management Platform

Enterprise-grade EV Charging Management Platform with OCPP 1.6J support, Razorpay payment integration, and Docker deployment.

## Features

- **OCPP 1.6J Support**: Full WebSocket-based communication with charging stations
- **Multi-tenant Architecture**: Partner management with isolated data
- **Role-Based Access Control**: Granular permissions for different user types
- **Real-time Dashboard**: Live session monitoring with Socket.IO
- **Payment Integration**: Razorpay for payments and wallet management
- **QR Code Charging**: Scan and charge functionality
- **Comprehensive Reporting**: PDF/Excel export capabilities
- **Audit Logging**: Complete activity trail

## Tech Stack

### Backend
- Node.js with Express.js
- PostgreSQL database
- Redis for caching and sessions
- Sequelize ORM
- Bull for job queues
- Socket.IO for real-time updates

### Frontend
- React 18 with TypeScript
- Material UI (MUI)
- Redux Toolkit
- ApexCharts
- Leaflet Maps

### DevOps
- Docker & Docker Compose
- Nginx reverse proxy
- GitHub Actions CI/CD

## Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ (for local development)

### Running with Docker

1. Clone the repository:
```bash
git clone https://github.com/your-org/ev-charging-platform.git
cd ev-charging-platform
```

2. Copy environment file:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Start services:
```bash
docker-compose up -d
```

4. Access the application:
- Frontend: http://localhost
- Backend API: http://localhost:3000
- OCPP Server: ws://localhost:9000/ocpp

### Local Development

1. Start infrastructure:
```bash
docker-compose up -d postgres redis
```

2. Run backend:
```bash
cd backend
npm install
npm run dev
```

3. Run frontend:
```bash
cd frontend
npm install
npm start
```

## Project Structure

```
├── backend/
│   ├── src/
│   │   ├── config/        # Configuration files
│   │   ├── controllers/   # Route controllers
│   │   ├── middleware/    # Express middleware
│   │   ├── models/        # Sequelize models
│   │   ├── routes/        # API routes
│   │   ├── ocpp/          # OCPP server & handlers
│   │   ├── socket/        # Socket.IO setup
│   │   ├── jobs/          # Background jobs
│   │   ├── integrations/  # Third-party integrations
│   │   ├── utils/         # Utilities
│   │   └── app.js         # Application entry
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── features/      # Redux slices
│   │   ├── services/      # API services
│   │   ├── theme/         # MUI theme
│   │   └── App.tsx        # App entry
│   └── Dockerfile
├── database/
│   └── schema.sql         # Database schema
├── docs/                  # Documentation
├── nginx/                 # Nginx configuration
├── docker-compose.yml     # Docker orchestration
└── README.md
```

## Documentation

- [Software Requirements Specification](docs/SRS.md)
- [Functional Requirements](docs/FRD.md)
- [Technical Design](docs/TDD.md)
- [Database Design](docs/DATABASE_DESIGN.md)
- [API Documentation](docs/API.md)
- [Deployment Guide](docs/DEPLOYMENT.md)

## OCPP Operations

The platform supports the following OCPP 1.6J operations:

### From Charger to Central System
- BootNotification
- Heartbeat
- StatusNotification
- Authorize
- StartTransaction
- StopTransaction
- MeterValues

### From Central System to Charger
- RemoteStartTransaction
- RemoteStopTransaction
- Reset
- ChangeConfiguration
- GetConfiguration
- UnlockConnector
- ReserveNow
- CancelReservation

## API Endpoints

Key API endpoints:

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/login | User login |
| GET | /api/stations | List charging stations |
| POST | /api/sessions/start | Start charging session |
| GET | /api/dashboard/overview | Dashboard statistics |
| GET | /api/reports/sessions | Generate session report |

See full [API Documentation](docs/API.md) for details.

## Environment Variables

See [.env.example](.env.example) for all configuration options.

## License

Proprietary - All rights reserved

## Support

For support, email support@evcharge.com
