import React from 'react';
import SettingsForm, { SettingsSection } from '../../components/common/SettingsForm';
import { settingsApi } from '../../services/api';

const sections: SettingsSection[] = [
  {
    heading: 'Mobile App',
    fields: [
      { name: 'androidVersion', label: 'Latest Android Version' },
      { name: 'iosVersion', label: 'Latest iOS Version' },
      { name: 'forceUpdate', label: 'Force Update', type: 'switch' },
      { name: 'maintenanceMode', label: 'Maintenance Mode', type: 'switch' },
    ],
  },
  {
    heading: 'Feature Flags',
    fields: [
      { name: 'enableReservations', label: 'Enable Reservations', type: 'switch' },
      { name: 'enableRoaming', label: 'Enable Roaming', type: 'switch' },
      { name: 'enableReferrals', label: 'Enable Referrals', type: 'switch' },
      { name: 'announcement', label: 'In-app Announcement', type: 'textarea' },
    ],
  },
];

const AppControl: React.FC = () => (
  <SettingsForm
    title="App Control"
    subtitle="Mobile app versions and feature flags"
    sections={sections}
    loader={() => settingsApi.get('app')}
    saver={(v) => settingsApi.save('app', v)}
  />
);

export default AppControl;
