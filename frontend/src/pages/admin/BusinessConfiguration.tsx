import React from 'react';
import SettingsForm, { SettingsSection } from '../../components/common/SettingsForm';
import { settingsApi } from '../../services/api';

const sections: SettingsSection[] = [
  {
    heading: 'Organisation',
    fields: [
      { name: 'legalName', label: 'Legal Business Name' },
      { name: 'supportEmail', label: 'Support Email' },
      { name: 'supportPhone', label: 'Support Phone' },
      { name: 'currency', label: 'Default Currency', type: 'select', options: [
        { value: 'INR', label: 'INR (₹)' },
        { value: 'USD', label: 'USD ($)' },
        { value: 'EUR', label: 'EUR (€)' },
      ] },
    ],
  },
  {
    heading: 'Billing & Tax',
    fields: [
      { name: 'gstNumber', label: 'GST Number' },
      { name: 'taxRate', label: 'Default Tax Rate (%)', type: 'number' },
      { name: 'defaultCommission', label: 'Default Commission (%)', type: 'number' },
      { name: 'invoicePrefix', label: 'Invoice Prefix' },
    ],
  },
];

const BusinessConfiguration: React.FC = () => (
  <SettingsForm
    title="Business Configuration"
    subtitle="Organisation, billing and tax settings"
    sections={sections}
    loader={() => settingsApi.get('business')}
    saver={(v) => settingsApi.save('business', v)}
  />
);

export default BusinessConfiguration;
