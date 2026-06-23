import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  BusinessCenterOutlined,
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
  EvStationOutlined,
} from '@mui/icons-material';

interface SidebarProps {
  onClose?: () => void;
}

interface MenuItem {
  title: string;
  path: string;
  icon: React.ReactElement;
}

interface MenuSection {
  heading: string;
  items: MenuItem[];
}

const GREEN = '#3a7d44';

const sections: MenuSection[] = [
  {
    heading: 'LIVE ANALYTICS',
    items: [{ title: 'Dashboard', path: '/dashboard', icon: <DashboardOutlined /> }],
  },
  {
    heading: 'MANAGE',
    items: [
      { title: 'Partners', path: '/partners', icon: <BusinessCenterOutlined /> },
      { title: 'Locations', path: '/locations', icon: <LocationOnOutlined /> },
      { title: 'Users', path: '/users', icon: <GroupsOutlined /> },
    ],
  },
  {
    heading: 'NETWORK',
    items: [
      { title: 'EV Drivers', path: '/drivers', icon: <PersonOutlineOutlined /> },
      { title: 'Transactions', path: '/transactions', icon: <ReceiptLongOutlined /> },
      { title: 'Schedules', path: '/schedules', icon: <CalendarMonthOutlined /> },
      { title: 'Reservations', path: '/reservations', icon: <EventSeatOutlined /> },
      { title: 'Charge Cards', path: '/cards', icon: <CreditCardOutlined /> },
      { title: 'Reviews', path: '/reviews', icon: <StarOutlineOutlined /> },
      { title: 'Coupons', path: '/coupons', icon: <LocalOfferOutlined /> },
      { title: 'Reports', path: '/reports', icon: <AssessmentOutlined /> },
      { title: 'Disputes', path: '/disputes', icon: <GavelOutlined /> },
    ],
  },
  {
    heading: 'CHARGE',
    items: [{ title: 'Charging Stations', path: '/stations', icon: <EvStationOutlined /> }],
  },
];

const Sidebar: React.FC<SidebarProps> = ({ onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigate = (path: string) => {
    navigate(path);
    if (onClose) onClose();
  };

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#fff' }}>
      {/* Brand */}
      <Box sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 1.25 }}>
        <Box
          sx={{
            width: 38,
            height: 38,
            borderRadius: 1.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #2e7d32 0%, #66bb6a 100%)',
          }}
        >
          <EvStationOutlined sx={{ color: '#fff', fontSize: 22 }} />
        </Box>
        <Typography variant="h6" fontWeight={800} sx={{ color: GREEN, letterSpacing: 0.5 }}>
          DJT EV
        </Typography>
      </Box>
      <Divider />

      {/* Sections */}
      <Box sx={{ flex: 1, overflowY: 'auto', py: 1 }}>
        {sections.map((section) => (
          <Box key={section.heading} sx={{ mb: 1 }}>
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
                        color: active ? '#fff' : '#4a5568',
                        bgcolor: active ? GREEN : 'transparent',
                        '& .MuiListItemIcon-root': { color: active ? '#fff' : '#7a8694' },
                        '&:hover': {
                          bgcolor: active ? GREEN : 'rgba(58,125,68,0.08)',
                        },
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 38 }}>{item.icon}</ListItemIcon>
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

      <Divider />
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="caption" color="text.secondary">
          v1.0.0 | OCPP 1.6J
        </Typography>
      </Box>
    </Box>
  );
};

export default Sidebar;
