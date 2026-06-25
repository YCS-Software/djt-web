import React from 'react';
import { GridColDef } from '@mui/x-data-grid';
import ResourceListPage from '../../components/common/ResourceListPage';
import { configurationsApi } from '../../services/api';

const columns: GridColDef[] = [
  { field: 'stationName', headerName: 'Station', flex: 1, minWidth: 150 },
  { field: 'key', headerName: 'Key', flex: 1, minWidth: 180 },
  { field: 'value', headerName: 'Value', flex: 1, minWidth: 160 },
  { field: 'readonly', headerName: 'Read Only', width: 110 },
  { field: 'status', headerName: 'Status', width: 120 },
];

const Configurations: React.FC = () => (
  <ResourceListPage
    title="Configurations"
    subtitle="OCPP charge-point configuration keys"
    columns={columns}
    fetcher={configurationsApi.list}
  />
);

export default Configurations;
