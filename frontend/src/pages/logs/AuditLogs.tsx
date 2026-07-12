import React from 'react';
import { GridColDef } from '@mui/x-data-grid';
import ResourceListPage from '../../components/common/ResourceListPage';
import { logsApi } from '../../services/api';
import { formatDateTime } from '../../utils/date';

const columns: GridColDef[] = [
  { field: 'id', headerName: 'ID', width: 90 },
  { field: 'action', headerName: 'Action', flex: 1, minWidth: 160 },
  { field: 'entity', headerName: 'Entity', flex: 1, minWidth: 140 },
  { field: 'user', headerName: 'User', flex: 1, minWidth: 140 },
  { field: 'ip', headerName: 'IP Address', width: 140 },
  { field: 'createdAt', headerName: 'Timestamp', flex: 1, minWidth: 160, valueFormatter: (p: any) => formatDateTime(p.value) },
];

const AuditLogs: React.FC = () => (
  <ResourceListPage
    title="Audit Logs"
    subtitle="Track administrative actions and changes"
    columns={columns}
    fetcher={logsApi.audit}
  />
);

export default AuditLogs;
