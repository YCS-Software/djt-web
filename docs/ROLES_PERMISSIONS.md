# User Roles & Permissions Matrix
# EV Charging Management Platform

**Version:** 1.0
**Date:** June 2026

---

## Table of Contents
1. [Role Definitions](#1-role-definitions)
2. [Permission Structure](#2-permission-structure)
3. [Permission Matrix](#3-permission-matrix)
4. [Access Control Rules](#4-access-control-rules)
5. [Implementation Guide](#5-implementation-guide)

---

## 1. Role Definitions

### 1.1 Super Administrator
**Code:** `super_admin`

**Description:** Platform owner with unrestricted access to all features, data, and settings across all partner organizations.

**Key Responsibilities:**
- Manage all partners and their configurations
- Access platform-wide analytics and reports
- Configure system-wide settings
- Manage commission rates and settlements
- Access all audit and system logs
- Create and manage admin users

**Scope:** Platform-wide (all partners)

### 1.2 Partner Administrator
**Code:** `partner_admin`

**Description:** Organization owner managing their charging network within the platform. Full access to their own partner's data and operations.

**Key Responsibilities:**
- Manage locations and charging stations
- Configure tariffs and pricing
- Manage operators within organization
- View revenue and business reports
- Handle customer disputes
- Manage RFID cards and coupons

**Scope:** Own partner organization only

### 1.3 Operator
**Code:** `operator`

**Description:** Field staff handling day-to-day operations with limited administrative access.

**Key Responsibilities:**
- Monitor real-time sessions
- Handle customer support
- Perform remote station operations
- View operational reports
- Manage disputes (resolve)
- Monitor station health

**Scope:** Own partner organization only

### 1.4 Viewer
**Code:** `viewer`

**Description:** Read-only access for monitoring and reporting purposes.

**Key Responsibilities:**
- View dashboards and reports
- Monitor station status
- View session history
- Access read-only data

**Scope:** Own partner organization only

---

## 2. Permission Structure

### 2.1 Permission Naming Convention
```
{action}:{resource}
```

**Actions:**
- `view` - Read access
- `create` - Create new resources
- `update` - Modify existing resources
- `delete` - Remove resources
- `manage` - Full CRUD + special operations
- `control` - Remote control operations
- `export` - Export data/reports

**Examples:**
- `view:stations` - View charging stations
- `create:locations` - Create new locations
- `control:sessions` - Start/stop charging sessions
- `export:reports` - Export reports to PDF/Excel

### 2.2 Module List
| Module | Code | Description |
|--------|------|-------------|
| Dashboard | `dashboard` | Dashboard and analytics |
| Users | `users` | User management |
| Partners | `partners` | Partner management |
| Locations | `locations` | Location management |
| Stations | `stations` | Charging station management |
| Connectors | `connectors` | Connector management |
| Drivers | `drivers` | EV driver management |
| Sessions | `sessions` | Charging session management |
| Tariffs | `tariffs` | Tariff/pricing management |
| Cards | `cards` | RFID card management |
| Reports | `reports` | Report generation |
| Disputes | `disputes` | Dispute management |
| Coupons | `coupons` | Coupon management |
| Logs | `logs` | System logs |

---

## 3. Permission Matrix

### 3.1 Dashboard Module
| Permission | Super Admin | Partner Admin | Operator | Viewer |
|------------|:-----------:|:-------------:|:--------:|:------:|
| view:dashboard | ✅ | ✅ | ✅ | ✅ |

### 3.2 Users Module
| Permission | Super Admin | Partner Admin | Operator | Viewer |
|------------|:-----------:|:-------------:|:--------:|:------:|
| view:users | ✅ | ✅ | ❌ | ❌ |
| create:users | ✅ | ✅ | ❌ | ❌ |
| update:users | ✅ | ✅ | ❌ | ❌ |
| delete:users | ✅ | ✅ | ❌ | ❌ |

### 3.3 Partners Module
| Permission | Super Admin | Partner Admin | Operator | Viewer |
|------------|:-----------:|:-------------:|:--------:|:------:|
| view:partners | ✅ | ❌ | ❌ | ❌ |
| create:partners | ✅ | ❌ | ❌ | ❌ |
| update:partners | ✅ | ❌ | ❌ | ❌ |
| delete:partners | ✅ | ❌ | ❌ | ❌ |
| manage:settlements | ✅ | ❌ | ❌ | ❌ |

### 3.4 Locations Module
| Permission | Super Admin | Partner Admin | Operator | Viewer |
|------------|:-----------:|:-------------:|:--------:|:------:|
| view:locations | ✅ | ✅ | ✅ | ✅ |
| create:locations | ✅ | ✅ | ❌ | ❌ |
| update:locations | ✅ | ✅ | ❌ | ❌ |
| delete:locations | ✅ | ✅ | ❌ | ❌ |

### 3.5 Stations Module
| Permission | Super Admin | Partner Admin | Operator | Viewer |
|------------|:-----------:|:-------------:|:--------:|:------:|
| view:stations | ✅ | ✅ | ✅ | ✅ |
| create:stations | ✅ | ✅ | ❌ | ❌ |
| update:stations | ✅ | ✅ | ❌ | ❌ |
| delete:stations | ✅ | ✅ | ❌ | ❌ |
| control:stations | ✅ | ✅ | ✅ | ❌ |

### 3.6 Connectors Module
| Permission | Super Admin | Partner Admin | Operator | Viewer |
|------------|:-----------:|:-------------:|:--------:|:------:|
| view:connectors | ✅ | ✅ | ✅ | ✅ |
| create:connectors | ✅ | ✅ | ❌ | ❌ |
| update:connectors | ✅ | ✅ | ❌ | ❌ |
| delete:connectors | ✅ | ✅ | ❌ | ❌ |

### 3.7 Drivers Module
| Permission | Super Admin | Partner Admin | Operator | Viewer |
|------------|:-----------:|:-------------:|:--------:|:------:|
| view:drivers | ✅ | ✅ | ✅ | ✅ |
| create:drivers | ✅ | ✅ | ❌ | ❌ |
| update:drivers | ✅ | ✅ | ❌ | ❌ |
| delete:drivers | ✅ | ✅ | ❌ | ❌ |

### 3.8 Sessions Module
| Permission | Super Admin | Partner Admin | Operator | Viewer |
|------------|:-----------:|:-------------:|:--------:|:------:|
| view:sessions | ✅ | ✅ | ✅ | ✅ |
| control:sessions | ✅ | ✅ | ✅ | ❌ |

### 3.9 Tariffs Module
| Permission | Super Admin | Partner Admin | Operator | Viewer |
|------------|:-----------:|:-------------:|:--------:|:------:|
| view:tariffs | ✅ | ✅ | ✅ | ✅ |
| create:tariffs | ✅ | ✅ | ❌ | ❌ |
| update:tariffs | ✅ | ✅ | ❌ | ❌ |
| delete:tariffs | ✅ | ✅ | ❌ | ❌ |

### 3.10 Cards Module
| Permission | Super Admin | Partner Admin | Operator | Viewer |
|------------|:-----------:|:-------------:|:--------:|:------:|
| view:cards | ✅ | ✅ | ✅ | ✅ |
| create:cards | ✅ | ✅ | ❌ | ❌ |
| update:cards | ✅ | ✅ | ❌ | ❌ |
| delete:cards | ✅ | ✅ | ❌ | ❌ |

### 3.11 Reports Module
| Permission | Super Admin | Partner Admin | Operator | Viewer |
|------------|:-----------:|:-------------:|:--------:|:------:|
| view:reports | ✅ | ✅ | ✅ | ✅ |
| export:reports | ✅ | ✅ | ❌ | ❌ |

### 3.12 Disputes Module
| Permission | Super Admin | Partner Admin | Operator | Viewer |
|------------|:-----------:|:-------------:|:--------:|:------:|
| view:disputes | ✅ | ✅ | ✅ | ✅ |
| manage:disputes | ✅ | ✅ | ✅ | ❌ |

### 3.13 Coupons Module
| Permission | Super Admin | Partner Admin | Operator | Viewer |
|------------|:-----------:|:-------------:|:--------:|:------:|
| view:coupons | ✅ | ✅ | ✅ | ✅ |
| create:coupons | ✅ | ✅ | ❌ | ❌ |
| update:coupons | ✅ | ✅ | ❌ | ❌ |
| delete:coupons | ✅ | ✅ | ❌ | ❌ |

### 3.14 Logs Module
| Permission | Super Admin | Partner Admin | Operator | Viewer |
|------------|:-----------:|:-------------:|:--------:|:------:|
| view:audit_logs | ✅ | ✅ | ❌ | ❌ |
| view:ocpp_logs | ✅ | ✅ | ✅ | ✅ |
| view:server_logs | ✅ | ❌ | ❌ | ❌ |

---

## 4. Access Control Rules

### 4.1 Data Isolation Rules

#### Rule 1: Partner Scope
```
Partner Admin, Operator, and Viewer users can ONLY access
data belonging to their assigned partner organization.
```

**Implementation:**
```javascript
// Middleware to enforce partner scope
function enforcePartnerScope(req, res, next) {
  if (req.user.role !== 'super_admin') {
    req.query.partnerId = req.user.partnerId;
  }
  next();
}
```

#### Rule 2: Super Admin Override
```
Super Admin bypasses all partner scope restrictions
and can access data across all partners.
```

#### Rule 3: Self-Service
```
All users can update their own profile regardless of role.
Users cannot change their own role or permissions.
```

### 4.2 Special Permission Rules

#### Rule 4: Station Control
```
control:stations permission allows:
- Remote start/stop transactions
- Station reset (soft/hard)
- Change configuration
- Unlock connector

Does NOT allow:
- Create/delete stations
- Modify station settings
```

#### Rule 5: Session Control
```
control:sessions permission allows:
- Remote start session (via dashboard)
- Remote stop session

Requires:
- Connector must be available (for start)
- Driver must have sufficient wallet balance (for start)
```

#### Rule 6: Settlement Management
```
manage:settlements permission (Super Admin only) allows:
- View pending settlements
- Process settlements
- Mark settlements as completed
- View settlement history
```

### 4.3 Hierarchical Rules

#### Rule 7: Role Assignment
```
Users can only assign roles equal to or lower than their own:
- Super Admin: Can assign any role
- Partner Admin: Can assign Partner Admin, Operator, Viewer
- Operator: Cannot assign roles
- Viewer: Cannot assign roles
```

#### Rule 8: User Management Scope
```
- Super Admin: Can manage users across all partners
- Partner Admin: Can only manage users within their partner
- Users cannot modify their own role
```

---

## 5. Implementation Guide

### 5.1 Permission Check Function
```javascript
// src/middleware/rbac.js
const checkPermission = (permission) => {
  return (req, res, next) => {
    const userPermissions = req.user.permissions;

    if (!userPermissions.includes(permission)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Insufficient permissions'
        }
      });
    }

    next();
  };
};

// Usage in routes
router.get('/stations',
  authenticate,
  checkPermission('view:stations'),
  enforcePartnerScope,
  stationController.list
);

router.post('/stations/:id/reset',
  authenticate,
  checkPermission('control:stations'),
  stationController.reset
);
```

### 5.2 Partner Scope Middleware
```javascript
// src/middleware/partnerScope.js
const enforcePartnerScope = async (req, res, next) => {
  // Super admin can access all
  if (req.user.role === 'super_admin') {
    return next();
  }

  // Others restricted to their partner
  const partnerId = req.user.partnerId;

  if (!partnerId) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'No partner association'
      }
    });
  }

  // Add partner filter to all queries
  req.partnerFilter = { partnerId };

  // For specific resource access, verify ownership
  if (req.params.id) {
    const resource = await getResource(req.path, req.params.id);
    if (resource && resource.partnerId !== partnerId) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Resource not found'
        }
      });
    }
  }

  next();
};
```

### 5.3 Role-Based UI Rendering
```javascript
// Frontend: usePermission hook
function usePermission(permission) {
  const { user } = useAuth();
  return user?.permissions?.includes(permission) || false;
}

// Usage in component
function StationsPage() {
  const canCreate = usePermission('create:stations');
  const canControl = usePermission('control:stations');

  return (
    <div>
      {canCreate && (
        <Button onClick={openCreateModal}>
          Add Station
        </Button>
      )}

      <StationTable
        showControlButtons={canControl}
      />
    </div>
  );
}
```

### 5.4 Menu Configuration
```javascript
// Navigation menu based on permissions
const menuItems = [
  {
    label: 'Dashboard',
    path: '/dashboard',
    permission: 'view:dashboard'
  },
  {
    label: 'Partners',
    path: '/partners',
    permission: 'view:partners'
  },
  {
    label: 'Locations',
    path: '/locations',
    permission: 'view:locations'
  },
  {
    label: 'Stations',
    path: '/stations',
    permission: 'view:stations'
  },
  {
    label: 'Sessions',
    path: '/sessions',
    permission: 'view:sessions'
  },
  {
    label: 'Drivers',
    path: '/drivers',
    permission: 'view:drivers'
  },
  {
    label: 'Tariffs',
    path: '/tariffs',
    permission: 'view:tariffs'
  },
  {
    label: 'RFID Cards',
    path: '/cards',
    permission: 'view:cards'
  },
  {
    label: 'Reports',
    path: '/reports',
    permission: 'view:reports'
  },
  {
    label: 'Disputes',
    path: '/disputes',
    permission: 'view:disputes'
  },
  {
    label: 'Coupons',
    path: '/coupons',
    permission: 'view:coupons'
  },
  {
    label: 'Users',
    path: '/users',
    permission: 'view:users'
  },
  {
    label: 'Settings',
    path: '/settings',
    permission: null // Available to all
  }
];

// Filter menu based on user permissions
function getVisibleMenuItems(permissions) {
  return menuItems.filter(item =>
    !item.permission || permissions.includes(item.permission)
  );
}
```

### 5.5 API Response Filtering
```javascript
// Remove sensitive fields based on role
function filterResponseByRole(data, role) {
  const sensitiveFields = {
    partner: ['bankDetails', 'panNumber'],
    driver: ['walletBalance'],
    user: ['passwordHash']
  };

  // Super admin sees everything
  if (role === 'super_admin') {
    return data;
  }

  // Remove sensitive fields for other roles
  const filtered = { ...data };
  Object.keys(sensitiveFields).forEach(type => {
    sensitiveFields[type].forEach(field => {
      if (filtered[field]) {
        delete filtered[field];
      }
    });
  });

  return filtered;
}
```

---

## Complete Permission List

| Permission | Description |
|------------|-------------|
| `view:dashboard` | View dashboard and analytics |
| `view:users` | View user list |
| `create:users` | Create new users |
| `update:users` | Update existing users |
| `delete:users` | Delete users |
| `view:partners` | View partner list |
| `create:partners` | Create new partners |
| `update:partners` | Update existing partners |
| `delete:partners` | Delete partners |
| `manage:settlements` | Process partner settlements |
| `view:locations` | View location list |
| `create:locations` | Create new locations |
| `update:locations` | Update existing locations |
| `delete:locations` | Delete locations |
| `view:stations` | View charging stations |
| `create:stations` | Create new stations |
| `update:stations` | Update existing stations |
| `delete:stations` | Delete stations |
| `control:stations` | Remote start/stop/reset stations |
| `view:connectors` | View connectors |
| `create:connectors` | Create new connectors |
| `update:connectors` | Update existing connectors |
| `delete:connectors` | Delete connectors |
| `view:drivers` | View EV drivers |
| `create:drivers` | Create new drivers |
| `update:drivers` | Update existing drivers |
| `delete:drivers` | Delete drivers |
| `view:sessions` | View charging sessions |
| `control:sessions` | Start/stop sessions remotely |
| `view:tariffs` | View tariffs |
| `create:tariffs` | Create new tariffs |
| `update:tariffs` | Update existing tariffs |
| `delete:tariffs` | Delete tariffs |
| `view:cards` | View RFID cards |
| `create:cards` | Create new cards |
| `update:cards` | Update existing cards |
| `delete:cards` | Delete cards |
| `view:reports` | View reports |
| `export:reports` | Export reports to PDF/Excel |
| `view:disputes` | View disputes |
| `manage:disputes` | Resolve disputes |
| `view:coupons` | View coupons |
| `create:coupons` | Create new coupons |
| `update:coupons` | Update existing coupons |
| `delete:coupons` | Delete coupons |
| `view:audit_logs` | View audit logs |
| `view:ocpp_logs` | View OCPP communication logs |
| `view:server_logs` | View server logs |

---

*End of Roles & Permissions Document*
