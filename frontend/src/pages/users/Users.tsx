import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Box, IconButton, Stack, Snackbar, Alert, Tooltip } from '@mui/material';
import { EditOutlined, DeleteOutline } from '@mui/icons-material';
import { GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { AppDispatch, RootState } from '../../store';
import {
  fetchUsers,
  createUser,
  updateUser,
  deleteUser,
} from '../../features/users/usersSlice';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import FormDialog, { FieldDef } from '../../components/common/FormDialog';
import ConfirmDialog from '../../components/common/ConfirmDialog';

const fields: FieldDef[] = [
  { name: 'name', label: 'Name', required: true },
  { name: 'email', label: 'Email', type: 'email', required: true },
  { name: 'phone', label: 'Phone', type: 'tel' },
  { name: 'password', label: 'Password', createOnly: true, required: true },
  {
    name: 'role',
    label: 'Role',
    type: 'select',
    options: [
      { value: 'admin', label: 'Admin' },
      { value: 'manager', label: 'Manager' },
      { value: 'operator', label: 'Operator' },
      { value: 'partner', label: 'Partner' },
      { value: 'viewer', label: 'Viewer' },
    ],
  },
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

const Users: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { rows, loading, saving } = useSelector((s: RootState) => (s as any).users);

  const [formOpen, setFormOpen] = useState(false);
  const [editRow, setEditRow] = useState<any | null>(null);
  const [deleteRow, setDeleteRow] = useState<any | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    dispatch(fetchUsers());
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
      ? updateUser({ id: String(editRow.id), data: values })
      : createUser(values);
    const res: any = await dispatch(action);
    if (res.error) {
      setToast({ msg: res.payload || 'Operation failed', type: 'error' });
    } else {
      setToast({ msg: editRow ? 'User updated' : 'User created', type: 'success' });
      setFormOpen(false);
      setEditRow(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteRow) return;
    const res: any = await dispatch(deleteUser(String(deleteRow.id)));
    if (res.error) {
      setToast({ msg: res.payload || 'Delete failed', type: 'error' });
    } else {
      setToast({ msg: 'User deleted', type: 'success' });
    }
    setDeleteRow(null);
  };

  const columns: GridColDef[] = useMemo(
    () => [
      { field: 'name', headerName: 'Name', flex: 1, minWidth: 140 },
      { field: 'email', headerName: 'Email', flex: 1, minWidth: 160 },
      { field: 'phone', headerName: 'Phone', flex: 1, minWidth: 120 },
      { field: 'role', headerName: 'Role', width: 120 },
      { field: 'status', headerName: 'Status', width: 120 },
      { field: 'createdAt', headerName: 'Created At', flex: 1, minWidth: 120 },
      {
        field: 'actions',
        headerName: 'Actions',
        width: 110,
        sortable: false,
        filterable: false,
        renderCell: (params: GridRenderCellParams) => (
          <Stack direction="row" spacing={0.5}>
            <Tooltip title="Edit">
              <IconButton size="small" onClick={() => openEdit(params.row)} sx={{ color: '#14532d' }}>
                <EditOutlined fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete">
              <IconButton size="small" onClick={() => setDeleteRow(params.row)} sx={{ color: '#c62828' }}>
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
        title="Users"
        subtitle="Back-office administrators and partner users"
        action={{ label: 'Add User', onClick: openCreate }}
      />
      <DataTable rows={rows} columns={columns} loading={loading} getRowId={(r) => r.id} autoHeight />

      <FormDialog
        open={formOpen}
        title={editRow ? 'Edit User' : 'Add User'}
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
        title="Delete User"
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

export default Users;
