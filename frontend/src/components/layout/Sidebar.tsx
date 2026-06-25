import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
} from '@mui/material';
import {
  DashboardOutlined,
  BatteryChargingFullOutlined,
  BusinessOutlined,
  BusinessCenterOutlined,
  AccountBalanceOutlined,
  LocationOnOutlined,
  GroupsOutlined,
  PersonOutlineOutlined,
  ReceiptLongOutlined,
  CalendarMonthOutlined,
  EventSeatOutlined,
  CreditCardOutlined,
  StarOutlineOutlined,
  LocalOfferOutlined,
  AssessmentOutlined,
  GavelOutlined,
  SubscriptionsOutlined,
  GroupWorkOutlined,
  VolunteerActivismOutlined,
  SupportAgentOutlined,
  DescriptionOutlined,
  TokenOutlined,
  EvStationOutlined,
  TimerOffOutlined,
  MapOutlined,
  BoltOutlined,
  EventNoteOutlined,
  StorageOutlined,
  TuneOutlined,
  HubOutlined,
  SettingsRemoteOutlined,
  MenuBookOutlined,
  TerminalOutlined,
  QrCode2Outlined,
  AdminPanelSettingsOutlined,
  StoreOutlined,
  SettingsOutlined,
  PhonelinkSetupOutlined,
  LockOutlined,
  LinkOutlined,
  PaidOutlined,
  CircleOutlined,
} from '@mui/icons-material';
import { RootState } from '../../store';
import { MenuSection } from '../../features/menu/menuSlice';
import BrandLogo from '../common/BrandLogo';

interface SidebarProps {
  onClose?: () => void;
}

// Path -> icon registry. The API returns menu items by path; we render the icon.
const ICONS: Record<string, React.ReactElement> = {
  '/dashboard': <DashboardOutlined />,
  '/live-sessions': <BatteryChargingFullOutlined />,
  '/business': <BusinessOutlined />,
  '/partners': <BusinessCenterOutlined />,
  '/settlements': <AccountBalanceOutlined />,
  '/locations': <LocationOnOutlined />,
  '/users': <GroupsOutlined />,
  '/drivers': <PersonOutlineOutlined />,
  '/transactions': <ReceiptLongOutlined />,
  '/schedules': <CalendarMonthOutlined />,
  '/reservations': <EventSeatOutlined />,
  '/cards': <CreditCardOutlined />,
  '/reviews': <StarOutlineOutlined />,
  '/coupons': <LocalOfferOutlined />,
  '/reports': <AssessmentOutlined />,
  '/disputes': <GavelOutlined />,
  '/stations': <EvStationOutlined />,
  '/sessions': <BoltOutlined />,
  '/tariffs': <PaidOutlined />,
  '/server-logs': <TerminalOutlined />,
  '/qr-generator': <QrCode2Outlined />,
  '/subscriptions': <SubscriptionsOutlined />,
  '/member-groups': <GroupWorkOutlined />,
  '/courtesy-sessions': <VolunteerActivismOutlined />,
  '/agents': <SupportAgentOutlined />,
  '/cdr': <DescriptionOutlined />,
  '/emsp-tokens': <TokenOutlined />,
  '/downtime': <TimerOffOutlined />,
  '/maps': <MapOutlined />,
  '/smart-scheduling': <EventNoteOutlined />,
  '/static-data': <StorageOutlined />,
  '/configurations': <TuneOutlined />,
  '/connections': <HubOutlined />,
  '/bulk-remote': <SettingsRemoteOutlined />,
  '/instructions': <MenuBookOutlined />,
  '/access-control': <AdminPanelSettingsOutlined />,
  '/admin/business-config': <StoreOutlined />,
  '/admin/platform-config': <SettingsOutlined />,
  '/admin/app-control': <PhonelinkSetupOutlined />,
  '/admin/paywall-control': <LockOutlined />,
  '/admin/products-link': <LinkOutlined />,
};

// Fallback admin menu (used before the API responds / if it fails).
const DEFAULT_SECTIONS: MenuSection[] = [
  { heading: '', items: [{ title: 'Dashboard', path: '/dashboard' }] },
  {
    heading: 'MANAGE',
    items: [
      { title: 'Partners', path: '/partners' },
      { title: 'Locations', path: '/locations' },
      { title: 'Users', path: '/users' },
    ],
  },
  {
    heading: 'NETWORK',
    items: [
      { title: 'EV Drivers', path: '/drivers' },
      { title: 'Transactions', path: '/transactions' },
      { title: 'Schedules', path: '/schedules' },
      { title: 'Reservations', path: '/reservations' },
      { title: 'Charge Cards', path: '/cards' },
      { title: 'Reviews', path: '/reviews' },
      { title: 'Coupons', path: '/coupons' },
      { title: 'Reports', path: '/reports' },
      { title: 'Disputes', path: '/disputes' },
    ],
  },
  {
    heading: 'CHARGE',
    items: [
      { title: 'Charging Stations', path: '/stations' },
      { title: 'Sessions', path: '/sessions' },
      { title: 'Tariffs', path: '/tariffs' },
    ],
  },
  {
    heading: 'TOOLS & UTILITIES',
    items: [
      { title: 'Server Logs', path: '/server-logs' },
      { title: 'QR Generator', path: '/qr-generator' },
    ],
  },
];

const Sidebar: React.FC<SidebarProps> = ({ onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { sections } = useSelector((s: RootState) => (s as any).menu);

  const menuSections: MenuSection[] = sections && sections.length ? sections : DEFAULT_SECTIONS;

  const handleNavigate = (path: string) => {
    navigate(path);
    if (onClose) onClose();
  };

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#0b261a' }}>
      {/* Brand — DJT HAIKA lockup */}
      <Box sx={{ px: 2, py: 2.25, display: 'flex', alignItems: 'center' }}>
        <BrandLogo height={30} color="#e8f3ec" />
      </Box>
      <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />

      {/* Sections (login-based, served by /web/menu) */}
      <Box sx={{ flex: 1, overflowY: 'auto', py: 1 }}>
        {menuSections.map((section, si) => (
          <Box key={section.heading || `s-${si}`} sx={{ mb: 1 }}>
            {section.heading ? (
              <Typography
                sx={{
                  px: 2.5,
                  pt: 1.5,
                  pb: 0.5,
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: 0.8,
                  color: '#9aa5b1',
                }}
              >
                {section.heading}
              </Typography>
            ) : (
              <Box sx={{ pt: 0.5 }} />
            )}
            <List disablePadding>
              {section.items.map((item) => {
                const active = isActive(item.path);
                return (
                  <ListItem key={item.path} disablePadding sx={{ px: 1.5 }}>
                    <ListItemButton
                      onClick={() => handleNavigate(item.path)}
                      sx={{
                        borderRadius: 1.5,
                        my: 0.25,
                        color: active ? '#34d399' : '#b8c7bd',
                        bgcolor: active ? 'rgba(52,211,153,0.15)' : 'transparent',
                        '& .MuiListItemIcon-root': { color: active ? '#34d399' : '#7f988a' },
                        '&:hover': { bgcolor: active ? 'rgba(52,211,153,0.18)' : 'rgba(255,255,255,0.06)' },
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 38 }}>
                        {ICONS[item.path] || <CircleOutlined sx={{ fontSize: 18 }} />}
                      </ListItemIcon>
                      <ListItemText
                        primary={item.title}
                        primaryTypographyProps={{ fontSize: 14, fontWeight: active ? 600 : 500 }}
                      />
                    </ListItemButton>
                  </ListItem>
                );
              })}
            </List>
          </Box>
        ))}
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="caption" sx={{ color: 'rgba(232,243,236,0.45)' }}>
          v1.0.0 | OCPP 1.6J
        </Typography>
      </Box>
    </Box>
  );
};

export default Sidebar;
