import React from 'react';
import { Button } from '@mui/material';
import { PaidOutlined } from '@mui/icons-material';
import { GridColDef } from '@mui/x-data-grid';
import ResourceListPage from '../../components/common/ResourceListPage';
import { settlementsApi } from '../../services/api';

const num = (p: any) => {
  const n = Number(p.value);
  return isNaN(n) ? (p.value ?? '') : n.toFixed(2);
};

const columns: GridColDef[] = [
  { field: 'partnerName', headerName: 'Partner', flex: 1, minWidth: 160 },
  { field: 'period', headerName: 'Period', flex: 1, minWidth: 130 },
  { field: 'totalRevenue', headerName: 'Revenue', width: 130, valueFormatter: num },
  { field: 'commission', headerName: 'Commission', width: 130, valueFormatter: num },
  { field: 'settlementAmount', headerName: 'Settlement', width: 130, valueFormatter: num },
  { field: 'status', headerName: 'Status', width: 130 },
];

const Settlements: React.FC = () => (
  <ResourceListPage
    title="Settlements"
    subtitle="Partner revenue settlements and payouts"
    entityName="Settlement"
    columns={columns}
    fetcher={settlementsApi.list}
    rowActions={(row, reload, notify) =>
      row.status !== 'settled' ? (
        <Button
          size="small"
          startIcon={<PaidOutlined fontSize="small" />}
          onClick={async () => {
            try {
              await settlementsApi.markSettled(String(row.id));
              notify('Settlement marked as settled');
              reload();
            } catch {
              notify('Failed to settle', 'error');
            }
          }}
          sx={{ textTransform: 'none', color: '#14532d' }}
        >
          Settle
        </Button>
      ) : null
    }
  />
);

export default Settlements;
