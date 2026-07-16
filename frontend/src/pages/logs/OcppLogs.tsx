import React from 'react';
import { GridColDef } from '@mui/x-data-grid';
import ResourceListPage from '../../components/common/ResourceListPage';
import { logsApi } from '../../services/api';
import { formatDateTime } from '../../utils/date';

const columns: GridColDef[] = [
  { field: 'ocppId', headerName: 'Charge Point', flex: 1, minWidth: 160 },
  { field: 'direction', headerName: 'Direction', width: 110 },
  { field: 'messageType', headerName: 'Type', width: 120 },
  { field: 'action', headerName: 'OCPP Action', flex: 1, minWidth: 150 },
  { field: 'payload', headerName: 'Payload', flex: 1.5, minWidth: 220 },
  { field: 'timestamp', headerName: 'Timestamp', flex: 1, minWidth: 160, valueFormatter: (p: any) => formatDateTime(p.value) },
];

const OcppLogs: React.FC = () => (
  <ResourceListPage
    title="OCPP Logs"
    subtitle="Charge point communication messages"
    columns={columns}
    fetcher={logsApi.ocpp}
  />
);

export default OcppLogs;
