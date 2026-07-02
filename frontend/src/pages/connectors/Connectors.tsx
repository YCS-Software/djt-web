import React from 'react';
import { GridColDef } from '@mui/x-data-grid';
import ResourceListPage from '../../components/common/ResourceListPage';
import { stationsApi } from '../../services/api';

// The djt-app API has no standalone /web/connectors resource — connectors are a
// property of each charge point (mchn_lst_t). This page therefore presents a
// connector-oriented view derived from the real stations endpoint.
const columns: GridColDef[] = [
  { field: 'name', headerName: 'Charge Point', flex: 1, minWidth: 160 },
  { field: 'station', headerName: 'Location', flex: 1, minWidth: 160 },
  { field: 'type', headerName: 'Connector Type', width: 150 },
  {
    field: 'power',
    headerName: 'Power (kW)',
    width: 130,
    valueFormatter: (value: any) => (value == null || value === '' ? '—' : `${value} kW`),
  },
  { field: 'connectors', headerName: 'Connectors', width: 120 },
  { field: 'ocppId', headerName: 'OCPP ID', flex: 1, minWidth: 140 },
  { field: 'status', headerName: 'Status', width: 130 },
];

const Connectors: React.FC = () => (
  <ResourceListPage
    title="Connectors"
    subtitle="Charging connectors by charge point and QR endpoints"
    columns={columns}
    fetcher={stationsApi.list}
  />
);

export default Connectors;
