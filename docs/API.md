# API Documentation
# EV Charging Management Platform

**Version:** 1.0
**Base URL:** `https://api.evcharging.com/v1`
**Date:** June 2026

---

## Table of Contents
1. [Overview](#1-overview)
2. [Authentication](#2-authentication)
3. [Error Handling](#3-error-handling)
4. [Rate Limiting](#4-rate-limiting)
5. [API Endpoints](#5-api-endpoints)
6. [WebSocket Events](#6-websocket-events)

---

## 1. Overview

### 1.1 API Standards
- RESTful design principles
- JSON request/response bodies
- UTF-8 encoding
- ISO 8601 date formats
- UUID identifiers

### 1.2 HTTP Methods
| Method | Usage |
|--------|-------|
| GET | Retrieve resources |
| POST | Create resources |
| PUT | Full update resources |
| PATCH | Partial update resources |
| DELETE | Remove resources |

### 1.3 Response Format
```json
{
  "success": true,
  "data": {},
  "message": "Operation successful",
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

---

## 2. Authentication

### 2.1 JWT Authentication
All protected endpoints require a valid JWT token in the Authorization header.

```http
Authorization: Bearer <access_token>
```

### 2.2 Token Endpoints

#### POST /auth/login
Login with email and password.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "partner_admin",
      "partnerId": "uuid"
    },
    "accessToken": "eyJhbG...",
    "refreshToken": "eyJhbG...",
    "expiresIn": 900
  }
}
```

#### POST /auth/refresh
Refresh access token.

**Request:**
```json
{
  "refreshToken": "eyJhbG..."
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbG...",
    "expiresIn": 900
  }
}
```

#### POST /auth/logout
Logout and invalidate tokens.

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

#### POST /auth/forgot-password
Request password reset email.

**Request:**
```json
{
  "email": "user@example.com"
}
```

#### POST /auth/reset-password
Reset password with token.

**Request:**
```json
{
  "token": "reset-token",
  "password": "NewSecurePass123!",
  "confirmPassword": "NewSecurePass123!"
}
```

---

## 3. Error Handling

### 3.1 Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": []
  },
  "requestId": "uuid"
}
```

### 3.2 Error Codes
| Code | HTTP Status | Description |
|------|-------------|-------------|
| VALIDATION_ERROR | 400 | Invalid input data |
| UNAUTHORIZED | 401 | Missing or invalid token |
| FORBIDDEN | 403 | Insufficient permissions |
| NOT_FOUND | 404 | Resource not found |
| CONFLICT | 409 | Resource already exists |
| RATE_LIMITED | 429 | Too many requests |
| INTERNAL_ERROR | 500 | Server error |

---

## 4. Rate Limiting

### 4.1 Limits
| Endpoint Type | Limit |
|---------------|-------|
| Authentication | 5 requests/minute |
| Standard API | 100 requests/minute |
| Reports | 10 requests/minute |

### 4.2 Headers
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1609459200
```

---

## 5. API Endpoints

### 5.1 Users

#### GET /users
List users with pagination and filters.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| page | integer | Page number (default: 1) |
| limit | integer | Items per page (default: 20, max: 100) |
| search | string | Search by name or email |
| status | string | Filter by status |
| role | string | Filter by role |

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "phone": "+919876543210",
      "status": "active",
      "roles": ["partner_admin"],
      "partnerId": "uuid",
      "partnerName": "Green Charge Ltd",
      "lastLoginAt": "2024-01-01T10:00:00Z",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "totalPages": 3
  }
}
```

#### GET /users/:id
Get user details.

#### POST /users
Create new user.

**Request:**
```json
{
  "email": "newuser@example.com",
  "password": "SecurePass123!",
  "firstName": "Jane",
  "lastName": "Doe",
  "phone": "+919876543210",
  "roleIds": ["uuid"],
  "partnerId": "uuid"
}
```

#### PUT /users/:id
Update user.

#### DELETE /users/:id
Soft delete user.

---

### 5.2 Partners

#### GET /partners
List partners.

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Green Charge Ltd",
      "email": "contact@greencharge.com",
      "phone": "+919876543210",
      "status": "active",
      "commissionRate": 10.00,
      "walletBalance": 50000.00,
      "totalLocations": 15,
      "totalStations": 45,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### GET /partners/:id
Get partner details including wallet info.

#### POST /partners
Create new partner.

**Request:**
```json
{
  "name": "Green Charge Ltd",
  "legalName": "Green Charge Private Limited",
  "email": "contact@greencharge.com",
  "phone": "+919876543210",
  "address": "123 Green Street",
  "city": "Mumbai",
  "state": "Maharashtra",
  "pincode": "400001",
  "gstNumber": "27AAAAA0000A1Z5",
  "panNumber": "AAAAA0000A",
  "commissionRate": 10.00
}
```

#### PUT /partners/:id
Update partner.

#### DELETE /partners/:id
Soft delete partner.

#### GET /partners/:id/wallet
Get partner wallet details.

#### GET /partners/:id/settlements
List partner settlements.

#### POST /partners/:id/settlements
Create settlement request.

---

### 5.3 Locations

#### GET /locations
List locations with geo filtering.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| partnerId | uuid | Filter by partner |
| city | string | Filter by city |
| status | string | Filter by status |
| lat | decimal | Center latitude |
| lng | decimal | Center longitude |
| radius | integer | Radius in km |

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "partnerId": "uuid",
      "partnerName": "Green Charge Ltd",
      "name": "Green Charge - Andheri",
      "address": "123 Main Road, Andheri West",
      "city": "Mumbai",
      "state": "Maharashtra",
      "pincode": "400058",
      "latitude": 19.1234,
      "longitude": 72.8567,
      "operatingHours": {},
      "amenities": ["parking", "restroom", "cafe"],
      "images": ["url1", "url2"],
      "status": "active",
      "totalStations": 5,
      "availableConnectors": 8,
      "totalConnectors": 10,
      "averageRating": 4.5,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### GET /locations/:id
Get location details with stations.

#### POST /locations
Create new location.

**Request:**
```json
{
  "name": "Green Charge - Andheri",
  "address": "123 Main Road, Andheri West",
  "city": "Mumbai",
  "state": "Maharashtra",
  "pincode": "400058",
  "latitude": 19.1234,
  "longitude": 72.8567,
  "operatingHours": {
    "monday": {"open": "06:00", "close": "22:00"},
    "tuesday": {"open": "06:00", "close": "22:00"}
  },
  "amenities": ["parking", "restroom"],
  "contactPhone": "+919876543210",
  "contactEmail": "andheri@greencharge.com"
}
```

#### PUT /locations/:id
Update location.

#### DELETE /locations/:id
Soft delete location.

---

### 5.4 Charging Stations

#### GET /stations
List charging stations.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| locationId | uuid | Filter by location |
| partnerId | uuid | Filter by partner |
| isOnline | boolean | Filter by online status |
| status | string | Filter by status |

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "locationId": "uuid",
      "locationName": "Green Charge - Andheri",
      "ocppIdentity": "GC-ANH-001",
      "name": "Station 1",
      "vendor": "ABB",
      "model": "Terra 54",
      "serialNumber": "SN123456",
      "firmwareVersion": "1.2.3",
      "isOnline": true,
      "lastHeartbeat": "2024-01-01T10:00:00Z",
      "status": "active",
      "connectors": [
        {
          "id": "uuid",
          "connectorId": 1,
          "connectorType": "CCS2",
          "powerKw": 50,
          "ocppStatus": "Available"
        }
      ],
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### GET /stations/:id
Get station details.

#### POST /stations
Create new station.

**Request:**
```json
{
  "locationId": "uuid",
  "ocppIdentity": "GC-ANH-001",
  "name": "Station 1",
  "vendor": "ABB",
  "model": "Terra 54"
}
```

#### PUT /stations/:id
Update station.

#### DELETE /stations/:id
Soft delete station.

#### POST /stations/:id/reset
Send reset command to station.

**Request:**
```json
{
  "type": "Soft"
}
```

#### POST /stations/:id/remote-start
Send remote start transaction command.

**Request:**
```json
{
  "connectorId": 1,
  "idTag": "DRIVER123",
  "driverId": "uuid"
}
```

#### POST /stations/:id/remote-stop
Send remote stop transaction command.

**Request:**
```json
{
  "transactionId": 12345
}
```

---

### 5.5 Connectors

#### GET /connectors
List connectors.

#### GET /connectors/:id
Get connector details including QR code.

#### POST /connectors
Create connector.

**Request:**
```json
{
  "stationId": "uuid",
  "connectorId": 1,
  "connectorType": "CCS2",
  "powerKw": 50,
  "voltage": 400,
  "amperage": 125,
  "tariffId": "uuid"
}
```

#### PUT /connectors/:id
Update connector.

#### DELETE /connectors/:id
Delete connector.

#### POST /connectors/:id/regenerate-qr
Regenerate QR code for connector.

---

### 5.6 EV Drivers

#### GET /drivers
List EV drivers.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| search | string | Search by name or phone |
| status | string | Filter by status |

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "phone": "+919876543210",
      "email": "driver@example.com",
      "firstName": "Rahul",
      "lastName": "Sharma",
      "status": "active",
      "walletBalance": 1500.00,
      "totalSessions": 45,
      "totalSpent": 25000.00,
      "vehicles": [
        {
          "id": "uuid",
          "make": "Tata",
          "model": "Nexon EV",
          "registrationNumber": "MH01AB1234",
          "isPrimary": true
        }
      ],
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### GET /drivers/:id
Get driver details.

#### POST /drivers
Create driver (admin).

#### PUT /drivers/:id
Update driver.

#### DELETE /drivers/:id
Soft delete driver.

#### GET /drivers/:id/sessions
Get driver's charging sessions.

#### GET /drivers/:id/transactions
Get driver's transactions.

---

### 5.7 Driver Wallet

#### GET /drivers/:id/wallet
Get driver wallet details.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "balance": 1500.00,
    "currency": "INR",
    "lowBalanceAlert": 100.00,
    "autoTopup": false,
    "transactions": [
      {
        "id": "uuid",
        "type": "credit",
        "category": "topup",
        "amount": 500.00,
        "balanceBefore": 1000.00,
        "balanceAfter": 1500.00,
        "description": "Wallet top-up",
        "createdAt": "2024-01-01T10:00:00Z"
      }
    ]
  }
}
```

#### POST /drivers/:id/wallet/topup
Initiate wallet top-up.

**Request:**
```json
{
  "amount": 500.00
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "orderId": "order_xxx",
    "amount": 500.00,
    "currency": "INR",
    "razorpayKeyId": "rzp_xxx"
  }
}
```

#### POST /drivers/:id/wallet/verify-topup
Verify and complete top-up.

**Request:**
```json
{
  "orderId": "order_xxx",
  "paymentId": "pay_xxx",
  "signature": "xxx"
}
```

---

### 5.8 Sessions

#### GET /sessions
List charging sessions.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| connectorId | uuid | Filter by connector |
| stationId | uuid | Filter by station |
| locationId | uuid | Filter by location |
| driverId | uuid | Filter by driver |
| status | string | Filter by status |
| startDate | date | Filter from date |
| endDate | date | Filter to date |

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "connectorId": "uuid",
      "stationName": "Station 1",
      "locationName": "Green Charge - Andheri",
      "driverId": "uuid",
      "driverName": "Rahul Sharma",
      "driverPhone": "+919876543210",
      "transactionId": 12345,
      "startMethod": "qr",
      "startTime": "2024-01-01T10:00:00Z",
      "endTime": "2024-01-01T11:30:00Z",
      "energyConsumedKwh": 25.5,
      "durationMinutes": 90,
      "totalAmount": 450.00,
      "status": "completed",
      "createdAt": "2024-01-01T10:00:00Z"
    }
  ]
}
```

#### GET /sessions/:id
Get session details with meter values.

#### GET /sessions/active
Get all active sessions.

#### POST /sessions/start
Start a charging session (QR flow).

**Request:**
```json
{
  "connectorId": "uuid",
  "driverId": "uuid",
  "vehicleId": "uuid"
}
```

#### POST /sessions/:id/stop
Stop a charging session.

---

### 5.9 Tariffs

#### GET /tariffs
List tariffs.

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "partnerId": "uuid",
      "name": "Standard Rate",
      "description": "Standard charging rate",
      "currency": "INR",
      "energyRate": 12.00,
      "timeRate": 0.50,
      "sessionFee": 20.00,
      "idleFeeRate": 2.00,
      "idleGraceMinutes": 5,
      "taxRate": 18.00,
      "isDefault": true,
      "status": "active",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### GET /tariffs/:id
Get tariff details.

#### POST /tariffs
Create tariff.

**Request:**
```json
{
  "name": "Standard Rate",
  "description": "Standard charging rate",
  "energyRate": 12.00,
  "timeRate": 0.50,
  "sessionFee": 20.00,
  "idleFeeRate": 2.00,
  "idleGraceMinutes": 5,
  "taxRate": 18.00,
  "isDefault": false
}
```

#### PUT /tariffs/:id
Update tariff.

#### DELETE /tariffs/:id
Soft delete tariff.

---

### 5.10 RFID Cards

#### GET /cards
List RFID cards.

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "cardNumber": "CARD001",
      "uid": "04:A1:B2:C3:D4",
      "driverId": "uuid",
      "driverName": "Rahul Sharma",
      "driverPhone": "+919876543210",
      "status": "active",
      "validFrom": "2024-01-01",
      "validUntil": "2027-01-01",
      "assignedAt": "2024-01-01T00:00:00Z",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### GET /cards/:id
Get card details.

#### POST /cards
Create RFID card.

**Request:**
```json
{
  "cardNumber": "CARD001",
  "uid": "04:A1:B2:C3:D4",
  "driverId": "uuid",
  "validFrom": "2024-01-01",
  "validUntil": "2027-01-01"
}
```

#### PUT /cards/:id
Update card.

#### POST /cards/:id/block
Block card.

**Request:**
```json
{
  "reason": "Lost card"
}
```

#### POST /cards/:id/unblock
Unblock card.

---

### 5.11 Reservations

#### GET /reservations
List reservations.

#### GET /reservations/:id
Get reservation details.

#### POST /reservations
Create reservation.

**Request:**
```json
{
  "connectorId": "uuid",
  "startTime": "2024-01-01T10:00:00Z",
  "endTime": "2024-01-01T10:30:00Z"
}
```

#### DELETE /reservations/:id
Cancel reservation.

---

### 5.12 Reports

#### GET /reports/sessions
Generate session report.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| startDate | date | Start date |
| endDate | date | End date |
| locationId | uuid | Filter by location |
| format | string | pdf or excel |

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "reportId": "uuid",
    "downloadUrl": "/reports/download/uuid"
  }
}
```

#### GET /reports/revenue
Generate revenue report.

#### GET /reports/utilization
Generate utilization report.

#### GET /reports/drivers
Generate driver activity report.

#### GET /reports/download/:id
Download generated report.

---

### 5.13 Dashboard

#### GET /dashboard/stats
Get dashboard statistics.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "activeSessions": 15,
    "todayRevenue": 25000.00,
    "todaySessions": 85,
    "todayEnergy": 1250.5,
    "totalStations": 45,
    "onlineStations": 42,
    "totalConnectors": 90,
    "availableConnectors": 65
  }
}
```

#### GET /dashboard/charts/revenue
Get revenue chart data.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| period | string | day, week, month, year |

#### GET /dashboard/charts/sessions
Get session chart data.

#### GET /dashboard/charts/energy
Get energy consumption chart data.

---

### 5.14 Reviews

#### GET /reviews
List reviews.

#### GET /reviews/:id
Get review details.

#### POST /reviews/:id/respond
Respond to review.

**Request:**
```json
{
  "response": "Thank you for your feedback!"
}
```

---

### 5.15 Disputes

#### GET /disputes
List disputes.

#### GET /disputes/:id
Get dispute details.

#### PUT /disputes/:id
Update dispute status.

**Request:**
```json
{
  "status": "in_progress",
  "assignedTo": "uuid"
}
```

#### POST /disputes/:id/resolve
Resolve dispute.

**Request:**
```json
{
  "resolution": "Refund processed",
  "refundAmount": 100.00
}
```

---

### 5.16 Coupons

#### GET /coupons
List coupons.

#### GET /coupons/:id
Get coupon details.

#### POST /coupons
Create coupon.

**Request:**
```json
{
  "code": "WELCOME50",
  "name": "Welcome Discount",
  "discountType": "percentage",
  "discountValue": 50,
  "maxDiscount": 100,
  "minAmount": 200,
  "usageLimit": 1000,
  "perUserLimit": 1,
  "validFrom": "2024-01-01T00:00:00Z",
  "validUntil": "2024-12-31T23:59:59Z"
}
```

#### PUT /coupons/:id
Update coupon.

#### DELETE /coupons/:id
Delete coupon.

#### POST /coupons/validate
Validate coupon code.

**Request:**
```json
{
  "code": "WELCOME50",
  "driverId": "uuid",
  "amount": 500.00
}
```

---

### 5.17 Audit Logs

#### GET /audit-logs
List audit logs.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| userId | uuid | Filter by user |
| action | string | Filter by action |
| resource | string | Filter by resource |
| startDate | date | From date |
| endDate | date | To date |

---

### 5.18 OCPP Logs

#### GET /ocpp-logs
List OCPP communication logs.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| stationId | uuid | Filter by station |
| action | string | Filter by OCPP action |
| direction | string | incoming or outgoing |

---

### 5.19 Webhooks

#### POST /webhooks/razorpay
Razorpay payment webhook.

**Headers:**
```http
X-Razorpay-Signature: sha256-signature
```

---

## 6. WebSocket Events

### 6.1 Socket.IO Connection
```javascript
const socket = io('wss://api.evcharging.com', {
  auth: {
    token: 'Bearer <access_token>'
  }
});
```

### 6.2 Server Events (Server → Client)

#### station:status
Station status update.
```json
{
  "stationId": "uuid",
  "isOnline": true,
  "connectors": [
    {
      "connectorId": 1,
      "status": "Available"
    }
  ]
}
```

#### session:update
Session progress update.
```json
{
  "sessionId": "uuid",
  "energyConsumedKwh": 15.5,
  "durationMinutes": 45,
  "currentAmount": 200.00,
  "status": "active"
}
```

#### session:complete
Session completed.
```json
{
  "sessionId": "uuid",
  "totalEnergy": 25.5,
  "totalDuration": 90,
  "totalAmount": 450.00,
  "status": "completed"
}
```

#### notification
System notification.
```json
{
  "type": "info",
  "title": "Station Offline",
  "message": "Station GC-ANH-001 is now offline",
  "data": {
    "stationId": "uuid"
  }
}
```

### 6.3 Client Events (Client → Server)

#### subscribe:partner
Subscribe to partner updates.
```json
{
  "partnerId": "uuid"
}
```

#### subscribe:session
Subscribe to session updates.
```json
{
  "sessionId": "uuid"
}
```

#### unsubscribe
Unsubscribe from room.
```json
{
  "room": "session:uuid"
}
```

---

*End of API Documentation*
