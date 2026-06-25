import React from 'react';
import { GridColDef } from '@mui/x-data-grid';
import ResourceListPage from '../../components/common/ResourceListPage';
import { staticDataApi } from '../../services/api';

const columns: GridColDef[] = [
  { field: 'category', headerName: 'Category', flex: 1, minWidth: 160 },
  { field: 'code', headerName: 'Code', flex: 1, minWidth: 140 },
  { field: 'label', headerName: 'Label', flex: 1, minWidth: 160 },
  { field: 'value', headerName: 'Value', flex: 1, minWidth: 140 },
  { field: 'status', headerName: 'Status', width: 120 },
];

const StaticData: React.FC = () => (
  <ResourceListPage
    title="Static Data"
    subtitle="Reference / master data used across the platform"
    columns={columns}
    fetcher={staticDataApi.list}
  />
);

export default StaticData;
