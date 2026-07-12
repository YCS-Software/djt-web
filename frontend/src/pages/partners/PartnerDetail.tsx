import React from 'react';
import DetailView from '../../components/common/DetailView';
import { partnersApi } from '../../services/api';
import { formatDateTime } from '../../utils/date';

const PartnerDetail: React.FC = () => (
  <DetailView
    title="Partner Detail"
    subtitle="Partner organization profile and footprint"
    fetcher={partnersApi.getById}
    sections={[
      {
        heading: 'Organization',
        fields: [
          { key: 'name', label: 'Name' },
          { key: 'email', label: 'Email' },
          { key: 'phone', label: 'Phone' },
          { key: 'role', label: 'Role' },
          { key: 'stations', label: 'Charging Stations' },
          { key: 'status', label: 'Status', status: true },
          { key: 'createdAt', label: 'Created At', format: formatDateTime },
        ],
      },
    ]}
  />
);

export default PartnerDetail;
