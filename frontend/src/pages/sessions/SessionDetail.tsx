import React from 'react';
import DetailView from '../../components/common/DetailView';
import { sessionsApi } from '../../services/api';
import { formatDateTime } from '../../utils/date';

const SessionDetail: React.FC = () => (
  <DetailView
    title="Session Detail"
    subtitle="Charging session, energy and billing"
    fetcher={sessionsApi.getById}
    sections={[
      {
        heading: 'Session',
        fields: [
          { key: 'sessionCode', label: 'Session Code' },
          { key: 'transactionId', label: 'Transaction ID' },
          { key: 'stationName', label: 'Station' },
          { key: 'member', label: 'Member' },
          { key: 'status', label: 'Status', status: true },
          { key: 'paymentStatus', label: 'Payment Status', status: true },
        ],
      },
      {
        heading: 'Energy & Billing',
        fields: [
          {
            key: 'energy',
            label: 'Energy',
            format: (v) => (v == null || v === '' ? '—' : `${v} kWh`),
          },
          {
            key: 'pricePerKwh',
            label: 'Price / kWh',
            format: (v) => (v == null || v === '' ? '—' : `₹ ${v}`),
          },
          {
            key: 'cost',
            label: 'Cost',
            format: (v) => (v == null || v === '' ? '—' : `₹ ${v}`),
          },
          {
            key: 'durationMins',
            label: 'Duration',
            format: (v) => (v == null || v === '' ? '—' : `${v} min`),
          },
          {
            key: 'progress',
            label: 'Progress',
            format: (v) => (v == null || v === '' ? '—' : `${v}%`),
          },
        ],
      },
      {
        heading: 'Timing',
        fields: [
          { key: 'startTime', label: 'Start Time', format: formatDateTime },
          { key: 'endTime', label: 'End Time', format: formatDateTime },
          { key: 'createdAt', label: 'Created At', format: formatDateTime },
        ],
      },
    ]}
  />
);

export default SessionDetail;
