import React from 'react';
import SettingsForm from '../components/common/SettingsForm';
import { settingsApi } from '../services/api';

const SCOPE = 'general';

const Settings: React.FC = () => (
  <SettingsForm
    title="Settings"
    subtitle="System configuration and preferences"
    loader={() => settingsApi.get(SCOPE)}
    saver={(values) => settingsApi.save(SCOPE, values)}
    sections={[
      {
        heading: 'General',
        fields: [
          { name: 'platformName', label: 'Platform Name' },
          { name: 'supportEmail', label: 'Support Email' },
          { name: 'supportPhone', label: 'Support Phone' },
          {
            name: 'currency',
            label: 'Currency',
            type: 'select',
            options: [
              { value: 'INR', label: 'INR (₹)' },
              { value: 'USD', label: 'USD ($)' },
              { value: 'EUR', label: 'EUR (€)' },
            ],
          },
        ],
      },
      {
        heading: 'Charging',
        fields: [
          { name: 'defaultPricePerKwh', label: 'Default Price / kWh', type: 'number' },
          { name: 'idleFeePerMin', label: 'Idle Fee / min', type: 'number' },
          { name: 'sessionTimeoutMins', label: 'Session Timeout (min)', type: 'number' },
        ],
      },
      {
        heading: 'Notifications',
        fields: [
          { name: 'emailNotifications', label: 'Email Notifications', type: 'switch' },
          { name: 'smsNotifications', label: 'SMS Notifications', type: 'switch' },
        ],
      },
    ]}
  />
);

export default Settings;
