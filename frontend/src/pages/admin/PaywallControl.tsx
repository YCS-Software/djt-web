import React from 'react';
import SettingsForm, { SettingsSection } from '../../components/common/SettingsForm';
import { settingsApi } from '../../services/api';

const sections: SettingsSection[] = [
  {
    heading: 'Paywall',
    fields: [
      { name: 'paywallEnabled', label: 'Enable Paywall', type: 'switch' },
      { name: 'freeSessionsPerMonth', label: 'Free Sessions / Month', type: 'number' },
      { name: 'trialDays', label: 'Trial Period (days)', type: 'number' },
      { name: 'gatingMode', label: 'Gating Mode', type: 'select', options: [
        { value: 'soft', label: 'Soft (prompt)' },
        { value: 'hard', label: 'Hard (block)' },
      ] },
    ],
  },
  {
    heading: 'Subscription Gating',
    fields: [
      { name: 'requireSubForFastCharge', label: 'Require Subscription for Fast Charging', type: 'switch' },
      { name: 'requireSubForReservation', label: 'Require Subscription for Reservations', type: 'switch' },
      { name: 'upgradeMessage', label: 'Upgrade Prompt Message', type: 'textarea' },
    ],
  },
];

const PaywallControl: React.FC = () => (
  <SettingsForm
    title="Paywall Control"
    subtitle="Subscription gating and paywall rules"
    sections={sections}
    loader={() => settingsApi.get('paywall')}
    saver={(v) => settingsApi.save('paywall', v)}
  />
);

export default PaywallControl;
