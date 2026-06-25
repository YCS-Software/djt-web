import React from 'react';
import { GridColDef } from '@mui/x-data-grid';
import ResourceListPage from '../../components/common/ResourceListPage';
import { FieldDef } from '../../components/common/FormDialog';
import { subscriptionsApi } from '../../services/api';

const columns: GridColDef[] = [
  { field: 'name', headerName: 'Plan', flex: 1, minWidth: 160 },
  { field: 'price', headerName: 'Price', width: 110 },
  { field: 'billingCycle', headerName: 'Billing', width: 120 },
  { field: 'subscribers', headerName: 'Subscribers', width: 130 },
  { field: 'status', headerName: 'Status', width: 120 },
];

const fields: FieldDef[] = [
  { name: 'name', label: 'Plan Name', required: true },
  { name: 'price', label: 'Price', type: 'number', required: true },
  { name: 'billingCycle', label: 'Billing Cycle', type: 'select', options: [
    { value: 'monthly', label: 'Monthly' },
    { value: 'quarterly', label: 'Quarterly' },
    { value: 'yearly', label: 'Yearly' },
  ] },
  { name: 'features', label: 'Features', fullWidth: true },
  { name: 'status', label: 'Status', type: 'select', options: [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
  ] },
];

const Subscriptions: React.FC = () => (
  <ResourceListPage
    title="Subscriptions"
    subtitle="Subscription plans for EV drivers"
    entityName="Subscription"
    columns={columns}
    fetcher={subscriptionsApi.list}
    formFields={fields}
    createFn={subscriptionsApi.create}
    updateFn={subscriptionsApi.update}
    deleteFn={subscriptionsApi.delete}
    addLabel="Add Plan"
  />
);

export default Subscriptions;
