import React from 'react';
import { GridColDef } from '@mui/x-data-grid';
import ResourceListPage from '../../components/common/ResourceListPage';
import { FieldDef } from '../../components/common/FormDialog';
import { smartSchedulingApi } from '../../services/api';

const columns: GridColDef[] = [
  { field: 'name', headerName: 'Schedule', flex: 1, minWidth: 160 },
  { field: 'stationName', headerName: 'Station', flex: 1, minWidth: 150 },
  { field: 'startTime', headerName: 'Start', width: 120 },
  { field: 'endTime', headerName: 'End', width: 120 },
  { field: 'maxPower', headerName: 'Max Power (kW)', width: 150 },
  { field: 'status', headerName: 'Status', width: 120 },
];

const fields: FieldDef[] = [
  { name: 'name', label: 'Schedule Name', required: true },
  { name: 'stationId', label: 'Station ID', required: true },
  { name: 'startTime', label: 'Start Time (HH:mm)' },
  { name: 'endTime', label: 'End Time (HH:mm)' },
  { name: 'maxPower', label: 'Max Power (kW)', type: 'number' },
  { name: 'status', label: 'Status', type: 'select', options: [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
  ] },
];

const SmartScheduling: React.FC = () => (
  <ResourceListPage
    title="Smart Scheduling"
    subtitle="Load-balanced charging schedules"
    entityName="Schedule"
    columns={columns}
    fetcher={smartSchedulingApi.list}
    formFields={fields}
    createFn={smartSchedulingApi.create}
    updateFn={smartSchedulingApi.update}
    deleteFn={smartSchedulingApi.delete}
    addLabel="Add Schedule"
  />
);

export default SmartScheduling;
