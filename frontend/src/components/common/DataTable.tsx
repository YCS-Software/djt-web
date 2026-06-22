import React from 'react';
import {
  DataGrid,
  GridColDef,
  GridRowsProp,
  GridToolbar,
  GridPaginationModel,
} from '@mui/x-data-grid';
import { Box, Paper } from '@mui/material';

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
    if (onPageChange) {
      onPageChange(model.page);
    }
    if (onPageSizeChange) {
      onPageSizeChange(model.pageSize);
    }
  };

  return (
    <Paper sx={{ width: '100%', overflow: 'hidden' }}>
      <Box sx={{ height: autoHeight ? 'auto' : 600, width: '100%' }}>
        <DataGrid
          rows={rows}
          columns={columns}
          loading={loading}
          pageSizeOptions={[10, 20, 50, 100]}
          paginationModel={{ page, pageSize }}
          onPaginationModelChange={handlePaginationChange}
          paginationMode={rowCount ? 'server' : 'client'}
          rowCount={rowCount}
          checkboxSelection={checkboxSelection}
          onRowSelectionModelChange={(ids) => {
            if (onSelectionChange) {
              onSelectionChange(ids as string[]);
            }
          }}
          onRowClick={onRowClick}
          getRowId={getRowId || ((row) => row.id)}
          slots={toolbar ? { toolbar: GridToolbar } : {}}
          slotProps={{
            toolbar: {
              showQuickFilter: true,
              quickFilterProps: { debounceMs: 500 },
            },
          }}
          disableRowSelectionOnClick
          autoHeight={autoHeight}
          sx={{
            border: 'none',
            '& .MuiDataGrid-columnHeaders': {
              bgcolor: 'grey.50',
            },
            '& .MuiDataGrid-row:hover': {
              bgcolor: 'action.hover',
              cursor: onRowClick ? 'pointer' : 'default',
            },
          }}
        />
      </Box>
    </Paper>
  );
};

export default DataTable;
