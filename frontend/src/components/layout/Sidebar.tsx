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
  Collapse,
  Divider,
} from '@mui/material';
import {
  Dashboard,
  People,
  Business,
  LocationOn,
  EvStation,
  ElectricalServices,
  DirectionsCar,
  PlayCircle,
  AttachMoney,
  EventSeat,
  CreditCard,
  SupportAgent,
  LocalOffer,
  Star,
  Assessment,
  History,
  Settings,
  ExpandLess,
  ExpandMore,
} from '@mui/icons-material';
import { RootState } from '../../store';

interface SidebarProps {
  onClose?: () => void;
}

interface MenuItem {
  title: string;
  path: string;
  icon: React.ReactElement;
  children?: MenuItem[];
  permission?: string;
}

const menuItems: MenuItem[] = [
  { title: 'Dashboard', path: '/dashboard', icon: <Dashboard /> },
  { title: 'Users', path: '/users', icon: <People />, permission: 'manage:users' },
  { title: 'Partners', path: '/partners', icon: <Business />, permission: 'manage:partners' },
  { title: 'Locations', path: '/locations', icon: <LocationOn /> },
  { title: 'Stations', path: '/stations', icon: <EvStation /> },
  { title: 'Connectors', path: '/connectors', icon: <ElectricalServices /> },
  { title: 'Drivers', path: '/drivers', icon: <DirectionsCar /> },
  { title: 'Sessions', path: '/sessions', icon: <PlayCircle /> },
  { title: 'Tariffs', path: '/tariffs', icon: <AttachMoney /> },
  { title: 'Reservations', path: '/reservations', icon: <EventSeat /> },
  { title: 'RFID Cards', path: '/cards', icon: <CreditCard /> },
  { title: 'Disputes', path: '/disputes', icon: <SupportAgent /> },
  { title: 'Coupons', path: '/coupons', icon: <LocalOffer /> },
  { title: 'Reviews', path: '/reviews', icon: <Star /> },
  { title: 'Reports', path: '/reports', icon: <Assessment /> },
  {
    title: 'Logs',
    path: '/logs',
    icon: <History />,
    children: [
      { title: 'Audit Logs', path: '/logs/audit', icon: <History /> },
      { title: 'OCPP Logs', path: '/logs/ocpp', icon: <History /> },
    ],
  },
  { title: 'Settings', path: '/settings', icon: <Settings /> },
];

const Sidebar: React.FC<SidebarProps> = ({ onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((state: RootState) => state.auth);
  const [openMenus, setOpenMenus] = React.useState<string[]>([]);

  const handleNavigate = (path: string) => {
    navigate(path);
    if (onClose) onClose();
  };

  const toggleSubmenu = (path: string) => {
    setOpenMenus((prev) =>
      prev.includes(path) ? prev.filter((p) => p !== path) : [...prev, path]
    );
  };

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const hasPermission = (permission?: string) => {
    if (!permission) return true;
    if (user?.role === 'super_admin') return true;
    return user?.permissions?.includes(permission);
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Logo */}
      <Box
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <EvStation sx={{ fontSize: 32, color: 'primary.main' }} />
        <Box>
          <Typography variant="h6" fontWeight="bold" color="primary">
            EV Charge
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Admin Panel
          </Typography>
        </Box>
      </Box>

      <Divider />

      {/* Menu Items */}
      <List sx={{ flex: 1, pt: 1 }}>
        {menuItems.map((item) => {
          if (!hasPermission(item.permission)) return null;

          if (item.children) {
            const isOpen = openMenus.includes(item.path);
            return (
              <React.Fragment key={item.path}>
                <ListItem disablePadding>
                  <ListItemButton onClick={() => toggleSubmenu(item.path)}>
                    <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
                    <ListItemText primary={item.title} />
                    {isOpen ? <ExpandLess /> : <ExpandMore />}
                  </ListItemButton>
                </ListItem>
                <Collapse in={isOpen} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding>
                    {item.children.map((child) => (
                      <ListItem key={child.path} disablePadding>
                        <ListItemButton
                          sx={{ pl: 4 }}
                          selected={isActive(child.path)}
                          onClick={() => handleNavigate(child.path)}
                        >
                          <ListItemIcon sx={{ minWidth: 40 }}>
                            {child.icon}
                          </ListItemIcon>
                          <ListItemText primary={child.title} />
                        </ListItemButton>
                      </ListItem>
                    ))}
                  </List>
                </Collapse>
              </React.Fragment>
            );
          }

          return (
            <ListItem key={item.path} disablePadding>
              <ListItemButton
                selected={isActive(item.path)}
                onClick={() => handleNavigate(item.path)}
                sx={{
                  '&.Mui-selected': {
                    bgcolor: 'primary.light',
                    color: 'primary.contrastText',
                    '& .MuiListItemIcon-root': {
                      color: 'primary.contrastText',
                    },
                    '&:hover': {
                      bgcolor: 'primary.main',
                    },
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
                <ListItemText primary={item.title} />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      {/* Footer */}
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
