import React from 'react';
import { GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import ResourceListPage from '../../components/common/ResourceListPage';
import StatusChip from '../../components/common/StatusChip';
import { tariffsApi } from '../../services/api';

const dateOnly = (p: any) => {
  if (!p.value) return '';
  const d = new Date(p.value);
  return isNaN(d.getTime()) ? String(p.value) : d.toLocaleDateString();
};

const columns: GridColDef[] = [
  { field: 'name', headerName: 'Name', flex: 1, minWidth: 200 },
  {
    field: 'status',
    headerName: 'Status',
    width: 130,
    renderCell: (p: GridRenderCellParams) => (p.value ? <StatusChip status={String(p.value)} /> : null),
  },
  { field: 'partnerOrg', headerName: 'Partner Org', flex: 1, minWidth: 160 },
  { field: 'businessOrg', headerName: 'Business Org', flex: 1, minWidth: 160 },
  { field: 'createdAt', headerName: 'Creation Date', width: 150, valueFormatter: dateOnly },
  { field: 'updatedAt', headerName: 'Updation Date', width: 150, valueFormatter: dateOnly },
];

const Tariffs: React.FC = () => (
  <ResourceListPage
    title="Tariffs"
    subtitle="Manage pricing and tariff plans"
    entityName="Tariff"
    columns={columns}
    fetcher={tariffsApi.list}
  />
);

export default Tariffs;
