import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Box, IconButton, Stack, Snackbar, Alert, Tooltip } from '@mui/material';
import { EditOutlined, DeleteOutline } from '@mui/icons-material';
import { GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import PageHeader from './PageHeader';
import DataTable from './DataTable';
import FormDialog, { FieldDef } from './FormDialog';
import ConfirmDialog from './ConfirmDialog';

export interface ResourceListPageProps {
  title: string;
  subtitle?: string;
  columns: GridColDef[];
  /** Returns an axios-style response; rows are extracted automatically. */
  fetcher: (params?: object) => Promise<any>;
  /** Override row extraction from the response payload. */
  parseRows?: (data: any) => any[];
  getRowId?: (row: any) => string;

  // CRUD (optional) ----------------------------------------------------------
  formFields?: FieldDef[];
  createFn?: (data: any) => Promise<any>;
  updateFn?: (id: string, data: any) => Promise<any>;
  deleteFn?: (id: string) => Promise<any>;
  addLabel?: string;
  entityName?: string;

  /** Custom per-row actions appended to the actions column. */
  rowActions?: (row: any, reload: () => void, notify: (m: string, t?: 'success' | 'error') => void) => React.ReactNode;
  /** Auto-refresh interval in ms (e.g. live screens). */
  autoRefreshMs?: number;
  /** Optional content rendered above the table (filters, KPIs). */
  toolbar?: React.ReactNode;
}

const guessRows = (data: any): any[] => {
  if (Array.isArray(data)) return data;
  if (!data || typeof data !== 'object') return [];
  if (Array.isArray(data.rows)) return data.rows;
  if (Array.isArray(data.data)) return data.data;
  // first array-valued property
  const arr = Object.values(data).find((v) => Array.isArray(v));
  return (arr as any[]) || [];
};

const ResourceListPage: React.FC<ResourceListPageProps> = ({
  title,
  subtitle,
  columns,
  fetcher,
  parseRows,
  getRowId,
  formFields,
  createFn,
  updateFn,
  deleteFn,
  addLabel,
  entityName,
  rowActions,
  autoRefreshMs,
  toolbar,
}) => {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editRow, setEditRow] = useState<any | null>(null);
  const [deleteRow, setDeleteRow] = useState<any | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const name = entityName || title.replace(/s$/, '');
  const notify = (msg: string, type: 'success' | 'error' = 'success') => setToast({ msg, type });

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetcher();
      const data = res?.data ?? res;
      setRows((parseRows ? parseRows(data) : guessRows(data)).map((r, i) => ({ id: r.id ?? i, ...r })));
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [fetcher, parseRows]);

  useEffect(() => {
    reload();
  }, [reload]);

  useEffect(() => {
    if (!autoRefreshMs) return;
    const id = setInterval(reload, autoRefreshMs);
    return () => clearInterval(id);
  }, [autoRefreshMs, reload]);

  const hasCrud = !!(createFn || updateFn || deleteFn);

  const handleSubmit = async (values: Record<string, any>) => {
    setSaving(true);
    try {
      if (editRow && updateFn) await updateFn(String(editRow.id), values);
      else if (createFn) await createFn(values);
      notify(editRow ? `${name} updated` : `${name} created`);
      setFormOpen(false);
      setEditRow(null);
      await reload();
    } catch (e: any) {
      notify(e?.response?.data?.error || 'Operation failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteRow || !deleteFn) return;
    setSaving(true);
    try {
      await deleteFn(String(deleteRow.id));
      notify(`${name} deleted`);
      await reload();
    } catch (e: any) {
      notify(e?.response?.data?.error || 'Delete failed', 'error');
    } finally {
      setSaving(false);
      setDeleteRow(null);
    }
  };

  const cols: GridColDef[] = useMemo(() => {
    const showActions = (hasCrud && (updateFn || deleteFn)) || rowActions;
    if (!showActions) return columns;
    return [
      ...columns,
      {
        field: '__actions',
        headerName: 'Actions',
        width: rowActions ? 160 : 110,
        sortable: false,
        filterable: false,
        renderCell: (params: GridRenderCellParams) => (
          <Stack direction="row" spacing={0.5} alignItems="center">
            {rowActions && rowActions(params.row, reload, notify)}
            {updateFn && formFields && (
              <Tooltip title="Edit">
                <IconButton
                  size="small"
                  onClick={() => {
                    setEditRow(params.row);
                    setFormOpen(true);
                  }}
                  sx={{ color: '#14532d' }}
                >
                  <EditOutlined fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {deleteFn && (
              <Tooltip title="Delete">
                <IconButton size="small" onClick={() => setDeleteRow(params.row)} sx={{ color: '#c62828' }}>
                  <DeleteOutline fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Stack>
        ),
      },
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columns, hasCrud, rowActions]);

  return (
    <Box>
      <PageHeader
        title={title}
        subtitle={subtitle}
        action={
          createFn && formFields
            ? {
                label: addLabel || `Add ${name}`,
                onClick: () => {
                  setEditRow(null);
                  setFormOpen(true);
                },
              }
            : undefined
        }
      />

      {toolbar}

      <DataTable rows={rows} columns={cols} loading={loading} getRowId={getRowId || ((r) => r.id)} autoHeight />

      {formFields && (
        <FormDialog
          open={formOpen}
          title={editRow ? `Edit ${name}` : `Add ${name}`}
          fields={formFields}
          initialValues={editRow || undefined}
          isEdit={!!editRow}
          loading={saving}
          onSubmit={handleSubmit}
          onCancel={() => {
            setFormOpen(false);
            setEditRow(null);
          }}
        />
      )}

      <ConfirmDialog
        open={!!deleteRow}
        title={`Delete ${name}`}
        message={`Are you sure you want to delete this ${name.toLowerCase()}? This action cannot be undone.`}
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

export default ResourceListPage;
