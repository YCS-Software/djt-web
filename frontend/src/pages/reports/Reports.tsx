import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Card,
  CardContent,
  Tabs,
  Tab,
  TextField,
  Button,
  MenuItem,
  Stack,
} from '@mui/material';
import { FileDownloadOutlined, PlayArrowOutlined } from '@mui/icons-material';
import { GridColDef } from '@mui/x-data-grid';
import { AppDispatch, RootState } from '../../store';
import { fetchReportMeta, generateReport } from '../../features/reports/reportsSlice';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';

const GREEN = '#14532d';
const CARD_BORDER = '#eef0f3';
const LABEL = '#8a94a6';

const daysAgo = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
};

const cardSx = {
  border: `1px solid ${CARD_BORDER}`,
  borderRadius: 2,
  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
} as const;

const Reports: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { meta, columns, rows, loadingMeta, generating } = useSelector(
    (s: RootState) => (s as any).reports
  );

  const [tab, setTab] = useState(0);
  const [startDate, setStartDate] = useState(daysAgo(30));
  const [endDate, setEndDate] = useState(daysAgo(0));
  const [filter, setFilter] = useState('');

  useEffect(() => {
    dispatch(fetchReportMeta());
  }, [dispatch]);

  const active = meta[tab];

  const run = useMemo(
    () => () => {
      if (!active) return;
      const params: any = { type: active.type };
      if (active.hasDateRange) {
        params.startDate = startDate;
        params.endDate = endDate;
      }
      if (filter) params.filter = filter;
      dispatch(generateReport(params));
    },
    [dispatch, active, startDate, endDate, filter]
  );

  // Run a report whenever the selected type changes (and once meta loads).
  useEffect(() => {
    setFilter('');
    if (active) run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, meta.length]);

  const gridColumns: GridColDef[] = useMemo(
    () => (columns || []).map((c: any) => ({ field: c.field, headerName: c.headerName, flex: 1, minWidth: 130 })),
    [columns]
  );

  const exportCsv = () => {
    if (!rows.length) return;
    const header = gridColumns.map((c) => c.headerName || c.field).join(',');
    const lines = rows.map((r: any) =>
      gridColumns
        .map((c) => {
          const v = r[c.field as string];
          const s = v === null || v === undefined ? '' : String(v);
          return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
        })
        .join(',')
    );
    const csv = [header, ...lines].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${active?.type || 'report'}-${startDate}_to_${endDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Box>
      <PageHeader title="Reports" subtitle="Generate and export operational reports by type" />

      <Card elevation={0} sx={{ ...cardSx, mb: 2.5 }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            borderBottom: `1px solid ${CARD_BORDER}`,
            '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, color: LABEL },
            '& .Mui-selected': { color: `${GREEN} !important` },
            '& .MuiTabs-indicator': { backgroundColor: GREEN },
          }}
        >
          {(meta.length ? meta : [{ label: loadingMeta ? 'Loading…' : 'Reports' }]).map(
            (r: any, i: number) => (
              <Tab key={r.type || i} label={r.label} />
            )
          )}
        </Tabs>

        <CardContent>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
            {active?.hasDateRange && (
              <>
                <TextField
                  label="Start Date"
                  type="date"
                  size="small"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  label="End Date"
                  type="date"
                  size="small"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </>
            )}
            {active?.filterOptions?.length > 0 && (
              <TextField
                select
                label="Filter By"
                size="small"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                sx={{ minWidth: 160 }}
              >
                <MenuItem value="">All</MenuItem>
                {active.filterOptions.map((o: string) => (
                  <MenuItem key={o} value={o} sx={{ textTransform: 'capitalize' }}>
                    {o}
                  </MenuItem>
                ))}
              </TextField>
            )}
            <Button
              variant="contained"
              startIcon={<PlayArrowOutlined />}
              onClick={run}
              disabled={generating || !active}
              sx={{ bgcolor: GREEN, '&:hover': { bgcolor: '#0f3d22' }, textTransform: 'none', fontWeight: 600 }}
            >
              Run Report
            </Button>
            <Box flex={1} />
            <Button
              variant="outlined"
              startIcon={<FileDownloadOutlined />}
              onClick={exportCsv}
              disabled={!rows.length}
              sx={{ color: GREEN, borderColor: GREEN, textTransform: 'none', fontWeight: 600 }}
            >
              Export CSV
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <DataTable
        rows={rows}
        columns={gridColumns}
        loading={generating || loadingMeta}
        getRowId={(r) => r.id}
        autoHeight
      />
    </Box>
  );
};

export default Reports;
