import React from 'react';
import DetailView from '../../components/common/DetailView';
import { stationsApi } from '../../services/api';
import { formatDateTime } from '../../utils/date';

const StationDetail: React.FC = () => (
  <DetailView
    title="Station Detail"
    subtitle="Charge point hardware and OCPP status"
    fetcher={stationsApi.getById}
    sections={[
      {
        heading: 'Charge Point',
        fields: [
          { key: 'name', label: 'Name' },
          { key: 'serial', label: 'Serial Number' },
          { key: 'ocppId', label: 'OCPP ID' },
          { key: 'station', label: 'Location' },
          { key: 'status', label: 'Status', status: true },
          { key: 'lastHeartbeat', label: 'Last Heartbeat', format: formatDateTime },
        ],
      },
      {
        heading: 'Specifications',
        fields: [
          { key: 'type', label: 'Type' },
          {
            key: 'power',
            label: 'Power',
            format: (v) => (v == null || v === '' ? '—' : `${v} kW`),
          },
          { key: 'connectors', label: 'Connectors' },
        ],
      },
    ]}
  />
);

export default StationDetail;
