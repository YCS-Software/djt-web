# Functional Requirements Document (FRD)
# EV Charging Management Platform

**Version:** 1.0
**Date:** June 2026

---

## Table of Contents
1. [Introduction](#1-introduction)
2. [User Roles & Personas](#2-user-roles--personas)
3. [Module Requirements](#3-module-requirements)
4. [User Stories](#4-user-stories)
5. [Business Rules](#5-business-rules)
6. [Data Flow Diagrams](#6-data-flow-diagrams)
7. [Use Cases](#7-use-cases)

---

## 1. Introduction

### 1.1 Purpose
This Functional Requirements Document (FRD) provides detailed specifications for each module of the EV Charging Management Platform, including user stories, business rules, and data flows.

### 1.2 Document Scope
This document covers:
- Detailed requirements for 20+ system modules
- User stories for all user roles
- Business rules governing system behavior
- Data flow between system components

---

## 2. User Roles & Personas

### 2.1 Super Administrator
**Description:** Platform owner with unrestricted access to all features and data across all partners.

**Characteristics:**
- Full system access
- Manages all partners
- Configures system-wide settings
- Views platform-wide analytics

**Goals:**
- Onboard new partners efficiently
- Monitor platform health
- Ensure system security and compliance

### 2.2 Partner Administrator
**Description:** Organization owner managing their charging network within the platform.

**Characteristics:**
- Access limited to their organization's data
- Manages locations, stations, and operators
- Configures tariffs and business settings
- Views revenue and analytics

**Goals:**
- Maximize station utilization
- Track and optimize revenue
- Provide excellent service to EV drivers

### 2.3 Operator
**Description:** Field staff handling day-to-day operations.

**Characteristics:**
- Limited administrative access
- Monitors real-time sessions
- Handles customer support
- Manages routine operations

**Goals:**
- Quick issue resolution
- Efficient session management
- Customer satisfaction

### 2.4 EV Driver
**Description:** End user utilizing charging services.

**Characteristics:**
- Self-service portal access
- Mobile-first experience
- Manages wallet and vehicles
- Views charging history

**Goals:**
- Find available chargers quickly
- Easy payment process
- Transparent pricing

---

## 3. Module Requirements

### 3.1 Authentication Module

#### 3.1.1 Features
| Feature | Description |
|---------|-------------|
| Login | Email/password authentication with JWT tokens |
| Logout | Token invalidation and session termination |
| Password Reset | Email-based secure password reset flow |
| Token Refresh | Automatic access token refresh using refresh token |
| Session Management | View and terminate active sessions |

#### 3.1.2 Technical Requirements
- JWT access token validity: 15 minutes
- Refresh token validity: 7 days
- Password hashing: bcrypt with cost factor 12
- Token signing: RS256 algorithm
- Rate limiting: 5 attempts per minute per IP

### 3.2 User Management Module

#### 3.2.1 Features
| Feature | Description |
|---------|-------------|
| User CRUD | Create, Read, Update, Delete users |
| Role Assignment | Assign roles to users |
| Profile Management | Update profile and avatar |
| User Status | Active/Inactive/Suspended states |
| Activity Tracking | Last login, login history |

#### 3.2.2 Data Fields
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | UUID | Auto | Unique identifier |
| email | String | Yes | Login email (unique) |
| password | String | Yes | Hashed password |
| firstName | String | Yes | First name |
| lastName | String | Yes | Last name |
| phone | String | No | Contact number |
| avatar | String | No | Profile image URL |
| status | Enum | Yes | active/inactive/suspended |
| partnerId | UUID | No | Associated partner (null for super admin) |
| createdAt | DateTime | Auto | Creation timestamp |
| updatedAt | DateTime | Auto | Last update timestamp |

### 3.3 Partner Management Module

#### 3.3.1 Features
| Feature | Description |
|---------|-------------|
| Partner Onboarding | Register new partner organizations |
| Partner Profile | Manage business details |
| Partner Wallet | Track revenue and balance |
| Settlement | Configure and process settlements |
| Commission | Configure platform commission rates |

#### 3.3.2 Data Fields
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | UUID | Auto | Unique identifier |
| name | String | Yes | Business name |
| email | String | Yes | Primary contact email |
| phone | String | Yes | Primary contact phone |
| address | Text | Yes | Business address |
| gstNumber | String | No | GST registration number |
| panNumber | String | No | PAN for tax |
| commissionRate | Decimal | Yes | Platform commission % |
| status | Enum | Yes | active/inactive/suspended |
| walletBalance | Decimal | Auto | Current wallet balance |

### 3.4 Location Management Module

#### 3.4.1 Features
| Feature | Description |
|---------|-------------|
| Location CRUD | Create, Read, Update, Delete locations |
| Geo-coordinates | Latitude/Longitude for map display |
| Operating Hours | Configure daily operating schedule |
| Amenities | Tag available amenities |
| Images | Upload location photos |
| Map View | Display locations on interactive map |

#### 3.4.2 Data Fields
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | UUID | Auto | Unique identifier |
| partnerId | UUID | Yes | Owner partner |
| name | String | Yes | Location name |
| address | Text | Yes | Full address |
| city | String | Yes | City name |
| state | String | Yes | State name |
| pincode | String | Yes | Postal code |
| latitude | Decimal | Yes | GPS latitude |
| longitude | Decimal | Yes | GPS longitude |
| operatingHours | JSON | No | Daily schedule |
| amenities | Array | No | Available amenities |
| images | Array | No | Photo URLs |
| status | Enum | Yes | active/inactive |

### 3.5 Charging Station Module

#### 3.5.1 Features
| Feature | Description |
|---------|-------------|
| Station Registration | Register OCPP-compliant stations |
| Status Tracking | Real-time online/offline status |
| Remote Control | Reset, configuration commands |
| Firmware Tracking | Monitor firmware versions |
| Error Logging | Track station errors |

#### 3.5.2 Data Fields
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | UUID | Auto | Unique identifier |
| locationId | UUID | Yes | Parent location |
| ocppIdentity | String | Yes | OCPP charge point ID (unique) |
| vendor | String | No | Manufacturer |
| model | String | No | Model name |
| serialNumber | String | No | Serial number |
| firmwareVersion | String | No | Current firmware |
| lastHeartbeat | DateTime | Auto | Last heartbeat time |
| isOnline | Boolean | Auto | Online status |
| status | Enum | Yes | active/inactive/maintenance |

### 3.6 Connector Module

#### 3.6.1 Features
| Feature | Description |
|---------|-------------|
| Connector CRUD | Manage connectors per station |
| Type Configuration | Set connector type (CCS, CHAdeMO, etc.) |
| Power Rating | Configure max power output |
| Status Tracking | Real-time OCPP status |
| Tariff Assignment | Link to pricing |

#### 3.6.2 Connector Types
| Type | Code | Description |
|------|------|-------------|
| CCS1 | CCS1 | Combined Charging System Type 1 |
| CCS2 | CCS2 | Combined Charging System Type 2 |
| CHAdeMO | CHADEMO | CHAdeMO DC fast charging |
| Type 2 | TYPE2 | IEC 62196 Type 2 |
| Type 1 | TYPE1 | SAE J1772 |
| GB/T | GBT | Chinese standard |

#### 3.6.3 Connector Status
| Status | Description |
|--------|-------------|
| Available | Ready for charging |
| Preparing | Preparing to charge |
| Charging | Currently charging |
| SuspendedEVSE | Suspended by charger |
| SuspendedEV | Suspended by vehicle |
| Finishing | Finishing charge |
| Reserved | Reserved by user |
| Unavailable | Not available |
| Faulted | Error state |

### 3.7 OCPP Communication Module

#### 3.7.1 Supported Messages (Charge Point to Central System)
| Message | Description |
|---------|-------------|
| BootNotification | Charge point registration |
| Heartbeat | Keep-alive signal |
| StatusNotification | Connector status update |
| Authorize | RFID card authorization |
| StartTransaction | Session start notification |
| StopTransaction | Session end notification |
| MeterValues | Energy consumption data |
| DiagnosticsStatusNotification | Diagnostics upload status |
| FirmwareStatusNotification | Firmware update status |

#### 3.7.2 Supported Messages (Central System to Charge Point)
| Message | Description |
|---------|-------------|
| RemoteStartTransaction | Start charging remotely |
| RemoteStopTransaction | Stop charging remotely |
| Reset | Soft/Hard reset |
| ChangeConfiguration | Update configuration |
| GetConfiguration | Retrieve configuration |
| ChangeAvailability | Change connector availability |
| ReserveNow | Create reservation |
| CancelReservation | Cancel reservation |
| UnlockConnector | Remote unlock |
| GetDiagnostics | Request diagnostics |
| UpdateFirmware | Trigger firmware update |

### 3.8 EV Driver Module

#### 3.8.1 Features
| Feature | Description |
|---------|-------------|
| Self Registration | Register with phone OTP |
| Profile Management | Update personal details |
| Vehicle Management | Add/manage vehicles |
| RFID Request | Request charge cards |
| Charging History | View past sessions |
| Wallet Management | Top-up and view balance |

#### 3.8.2 Data Fields
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | UUID | Auto | Unique identifier |
| phone | String | Yes | Mobile number (unique) |
| email | String | No | Email address |
| firstName | String | Yes | First name |
| lastName | String | No | Last name |
| walletBalance | Decimal | Auto | Current balance |
| status | Enum | Yes | active/inactive/suspended |

### 3.9 Vehicle Management Module

#### 3.9.1 Features
| Feature | Description |
|---------|-------------|
| Vehicle CRUD | Add/edit/remove vehicles |
| Make/Model | Vehicle details |
| Registration | License plate tracking |
| Battery Capacity | For SoC calculations |

#### 3.9.2 Data Fields
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | UUID | Auto | Unique identifier |
| driverId | UUID | Yes | Owner driver |
| make | String | Yes | Manufacturer |
| model | String | Yes | Model name |
| year | Integer | No | Manufacturing year |
| registrationNumber | String | No | License plate |
| batteryCapacity | Decimal | No | kWh capacity |
| connectorType | String | No | Preferred connector |

### 3.10 Wallet Module

#### 3.10.1 Features
| Feature | Description |
|---------|-------------|
| Balance View | Current wallet balance |
| Top-up | Add funds via Razorpay |
| Transactions | View transaction history |
| Auto-deduction | Automatic session payment |
| Refunds | Handle refund credits |

#### 3.10.2 Transaction Types
| Type | Description |
|------|-------------|
| TOPUP | Wallet recharge |
| CHARGE | Charging session deduction |
| REFUND | Refund credit |
| ADJUSTMENT | Manual adjustment |
| COUPON | Promotional credit |

### 3.11 Charging Session Module

#### 3.11.1 Features
| Feature | Description |
|---------|-------------|
| Session Creation | On StartTransaction |
| Real-time Updates | MeterValues processing |
| Session End | On StopTransaction |
| Cost Calculation | Tariff-based pricing |
| Session History | Historical records |

#### 3.11.2 Session States
| State | Description |
|-------|-------------|
| PENDING | Awaiting start |
| ACTIVE | Currently charging |
| COMPLETED | Successfully finished |
| FAILED | Error during session |
| CANCELLED | Cancelled before start |

#### 3.11.3 Data Fields
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | UUID | Auto | Unique identifier |
| connectorId | UUID | Yes | Connector used |
| driverId | UUID | No | EV Driver (if known) |
| rfidCardId | UUID | No | RFID used (if any) |
| transactionId | Integer | Yes | OCPP transaction ID |
| startTime | DateTime | Yes | Session start |
| endTime | DateTime | No | Session end |
| startMeterValue | Integer | Yes | Starting Wh |
| endMeterValue | Integer | No | Ending Wh |
| energyConsumed | Decimal | Auto | kWh consumed |
| duration | Integer | Auto | Minutes |
| amount | Decimal | Auto | Total cost |
| status | Enum | Yes | Session state |

### 3.12 Tariff Module

#### 3.12.1 Features
| Feature | Description |
|---------|-------------|
| Tariff CRUD | Create and manage tariffs |
| Pricing Rules | Energy, time, flat fees |
| Time-of-Use | Peak/off-peak rates |
| Connector Assignment | Link to connectors |

#### 3.12.2 Pricing Components
| Component | Unit | Description |
|-----------|------|-------------|
| Energy Rate | per kWh | Cost per unit energy |
| Time Rate | per minute | Cost per unit time |
| Session Fee | flat | Fixed session cost |
| Idle Fee | per minute | Cost after charge complete |
| Reservation Fee | flat | Cost for no-show |

#### 3.12.3 Data Fields
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | UUID | Auto | Unique identifier |
| partnerId | UUID | Yes | Owner partner |
| name | String | Yes | Tariff name |
| energyRate | Decimal | No | Per kWh rate |
| timeRate | Decimal | No | Per minute rate |
| sessionFee | Decimal | No | Flat session fee |
| idleFeeRate | Decimal | No | Idle fee per minute |
| taxRate | Decimal | No | Tax percentage |
| currency | String | Yes | Currency code (INR) |
| isDefault | Boolean | No | Default tariff flag |

### 3.13 QR Code Module

#### 3.13.1 Features
| Feature | Description |
|---------|-------------|
| QR Generation | Generate per connector |
| QR Download | Download for printing |
| QR Scan | Initiate charging |
| QR Regenerate | Generate new code |

#### 3.13.2 QR Payload
```json
{
  "type": "EVCHARGE",
  "version": "1.0",
  "connectorId": "uuid-string",
  "stationId": "uuid-string",
  "locationId": "uuid-string"
}
```

### 3.14 RFID Card Module

#### 3.14.1 Features
| Feature | Description |
|---------|-------------|
| Card CRUD | Create and manage cards |
| Card Assignment | Assign to drivers |
| Card Authorization | OCPP Authorize |
| Card Blocking | Block/unblock cards |
| Usage Tracking | Card usage history |

#### 3.14.2 Card Status
| Status | Description |
|--------|-------------|
| PENDING | Awaiting assignment |
| ACTIVE | Assigned and active |
| BLOCKED | Temporarily blocked |
| EXPIRED | Past validity |
| LOST | Reported lost |

### 3.15 Reports Module

#### 3.15.1 Report Types
| Report | Description |
|--------|-------------|
| Session Report | Charging session details |
| Revenue Report | Revenue by location/station |
| Utilization Report | Station utilization metrics |
| Driver Report | Driver activity summary |
| Transaction Report | Payment transactions |
| Settlement Report | Partner settlements |

#### 3.15.2 Export Formats
- PDF (styled report)
- Excel (.xlsx)
- CSV

### 3.16 Dashboard Module

#### 3.16.1 KPI Cards
| KPI | Description |
|-----|-------------|
| Active Sessions | Currently charging |
| Today's Revenue | Day's earnings |
| Total Stations | Station count |
| Online Stations | Currently online |
| Today's Sessions | Day's session count |
| Energy Delivered | Day's kWh |

#### 3.16.2 Charts
| Chart | Type | Description |
|-------|------|-------------|
| Revenue Trend | Line | Daily/weekly/monthly revenue |
| Session Count | Bar | Sessions per day |
| Station Utilization | Pie | Busy vs idle time |
| Energy Consumption | Area | kWh over time |
| Peak Hours | Heatmap | Busiest times |

### 3.17 Reservation Module

#### 3.17.1 Features
| Feature | Description |
|---------|-------------|
| Create Reservation | Book connector |
| Cancel Reservation | Cancel booking |
| Reservation Timeout | Auto-expire |
| Reservation Fee | No-show charge |

#### 3.17.2 Data Fields
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | UUID | Auto | Unique identifier |
| connectorId | UUID | Yes | Reserved connector |
| driverId | UUID | Yes | Booking driver |
| startTime | DateTime | Yes | Reservation start |
| endTime | DateTime | Yes | Reservation end |
| status | Enum | Yes | pending/active/used/expired/cancelled |
| reservationId | Integer | Yes | OCPP reservation ID |

### 3.18 Reviews Module

#### 3.18.1 Features
| Feature | Description |
|---------|-------------|
| Submit Review | Rate session 1-5 |
| View Reviews | List reviews |
| Reply to Review | Admin response |
| Average Rating | Calculate averages |

### 3.19 Disputes Module

#### 3.19.1 Features
| Feature | Description |
|---------|-------------|
| Raise Dispute | Create dispute ticket |
| Dispute Categories | Categorize issues |
| Resolution | Admin resolution |
| Refund Processing | Issue refunds |

#### 3.19.2 Dispute Categories
- Incorrect Billing
- Session Not Started
- Payment Issue
- Station Malfunction
- Other

### 3.20 Notifications Module

#### 3.20.1 Notification Types
| Type | Channel | Trigger |
|------|---------|---------|
| Session Start | SMS/Email | Charging begins |
| Session End | SMS/Email | Charging completes |
| Low Balance | SMS | Balance below threshold |
| Wallet Top-up | Email | Successful top-up |
| Card Request | Email | RFID card status |

### 3.21 Audit Log Module

#### 3.21.1 Logged Events
| Event | Description |
|-------|-------------|
| User Login | Successful/failed login |
| User Action | Create/update/delete |
| Session Events | Start/stop charging |
| Payment Events | Transactions |
| Configuration Changes | Settings updates |
| OCPP Messages | All protocol messages |

---

## 4. User Stories

### 4.1 Super Administrator Stories

| ID | Story | Acceptance Criteria |
|----|-------|---------------------|
| US-SA-001 | As a Super Admin, I want to create new partners so that they can manage their charging network | Partner created with all required fields; Admin user created for partner |
| US-SA-002 | As a Super Admin, I want to view all partners so that I can monitor the platform | List shows all partners with status and metrics |
| US-SA-003 | As a Super Admin, I want to configure commission rates so that revenue sharing is accurate | Commission rate saved and applied to future transactions |
| US-SA-004 | As a Super Admin, I want to view platform-wide analytics so that I can monitor business health | Dashboard shows aggregate metrics across all partners |
| US-SA-005 | As a Super Admin, I want to suspend a partner so that I can handle policy violations | Partner access revoked; all their stations go offline |

### 4.2 Partner Administrator Stories

| ID | Story | Acceptance Criteria |
|----|-------|---------------------|
| US-PA-001 | As a Partner Admin, I want to add a new location so that I can expand my network | Location created with geo-coordinates; appears on map |
| US-PA-002 | As a Partner Admin, I want to register a charging station so that it connects to the platform | Station appears in list; ready for OCPP connection |
| US-PA-003 | As a Partner Admin, I want to configure tariffs so that I can set pricing | Tariff created and assignable to connectors |
| US-PA-004 | As a Partner Admin, I want to view my revenue so that I can track earnings | Dashboard shows daily/weekly/monthly revenue |
| US-PA-005 | As a Partner Admin, I want to manage operators so that staff can access the system | Operator created with appropriate permissions |
| US-PA-006 | As a Partner Admin, I want to view my wallet balance so that I know available funds | Current balance and transaction history visible |
| US-PA-007 | As a Partner Admin, I want to download reports so that I can analyze business | Reports download in PDF/Excel format |

### 4.3 Operator Stories

| ID | Story | Acceptance Criteria |
|----|-------|---------------------|
| US-OP-001 | As an Operator, I want to view active sessions so that I can monitor charging | List of active sessions with real-time updates |
| US-OP-002 | As an Operator, I want to remotely stop a session so that I can assist customers | RemoteStopTransaction sent; session ends |
| US-OP-003 | As an Operator, I want to view station status so that I can identify issues | Station list with online/offline indicators |
| US-OP-004 | As an Operator, I want to reset a station so that I can resolve issues | Reset command sent; station restarts |
| US-OP-005 | As an Operator, I want to handle disputes so that customer issues are resolved | Dispute status updated; resolution logged |

### 4.4 EV Driver Stories

| ID | Story | Acceptance Criteria |
|----|-------|---------------------|
| US-DR-001 | As a Driver, I want to register with my phone so that I can use the platform | Account created after OTP verification |
| US-DR-002 | As a Driver, I want to find nearby chargers so that I can charge my vehicle | Map shows chargers with availability status |
| US-DR-003 | As a Driver, I want to add funds to my wallet so that I can pay for charging | Razorpay payment processed; balance updated |
| US-DR-004 | As a Driver, I want to scan a QR code to start charging so that I can charge easily | Session starts after QR scan and confirmation |
| US-DR-005 | As a Driver, I want to view my charging history so that I can track usage | List of past sessions with details |
| US-DR-006 | As a Driver, I want to request an RFID card so that I can charge without phone | Request submitted; card shipped |
| US-DR-007 | As a Driver, I want to add my vehicle so that I can track charging per vehicle | Vehicle added to profile |
| US-DR-008 | As a Driver, I want to rate a session so that I can share feedback | Rating saved; visible to admin |
| US-DR-009 | As a Driver, I want to raise a dispute so that billing issues are resolved | Dispute ticket created; tracking available |

---

## 5. Business Rules

### 5.1 Authentication Rules
| Rule ID | Rule |
|---------|------|
| BR-AUTH-001 | Users must verify email before first login |
| BR-AUTH-002 | Password must be minimum 8 characters with uppercase, lowercase, number, special character |
| BR-AUTH-003 | Account locks after 5 failed attempts for 30 minutes |
| BR-AUTH-004 | Password reset links expire after 1 hour |
| BR-AUTH-005 | Refresh tokens are invalidated on password change |

### 5.2 Partner Rules
| Rule ID | Rule |
|---------|------|
| BR-PARTNER-001 | Partner can only access their own data |
| BR-PARTNER-002 | Commission is calculated on gross session amount |
| BR-PARTNER-003 | Minimum settlement amount is ₹1000 |
| BR-PARTNER-004 | Settlement processed within 7 business days |

### 5.3 Station Rules
| Rule ID | Rule |
|---------|------|
| BR-STATION-001 | Station marked offline if no heartbeat for 5 minutes |
| BR-STATION-002 | OCPP identity must be unique across platform |
| BR-STATION-003 | Station must send BootNotification on connection |
| BR-STATION-004 | All connectors must have a tariff assigned |

### 5.4 Session Rules
| Rule ID | Rule |
|---------|------|
| BR-SESSION-001 | Session requires minimum wallet balance of ₹100 (QR/app) |
| BR-SESSION-002 | RFID sessions require active card linked to active driver |
| BR-SESSION-003 | Session amount calculated as: (energy × energyRate) + (time × timeRate) + sessionFee |
| BR-SESSION-004 | Tax calculated on subtotal |
| BR-SESSION-005 | Idle fee starts 5 minutes after charging complete |
| BR-SESSION-006 | Maximum session duration is 24 hours |

### 5.5 Wallet Rules
| Rule ID | Rule |
|---------|------|
| BR-WALLET-001 | Minimum top-up amount is ₹100 |
| BR-WALLET-002 | Maximum wallet balance is ₹50,000 |
| BR-WALLET-003 | Refunds credited within 5-7 business days |
| BR-WALLET-004 | Wallet cannot go negative |

### 5.6 Reservation Rules
| Rule ID | Rule |
|---------|------|
| BR-RESERVE-001 | Reservation duration is 15-60 minutes |
| BR-RESERVE-002 | Reservation expires if session not started |
| BR-RESERVE-003 | Only one active reservation per driver |
| BR-RESERVE-004 | Reservation fee charged for no-show |

### 5.7 RFID Card Rules
| Rule ID | Rule |
|---------|------|
| BR-CARD-001 | Card must be assigned to driver before activation |
| BR-CARD-002 | Lost card blocks immediately |
| BR-CARD-003 | One card per driver (additional cards require request) |
| BR-CARD-004 | Card validity is 3 years |

---

## 6. Data Flow Diagrams

### 6.1 Context Diagram
```
                              ┌─────────────────┐
                              │   SMS Gateway   │
                              └────────▲────────┘
                                       │
                              ┌────────┴────────┐
                              │   Email Service │
                              └────────▲────────┘
                                       │
┌─────────────┐              ┌─────────┴──────────┐              ┌─────────────┐
│   Admin     │◄────────────►│                    │◄────────────►│  Charging   │
│   Users     │    HTTPS     │    EV Charging     │    OCPP      │  Stations   │
└─────────────┘              │    Management      │              └─────────────┘
                             │    Platform        │
┌─────────────┐              │                    │              ┌─────────────┐
│  EV Drivers │◄────────────►│                    │◄────────────►│  Razorpay   │
│             │    HTTPS     │                    │    HTTPS     │             │
└─────────────┘              └────────────────────┘              └─────────────┘
```

### 6.2 QR Charging Flow
```
Driver              Frontend            Backend            OCPP Server         Charger
  │                    │                   │                    │                 │
  │ 1. Scan QR         │                   │                    │                 │
  │───────────────────►│                   │                    │                 │
  │                    │ 2. Get connector  │                    │                 │
  │                    │──────────────────►│                    │                 │
  │                    │◄──────────────────│                    │                 │
  │ 3. Show details    │                   │                    │                 │
  │◄───────────────────│                   │                    │                 │
  │                    │                   │                    │                 │
  │ 4. Confirm start   │                   │                    │                 │
  │───────────────────►│                   │                    │                 │
  │                    │ 5. Start request  │                    │                 │
  │                    │──────────────────►│                    │                 │
  │                    │                   │ 6. RemoteStart     │                 │
  │                    │                   │───────────────────►│                 │
  │                    │                   │                    │ 7. RemoteStart  │
  │                    │                   │                    │────────────────►│
  │                    │                   │                    │◄────────────────│
  │                    │                   │◄───────────────────│ 8. Accepted     │
  │                    │◄──────────────────│                    │                 │
  │ 9. Starting...     │                   │                    │                 │
  │◄───────────────────│                   │                    │                 │
  │                    │                   │                    │                 │
  │                    │                   │                    │ 10. StartTx     │
  │                    │                   │◄───────────────────│◄────────────────│
  │                    │                   │────────────────────│                 │
  │                    │ 11. Session active│                    │                 │
  │                    │◄──────────────────│                    │                 │
  │ 12. Charging       │                   │                    │                 │
  │◄───────────────────│                   │                    │                 │
```

### 6.3 Payment Flow
```
Driver              Frontend            Backend              Razorpay
  │                    │                   │                    │
  │ 1. Top-up request  │                   │                    │
  │───────────────────►│                   │                    │
  │                    │ 2. Create order   │                    │
  │                    │──────────────────►│                    │
  │                    │                   │ 3. Create order    │
  │                    │                   │───────────────────►│
  │                    │                   │◄───────────────────│
  │                    │◄──────────────────│ 4. Order ID        │
  │ 5. Payment form    │                   │                    │
  │◄───────────────────│                   │                    │
  │                    │                   │                    │
  │ 6. Enter details   │                   │                    │
  │───────────────────►│                   │                    │
  │                    │ 7. Process payment│                    │
  │                    │──────────────────────────────────────►│
  │                    │◄──────────────────────────────────────│
  │ 8. Payment result  │                   │                    │
  │◄───────────────────│                   │                    │
  │                    │ 9. Verify payment │                    │
  │                    │──────────────────►│                    │
  │                    │                   │ 10. Verify         │
  │                    │                   │───────────────────►│
  │                    │                   │◄───────────────────│
  │                    │                   │ 11. Update wallet  │
  │                    │◄──────────────────│                    │
  │ 12. Success        │                   │                    │
  │◄───────────────────│                   │                    │
```

---

## 7. Use Cases

### 7.1 Use Case: QR Code Charging

**Use Case ID:** UC-001
**Use Case Name:** Start Charging via QR Code
**Actor:** EV Driver
**Preconditions:**
- Driver is registered and logged in
- Wallet balance >= ₹100
- Connector is available

**Main Flow:**
1. Driver scans QR code on charger
2. System decodes connector information
3. System displays connector details and tariff
4. Driver confirms start
5. System verifies wallet balance
6. System sends RemoteStartTransaction
7. Charger accepts and starts charging
8. Session created and monitored

**Alternative Flows:**
- A1: Insufficient balance - Show top-up prompt
- A2: Connector unavailable - Show error message
- A3: Charger offline - Show error message
- A4: Start rejected - Show error with reason

**Postconditions:**
- Session is active
- Real-time updates visible to driver

### 7.2 Use Case: RFID Charging

**Use Case ID:** UC-002
**Use Case Name:** Start Charging via RFID Card
**Actor:** EV Driver
**Preconditions:**
- RFID card is active
- Card linked to driver account
- Driver wallet balance >= ₹100

**Main Flow:**
1. Driver taps RFID card on charger
2. Charger sends Authorize request
3. System validates card and balance
4. System sends Authorize response (Accepted)
5. Charger starts charging
6. Charger sends StartTransaction
7. System creates session
8. Session monitored until completion

**Alternative Flows:**
- A1: Invalid card - Authorize rejected
- A2: Blocked card - Authorize blocked
- A3: Insufficient balance - Authorize rejected

**Postconditions:**
- Session is active
- Amount deducted on completion

### 7.3 Use Case: Remote Session Stop

**Use Case ID:** UC-003
**Use Case Name:** Stop Session Remotely
**Actor:** Operator
**Preconditions:**
- Session is active
- Operator has permission

**Main Flow:**
1. Operator views active sessions
2. Operator selects session to stop
3. Operator confirms stop action
4. System sends RemoteStopTransaction
5. Charger stops charging
6. Charger sends StopTransaction
7. Session finalized
8. Amount deducted from wallet

**Postconditions:**
- Session is completed
- Receipt generated

### 7.4 Use Case: Wallet Top-up

**Use Case ID:** UC-004
**Use Case Name:** Add Funds to Wallet
**Actor:** EV Driver
**Preconditions:**
- Driver is logged in
- Valid payment method

**Main Flow:**
1. Driver opens wallet page
2. Driver enters amount (min ₹100)
3. System creates Razorpay order
4. Razorpay checkout opens
5. Driver completes payment
6. Razorpay redirects with success
7. System verifies payment
8. Wallet balance updated

**Alternative Flows:**
- A1: Payment failed - Show error, no balance update
- A2: Payment cancelled - Return to wallet page

**Postconditions:**
- Wallet balance increased
- Transaction recorded

### 7.5 Use Case: Partner Settlement

**Use Case ID:** UC-005
**Use Case Name:** Process Partner Settlement
**Actor:** Super Admin
**Preconditions:**
- Partner has unsettled balance >= ₹1000
- Settlement period complete

**Main Flow:**
1. Admin views settlement requests
2. Admin selects partner for settlement
3. System calculates net amount (gross - commission)
4. Admin initiates bank transfer
5. Admin marks settlement as processed
6. Partner wallet balance deducted
7. Settlement record created

**Postconditions:**
- Partner wallet reduced
- Settlement history updated
- Partner notified

---

*End of Functional Requirements Document*
