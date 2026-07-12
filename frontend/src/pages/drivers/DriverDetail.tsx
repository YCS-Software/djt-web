import React from 'react';
import DetailView from '../../components/common/DetailView';
import { driversApi } from '../../services/api';
import { formatDateTime } from '../../utils/date';

const DriverDetail: React.FC = () => (
  <DetailView
    title="Driver Detail"
    subtitle="EV driver profile and wallet"
    fetcher={driversApi.getById}
    sections={[
      {
        heading: 'Profile',
        fields: [
          { key: 'name', label: 'Name' },
          { key: 'email', label: 'Email' },
          { key: 'phone', label: 'Phone' },
          {
            key: 'walletBalance',
            label: 'Wallet Balance',
            format: (v) => (v == null || v === '' ? '—' : `₹ ${v}`),
          },
          { key: 'status', label: 'Status', status: true },
          { key: 'createdAt', label: 'Created At', format: formatDateTime },
        ],
      },
    ]}
  />
);

export default DriverDetail;
