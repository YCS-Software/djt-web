import React from 'react';
import { GridColDef } from '@mui/x-data-grid';
import ResourceListPage from '../../components/common/ResourceListPage';
import { FieldDef } from '../../components/common/FormDialog';
import { agentsApi } from '../../services/api';

const columns: GridColDef[] = [
  { field: 'name', headerName: 'Agent', flex: 1, minWidth: 150 },
  { field: 'email', headerName: 'Email', flex: 1, minWidth: 160 },
  { field: 'phone', headerName: 'Phone', flex: 1, minWidth: 120 },
  { field: 'region', headerName: 'Region', width: 130 },
  { field: 'status', headerName: 'Status', width: 120 },
];

const fields: FieldDef[] = [
  { name: 'name', label: 'Agent Name', required: true },
  { name: 'email', label: 'Email', type: 'email', required: true },
  { name: 'phone', label: 'Phone', type: 'tel' },
  { name: 'region', label: 'Region' },
  { name: 'status', label: 'Status', type: 'select', options: [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
  ] },
];

const Agents: React.FC = () => (
  <ResourceListPage
    title="Agents"
    subtitle="Field agents and resellers"
    entityName="Agent"
    columns={columns}
    fetcher={agentsApi.list}
    formFields={fields}
    createFn={agentsApi.create}
    updateFn={agentsApi.update}
    deleteFn={agentsApi.delete}
    addLabel="Add Agent"
  />
);

export default Agents;
