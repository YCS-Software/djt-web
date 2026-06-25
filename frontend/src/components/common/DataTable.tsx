import React from 'react';
import {
  DataGrid,
  GridColDef,
  GridRowsProp,
  GridToolbar,
  GridPaginationModel,
  GridRenderCellParams,
  GridOverlay,
} from '@mui/x-data-grid';
import { Box, Paper, Chip, Typography } from '@mui/material';
import { InboxOutlined } from '@mui/icons-material';

// Polished empty state shown when a grid has no rows.
const NoRowsOverlay: React.FC = () => (
  <GridOverlay>
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, color: '#9aa5b1' }}>
      <InboxOutlined sx={{ fontSize: 44 }} />
      <Typography sx={{ fontSize: 14, fontWeight: 500 }}>No data available</Typography>
    </Box>
  </GridOverlay>
);

interface DataTableProps {
  rows: GridRowsProp;
  columns: GridColDef[];
  loading?: boolean;
  pageSize?: number;
  rowCount?: number;
  page?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  onRowClick?: (params: any) => void;
  checkboxSelection?: boolean;
  onSelectionChange?: (ids: string[]) => void;
  toolbar?: boolean;
  autoHeight?: boolean;
  getRowId?: (row: any) => string;
}

// Status -> color bucket, used to render status cells as colored chips.
const statusColor = (raw: any): { bg: string; fg: string } => {
  const v = String(raw || '').toLowerCase();
  if (/(active|completed|finished|approved|paid|success|available|resolved|online)/.test(v))
    return { bg: 'rgba(46,125,50,0.12)', fg: '#2e7d32' };
  if (/(inactive|revoked|rejected|failed|cancelled|canceled|error|disputed|blocked|offline)/.test(v))
    return { bg: 'rgba(211,47,47,0.12)', fg: '#c62828' };
  if (/(pending|unknown|planned|created|processing|scheduled)/.test(v))
    return { bg: 'rgba(237,108,2,0.14)', fg: '#e65100' };
  return { bg: 'rgba(20,83,45,0.10)', fg: '#14532d' };
};

const StatusChip: React.FC<{ value: any }> = ({ value }) => {
  if (value === null || value === undefined || value === '') return <span>—</span>;
  const c = statusColor(value);
  return (
    <Chip
      label={String(value)}
      size="small"
      sx={{ bgcolor: c.bg, color: c.fg, fontWeight: 600, borderRadius: 1, textTransform: 'capitalize' }}
    />
  );
};

const DataTable: React.FC<DataTableProps> = ({
  rows,
  columns,
  loading = false,
  pageSize = 20,
  rowCount,
  page = 0,
  onPageChange,
  onPageSizeChange,
  onRowClick,
  checkboxSelection = false,
  onSelectionChange,
  toolbar = true,
  autoHeight = false,
  getRowId,
}) => {
  const handlePaginationChange = (model: GridPaginationModel) => {
    if (onPageChange) onPageChange(model.page);
    if (onPageSizeChange) onPageSizeChange(model.pageSize);
  };

  // Auto-render any `status` column as a colored chip (unless the page already
  // supplied a custom renderCell).
  const enhancedColumns: GridColDef[] = columns.map((col) =>
    col.field === 'status' && !col.renderCell
      ? { ...col, renderCell: (params: GridRenderCellParams) => <StatusChip value={params.value} /> }
      : col
  );

  return (
    <Paper
      elevation={0}
      sx={{
        width: '100%',
        overflow: 'hidden',
        border: '1px solid #eef0f3',
        borderRadius: 2,
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}
    >
      <Box sx={{ height: autoHeight ? 'auto' : 600, width: '100%' }}>
        <DataGrid
          rows={rows}
          columns={enhancedColumns}
          loading={loading}
          pageSizeOptions={[10, 20, 50, 100]}
          initialState={{ pagination: { paginationModel: { page, pageSize } } }}
          paginationModel={rowCount ? { page, pageSize } : undefined}
          onPaginationModelChange={handlePaginationChange}
          paginationMode={rowCount ? 'server' : 'client'}
          rowCount={rowCount}
          checkboxSelection={checkboxSelection}
          onRowSelectionModelChange={(ids) => {
            if (onSelectionChange) onSelectionChange(ids as string[]);
          }}
          onRowClick={onRowClick}
          getRowId={getRowId || ((row) => row.id)}
          slots={{ ...(toolbar ? { toolbar: GridToolbar } : {}), noRowsOverlay: NoRowsOverlay }}
          slotProps={{
            toolbar: { showQuickFilter: true, quickFilterProps: { debounceMs: 400 } },
          }}
          disableRowSelectionOnClick
          autoHeight={autoHeight}
          sx={{
            border: 'none',
            '& .MuiDataGrid-columnHeaders': {
              bgcolor: '#f4f8f5',
              color: '#2f3b52',
            },
            '& .MuiDataGrid-columnHeaderTitle': { fontWeight: 700 },
            '& .MuiDataGrid-cell': { borderColor: '#f0f2f4' },
            '& .MuiDataGrid-row:hover': {
              bgcolor: 'rgba(20,83,45,0.05)',
              cursor: onRowClick ? 'pointer' : 'default',
            },
            '& .MuiDataGrid-footerContainer': { borderColor: '#eef0f3' },
          }}
        />
      </Box>
    </Paper>
  );
};

export default DataTable;
