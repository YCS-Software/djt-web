import React from 'react';
import { GridColDef } from '@mui/x-data-grid';
import ResourceListPage from '../../components/common/ResourceListPage';
import { FieldDef } from '../../components/common/FormDialog';
import { accessControlApi } from '../../services/api';

const columns: GridColDef[] = [
  { field: 'name', headerName: 'Role', flex: 1, minWidth: 160 },
  { field: 'description', headerName: 'Description', flex: 1, minWidth: 220 },
  { field: 'users', headerName: 'Users', width: 100 },
  { field: 'status', headerName: 'Status', width: 120 },
];

const fields: FieldDef[] = [
  { name: 'name', label: 'Role Name', required: true },
  { name: 'description', label: 'Description', fullWidth: true },
  {
    name: 'permissions',
    label: 'Permissions (comma separated)',
    fullWidth: true,
    helperText: 'e.g. view:reports, manage:stations, manage:users',
  },
  { name: 'status', label: 'Status', type: 'select', options: [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
  ] },
];

const AccessControl: React.FC = () => (
  <ResourceListPage
    title="Access Control"
    subtitle="Roles and permissions for back-office users"
    entityName="Role"
    columns={columns}
    fetcher={accessControlApi.list}
    formFields={fields}
    createFn={accessControlApi.create}
    updateFn={accessControlApi.update}
    deleteFn={accessControlApi.delete}
    addLabel="Add Role"
  />
);

export default AccessControl;
