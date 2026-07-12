import React from 'react';
import { Button } from '@mui/material';
import { StopCircleOutlined } from '@mui/icons-material';
import { GridColDef } from '@mui/x-data-grid';
import ResourceListPage from '../../components/common/ResourceListPage';
import { sessionsApi } from '../../services/api';
import { formatDateTime } from '../../utils/date';

const num = (p: any) => {
  const n = Number(p.value);
  return isNaN(n) ? (p.value ?? '') : n.toFixed(2);
};

const columns: GridColDef[] = [
  { field: 'id', headerName: 'Session', width: 100 },
  { field: 'stationName', headerName: 'Station', flex: 1, minWidth: 150 },
  { field: 'driverName', headerName: 'Driver', flex: 1, minWidth: 140 },
  { field: 'energy', headerName: 'Energy (kWh)', width: 130, valueFormatter: num },
  { field: 'progress', headerName: 'Progress %', width: 120 },
  { field: 'startTime', headerName: 'Started', flex: 1, minWidth: 150, valueFormatter: (p: any) => formatDateTime(p.value) },
  { field: 'status', headerName: 'Status', width: 120 },
];

const LiveSessions: React.FC = () => (
  <ResourceListPage
    title="Live Sessions"
    subtitle="Charging sessions in progress — auto-refreshing"
    columns={columns}
    fetcher={sessionsApi.getActive}
    autoRefreshMs={10000}
    rowActions={(row, reload, notify) => (
      <Button
        size="small"
        startIcon={<StopCircleOutlined fontSize="small" />}
        onClick={async () => {
          try {
            await sessionsApi.stop(String(row.id));
            notify('Session stopped');
            reload();
          } catch {
            notify('Failed to stop session', 'error');
          }
        }}
        sx={{ textTransform: 'none', color: '#c62828' }}
      >
        Stop
      </Button>
    )}
  />
);

export default LiveSessions;
