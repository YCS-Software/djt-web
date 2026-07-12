import React from 'react';
import { GridColDef } from '@mui/x-data-grid';
import ResourceListPage from '../../components/common/ResourceListPage';
import { FieldDef } from '../../components/common/FormDialog';
import { courtesySessionsApi } from '../../services/api';
import { formatDateTime } from '../../utils/date';

const columns: GridColDef[] = [
  { field: 'driverName', headerName: 'Driver', flex: 1, minWidth: 150 },
  { field: 'stationName', headerName: 'Station', flex: 1, minWidth: 150 },
  { field: 'durationMinutes', headerName: 'Duration (min)', width: 140 },
  { field: 'reason', headerName: 'Reason', flex: 1, minWidth: 150 },
  { field: 'status', headerName: 'Status', width: 120 },
  { field: 'createdAt', headerName: 'Granted At', flex: 1, minWidth: 120, valueFormatter: (p: any) => formatDateTime(p.value) },
];

const fields: FieldDef[] = [
  { name: 'driverId', label: 'Driver ID', required: true },
  { name: 'stationId', label: 'Station ID', required: true },
  { name: 'durationMinutes', label: 'Duration (minutes)', type: 'number', required: true },
  { name: 'reason', label: 'Reason', fullWidth: true },
];

const CourtesySessions: React.FC = () => (
  <ResourceListPage
    title="Courtesy Sessions"
    subtitle="Complimentary charging sessions granted to drivers"
    entityName="Courtesy Session"
    columns={columns}
    fetcher={courtesySessionsApi.list}
    formFields={fields}
    createFn={courtesySessionsApi.create}
    deleteFn={courtesySessionsApi.delete}
    addLabel="Grant Session"
  />
);

export default CourtesySessions;
