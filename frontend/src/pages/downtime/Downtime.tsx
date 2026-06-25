import React from 'react';
import { GridColDef } from '@mui/x-data-grid';
import ResourceListPage from '../../components/common/ResourceListPage';
import { downtimeApi } from '../../services/api';

const columns: GridColDef[] = [
  { field: 'stationName', headerName: 'Station', flex: 1, minWidth: 160 },
  { field: 'connectorId', headerName: 'Connector', width: 120 },
  { field: 'reason', headerName: 'Reason', flex: 1, minWidth: 160 },
  { field: 'startTime', headerName: 'Start', flex: 1, minWidth: 150 },
  { field: 'endTime', headerName: 'End', flex: 1, minWidth: 150 },
  { field: 'durationHours', headerName: 'Duration (hr)', width: 130 },
  { field: 'status', headerName: 'Status', width: 120 },
];

const Downtime: React.FC = () => (
  <ResourceListPage
    title="Downtime"
    subtitle="Charger downtime windows and outages"
    columns={columns}
    fetcher={downtimeApi.list}
  />
);

export default Downtime;
