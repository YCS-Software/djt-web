# UI/UX Design System
# EV Charging Management Platform

**Version:** 1.0
**Date:** June 2026

---

## Table of Contents
1. [Brand Identity](#1-brand-identity)
2. [Color Palette](#2-color-palette)
3. [Typography](#3-typography)
4. [Spacing & Layout](#4-spacing--layout)
5. [Component Library](#5-component-library)
6. [Iconography](#6-iconography)
7. [Responsive Design](#7-responsive-design)
8. [Navigation Structure](#8-navigation-structure)
9. [Data Visualization](#9-data-visualization)
10. [Accessibility](#10-accessibility)

---

## 1. Brand Identity

### 1.1 Brand Values
- **Sustainable**: Green energy, environmental consciousness
- **Reliable**: Trustworthy, always available
- **Modern**: Cutting-edge technology, innovation
- **Simple**: Easy to use, intuitive interfaces

### 1.2 Logo Usage
- Primary logo with tagline for headers
- Icon-only version for favicons and compact spaces
- Minimum clear space: 1x logo height
- Minimum size: 32px height

### 1.3 Brand Voice
- Professional yet approachable
- Clear and concise
- Action-oriented
- Technical accuracy without jargon

---

## 2. Color Palette

### 2.1 Primary Colors

```css
/* Green Energy Theme */
:root {
  /* Primary - Green */
  --primary-50: #e8f5e9;
  --primary-100: #c8e6c9;
  --primary-200: #a5d6a7;
  --primary-300: #81c784;
  --primary-400: #66bb6a;
  --primary-500: #4caf50;  /* Main Primary */
  --primary-600: #43a047;
  --primary-700: #388e3c;
  --primary-800: #2e7d32;
  --primary-900: #1b5e20;

  /* Secondary - Blue */
  --secondary-50: #e3f2fd;
  --secondary-100: #bbdefb;
  --secondary-200: #90caf9;
  --secondary-300: #64b5f6;
  --secondary-400: #42a5f5;
  --secondary-500: #2196f3;  /* Main Secondary */
  --secondary-600: #1e88e5;
  --secondary-700: #1976d2;
  --secondary-800: #1565c0;
  --secondary-900: #0d47a1;
}
```

### 2.2 Semantic Colors

```css
:root {
  /* Success */
  --success-light: #81c784;
  --success-main: #4caf50;
  --success-dark: #388e3c;
  --success-contrast: #ffffff;

  /* Warning */
  --warning-light: #ffb74d;
  --warning-main: #ff9800;
  --warning-dark: #f57c00;
  --warning-contrast: #000000;

  /* Error */
  --error-light: #e57373;
  --error-main: #f44336;
  --error-dark: #d32f2f;
  --error-contrast: #ffffff;

  /* Info */
  --info-light: #64b5f6;
  --info-main: #2196f3;
  --info-dark: #1976d2;
  --info-contrast: #ffffff;
}
```

### 2.3 Neutral Colors

```css
:root {
  /* Grays */
  --gray-50: #fafafa;
  --gray-100: #f5f5f5;
  --gray-200: #eeeeee;
  --gray-300: #e0e0e0;
  --gray-400: #bdbdbd;
  --gray-500: #9e9e9e;
  --gray-600: #757575;
  --gray-700: #616161;
  --gray-800: #424242;
  --gray-900: #212121;

  /* Background */
  --background-default: #f5f5f5;
  --background-paper: #ffffff;
  --background-dark: #121212;

  /* Text */
  --text-primary: rgba(0, 0, 0, 0.87);
  --text-secondary: rgba(0, 0, 0, 0.60);
  --text-disabled: rgba(0, 0, 0, 0.38);
}
```

### 2.4 Status Colors

| Status | Color | Hex | Usage |
|--------|-------|-----|-------|
| Available | Green | #4caf50 | Connector available |
| Charging | Blue | #2196f3 | Active session |
| Reserved | Orange | #ff9800 | Reserved connector |
| Offline | Gray | #9e9e9e | Station offline |
| Faulted | Red | #f44336 | Error state |
| Preparing | Yellow | #ffeb3b | Preparing to charge |
| Finishing | Teal | #009688 | Session ending |

### 2.5 Dark Mode

```css
:root[data-theme="dark"] {
  --background-default: #121212;
  --background-paper: #1e1e1e;
  --text-primary: rgba(255, 255, 255, 0.87);
  --text-secondary: rgba(255, 255, 255, 0.60);
  --text-disabled: rgba(255, 255, 255, 0.38);

  /* Adjust primary for dark mode */
  --primary-main: #66bb6a;
}
```

---

## 3. Typography

### 3.1 Font Family

```css
:root {
  --font-family-primary: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-family-mono: 'JetBrains Mono', 'Fira Code', monospace;
}
```

### 3.2 Type Scale

| Variant | Size | Weight | Line Height | Usage |
|---------|------|--------|-------------|-------|
| h1 | 32px | 700 | 1.2 | Page titles |
| h2 | 24px | 600 | 1.3 | Section headers |
| h3 | 20px | 600 | 1.4 | Card titles |
| h4 | 18px | 600 | 1.4 | Subsection headers |
| h5 | 16px | 600 | 1.5 | Widget titles |
| h6 | 14px | 600 | 1.5 | Small headers |
| body1 | 16px | 400 | 1.5 | Body text |
| body2 | 14px | 400 | 1.5 | Secondary text |
| caption | 12px | 400 | 1.5 | Labels, hints |
| button | 14px | 500 | 1.75 | Button text |
| overline | 12px | 500 | 2.5 | Category labels |

### 3.3 Typography CSS

```css
.h1 { font-size: 2rem; font-weight: 700; line-height: 1.2; }
.h2 { font-size: 1.5rem; font-weight: 600; line-height: 1.3; }
.h3 { font-size: 1.25rem; font-weight: 600; line-height: 1.4; }
.h4 { font-size: 1.125rem; font-weight: 600; line-height: 1.4; }
.h5 { font-size: 1rem; font-weight: 600; line-height: 1.5; }
.h6 { font-size: 0.875rem; font-weight: 600; line-height: 1.5; }

.body1 { font-size: 1rem; font-weight: 400; line-height: 1.5; }
.body2 { font-size: 0.875rem; font-weight: 400; line-height: 1.5; }
.caption { font-size: 0.75rem; font-weight: 400; line-height: 1.5; }
.button { font-size: 0.875rem; font-weight: 500; line-height: 1.75; text-transform: uppercase; }
.overline { font-size: 0.75rem; font-weight: 500; line-height: 2.5; text-transform: uppercase; letter-spacing: 0.08em; }
```

---

## 4. Spacing & Layout

### 4.1 Spacing Scale

```css
:root {
  --spacing-1: 4px;
  --spacing-2: 8px;
  --spacing-3: 12px;
  --spacing-4: 16px;
  --spacing-5: 20px;
  --spacing-6: 24px;
  --spacing-8: 32px;
  --spacing-10: 40px;
  --spacing-12: 48px;
  --spacing-16: 64px;
}
```

### 4.2 Layout Grid

```css
/* 12-column grid system */
.container {
  max-width: 1440px;
  margin: 0 auto;
  padding: 0 24px;
}

/* Breakpoints */
:root {
  --breakpoint-xs: 0;
  --breakpoint-sm: 600px;
  --breakpoint-md: 900px;
  --breakpoint-lg: 1200px;
  --breakpoint-xl: 1536px;
}
```

### 4.3 Page Layout

```
┌─────────────────────────────────────────────────────────────┐
│                        Header (64px)                         │
├────────────┬────────────────────────────────────────────────┤
│            │                                                │
│  Sidebar   │              Main Content Area                 │
│  (240px)   │                                                │
│            │    ┌─────────────────────────────────────┐     │
│  - Logo    │    │         Page Header                 │     │
│  - Nav     │    │    Title    |    Actions           │     │
│  - User    │    └─────────────────────────────────────┘     │
│            │                                                │
│            │    ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│            │    │   KPI    │  │   KPI    │  │   KPI    │   │
│            │    │   Card   │  │   Card   │  │   Card   │   │
│            │    └──────────┘  └──────────┘  └──────────┘   │
│            │                                                │
│            │    ┌─────────────────────────────────────┐     │
│            │    │                                     │     │
│            │    │         Data Table / Chart          │     │
│            │    │                                     │     │
│            │    └─────────────────────────────────────┘     │
│            │                                                │
└────────────┴────────────────────────────────────────────────┘
```

### 4.4 Border Radius

```css
:root {
  --radius-none: 0;
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-full: 9999px;
}
```

### 4.5 Shadows

```css
:root {
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}
```

---

## 5. Component Library

### 5.1 Buttons

```jsx
// Primary Button
<Button variant="contained" color="primary">
  Start Charging
</Button>

// Secondary Button
<Button variant="outlined" color="primary">
  Cancel
</Button>

// Text Button
<Button variant="text" color="primary">
  Learn More
</Button>

// Icon Button
<IconButton color="primary">
  <RefreshIcon />
</IconButton>
```

**Button Sizes:**
- Small: 32px height, 12px padding
- Medium: 40px height, 16px padding (default)
- Large: 48px height, 20px padding

**Button States:**
- Default
- Hover: Darker shade
- Active: Even darker
- Disabled: 50% opacity
- Loading: Spinner icon

### 5.2 Cards

```jsx
// Standard Card
<Card>
  <CardHeader title="Station Status" />
  <CardContent>
    {/* Content */}
  </CardContent>
  <CardActions>
    <Button>View Details</Button>
  </CardActions>
</Card>

// KPI Card
<Card className="kpi-card">
  <div className="kpi-icon">
    <BoltIcon />
  </div>
  <div className="kpi-content">
    <Typography variant="h4">1,250</Typography>
    <Typography variant="body2" color="textSecondary">
      Sessions Today
    </Typography>
  </div>
  <div className="kpi-trend positive">
    <TrendUpIcon /> +12%
  </div>
</Card>
```

### 5.3 Data Tables

```jsx
<DataTable
  columns={[
    { field: 'id', header: 'ID', width: 100 },
    { field: 'name', header: 'Station Name', sortable: true },
    { field: 'status', header: 'Status', render: StatusBadge },
    { field: 'actions', header: '', render: ActionButtons }
  ]}
  data={stations}
  pagination
  searchable
  selectable
/>
```

**Table Features:**
- Sortable columns
- Search/filter
- Pagination
- Row selection
- Column resizing
- Export options

### 5.4 Forms

```jsx
// Text Input
<TextField
  label="Station Name"
  placeholder="Enter station name"
  helperText="Unique identifier for the station"
  required
/>

// Select
<Select
  label="Connector Type"
  options={connectorTypes}
  value={selectedType}
  onChange={handleChange}
/>

// Date Picker
<DatePicker
  label="Start Date"
  value={startDate}
  onChange={setStartDate}
/>

// Switch
<Switch
  label="Enable Station"
  checked={isEnabled}
  onChange={handleToggle}
/>
```

### 5.5 Status Badges

```jsx
<Badge status="available" /> // Green
<Badge status="charging" />  // Blue
<Badge status="offline" />   // Gray
<Badge status="faulted" />   // Red
<Badge status="reserved" />  // Orange
```

```css
.badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.badge-available { background: #e8f5e9; color: #2e7d32; }
.badge-charging { background: #e3f2fd; color: #1565c0; }
.badge-offline { background: #fafafa; color: #616161; }
.badge-faulted { background: #ffebee; color: #c62828; }
.badge-reserved { background: #fff3e0; color: #e65100; }
```

### 5.6 Modals

```jsx
<Modal
  open={isOpen}
  onClose={handleClose}
  title="Create New Station"
  size="md" // sm, md, lg, xl, full
>
  <ModalContent>
    <Form>
      {/* Form fields */}
    </Form>
  </ModalContent>
  <ModalActions>
    <Button variant="text" onClick={handleClose}>Cancel</Button>
    <Button variant="contained" onClick={handleSubmit}>Create</Button>
  </ModalActions>
</Modal>
```

### 5.7 Alerts & Notifications

```jsx
// Alert
<Alert severity="success">Station created successfully!</Alert>
<Alert severity="error">Failed to connect to station</Alert>
<Alert severity="warning">Low wallet balance</Alert>
<Alert severity="info">New update available</Alert>

// Toast Notification
toast.success('Session started');
toast.error('Connection failed');
```

### 5.8 Loading States

```jsx
// Full page loader
<PageLoader />

// Skeleton
<Skeleton variant="text" width={200} />
<Skeleton variant="rectangular" height={200} />
<Skeleton variant="circular" width={40} height={40} />

// Button loading
<Button loading>Processing...</Button>

// Table loading
<Table loading rows={5} />
```

---

## 6. Iconography

### 6.1 Icon Library
Using Material Design Icons (MUI Icons) for consistency.

### 6.2 Icon Categories

**Navigation:**
- Dashboard: `DashboardIcon`
- Stations: `EvStationIcon`
- Locations: `LocationOnIcon`
- Sessions: `BoltIcon`
- Users: `PeopleIcon`
- Reports: `AssessmentIcon`
- Settings: `SettingsIcon`

**Actions:**
- Add: `AddIcon`
- Edit: `EditIcon`
- Delete: `DeleteIcon`
- Search: `SearchIcon`
- Filter: `FilterListIcon`
- Export: `DownloadIcon`
- Refresh: `RefreshIcon`

**Status:**
- Online: `CheckCircleIcon`
- Offline: `HighlightOffIcon`
- Warning: `WarningIcon`
- Error: `ErrorIcon`
- Charging: `BoltIcon`

### 6.3 Icon Sizes

```css
.icon-sm { font-size: 16px; }
.icon-md { font-size: 24px; }  /* Default */
.icon-lg { font-size: 32px; }
.icon-xl { font-size: 48px; }
```

---

## 7. Responsive Design

### 7.1 Breakpoints

| Breakpoint | Width | Usage |
|------------|-------|-------|
| xs | 0-599px | Mobile phones |
| sm | 600-899px | Tablets portrait |
| md | 900-1199px | Tablets landscape, small laptops |
| lg | 1200-1535px | Desktops |
| xl | 1536px+ | Large screens |

### 7.2 Responsive Patterns

**Mobile (xs):**
- Sidebar hidden, hamburger menu
- Single column layout
- Stacked KPI cards
- Simplified table (cards on mobile)
- Bottom navigation for key actions

**Tablet (sm-md):**
- Collapsible sidebar (icons only)
- Two-column KPI cards
- Full table with horizontal scroll

**Desktop (lg-xl):**
- Full sidebar
- Multi-column layouts
- Complete feature set

### 7.3 Mobile-First CSS

```css
/* Mobile first */
.kpi-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

/* Tablet */
@media (min-width: 600px) {
  .kpi-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Desktop */
@media (min-width: 1200px) {
  .kpi-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}
```

---

## 8. Navigation Structure

### 8.1 Sidebar Navigation

```
Dashboard
│
├── Infrastructure
│   ├── Locations
│   ├── Stations
│   └── Connectors
│
├── Operations
│   ├── Active Sessions
│   ├── Session History
│   └── Reservations
│
├── Users
│   ├── EV Drivers
│   ├── Admin Users
│   └── RFID Cards
│
├── Finance
│   ├── Transactions
│   ├── Tariffs
│   └── Settlements (Super Admin)
│
├── Support
│   ├── Disputes
│   ├── Reviews
│   └── Coupons
│
├── Reports
│   ├── Sessions
│   ├── Revenue
│   └── Utilization
│
├── System (Super Admin)
│   ├── Partners
│   ├── Audit Logs
│   └── OCPP Logs
│
└── Settings
```

### 8.2 Breadcrumbs

```jsx
<Breadcrumbs>
  <Link to="/">Dashboard</Link>
  <Link to="/stations">Stations</Link>
  <Typography>Station Details</Typography>
</Breadcrumbs>
```

### 8.3 Page Header

```jsx
<PageHeader
  title="Charging Stations"
  subtitle="Manage all charging stations"
  breadcrumbs={[
    { label: 'Dashboard', path: '/' },
    { label: 'Stations' }
  ]}
  actions={
    <>
      <Button startIcon={<AddIcon />}>Add Station</Button>
      <Button startIcon={<ExportIcon />}>Export</Button>
    </>
  }
/>
```

---

## 9. Data Visualization

### 9.1 Chart Library
Using ApexCharts for React.

### 9.2 Chart Types

**Line Chart (Revenue Trend):**
```jsx
<LineChart
  data={revenueData}
  xAxis="date"
  yAxis="amount"
  color={theme.primary}
/>
```

**Bar Chart (Sessions by Day):**
```jsx
<BarChart
  data={sessionData}
  xAxis="day"
  yAxis="count"
  color={theme.secondary}
/>
```

**Pie/Donut Chart (Connector Status):**
```jsx
<DonutChart
  data={statusData}
  colors={statusColors}
  showLegend
/>
```

**Area Chart (Energy Consumption):**
```jsx
<AreaChart
  data={energyData}
  xAxis="time"
  yAxis="kwh"
  gradient
/>
```

### 9.3 Chart Colors

```javascript
const chartColors = {
  primary: '#4caf50',
  secondary: '#2196f3',
  tertiary: '#ff9800',
  series: [
    '#4caf50', '#2196f3', '#ff9800',
    '#9c27b0', '#00bcd4', '#ff5722'
  ]
};
```

### 9.4 Map Components

```jsx
<LocationMap
  center={[20.5937, 78.9629]} // India
  zoom={5}
  locations={locations}
  onMarkerClick={handleMarkerClick}
  showClusters
/>

<StationMarker
  position={[19.1234, 72.8567]}
  station={station}
  status={station.status}
/>
```

---

## 10. Accessibility

### 10.1 WCAG 2.1 Compliance

**Level AA Requirements:**
- Color contrast ratio: 4.5:1 for normal text, 3:1 for large text
- Focus indicators visible
- Keyboard navigable
- Screen reader compatible
- No content depends solely on color

### 10.2 Focus States

```css
:focus-visible {
  outline: 2px solid var(--primary-500);
  outline-offset: 2px;
}

/* Skip to main content link */
.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  background: var(--primary-500);
  color: white;
  padding: 8px;
  z-index: 100;
}

.skip-link:focus {
  top: 0;
}
```

### 10.3 ARIA Labels

```jsx
<Button aria-label="Add new station">
  <AddIcon />
</Button>

<Table aria-label="Charging stations list">
  {/* ... */}
</Table>

<IconButton
  aria-label="Delete station"
  aria-describedby="delete-warning"
>
  <DeleteIcon />
</IconButton>
```

### 10.4 Color Contrast

| Element | Foreground | Background | Ratio |
|---------|------------|------------|-------|
| Body text | #212121 | #ffffff | 16:1 |
| Secondary text | #757575 | #ffffff | 4.6:1 |
| Primary button | #ffffff | #4caf50 | 4.5:1 |
| Error text | #d32f2f | #ffffff | 5.9:1 |
| Success badge | #2e7d32 | #e8f5e9 | 4.6:1 |

---

## MUI Theme Configuration

```javascript
// src/theme/index.js
import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#4caf50',
      light: '#81c784',
      dark: '#388e3c',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#2196f3',
      light: '#64b5f6',
      dark: '#1976d2',
      contrastText: '#ffffff',
    },
    success: {
      main: '#4caf50',
    },
    warning: {
      main: '#ff9800',
    },
    error: {
      main: '#f44336',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    h1: { fontSize: '2rem', fontWeight: 700 },
    h2: { fontSize: '1.5rem', fontWeight: 600 },
    h3: { fontSize: '1.25rem', fontWeight: 600 },
    h4: { fontSize: '1.125rem', fontWeight: 600 },
    h5: { fontSize: '1rem', fontWeight: 600 },
    h6: { fontSize: '0.875rem', fontWeight: 600 },
    button: {
      textTransform: 'none',
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '8px 16px',
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
        size: 'small',
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 600,
          backgroundColor: '#f5f5f5',
        },
      },
    },
  },
});

export default theme;
```

---

*End of Design System Document*
