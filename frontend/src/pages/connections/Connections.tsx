import React from 'react';
import { GridColDef } from '@mui/x-data-grid';
import ResourceListPage from '../../components/common/ResourceListPage';
import { connectionsApi } from '../../services/api';
import { formatDateTime } from '../../utils/date';

const columns: GridColDef[] = [
  { field: 'stationName', headerName: 'Station', flex: 1, minWidth: 160 },
  { field: 'ocppId', headerName: 'OCPP ID', flex: 1, minWidth: 150 },
  { field: 'protocol', headerName: 'Protocol', width: 120 },
  { field: 'lastHeartbeat', headerName: 'Last Heartbeat', flex: 1, minWidth: 160, valueFormatter: (p: any) => formatDateTime(p.value) },
  { field: 'status', headerName: 'Status', width: 130 },
];

const Connections: React.FC = () => (
  <ResourceListPage
    title="Connections"
    subtitle="Live OCPP charge-point connections"
    columns={columns}
    fetcher={connectionsApi.list}
    autoRefreshMs={15000}
  />
);

export default Connections;
