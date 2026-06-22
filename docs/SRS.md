# Software Requirements Specification (SRS)
# EV Charging Management Platform

**Version:** 1.0
**Date:** June 2026
**Status:** Approved

---

## Table of Contents
1. [Introduction](#1-introduction)
2. [System Overview](#2-system-overview)
3. [Stakeholder Analysis](#3-stakeholder-analysis)
4. [Functional Requirements](#4-functional-requirements)
5. [Non-Functional Requirements](#5-non-functional-requirements)
6. [System Constraints](#6-system-constraints)
7. [Assumptions](#7-assumptions)
8. [Acceptance Criteria](#8-acceptance-criteria)

---

## 1. Introduction

### 1.1 Purpose
This document specifies the software requirements for the EV Charging Management Platform, an enterprise-grade solution for managing electric vehicle charging infrastructure, including charging stations, user management, payments, and real-time monitoring.

### 1.2 Scope
The platform provides:
- Multi-tenant partner management
- OCPP 1.6J compliant charging station integration
- Real-time session monitoring and control
- Payment processing via Razorpay
- Mobile QR-based charging initiation
- Comprehensive reporting and analytics

### 1.3 Definitions and Acronyms
| Term | Definition |
|------|------------|
| OCPP | Open Charge Point Protocol |
| EV | Electric Vehicle |
| RFID | Radio Frequency Identification |
| CPO | Charge Point Operator |
| EVSE | Electric Vehicle Supply Equipment |
| SoC | State of Charge |
| JWT | JSON Web Token |
| RBAC | Role-Based Access Control |

### 1.4 References
- OCPP 1.6J Specification
- Razorpay API Documentation
- OpenAPI 3.0 Specification

---

## 2. System Overview

### 2.1 System Description
The EV Charging Management Platform is a web-based application that enables charge point operators to manage their EV charging infrastructure. The system connects to charging stations via OCPP 1.6J WebSocket protocol, processes payments through Razorpay, and provides real-time monitoring through a responsive web dashboard.

### 2.2 System Architecture Overview
```
┌─────────────────────────────────────────────────────────────┐
│                      Web Browsers                            │
│              (Admin Dashboard / Driver Portal)               │
└─────────────────────────┬───────────────────────────────────┘
                          │ HTTPS
┌─────────────────────────┴───────────────────────────────────┐
│                      Nginx Reverse Proxy                     │
└─────────────────────────┬───────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
┌───────┴───────┐ ┌───────┴───────┐ ┌───────┴───────┐
│   Frontend    │ │   Backend     │ │  OCPP Server  │
│   (React)     │ │   (Node.js)   │ │  (WebSocket)  │
│   Port 3001   │ │   Port 3000   │ │   Port 9000   │
└───────────────┘ └───────┬───────┘ └───────┬───────┘
                          │                 │
        ┌─────────────────┼─────────────────┘
        │                 │
┌───────┴───────┐ ┌───────┴───────┐
│  PostgreSQL   │ │    Redis      │
│   Port 5432   │ │   Port 6379   │
└───────────────┘ └───────────────┘
```

### 2.3 System Context
The platform integrates with:
- **Charging Stations**: Via OCPP 1.6J WebSocket
- **Payment Gateway**: Razorpay for transactions
- **Maps Service**: Leaflet/OpenStreetMap for location display
- **SMS Gateway**: For OTP and notifications
- **Email Service**: For transactional emails

---

## 3. Stakeholder Analysis

### 3.1 Primary Stakeholders

#### 3.1.1 Super Administrator
- **Role**: Platform owner with full system access
- **Goals**: Manage all partners, system configuration, and oversight
- **Concerns**: System stability, security, and scalability

#### 3.1.2 Partner Administrator
- **Role**: CPO managing their own charging network
- **Goals**: Monitor stations, manage revenue, handle customers
- **Concerns**: Uptime, revenue tracking, customer satisfaction

#### 3.1.3 Operator
- **Role**: Field staff managing day-to-day operations
- **Goals**: Monitor sessions, handle support, manage stations
- **Concerns**: Real-time alerts, quick issue resolution

#### 3.1.4 EV Driver
- **Role**: End user consuming charging services
- **Goals**: Find stations, charge vehicles, manage payments
- **Concerns**: Availability, pricing transparency, easy payments

### 3.2 Secondary Stakeholders
- **Finance Team**: Settlement reports, reconciliation
- **Technical Support**: System monitoring, troubleshooting
- **Auditors**: Compliance verification, audit trails

---

## 4. Functional Requirements

### 4.1 Authentication & Authorization (FR-AUTH)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-AUTH-001 | System shall support JWT-based authentication with access and refresh tokens | High |
| FR-AUTH-002 | System shall implement role-based access control (RBAC) with granular permissions | High |
| FR-AUTH-003 | System shall support password reset via email with secure tokens | High |
| FR-AUTH-004 | System shall enforce password complexity (min 8 chars, uppercase, lowercase, number, special) | High |
| FR-AUTH-005 | System shall lock accounts after 5 failed login attempts for 30 minutes | Medium |
| FR-AUTH-006 | System shall maintain audit log of all authentication events | High |
| FR-AUTH-007 | System shall support session management with configurable timeout | Medium |
| FR-AUTH-008 | System shall invalidate all tokens on password change | High |

### 4.2 User Management (FR-USER)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-USER-001 | Super Admin shall be able to create, view, update, and deactivate admin users | High |
| FR-USER-002 | Partner Admin shall be able to manage operators within their organization | High |
| FR-USER-003 | System shall support user profile management with avatar upload | Medium |
| FR-USER-004 | System shall track user activity and last login timestamp | Medium |
| FR-USER-005 | System shall support bulk user import via CSV | Low |
| FR-USER-006 | System shall enforce unique email addresses across all users | High |

### 4.3 Partner Management (FR-PARTNER)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-PARTNER-001 | Super Admin shall be able to onboard new partners with business details | High |
| FR-PARTNER-002 | Each partner shall have an isolated view of their own data only | High |
| FR-PARTNER-003 | System shall maintain partner wallet for revenue tracking | High |
| FR-PARTNER-004 | System shall support partner settlements with configurable commission | High |
| FR-PARTNER-005 | Partner shall be able to view their wallet balance and transaction history | High |
| FR-PARTNER-006 | System shall generate partner-specific revenue reports | Medium |
| FR-PARTNER-007 | Partner shall be able to configure their business settings and branding | Low |

### 4.4 Location Management (FR-LOC)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-LOC-001 | Partner shall be able to create locations with address and geo-coordinates | High |
| FR-LOC-002 | System shall display locations on an interactive map | High |
| FR-LOC-003 | Location shall support operating hours configuration | Medium |
| FR-LOC-004 | Location shall support amenities tagging (parking, restroom, cafe, etc.) | Medium |
| FR-LOC-005 | System shall support location images upload | Medium |
| FR-LOC-006 | System shall track location availability based on connector status | High |
| FR-LOC-007 | Locations shall be searchable by name, city, or proximity | High |

### 4.5 Charging Station Management (FR-STATION)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-STATION-001 | Partner shall be able to register charging stations with OCPP identity | High |
| FR-STATION-002 | System shall track station online/offline status via OCPP heartbeat | High |
| FR-STATION-003 | System shall display real-time station status on dashboard | High |
| FR-STATION-004 | Station shall support multiple connectors with individual status | High |
| FR-STATION-005 | System shall support remote station reset via OCPP | High |
| FR-STATION-006 | System shall support firmware update tracking | Medium |
| FR-STATION-007 | System shall maintain station error logs | High |
| FR-STATION-008 | Station shall be assignable to a specific location | High |

### 4.6 Connector Management (FR-CONN)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-CONN-001 | System shall support multiple connector types (CCS1, CCS2, CHAdeMO, Type2, etc.) | High |
| FR-CONN-002 | System shall track connector status (Available, Occupied, Faulted, Unavailable) | High |
| FR-CONN-003 | Connector shall have configurable power output (kW) | High |
| FR-CONN-004 | System shall update connector status in real-time via OCPP StatusNotification | High |
| FR-CONN-005 | Connector shall be linked to tariff configuration | High |

### 4.7 OCPP Communication (FR-OCPP)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-OCPP-001 | System shall implement OCPP 1.6J WebSocket server | High |
| FR-OCPP-002 | System shall process BootNotification and register charge points | High |
| FR-OCPP-003 | System shall process Heartbeat messages and track station connectivity | High |
| FR-OCPP-004 | System shall process StatusNotification for connector status updates | High |
| FR-OCPP-005 | System shall process Authorize requests for RFID card validation | High |
| FR-OCPP-006 | System shall process StartTransaction and create charging sessions | High |
| FR-OCPP-007 | System shall process StopTransaction and finalize sessions | High |
| FR-OCPP-008 | System shall process MeterValues for energy consumption tracking | High |
| FR-OCPP-009 | System shall send RemoteStartTransaction commands | High |
| FR-OCPP-010 | System shall send RemoteStopTransaction commands | High |
| FR-OCPP-011 | System shall send Reset commands (soft/hard) | Medium |
| FR-OCPP-012 | System shall send ChangeConfiguration commands | Medium |
| FR-OCPP-013 | System shall log all OCPP messages for debugging | High |

### 4.8 EV Driver Management (FR-DRIVER)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-DRIVER-001 | EV Drivers shall be able to self-register with mobile number and OTP | High |
| FR-DRIVER-002 | Driver shall be able to manage their profile information | High |
| FR-DRIVER-003 | Driver shall be able to add and manage multiple vehicles | Medium |
| FR-DRIVER-004 | Driver shall be able to request RFID cards for charging | Medium |
| FR-DRIVER-005 | System shall maintain driver wallet for prepaid charging | High |
| FR-DRIVER-006 | Driver shall be able to view charging history | High |
| FR-DRIVER-007 | Driver shall be able to view nearby charging stations on map | High |

### 4.9 Wallet System (FR-WALLET)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-WALLET-001 | Driver shall be able to add funds to wallet via Razorpay | High |
| FR-WALLET-002 | System shall deduct wallet balance for charging sessions | High |
| FR-WALLET-003 | Driver shall be able to view wallet transaction history | High |
| FR-WALLET-004 | System shall support minimum balance alerts | Medium |
| FR-WALLET-005 | System shall prevent session start if wallet balance is insufficient | High |
| FR-WALLET-006 | System shall support wallet refunds for failed transactions | High |
| FR-WALLET-007 | Partner wallet shall track revenue from all charging sessions | High |

### 4.10 Charging Sessions (FR-SESSION)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-SESSION-001 | System shall create session on StartTransaction from OCPP | High |
| FR-SESSION-002 | System shall update session with MeterValues in real-time | High |
| FR-SESSION-003 | System shall finalize session on StopTransaction | High |
| FR-SESSION-004 | System shall calculate session cost based on tariff rules | High |
| FR-SESSION-005 | Session shall be initiatable via QR code scan | High |
| FR-SESSION-006 | Session shall be initiatable via RFID card | High |
| FR-SESSION-007 | Admin/Operator shall be able to remotely start sessions | High |
| FR-SESSION-008 | Admin/Operator shall be able to remotely stop sessions | High |
| FR-SESSION-009 | System shall track session duration and energy consumed | High |
| FR-SESSION-010 | System shall support session idle fee after charging complete | Medium |

### 4.11 Reservations (FR-RESERVE)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-RESERVE-001 | Driver shall be able to reserve a connector for future use | Medium |
| FR-RESERVE-002 | Reservation shall have configurable duration (default 30 mins) | Medium |
| FR-RESERVE-003 | System shall send ReserveNow command to charge point | Medium |
| FR-RESERVE-004 | System shall automatically cancel expired reservations | Medium |
| FR-RESERVE-005 | Driver shall be able to cancel their own reservations | Medium |
| FR-RESERVE-006 | System shall charge reservation fee if session not started | Low |

### 4.12 Tariff Management (FR-TARIFF)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-TARIFF-001 | Partner shall be able to create tariff configurations | High |
| FR-TARIFF-002 | Tariff shall support per-kWh pricing | High |
| FR-TARIFF-003 | Tariff shall support per-minute pricing | High |
| FR-TARIFF-004 | Tariff shall support flat session fee | High |
| FR-TARIFF-005 | Tariff shall support time-of-use pricing (peak/off-peak) | Medium |
| FR-TARIFF-006 | Tariff shall support idle fee after charging complete | Medium |
| FR-TARIFF-007 | Tariff shall be assignable to specific connectors | High |
| FR-TARIFF-008 | System shall support tax calculation | Medium |

### 4.13 Payment Integration (FR-PAY)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-PAY-001 | System shall integrate with Razorpay for payment processing | High |
| FR-PAY-002 | System shall support wallet top-up via Razorpay | High |
| FR-PAY-003 | System shall support direct payment for charging sessions | High |
| FR-PAY-004 | System shall handle payment failures gracefully | High |
| FR-PAY-005 | System shall support refund processing | High |
| FR-PAY-006 | System shall maintain transaction records for reconciliation | High |
| FR-PAY-007 | System shall generate payment receipts | Medium |

### 4.14 QR Code System (FR-QR)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-QR-001 | System shall generate unique QR codes for each connector | High |
| FR-QR-002 | QR code shall encode connector identification | High |
| FR-QR-003 | Driver shall be able to scan QR to initiate charging | High |
| FR-QR-004 | System shall support QR code regeneration | Medium |
| FR-QR-005 | QR codes shall be downloadable for printing | Medium |

### 4.15 Charge Cards / RFID (FR-CARD)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-CARD-001 | Admin shall be able to create and manage RFID cards | High |
| FR-CARD-002 | RFID card shall be assignable to a driver | High |
| FR-CARD-003 | System shall validate RFID on Authorize request | High |
| FR-CARD-004 | Driver shall be able to request new RFID card | Medium |
| FR-CARD-005 | System shall support card blocking/unblocking | High |
| FR-CARD-006 | System shall track card usage history | Medium |

### 4.16 Reports & Analytics (FR-REPORT)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-REPORT-001 | System shall generate charging session reports | High |
| FR-REPORT-002 | System shall generate revenue reports | High |
| FR-REPORT-003 | System shall generate station utilization reports | High |
| FR-REPORT-004 | System shall generate driver activity reports | Medium |
| FR-REPORT-005 | Reports shall be exportable to PDF and Excel | High |
| FR-REPORT-006 | Reports shall support date range filtering | High |
| FR-REPORT-007 | Dashboard shall display real-time KPIs | High |
| FR-REPORT-008 | Dashboard shall display charts for trends analysis | Medium |

### 4.17 Reviews & Ratings (FR-REVIEW)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-REVIEW-001 | Driver shall be able to rate a charging session (1-5 stars) | Medium |
| FR-REVIEW-002 | Driver shall be able to write review comments | Medium |
| FR-REVIEW-003 | Admin shall be able to view and respond to reviews | Medium |
| FR-REVIEW-004 | System shall calculate average rating per location/station | Medium |

### 4.18 Disputes (FR-DISPUTE)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-DISPUTE-001 | Driver shall be able to raise dispute on a transaction | Medium |
| FR-DISPUTE-002 | Admin shall be able to view and resolve disputes | Medium |
| FR-DISPUTE-003 | System shall support dispute categories | Medium |
| FR-DISPUTE-004 | System shall track dispute resolution history | Medium |

### 4.19 Coupons & Promotions (FR-COUPON)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-COUPON-001 | Admin shall be able to create discount coupons | Low |
| FR-COUPON-002 | Coupon shall support percentage or fixed amount discount | Low |
| FR-COUPON-003 | Coupon shall have validity period | Low |
| FR-COUPON-004 | Coupon shall have usage limits (per user, total) | Low |
| FR-COUPON-005 | Driver shall be able to apply coupon during charging | Low |

### 4.20 Notifications (FR-NOTIFY)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-NOTIFY-001 | System shall send SMS notifications for session events | Medium |
| FR-NOTIFY-002 | System shall send email notifications for important events | Medium |
| FR-NOTIFY-003 | System shall display in-app notifications | Medium |
| FR-NOTIFY-004 | Admin shall be able to send broadcast notifications | Low |
| FR-NOTIFY-005 | Driver shall be able to configure notification preferences | Low |

### 4.21 Audit & Logging (FR-AUDIT)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-AUDIT-001 | System shall maintain audit log of all critical actions | High |
| FR-AUDIT-002 | Audit log shall record user, action, timestamp, and details | High |
| FR-AUDIT-003 | System shall log all OCPP messages | High |
| FR-AUDIT-004 | System shall log all API requests (server logs) | High |
| FR-AUDIT-005 | Logs shall be searchable with filters | Medium |
| FR-AUDIT-006 | Logs shall be exportable for compliance | Medium |

---

## 5. Non-Functional Requirements

### 5.1 Performance (NFR-PERF)

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-PERF-001 | API response time | < 200ms for 95th percentile |
| NFR-PERF-002 | Dashboard page load time | < 3 seconds |
| NFR-PERF-003 | OCPP message processing | < 100ms |
| NFR-PERF-004 | Concurrent WebSocket connections | 10,000+ |
| NFR-PERF-005 | Database query time | < 100ms for complex queries |
| NFR-PERF-006 | Real-time dashboard updates | < 1 second latency |

### 5.2 Scalability (NFR-SCALE)

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-SCALE-001 | Horizontal scaling capability | Kubernetes-ready |
| NFR-SCALE-002 | Charging stations supported | 50,000+ |
| NFR-SCALE-003 | Concurrent users | 10,000+ |
| NFR-SCALE-004 | Daily transactions | 500,000+ |
| NFR-SCALE-005 | Data retention | 5+ years |

### 5.3 Availability (NFR-AVAIL)

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-AVAIL-001 | System uptime | 99.9% |
| NFR-AVAIL-002 | Planned maintenance window | < 4 hours/month |
| NFR-AVAIL-003 | Recovery Time Objective (RTO) | < 1 hour |
| NFR-AVAIL-004 | Recovery Point Objective (RPO) | < 5 minutes |

### 5.4 Security (NFR-SEC)

| ID | Requirement |
|----|-------------|
| NFR-SEC-001 | All communications over HTTPS/WSS |
| NFR-SEC-002 | JWT tokens with RS256 signing |
| NFR-SEC-003 | Password hashing with bcrypt (cost factor 12) |
| NFR-SEC-004 | SQL injection prevention via parameterized queries |
| NFR-SEC-005 | XSS prevention via input sanitization and Content Security Policy |
| NFR-SEC-006 | CSRF protection |
| NFR-SEC-007 | Rate limiting on all endpoints |
| NFR-SEC-008 | OWASP Top 10 compliance |
| NFR-SEC-009 | Sensitive data encryption at rest |
| NFR-SEC-010 | Regular security audits and penetration testing |

### 5.5 Usability (NFR-USE)

| ID | Requirement |
|----|-------------|
| NFR-USE-001 | Responsive design for desktop, tablet, and mobile |
| NFR-USE-002 | Support for modern browsers (Chrome, Firefox, Safari, Edge) |
| NFR-USE-003 | Intuitive navigation with maximum 3 clicks to any feature |
| NFR-USE-004 | Consistent UI patterns across all modules |
| NFR-USE-005 | Clear error messages with actionable guidance |
| NFR-USE-006 | WCAG 2.1 Level AA accessibility compliance |

### 5.6 Maintainability (NFR-MAINT)

| ID | Requirement |
|----|-------------|
| NFR-MAINT-001 | Modular architecture with clear separation of concerns |
| NFR-MAINT-002 | Comprehensive API documentation (OpenAPI 3.0) |
| NFR-MAINT-003 | Code coverage > 80% |
| NFR-MAINT-004 | Structured logging with correlation IDs |
| NFR-MAINT-005 | Health check endpoints for monitoring |

### 5.7 Compatibility (NFR-COMPAT)

| ID | Requirement |
|----|-------------|
| NFR-COMPAT-001 | OCPP 1.6J compliant |
| NFR-COMPAT-002 | RESTful API following OpenAPI 3.0 |
| NFR-COMPAT-003 | PostgreSQL 15+ |
| NFR-COMPAT-004 | Node.js 20 LTS |
| NFR-COMPAT-005 | Docker and Docker Compose deployment |

---

## 6. System Constraints

### 6.1 Technical Constraints
- Backend must be implemented in Node.js with Express framework
- Frontend must be implemented in React with Material-UI
- Database must be PostgreSQL
- Real-time communication via Socket.IO and WebSocket
- OCPP implementation limited to version 1.6J (JSON over WebSocket)
- Payment processing limited to Razorpay

### 6.2 Business Constraints
- Multi-tenant architecture with data isolation
- Compliance with local EV charging regulations
- Support for Indian payment methods (UPI, cards, wallets)
- GST compliance for invoicing

### 6.3 Resource Constraints
- Docker-based deployment
- Single-node deployment for MVP (scalable to cluster)
- Cloud-agnostic design

---

## 7. Assumptions

1. Charging stations are OCPP 1.6J compliant
2. Stable internet connectivity available at charging locations
3. Razorpay account configured and API keys available
4. Users have access to modern web browsers
5. SMS gateway service configured for OTP delivery
6. Email service configured for transactional emails
7. SSL certificates available for HTTPS/WSS
8. Docker and Docker Compose available on deployment server

---

## 8. Acceptance Criteria

### 8.1 System Acceptance Criteria

| Criteria | Description |
|----------|-------------|
| AC-001 | All functional requirements marked "High" priority are implemented |
| AC-002 | System passes security vulnerability scan with no critical issues |
| AC-003 | All API endpoints documented and accessible via Swagger UI |
| AC-004 | OCPP 1.6J compliance verified with test charge point simulator |
| AC-005 | Payment flow tested end-to-end with Razorpay test mode |
| AC-006 | Performance benchmarks meet specified targets |
| AC-007 | System operates continuously for 72 hours without failure |
| AC-008 | Complete QR charging flow functional |
| AC-009 | All user roles can perform their designated functions |
| AC-010 | Reports generate correctly in PDF and Excel formats |

### 8.2 Module Acceptance Criteria

Each module must:
1. Pass unit tests with > 80% coverage
2. Pass integration tests
3. Handle error cases gracefully
4. Log appropriate events
5. Meet performance requirements
6. Support the defined user roles and permissions

---

## Document Approval

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Project Manager | | | |
| Technical Lead | | | |
| Product Owner | | | |
| QA Lead | | | |

---

*End of Software Requirements Specification*
