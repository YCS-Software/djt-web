import React from 'react';
import { GridColDef } from '@mui/x-data-grid';
import ResourceListPage from '../../components/common/ResourceListPage';
import { FieldDef } from '../../components/common/FormDialog';
import { productsLinkApi } from '../../services/api';

const columns: GridColDef[] = [
  { field: 'name', headerName: 'Product', flex: 1, minWidth: 180 },
  { field: 'category', headerName: 'Category', width: 150 },
  { field: 'url', headerName: 'Link', flex: 1, minWidth: 220 },
  { field: 'status', headerName: 'Status', width: 120 },
];

const fields: FieldDef[] = [
  { name: 'name', label: 'Product Name', required: true },
  { name: 'category', label: 'Category' },
  { name: 'url', label: 'Link URL', fullWidth: true, required: true },
  { name: 'description', label: 'Description', fullWidth: true },
  { name: 'status', label: 'Status', type: 'select', options: [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
  ] },
];

const ProductsLink: React.FC = () => (
  <ResourceListPage
    title="Products Link"
    subtitle="Linked product catalogue and external resources"
    entityName="Product"
    columns={columns}
    fetcher={productsLinkApi.list}
    formFields={fields}
    createFn={productsLinkApi.create}
    updateFn={productsLinkApi.update}
    deleteFn={productsLinkApi.delete}
    addLabel="Add Product"
  />
);

export default ProductsLink;
