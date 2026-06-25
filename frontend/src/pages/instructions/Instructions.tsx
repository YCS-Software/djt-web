import React from 'react';
import { GridColDef } from '@mui/x-data-grid';
import ResourceListPage from '../../components/common/ResourceListPage';
import { instructionsApi } from '../../services/api';

const columns: GridColDef[] = [
  { field: 'title', headerName: 'Title', flex: 1, minWidth: 200 },
  { field: 'category', headerName: 'Category', flex: 1, minWidth: 150 },
  { field: 'audience', headerName: 'Audience', width: 140 },
  { field: 'updatedAt', headerName: 'Updated', flex: 1, minWidth: 140 },
  { field: 'status', headerName: 'Status', width: 120 },
];

const Instructions: React.FC = () => (
  <ResourceListPage
    title="Instructions"
    subtitle="Operator instructions and knowledge base"
    columns={columns}
    fetcher={instructionsApi.list}
  />
);

export default Instructions;
