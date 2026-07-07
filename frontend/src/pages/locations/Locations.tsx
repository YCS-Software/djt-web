import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Box, IconButton, Stack, Snackbar, Alert, Tooltip } from '@mui/material';
import { EditOutlined, DeleteOutline } from '@mui/icons-material';
import { GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { AppDispatch, RootState } from '../../store';
import {
  fetchLocations,
  createLocation,
  updateLocation,
  deleteLocation,
} from '../../features/locations/locationsSlice';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import FormDialog, { FieldDef } from '../../components/common/FormDialog';
import ConfirmDialog from '../../components/common/ConfirmDialog';

const formatNumber = (value: any): string => {
  if (value === null || value === undefined || value === '') return '';
  const n = Number(value);
  return isNaN(n) ? String(value) : n.toFixed(2);
};

const fields: FieldDef[] = [
  { name: 'name', label: 'Name', required: true },
  { name: 'code', label: 'Code' },
  { name: 'address', label: 'Address', fullWidth: true },
  { name: 'city', label: 'City' },
  { name: 'state', label: 'State' },
  { name: 'pincode', label: 'Pincode' },
  { name: 'latitude', label: 'Latitude', type: 'number' },
  { name: 'longitude', label: 'Longitude', type: 'number' },
  { name: 'contactPhone', label: 'Contact Phone', type: 'tel' },
  { name: 'contactEmail', label: 'Contact Email', type: 'email' },
  {
    name: 'status',
    label: 'Status',
    type: 'select',
    options: [
      { value: 'active', label: 'Active' },
      { value: 'inactive', label: 'Inactive' },
    ],
  },
];

const Locations: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { rows, loading, saving } = useSelector((s: RootState) => (s as any).locations);

  const [formOpen, setFormOpen] = useState(false);
  const [editRow, setEditRow] = useState<any | null>(null);
  const [deleteRow, setDeleteRow] = useState<any | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    dispatch(fetchLocations());
  }, [dispatch]);

  const openCreate = () => {
    setEditRow(null);
    setFormOpen(true);
  };
  const openEdit = (row: any) => {
    setEditRow(row);
    setFormOpen(true);
  };

  const handleSubmit = async (values: Record<string, any>) => {
    const action = editRow
      ? updateLocation({ id: String(editRow.id), data: values })
      : createLocation(values);
    const res: any = await dispatch(action);
    if (res.error) {
      setToast({ msg: res.payload || 'Operation failed', type: 'error' });
    } else {
      setToast({ msg: editRow ? 'Location updated' : 'Location created', type: 'success' });
      setFormOpen(false);
      setEditRow(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteRow) return;
    const res: any = await dispatch(deleteLocation(String(deleteRow.id)));
    if (res.error) {
      setToast({ msg: res.payload || 'Delete failed', type: 'error' });
    } else {
      setToast({ msg: 'Location deleted', type: 'success' });
    }
    setDeleteRow(null);
  };

  const columns: GridColDef[] = useMemo(
    () => [
      { field: 'name', headerName: 'Name', flex: 1, minWidth: 140 },
      { field: 'code', headerName: 'Code', width: 110 },
      { field: 'city', headerName: 'City', flex: 1, minWidth: 110 },
      { field: 'state', headerName: 'State', flex: 1, minWidth: 110 },
      { field: 'totalChargers', headerName: 'Chargers', width: 100 },
      {
        field: 'pricePerKwh',
        headerName: 'Price/kWh',
        width: 110,
        valueFormatter: (params: any) => formatNumber(params?.value),
      },
      { field: 'rating', headerName: 'Rating', width: 90, type: 'number' },
      { field: 'status', headerName: 'Status', width: 120 },
      {
        field: 'actions',
        headerName: 'Actions',
        width: 110,
        sortable: false,
        filterable: false,
        renderCell: (params: GridRenderCellParams) => (
          <Stack direction="row" spacing={0.5}>
            <Tooltip title="Edit">
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  openEdit(params.row);
                }}
                sx={{ color: '#14532d' }}
              >
                <EditOutlined fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete">
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteRow(params.row);
                }}
                sx={{ color: '#c62828' }}
              >
                <DeleteOutline fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        ),
      },
    ],
    []
  );

  return (
    <Box>
      <PageHeader
        title="Locations"
        subtitle="Charging site locations across the network"
        action={{ label: 'Add Location', onClick: openCreate }}
      />
      <DataTable
        rows={rows}
        columns={columns}
        loading={loading}
        getRowId={(r) => r.id}
        onRowClick={(params) => navigate(`/locations/${params.row.id}`)}
        autoHeight
      />

      <FormDialog
        open={formOpen}
        title={editRow ? 'Edit Location' : 'Add Location'}
        fields={fields}
        initialValues={editRow || undefined}
        isEdit={!!editRow}
        loading={saving}
        onSubmit={handleSubmit}
        onCancel={() => {
          setFormOpen(false);
          setEditRow(null);
        }}
      />

      <ConfirmDialog
        open={!!deleteRow}
        title="Delete Location"
        message={`Are you sure you want to delete "${deleteRow?.name || ''}"? This action cannot be undone.`}
        confirmText="Delete"
        confirmColor="error"
        loading={saving}
        onConfirm={handleDelete}
        onCancel={() => setDeleteRow(null)}
      />

      <Snackbar
        open={!!toast}
        autoHideDuration={4000}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        {toast ? (
          <Alert severity={toast.type} variant="filled" onClose={() => setToast(null)}>
            {toast.msg}
          </Alert>
        ) : undefined}
      </Snackbar>
    </Box>
  );
};

export default Locations;
