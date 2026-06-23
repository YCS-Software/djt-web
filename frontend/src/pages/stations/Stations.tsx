import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Box } from '@mui/material';
import { GridColDef } from '@mui/x-data-grid';
import { AppDispatch, RootState } from '../../store';
import { fetchStations } from '../../features/stations/stationsSlice';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';

const columns: GridColDef[] = [
  { field: 'name', headerName: 'Name', flex: 1, minWidth: 120 },
  { field: 'serial', headerName: 'Serial', flex: 1, minWidth: 120 },
  { field: 'ocppId', headerName: 'OCPP ID', flex: 1, minWidth: 120 },
  { field: 'type', headerName: 'Type', flex: 1, minWidth: 120 },
  { field: 'power', headerName: 'Power', flex: 1, minWidth: 120 },
  { field: 'connectors', headerName: 'Connectors', flex: 1, minWidth: 120 },
  { field: 'station', headerName: 'Station', flex: 1, minWidth: 120 },
  { field: 'status', headerName: 'Status', flex: 1, minWidth: 120 },
];

const Stations: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { rows, loading } = useSelector((s: RootState) => (s as any).stations);

  useEffect(() => {
    dispatch(fetchStations());
  }, [dispatch]);

  return (
    <Box>
      <PageHeader
        title="Charging Stations"
        subtitle="Chargers (machines) across all locations"
      />
      <DataTable
        rows={rows}
        columns={columns}
        loading={loading}
        getRowId={(r) => r.id}
        autoHeight
      />
    </Box>
  );
};

export default Stations;
