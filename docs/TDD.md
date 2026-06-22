# Technical Design Document (TDD)
# EV Charging Management Platform

**Version:** 1.0
**Date:** June 2026

---

## Table of Contents
1. [System Architecture](#1-system-architecture)
2. [Component Design](#2-component-design)
3. [Integration Points](#3-integration-points)
4. [Security Architecture](#4-security-architecture)
5. [Error Handling Strategy](#5-error-handling-strategy)
6. [Caching Strategy](#6-caching-strategy)
7. [Real-time Communication](#7-real-time-communication)
8. [Background Jobs](#8-background-jobs)
9. [Deployment Architecture](#9-deployment-architecture)

---

## 1. System Architecture

### 1.1 Architecture Overview

The EV Charging Management Platform follows a **microservice-ready monolith** architecture pattern. This approach provides the simplicity of a monolithic deployment while maintaining clear service boundaries that can be split into microservices as scaling demands increase.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              Client Layer                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│    ┌────────────────┐    ┌────────────────┐    ┌────────────────┐          │
│    │  Admin Portal  │    │  Driver Portal │    │  Mobile App    │          │
│    │    (React)     │    │    (React)     │    │   (Future)     │          │
│    └───────┬────────┘    └───────┬────────┘    └───────┬────────┘          │
└────────────┼─────────────────────┼─────────────────────┼────────────────────┘
             │                     │                     │
             └──────────┬──────────┴──────────┬──────────┘
                        │      HTTPS          │
┌───────────────────────┼─────────────────────┼───────────────────────────────┐
│                       ▼                     ▼                                │
│    ┌──────────────────────────────────────────────────────────┐             │
│    │                   Nginx Reverse Proxy                     │             │
│    │               (SSL Termination, Load Balancing)           │             │
│    └────────────────────────────┬─────────────────────────────┘             │
│                                 │                                            │
│    ┌────────────────────────────┼────────────────────────────┐              │
│    │                            ▼                            │              │
│    │    ┌──────────────────────────────────────────────┐     │              │
│    │    │              Application Server               │     │              │
│    │    │              (Node.js/Express)                │     │              │
│    │    │                                              │     │              │
│    │    │  ┌─────────┐ ┌─────────┐ ┌─────────────────┐ │     │              │
│    │    │  │   API   │ │ Socket  │ │  OCPP Server    │ │     │              │
│    │    │  │ Server  │ │   IO    │ │  (WebSocket)    │ │     │              │
│    │    │  │ :3000   │ │ :3000   │ │     :9000       │ │     │              │
│    │    │  └────┬────┘ └────┬────┘ └───────┬─────────┘ │     │              │
│    │    │       │           │              │           │     │              │
│    │    │       └───────────┼──────────────┘           │     │              │
│    │    │                   │                          │     │              │
│    │    │    ┌──────────────┼──────────────┐           │     │              │
│    │    │    │              ▼              │           │     │              │
│    │    │    │       Service Layer         │           │     │              │
│    │    │    │  ┌─────┐ ┌─────┐ ┌─────┐   │           │     │              │
│    │    │    │  │Auth │ │User │ │OCPP │   │           │     │              │
│    │    │    │  └─────┘ └─────┘ └─────┘   │           │     │              │
│    │    │    │  ┌─────┐ ┌─────┐ ┌─────┐   │           │     │              │
│    │    │    │  │Pay  │ │Sess │ │Report   │           │     │              │
│    │    │    │  └─────┘ └─────┘ └─────┘   │           │     │              │
│    │    │    └────────────┬───────────────┘           │     │              │
│    │    │                 │                           │     │              │
│    │    └─────────────────┼───────────────────────────┘     │              │
│    │                      │                                  │              │
│    └──────────────────────┼──────────────────────────────────┘              │
│                           │                                                  │
│    ┌──────────────────────┼──────────────────────────────────┐              │
│    │                      ▼                                  │              │
│    │    ┌─────────────────────────┐  ┌─────────────────────┐ │              │
│    │    │      PostgreSQL          │  │       Redis        │ │              │
│    │    │        :5432             │  │       :6379        │ │              │
│    │    │                          │  │                    │ │              │
│    │    │  - Users & Roles         │  │  - Sessions        │ │              │
│    │    │  - Partners              │  │  - Rate Limiting   │ │              │
│    │    │  - Stations              │  │  - Job Queues      │ │              │
│    │    │  - Sessions              │  │  - Pub/Sub         │ │              │
│    │    │  - Transactions          │  │  - OCPP State      │ │              │
│    │    └─────────────────────────┘  └─────────────────────┘ │              │
│    │                       Data Layer                         │              │
│    └──────────────────────────────────────────────────────────┘              │
│                              Docker Host                                     │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Technology Stack

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| Frontend | React | 18.x | User interface |
| UI Library | Material-UI (MUI) | 5.x | Component library |
| State Management | Redux Toolkit | 2.x | Application state |
| Charts | ApexCharts | 3.x | Data visualization |
| Maps | Leaflet | 1.9.x | Interactive maps |
| Backend | Node.js | 20 LTS | Runtime environment |
| Framework | Express.js | 4.x | Web framework |
| ORM | Sequelize | 6.x | Database ORM |
| Database | PostgreSQL | 15.x | Primary database |
| Cache | Redis | 7.x | Caching & pub/sub |
| WebSocket | ws | 8.x | OCPP communication |
| Real-time | Socket.IO | 4.x | Dashboard updates |
| Queue | Bull | 4.x | Background jobs |
| Container | Docker | 24.x | Containerization |
| Orchestration | Docker Compose | 2.x | Container orchestration |
| Reverse Proxy | Nginx | 1.25.x | Load balancing, SSL |

### 1.3 Directory Structure

```
DJTEVwebAdmin/
├── docs/                          # Documentation
│   ├── SRS.md
│   ├── FRD.md
│   ├── TDD.md
│   ├── DATABASE_DESIGN.md
│   ├── API.md
│   ├── openapi.yaml
│   ├── ROLES_PERMISSIONS.md
│   ├── WORKFLOWS.md
│   └── DESIGN_SYSTEM.md
│
├── database/                      # Database scripts
│   └── schema.sql
│
├── backend/                       # Backend application
│   ├── src/
│   │   ├── config/               # Configuration files
│   │   │   ├── database.js       # Sequelize config
│   │   │   ├── redis.js          # Redis config
│   │   │   ├── jwt.js            # JWT config
│   │   │   └── ocpp.js           # OCPP config
│   │   │
│   │   ├── models/               # Sequelize models
│   │   │   ├── index.js          # Model associations
│   │   │   ├── User.js
│   │   │   ├── Role.js
│   │   │   ├── Partner.js
│   │   │   ├── Location.js
│   │   │   ├── ChargingStation.js
│   │   │   ├── Connector.js
│   │   │   ├── EvDriver.js
│   │   │   ├── Session.js
│   │   │   ├── Transaction.js
│   │   │   └── ...
│   │   │
│   │   ├── controllers/          # Request handlers
│   │   │   ├── authController.js
│   │   │   ├── userController.js
│   │   │   ├── partnerController.js
│   │   │   ├── locationController.js
│   │   │   ├── stationController.js
│   │   │   ├── connectorController.js
│   │   │   ├── driverController.js
│   │   │   ├── sessionController.js
│   │   │   ├── walletController.js
│   │   │   ├── tariffController.js
│   │   │   ├── reservationController.js
│   │   │   ├── reportController.js
│   │   │   └── ...
│   │   │
│   │   ├── services/             # Business logic
│   │   │   ├── authService.js
│   │   │   ├── userService.js
│   │   │   ├── partnerService.js
│   │   │   ├── stationService.js
│   │   │   ├── sessionService.js
│   │   │   ├── billingService.js
│   │   │   ├── notificationService.js
│   │   │   └── ...
│   │   │
│   │   ├── middleware/           # Express middleware
│   │   │   ├── auth.js           # JWT authentication
│   │   │   ├── rbac.js           # Role-based access
│   │   │   ├── validate.js       # Request validation
│   │   │   ├── rateLimiter.js    # Rate limiting
│   │   │   ├── errorHandler.js   # Error handling
│   │   │   └── auditLog.js       # Audit logging
│   │   │
│   │   ├── routes/               # API routes
│   │   │   ├── index.js          # Route aggregator
│   │   │   ├── auth.routes.js
│   │   │   ├── user.routes.js
│   │   │   ├── partner.routes.js
│   │   │   ├── location.routes.js
│   │   │   ├── station.routes.js
│   │   │   ├── connector.routes.js
│   │   │   ├── driver.routes.js
│   │   │   ├── session.routes.js
│   │   │   ├── wallet.routes.js
│   │   │   └── ...
│   │   │
│   │   ├── ocpp/                 # OCPP 1.6J server
│   │   │   ├── server.js         # WebSocket server
│   │   │   ├── handlers/         # Message handlers
│   │   │   │   ├── bootNotification.js
│   │   │   │   ├── heartbeat.js
│   │   │   │   ├── statusNotification.js
│   │   │   │   ├── authorize.js
│   │   │   │   ├── startTransaction.js
│   │   │   │   ├── stopTransaction.js
│   │   │   │   ├── meterValues.js
│   │   │   │   └── ...
│   │   │   ├── commands/         # Central system commands
│   │   │   │   ├── remoteStart.js
│   │   │   │   ├── remoteStop.js
│   │   │   │   ├── reset.js
│   │   │   │   ├── changeConfiguration.js
│   │   │   │   └── ...
│   │   │   └── utils/            # OCPP utilities
│   │   │
│   │   ├── integrations/         # External integrations
│   │   │   ├── razorpay/         # Payment gateway
│   │   │   │   ├── client.js
│   │   │   │   ├── orders.js
│   │   │   │   └── webhooks.js
│   │   │   ├── sms/              # SMS gateway
│   │   │   └── email/            # Email service
│   │   │
│   │   ├── socket/               # Socket.IO
│   │   │   ├── server.js         # Socket server
│   │   │   └── events.js         # Event handlers
│   │   │
│   │   ├── jobs/                 # Background jobs
│   │   │   ├── queue.js          # Bull queue setup
│   │   │   ├── sessionTimeout.js
│   │   │   ├── heartbeatCheck.js
│   │   │   ├── reportGeneration.js
│   │   │   └── settlement.js
│   │   │
│   │   ├── utils/                # Utilities
│   │   │   ├── logger.js         # Logging utility
│   │   │   ├── qrGenerator.js    # QR code generator
│   │   │   ├── pdfGenerator.js   # PDF reports
│   │   │   ├── excelGenerator.js # Excel exports
│   │   │   ├── encryption.js     # Encryption helpers
│   │   │   └── validators.js     # Validation schemas
│   │   │
│   │   └── app.js                # Express app setup
│   │
│   ├── database/
│   │   ├── migrations/           # Sequelize migrations
│   │   └── seeders/              # Seed data
│   │
│   ├── tests/                    # Test files
│   │   ├── unit/
│   │   ├── integration/
│   │   └── e2e/
│   │
│   ├── Dockerfile
│   ├── package.json
│   └── .env.example
│
├── frontend/                     # Frontend application
│   ├── src/
│   │   ├── components/           # React components
│   │   │   ├── common/           # Shared components
│   │   │   │   ├── Button/
│   │   │   │   ├── Card/
│   │   │   │   ├── Table/
│   │   │   │   ├── Form/
│   │   │   │   ├── Modal/
│   │   │   │   └── ...
│   │   │   ├── charts/           # Chart components
│   │   │   │   ├── LineChart/
│   │   │   │   ├── BarChart/
│   │   │   │   ├── PieChart/
│   │   │   │   └── ...
│   │   │   ├── maps/             # Map components
│   │   │   │   ├── LocationMap/
│   │   │   │   └── StationMarker/
│   │   │   └── layout/           # Layout components
│   │   │       ├── Header/
│   │   │       ├── Sidebar/
│   │   │       ├── Footer/
│   │   │       └── MainLayout/
│   │   │
│   │   ├── pages/                # Page components
│   │   │   ├── auth/
│   │   │   │   ├── Login/
│   │   │   │   ├── ForgotPassword/
│   │   │   │   └── ResetPassword/
│   │   │   ├── dashboard/
│   │   │   ├── users/
│   │   │   ├── partners/
│   │   │   ├── locations/
│   │   │   ├── stations/
│   │   │   ├── connectors/
│   │   │   ├── drivers/
│   │   │   ├── sessions/
│   │   │   ├── tariffs/
│   │   │   ├── reports/
│   │   │   └── ...
│   │   │
│   │   ├── features/             # Redux slices
│   │   │   ├── auth/
│   │   │   ├── users/
│   │   │   ├── partners/
│   │   │   ├── locations/
│   │   │   ├── stations/
│   │   │   ├── sessions/
│   │   │   └── ...
│   │   │
│   │   ├── services/             # API services
│   │   │   ├── api.js            # Axios instance
│   │   │   ├── authService.js
│   │   │   ├── userService.js
│   │   │   └── ...
│   │   │
│   │   ├── hooks/                # Custom hooks
│   │   │   ├── useAuth.js
│   │   │   ├── useSocket.js
│   │   │   ├── usePagination.js
│   │   │   └── ...
│   │   │
│   │   ├── utils/                # Utilities
│   │   │   ├── formatters.js
│   │   │   ├── validators.js
│   │   │   └── constants.js
│   │   │
│   │   ├── theme/                # MUI theme
│   │   │   ├── index.js
│   │   │   ├── palette.js
│   │   │   ├── typography.js
│   │   │   └── components.js
│   │   │
│   │   ├── routes/               # React Router
│   │   │   ├── index.jsx
│   │   │   ├── PrivateRoute.jsx
│   │   │   └── routes.js
│   │   │
│   │   ├── App.jsx
│   │   └── main.jsx
│   │
│   ├── public/
│   ├── Dockerfile
│   ├── package.json
│   └── vite.config.js
│
├── nginx/                        # Nginx configuration
│   └── nginx.conf
│
├── scripts/                      # Deployment scripts
│   ├── deploy.sh
│   └── backup.sh
│
├── .github/
│   └── workflows/
│       └── ci-cd.yml
│
├── docker-compose.yml
├── docker-compose.prod.yml
└── .env.example
```

---

## 2. Component Design

### 2.1 Backend Components

#### 2.1.1 Authentication Component
```javascript
// Authentication flow
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Client    │────►│ Auth Router  │────►│ Auth Service│
│             │◄────│              │◄────│             │
└─────────────┘     └──────────────┘     └──────┬──────┘
                                                 │
                    ┌──────────────┐     ┌──────┴──────┐
                    │  JWT Utils   │◄────│ User Model  │
                    └──────────────┘     └─────────────┘
```

**Key Classes:**
- `AuthService`: Handles login, logout, token refresh
- `JWTUtils`: Token generation and validation
- `AuthMiddleware`: Request authentication

#### 2.1.2 OCPP Component
```javascript
// OCPP communication flow
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│  Charger    │────►│ OCPP Server  │────►│ Message     │
│  (WS)       │◄────│  (Port 9000) │◄────│ Handler     │
└─────────────┘     └──────────────┘     └──────┬──────┘
                                                 │
                    ┌──────────────┐     ┌──────┴──────┐
                    │ State Manager│◄────│ Services    │
                    │   (Redis)    │     │             │
                    └──────────────┘     └─────────────┘
```

**Key Classes:**
- `OCPPServer`: WebSocket server for OCPP
- `MessageRouter`: Routes messages to handlers
- `BootNotificationHandler`: Processes boot notifications
- `StartTransactionHandler`: Processes start transactions
- `RemoteStartCommand`: Sends remote start commands

#### 2.1.3 Session Component
```javascript
// Session lifecycle
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Session    │────►│   Session    │────►│   Billing    │
│  Controller  │     │   Service    │     │   Service    │
└──────────────┘     └──────┬───────┘     └──────────────┘
                            │
       ┌────────────────────┼────────────────────┐
       │                    │                    │
┌──────┴──────┐     ┌───────┴──────┐     ┌──────┴──────┐
│   Session   │     │   Wallet     │     │  Tariff     │
│   Model     │     │   Service    │     │  Service    │
└─────────────┘     └──────────────┘     └─────────────┘
```

### 2.2 Frontend Components

#### 2.2.1 Component Hierarchy
```
App
├── ThemeProvider
│   └── RouterProvider
│       ├── AuthLayout
│       │   ├── LoginPage
│       │   ├── ForgotPasswordPage
│       │   └── ResetPasswordPage
│       │
│       └── MainLayout
│           ├── Header
│           │   ├── Logo
│           │   ├── SearchBar
│           │   └── UserMenu
│           │
│           ├── Sidebar
│           │   └── NavMenu
│           │
│           └── MainContent
│               ├── DashboardPage
│               │   ├── KPICards
│               │   ├── RevenueChart
│               │   ├── SessionChart
│               │   └── ActiveSessionsTable
│               │
│               ├── StationsPage
│               │   ├── StationList
│               │   ├── StationCard
│               │   └── StationDetails
│               │
│               └── SessionsPage
│                   ├── SessionFilters
│                   ├── SessionTable
│                   └── SessionDetails
```

#### 2.2.2 State Management
```
Redux Store
├── auth
│   ├── user
│   ├── token
│   └── isAuthenticated
│
├── partners
│   ├── list
│   ├── current
│   └── loading
│
├── locations
│   ├── list
│   ├── current
│   └── loading
│
├── stations
│   ├── list
│   ├── filters
│   ├── pagination
│   └── loading
│
├── sessions
│   ├── active
│   ├── history
│   └── loading
│
└── ui
    ├── sidebarOpen
    ├── theme
    └── notifications
```

---

## 3. Integration Points

### 3.1 OCPP 1.6J Integration

#### 3.1.1 Connection Management
```javascript
// Connection establishment
1. Charger connects to wss://server:9000/ocpp/{chargePointId}
2. Server validates chargePointId exists in database
3. Server stores connection in Redis: ocpp:connections:{chargePointId}
4. Server awaits BootNotification
5. On BootNotification: validate, respond, update station status
6. Start heartbeat monitoring
```

#### 3.1.2 Message Format
```json
// OCPP Call (Request)
[2, "uniqueId", "Action", {payload}]

// OCPP CallResult (Response)
[3, "uniqueId", {payload}]

// OCPP CallError (Error)
[4, "uniqueId", "errorCode", "errorDescription", {errorDetails}]
```

#### 3.1.3 Supported Messages
| Message | Direction | Purpose |
|---------|-----------|---------|
| BootNotification | CP→CS | Charger registration |
| Heartbeat | CP→CS | Keep-alive |
| StatusNotification | CP→CS | Connector status |
| Authorize | CP→CS | RFID validation |
| StartTransaction | CP→CS | Session start |
| StopTransaction | CP→CS | Session end |
| MeterValues | CP→CS | Energy data |
| RemoteStartTransaction | CS→CP | Start command |
| RemoteStopTransaction | CS→CP | Stop command |
| Reset | CS→CP | Reset command |
| ChangeConfiguration | CS→CP | Config update |

### 3.2 Razorpay Integration

#### 3.2.1 Order Creation
```javascript
// Wallet top-up flow
1. Client requests wallet top-up with amount
2. Backend creates Razorpay order:
   POST https://api.razorpay.com/v1/orders
   {
     "amount": amountInPaise,
     "currency": "INR",
     "receipt": "wallet_topup_{walletId}_{timestamp}",
     "notes": {
       "driverId": "uuid",
       "type": "wallet_topup"
     }
   }
3. Return order_id to client
4. Client opens Razorpay checkout
5. Client completes payment
6. Razorpay posts webhook to /api/webhooks/razorpay
7. Backend verifies signature
8. Backend updates wallet balance
```

#### 3.2.2 Webhook Handling
```javascript
// Webhook verification
const crypto = require('crypto');

function verifyWebhook(body, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(body))
    .digest('hex');
  return signature === expectedSignature;
}
```

### 3.3 Map Integration (Leaflet)

```javascript
// Map configuration
const mapConfig = {
  center: [20.5937, 78.9629], // India center
  zoom: 5,
  maxZoom: 18,
  tileLayer: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  attribution: '© OpenStreetMap contributors'
};

// Marker clustering for locations
import MarkerClusterGroup from 'react-leaflet-cluster';
```

---

## 4. Security Architecture

### 4.1 Authentication & Authorization

#### 4.1.1 JWT Structure
```javascript
// Access Token (15 min expiry)
{
  "header": {
    "alg": "RS256",
    "typ": "JWT"
  },
  "payload": {
    "sub": "userId",
    "email": "user@example.com",
    "role": "partner_admin",
    "partnerId": "partnerId",
    "permissions": ["read:stations", "write:stations", ...],
    "iat": 1234567890,
    "exp": 1234568790
  }
}

// Refresh Token (7 days expiry)
{
  "sub": "userId",
  "jti": "uniqueTokenId",
  "iat": 1234567890,
  "exp": 1235172690
}
```

#### 4.1.2 RBAC Implementation
```javascript
// Middleware chain
app.use('/api/stations',
  authenticate,              // Verify JWT
  authorize('read:stations'), // Check permission
  rateLimiter,               // Rate limit
  stationController.list     // Handler
);

// Permission check
function authorize(permission) {
  return (req, res, next) => {
    if (!req.user.permissions.includes(permission)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}
```

### 4.2 Data Security

#### 4.2.1 Encryption
| Data Type | Encryption Method |
|-----------|-------------------|
| Passwords | bcrypt (cost 12) |
| JWT Signing | RS256 (RSA) |
| HTTPS | TLS 1.3 |
| Sensitive Fields | AES-256-GCM |

#### 4.2.2 Input Validation
```javascript
// Joi schema example
const createUserSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
    .required(),
  firstName: Joi.string().min(2).max(50).required(),
  lastName: Joi.string().min(2).max(50).required(),
  phone: Joi.string().pattern(/^[6-9]\d{9}$/).optional()
});
```

### 4.3 API Security

| Security Measure | Implementation |
|------------------|----------------|
| Rate Limiting | express-rate-limit (100 req/min) |
| CORS | Strict origin whitelist |
| Helmet | Security headers |
| Input Sanitization | express-validator |
| SQL Injection | Parameterized queries (Sequelize) |
| XSS | Content Security Policy |

---

## 5. Error Handling Strategy

### 5.1 Error Categories

| Category | HTTP Status | Use Case |
|----------|-------------|----------|
| Validation | 400 | Invalid input |
| Authentication | 401 | Invalid/missing token |
| Authorization | 403 | Insufficient permissions |
| Not Found | 404 | Resource not found |
| Conflict | 409 | Duplicate resource |
| Rate Limited | 429 | Too many requests |
| Server Error | 500 | Internal error |

### 5.2 Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  },
  "requestId": "uuid",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### 5.3 Error Handler Middleware
```javascript
function errorHandler(err, req, res, next) {
  // Log error
  logger.error({
    error: err.message,
    stack: err.stack,
    requestId: req.id,
    path: req.path,
    method: req.method
  });

  // Determine status code
  const statusCode = err.statusCode || 500;

  // Send response
  res.status(statusCode).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: statusCode === 500 ? 'Internal server error' : err.message,
      details: err.details
    },
    requestId: req.id,
    timestamp: new Date().toISOString()
  });
}
```

---

## 6. Caching Strategy

### 6.1 Redis Cache Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                       Redis Instance                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │   Sessions   │  │  Rate Limit  │  │  OCPP State  │       │
│  │   (DB 0)     │  │   (DB 1)     │  │   (DB 2)     │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │  Job Queue   │  │  Pub/Sub     │  │  App Cache   │       │
│  │   (DB 3)     │  │   (DB 4)     │  │   (DB 5)     │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 6.2 Cache Patterns

#### 6.2.1 Cache Keys
```
// Session caching
session:{sessionId}                  -> Session data (TTL: 1 hour)
user:sessions:{userId}               -> User's session list (TTL: 30 min)

// Rate limiting
ratelimit:{ip}:{endpoint}            -> Request count (TTL: 1 min)

// OCPP connections
ocpp:connection:{chargePointId}      -> Connection info (no TTL)
ocpp:pending:{messageId}             -> Pending request (TTL: 30 sec)

// Application cache
cache:stations:{partnerId}           -> Station list (TTL: 5 min)
cache:tariff:{tariffId}              -> Tariff details (TTL: 15 min)
cache:location:{locationId}          -> Location details (TTL: 10 min)
```

#### 6.2.2 Cache-Aside Pattern
```javascript
async function getStation(stationId) {
  const cacheKey = `cache:station:${stationId}`;

  // Try cache first
  let station = await redis.get(cacheKey);
  if (station) {
    return JSON.parse(station);
  }

  // Fetch from database
  station = await Station.findByPk(stationId);

  // Store in cache
  await redis.setex(cacheKey, 300, JSON.stringify(station));

  return station;
}
```

### 6.3 Cache Invalidation
```javascript
// Invalidate on update
async function updateStation(stationId, data) {
  await Station.update(data, { where: { id: stationId } });

  // Invalidate specific cache
  await redis.del(`cache:station:${stationId}`);

  // Invalidate list cache
  const station = await Station.findByPk(stationId);
  await redis.del(`cache:stations:${station.partnerId}`);
}
```

---

## 7. Real-time Communication

### 7.1 Socket.IO Events

#### 7.1.1 Server → Client Events
| Event | Payload | Description |
|-------|---------|-------------|
| `station:status` | `{stationId, status, connectors}` | Station status update |
| `session:update` | `{sessionId, energyConsumed, duration}` | Session progress |
| `session:complete` | `{sessionId, totalEnergy, totalAmount}` | Session completed |
| `notification` | `{type, title, message}` | System notification |

#### 7.1.2 Client → Server Events
| Event | Payload | Description |
|-------|---------|-------------|
| `subscribe:stations` | `{partnerId}` | Subscribe to partner stations |
| `subscribe:session` | `{sessionId}` | Subscribe to session updates |
| `unsubscribe` | `{room}` | Leave subscription |

### 7.2 Room Structure
```javascript
// Rooms for targeted updates
partner:{partnerId}          // All partner resources
location:{locationId}        // Specific location
station:{stationId}          // Specific station
session:{sessionId}          // Specific session
user:{userId}                // User-specific notifications
```

### 7.3 Socket.IO Implementation
```javascript
io.on('connection', (socket) => {
  // Authenticate socket
  const token = socket.handshake.auth.token;
  const user = verifyToken(token);

  if (!user) {
    socket.disconnect();
    return;
  }

  // Join user room
  socket.join(`user:${user.id}`);

  // Join partner room (for admin/operator)
  if (user.partnerId) {
    socket.join(`partner:${user.partnerId}`);
  }

  // Handle subscriptions
  socket.on('subscribe:session', ({ sessionId }) => {
    socket.join(`session:${sessionId}`);
  });
});

// Emit updates from services
function broadcastSessionUpdate(session) {
  io.to(`session:${session.id}`).emit('session:update', {
    sessionId: session.id,
    energyConsumed: session.energyConsumed,
    duration: session.duration,
    currentAmount: session.currentAmount
  });
}
```

---

## 8. Background Jobs

### 8.1 Job Queue Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Bull Queue                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────┐     ┌──────────────────┐              │
│  │   heartbeat      │     │   session        │              │
│  │   check          │     │   timeout        │              │
│  │   (every 1 min)  │     │   (every 5 min)  │              │
│  └──────────────────┘     └──────────────────┘              │
│                                                              │
│  ┌──────────────────┐     ┌──────────────────┐              │
│  │   report         │     │   notification   │              │
│  │   generation     │     │   sender         │              │
│  │   (on demand)    │     │   (real-time)    │              │
│  └──────────────────┘     └──────────────────┘              │
│                                                              │
│  ┌──────────────────┐     ┌──────────────────┐              │
│  │   settlement     │     │   cleanup        │              │
│  │   processing     │     │   old logs       │              │
│  │   (daily)        │     │   (weekly)       │              │
│  └──────────────────┘     └──────────────────┘              │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 8.2 Job Definitions

#### 8.2.1 Heartbeat Check Job
```javascript
// Runs every 1 minute
// Marks stations offline if no heartbeat for 5 minutes
queue.process('heartbeat-check', async (job) => {
  const threshold = new Date(Date.now() - 5 * 60 * 1000);

  await ChargingStation.update(
    { isOnline: false },
    {
      where: {
        isOnline: true,
        lastHeartbeat: { [Op.lt]: threshold }
      }
    }
  );

  // Emit status updates via Socket.IO
  const offlineStations = await ChargingStation.findAll({
    where: {
      isOnline: false,
      lastHeartbeat: { [Op.gte]: new Date(Date.now() - 6 * 60 * 1000) }
    }
  });

  offlineStations.forEach(station => {
    io.to(`partner:${station.partnerId}`).emit('station:status', {
      stationId: station.id,
      status: 'offline'
    });
  });
});
```

#### 8.2.2 Report Generation Job
```javascript
// On-demand report generation
queue.process('report-generation', async (job) => {
  const { reportType, filters, format, userId } = job.data;

  // Generate report based on type
  let reportData;
  switch (reportType) {
    case 'sessions':
      reportData = await generateSessionReport(filters);
      break;
    case 'revenue':
      reportData = await generateRevenueReport(filters);
      break;
    // ... other report types
  }

  // Generate file
  let filePath;
  if (format === 'pdf') {
    filePath = await generatePDF(reportData, reportType);
  } else {
    filePath = await generateExcel(reportData, reportType);
  }

  // Notify user
  io.to(`user:${userId}`).emit('report:ready', {
    reportId: job.id,
    downloadUrl: filePath
  });
});
```

---

## 9. Deployment Architecture

### 9.1 Docker Compose Configuration

```yaml
version: '3.8'

services:
  nginx:
    image: nginx:1.25-alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - backend
      - frontend
    networks:
      - ev-network

  backend:
    build: ./backend
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://user:pass@postgres:5432/evcharging
      - REDIS_URL=redis://redis:6379
    depends_on:
      - postgres
      - redis
    networks:
      - ev-network

  frontend:
    build: ./frontend
    depends_on:
      - backend
    networks:
      - ev-network

  ocpp:
    build:
      context: ./backend
      dockerfile: Dockerfile.ocpp
    ports:
      - "9000:9000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://user:pass@postgres:5432/evcharging
      - REDIS_URL=redis://redis:6379
    depends_on:
      - postgres
      - redis
    networks:
      - ev-network

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=evcharging
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
    volumes:
      - postgres-data:/var/lib/postgresql/data
    networks:
      - ev-network

  redis:
    image: redis:7-alpine
    volumes:
      - redis-data:/data
    networks:
      - ev-network

volumes:
  postgres-data:
  redis-data:

networks:
  ev-network:
    driver: bridge
```

### 9.2 Nginx Configuration
```nginx
upstream backend {
    server backend:3000;
}

upstream frontend {
    server frontend:3001;
}

server {
    listen 80;
    server_name _;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name _;

    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;

    # API requests
    location /api {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Socket.IO
    location /socket.io {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
    }

    # Frontend
    location / {
        proxy_pass http://frontend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
}
```

### 9.3 Health Checks

```javascript
// Health check endpoint
app.get('/health', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
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

---

*End of Technical Design Document*
