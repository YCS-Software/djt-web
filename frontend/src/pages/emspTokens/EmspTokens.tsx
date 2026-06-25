import React from 'react';
import { GridColDef } from '@mui/x-data-grid';
import ResourceListPage from '../../components/common/ResourceListPage';
import { FieldDef } from '../../components/common/FormDialog';
import { emspTokensApi } from '../../services/api';

const columns: GridColDef[] = [
  { field: 'uid', headerName: 'Token UID', flex: 1, minWidth: 160 },
  { field: 'type', headerName: 'Type', width: 120 },
  { field: 'contractId', headerName: 'Contract ID', flex: 1, minWidth: 150 },
  { field: 'issuer', headerName: 'Issuer', flex: 1, minWidth: 140 },
  { field: 'status', headerName: 'Status', width: 120 },
];

const fields: FieldDef[] = [
  { name: 'uid', label: 'Token UID', required: true },
  { name: 'type', label: 'Type', type: 'select', options: [
    { value: 'RFID', label: 'RFID' },
    { value: 'APP_USER', label: 'App User' },
    { value: 'AD_HOC_USER', label: 'Ad-hoc User' },
  ] },
  { name: 'contractId', label: 'Contract ID' },
  { name: 'issuer', label: 'Issuer' },
  { name: 'status', label: 'Status', type: 'select', options: [
    { value: 'valid', label: 'Valid' },
    { value: 'blocked', label: 'Blocked' },
    { value: 'expired', label: 'Expired' },
  ] },
];

const EmspTokens: React.FC = () => (
  <ResourceListPage
    title="EMSP Tokens"
    subtitle="e-Mobility Service Provider roaming tokens"
    entityName="Token"
    columns={columns}
    fetcher={emspTokensApi.list}
    formFields={fields}
    createFn={emspTokensApi.create}
    updateFn={emspTokensApi.update}
    deleteFn={emspTokensApi.delete}
    addLabel="Add Token"
  />
);

export default EmspTokens;
