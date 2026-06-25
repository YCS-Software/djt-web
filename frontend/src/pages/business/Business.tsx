import React from 'react';
import ResourceListPage from '../../components/common/ResourceListPage';
import { FieldDef } from '../../components/common/FormDialog';
import { businessApi } from '../../services/api';
import { GridColDef } from '@mui/x-data-grid';

const columns: GridColDef[] = [
  { field: 'name', headerName: 'Business Name', flex: 1, minWidth: 160 },
  { field: 'email', headerName: 'Email', flex: 1, minWidth: 160 },
  { field: 'phone', headerName: 'Phone', flex: 1, minWidth: 120 },
  { field: 'partners', headerName: 'Partners', width: 100 },
  { field: 'locations', headerName: 'Locations', width: 100 },
  { field: 'status', headerName: 'Status', width: 120 },
  { field: 'createdAt', headerName: 'Created At', flex: 1, minWidth: 120 },
];

const fields: FieldDef[] = [
  { name: 'name', label: 'Business Name', required: true },
  { name: 'email', label: 'Email', type: 'email', required: true },
  { name: 'phone', label: 'Phone', type: 'tel' },
  { name: 'registrationNumber', label: 'Registration No.' },
  { name: 'gstNumber', label: 'GST Number' },
  { name: 'address', label: 'Address', fullWidth: true },
  { name: 'city', label: 'City' },
  { name: 'state', label: 'State' },
  { name: 'status', label: 'Status', type: 'select', options: [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
  ] },
];

const Business: React.FC = () => (
  <ResourceListPage
    title="Business"
    subtitle="Business organisations on the charging network"
    entityName="Business"
    columns={columns}
    fetcher={businessApi.list}
    formFields={fields}
    createFn={businessApi.create}
    updateFn={businessApi.update}
    deleteFn={businessApi.delete}
    addLabel="Add Business"
  />
);

export default Business;
