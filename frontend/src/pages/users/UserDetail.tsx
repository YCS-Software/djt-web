import React from 'react';
import DetailView from '../../components/common/DetailView';
import { usersApi } from '../../services/api';

const UserDetail: React.FC = () => (
  <DetailView
    title="User Detail"
    subtitle="Back-office administrator / partner user profile"
    fetcher={usersApi.getById}
    sections={[
      {
        heading: 'Profile',
        fields: [
          { key: 'name', label: 'Name' },
          { key: 'email', label: 'Email' },
          { key: 'phone', label: 'Phone' },
          { key: 'role', label: 'Role' },
          { key: 'status', label: 'Status', status: true },
          { key: 'createdAt', label: 'Created At' },
        ],
      },
    ]}
  />
);

export default UserDetail;
