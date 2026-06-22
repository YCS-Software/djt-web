import React from 'react';
import { Chip, ChipProps } from '@mui/material';

interface StatusChipProps {
  status: string;
  size?: 'small' | 'medium';
}

const statusColors: Record<string, ChipProps['color']> = {
  // Session statuses
  active: 'success',
  completed: 'primary',
  failed: 'error',
  expired: 'warning',

  // Station/Connector statuses
  Available: 'success',
  Occupied: 'warning',
  Charging: 'info',
  Faulted: 'error',
  Unavailable: 'default',
  Reserved: 'secondary',
  Preparing: 'info',
  Finishing: 'info',

  // General statuses
  online: 'success',
  offline: 'error',
  pending: 'warning',
  approved: 'success',
  rejected: 'error',
  blocked: 'error',
  cancelled: 'default',

  // User/Driver statuses
  verified: 'success',
  unverified: 'warning',

  // Dispute statuses
  open: 'warning',
  'in-progress': 'info',
  resolved: 'success',
  closed: 'default',

  // Payment statuses
  paid: 'success',
  unpaid: 'error',
  refunded: 'info',
};

const StatusChip: React.FC<StatusChipProps> = ({ status, size = 'small' }) => {
  const color = statusColors[status] || statusColors[status.toLowerCase()] || 'default';
  const label = status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ');

  return <Chip label={label} color={color} size={size} />;
};

export default StatusChip;
