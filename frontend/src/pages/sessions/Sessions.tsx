import React from 'react';
import { useNavigate } from 'react-router-dom';
import { GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import ResourceListPage from '../../components/common/ResourceListPage';
import StatusChip from '../../components/common/StatusChip';
import { sessionsApi } from '../../services/api';
import { formatDateTime } from '../../utils/date';

const num = (digits: number) => (p: any) => {
  const n = Number(p.value);
  return isNaN(n) ? (p.value ?? '') : n.toFixed(digits);
};

const dateTime = (p: any) => formatDateTime(p.value);

const columns: GridColDef[] = [
  { field: 'sessionCode', headerName: 'Session', flex: 1, minWidth: 180 },
  { field: 'transactionId', headerName: 'Txn ID', width: 120, valueGetter: (p) => p.value || '—' },
  {
    field: 'status',
    headerName: 'Status',
    width: 130,
    renderCell: (p: GridRenderCellParams) => (p.value ? <StatusChip status={String(p.value)} /> : null),
  },
  { field: 'stationName', headerName: 'Charging Station', flex: 1, minWidth: 180 },
  { field: 'member', headerName: 'EV Driver', flex: 1, minWidth: 140 },
  { field: 'energy', headerName: 'Energy (kWh)', width: 130, valueFormatter: num(3) },
  { field: 'cost', headerName: 'Cost', width: 110, valueFormatter: num(2) },
  { field: 'durationMins', headerName: 'Duration (min)', width: 140 },
  {
    field: 'paymentStatus',
    headerName: 'Payment',
    width: 120,
    renderCell: (p: GridRenderCellParams) => (p.value ? <StatusChip status={String(p.value)} /> : null),
  },
  { field: 'startTime', headerName: 'Started', width: 190, valueFormatter: dateTime },
  { field: 'endTime', headerName: 'Ended', width: 190, valueFormatter: dateTime },
];

const Sessions: React.FC = () => {
  const navigate = useNavigate();
  return (
    <ResourceListPage
      title="Charging Sessions"
      subtitle="View and manage charging sessions"
      entityName="Session"
      columns={columns}
      fetcher={sessionsApi.list}
      onRowClick={(params) => navigate(`/sessions/${params.row.id}`)}
    />
  );
};

export default Sessions;
