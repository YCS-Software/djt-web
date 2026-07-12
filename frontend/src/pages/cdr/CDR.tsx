import React from 'react';
import { GridColDef } from '@mui/x-data-grid';
import ResourceListPage from '../../components/common/ResourceListPage';
import { cdrApi } from '../../services/api';
import { formatDateTime } from '../../utils/date';

const num = (p: any) => {
  const n = Number(p.value);
  return isNaN(n) ? (p.value ?? '') : n.toFixed(2);
};

const columns: GridColDef[] = [
  { field: 'cdrId', headerName: 'CDR ID', width: 120 },
  { field: 'sessionId', headerName: 'Session', width: 120 },
  { field: 'stationName', headerName: 'Station', flex: 1, minWidth: 150 },
  { field: 'driverName', headerName: 'Driver', flex: 1, minWidth: 140 },
  { field: 'energyKwh', headerName: 'Energy (kWh)', width: 130, valueFormatter: num },
  { field: 'totalCost', headerName: 'Cost', width: 110, valueFormatter: num },
  { field: 'startTime', headerName: 'Start', flex: 1, minWidth: 150, valueFormatter: (p: any) => formatDateTime(p.value) },
  { field: 'status', headerName: 'Status', width: 120 },
];

const CDR: React.FC = () => (
  <ResourceListPage
    title="CDR"
    subtitle="Charge Detail Records for roaming sessions"
    columns={columns}
    fetcher={cdrApi.list}
  />
);

export default CDR;
