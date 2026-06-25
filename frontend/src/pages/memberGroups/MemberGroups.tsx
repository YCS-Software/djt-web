import React from 'react';
import { GridColDef } from '@mui/x-data-grid';
import ResourceListPage from '../../components/common/ResourceListPage';
import { FieldDef } from '../../components/common/FormDialog';
import { memberGroupsApi } from '../../services/api';

const columns: GridColDef[] = [
  { field: 'name', headerName: 'Group Name', flex: 1, minWidth: 160 },
  { field: 'description', headerName: 'Description', flex: 1, minWidth: 180 },
  { field: 'members', headerName: 'Members', width: 110 },
  { field: 'discountRate', headerName: 'Discount %', width: 120 },
  { field: 'status', headerName: 'Status', width: 120 },
];

const fields: FieldDef[] = [
  { name: 'name', label: 'Group Name', required: true },
  { name: 'description', label: 'Description', fullWidth: true },
  { name: 'discountRate', label: 'Discount Rate (%)', type: 'number' },
  { name: 'status', label: 'Status', type: 'select', options: [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
  ] },
];

const MemberGroups: React.FC = () => (
  <ResourceListPage
    title="Member Groups"
    subtitle="Driver member groups and benefits"
    entityName="Member Group"
    columns={columns}
    fetcher={memberGroupsApi.list}
    formFields={fields}
    createFn={memberGroupsApi.create}
    updateFn={memberGroupsApi.update}
    deleteFn={memberGroupsApi.delete}
    addLabel="Add Group"
  />
);

export default MemberGroups;
