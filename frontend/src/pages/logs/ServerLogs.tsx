import React from 'react';
import { GridColDef } from '@mui/x-data-grid';
import ResourceListPage from '../../components/common/ResourceListPage';
import { logsApi } from '../../services/api';
import { formatDateTime } from '../../utils/date';

const columns: GridColDef[] = [
  { field: 'timestamp', headerName: 'Timestamp', flex: 1, minWidth: 170, valueFormatter: (p: any) => formatDateTime(p.value) },
  { field: 'stationId', headerName: 'Station', flex: 1, minWidth: 140 },
  { field: 'messageType', headerName: 'Message', flex: 1, minWidth: 150 },
  { field: 'direction', headerName: 'Direction', width: 120 },
  { field: 'status', headerName: 'Status', width: 120 },
];

const ServerLogs: React.FC = () => (
  <ResourceListPage
    title="Server Logs"
    subtitle="OCPP / CSMS server message logs"
    columns={columns}
    fetcher={logsApi.ocpp}
    autoRefreshMs={20000}
  />
);

export default ServerLogs;
