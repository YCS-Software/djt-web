import React from 'react';
import SettingsForm, { SettingsSection } from '../../components/common/SettingsForm';
import { settingsApi } from '../../services/api';

const sections: SettingsSection[] = [
  {
    heading: 'OCPP / Charging',
    fields: [
      { name: 'ocppVersion', label: 'OCPP Version', type: 'select', options: [
        { value: '1.6J', label: 'OCPP 1.6J' },
        { value: '2.0.1', label: 'OCPP 2.0.1' },
      ] },
      { name: 'heartbeatInterval', label: 'Heartbeat Interval (s)', type: 'number' },
      { name: 'sessionTimeout', label: 'Session Timeout (min)', type: 'number' },
      { name: 'maxPower', label: 'Max Power per Connector (kW)', type: 'number' },
    ],
  },
  {
    heading: 'Wallet & Payments',
    fields: [
      { name: 'minTopup', label: 'Minimum Wallet Top-up', type: 'number' },
      { name: 'razorpayEnabled', label: 'Enable Razorpay', type: 'switch' },
      { name: 'autoRefund', label: 'Auto-refund Failed Sessions', type: 'switch' },
    ],
  },
];

const PlatformConfiguration: React.FC = () => (
  <SettingsForm
    title="Platform Configuration"
    subtitle="Charging protocol, wallet and payment settings"
    sections={sections}
    loader={() => settingsApi.get('platform')}
    saver={(v) => settingsApi.save('platform', v)}
  />
);

export default PlatformConfiguration;
