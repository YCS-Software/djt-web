import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { reportsApi } from '../../services/api';

export interface ReportColumn {
  field: string;
  headerName: string;
}

export interface ReportTypeMeta {
  type: string;
  label: string;
  columns: ReportColumn[];
  hasDateRange: boolean;
  filterOptions: string[];
}

interface State {
  meta: ReportTypeMeta[];
  columns: ReportColumn[];
  rows: any[];
  loadingMeta: boolean;
  generating: boolean;
  error: string | null;
}

const initialState: State = {
  meta: [],
  columns: [],
  rows: [],
  loadingMeta: false,
  generating: false,
  error: null,
};

export const fetchReportMeta = createAsyncThunk(
  'reports/meta',
  async (_: void, { rejectWithValue }) => {
    try {
      const r = await reportsApi.meta();
      return (r.data.reports || []) as ReportTypeMeta[];
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.error || 'Failed to load report types');
    }
  }
);

export const generateReport = createAsyncThunk(
  'reports/generate',
  async (
    params: { type: string; startDate?: string; endDate?: string; filter?: string },
    { rejectWithValue }
  ) => {
    try {
      const r = await reportsApi.generate(params);
      const rows = (r.data.rows || []).map((row: any, i: number) => ({ id: row.id ?? i, ...row }));
      return { columns: (r.data.columns || []) as ReportColumn[], rows };
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.error || 'Failed to generate report');
    }
  }
);

const slice = createSlice({
  name: 'reports',
  initialState,
  reducers: {
    clearReport: (s) => {
      s.rows = [];
      s.columns = [];
    },
  },
  extraReducers: (b) => {
    b.addCase(fetchReportMeta.pending, (s) => { s.loadingMeta = true; s.error = null; });
    b.addCase(fetchReportMeta.fulfilled, (s, a) => { s.loadingMeta = false; s.meta = a.payload; });
    b.addCase(fetchReportMeta.rejected, (s, a) => { s.loadingMeta = false; s.error = a.payload as string; });

    b.addCase(generateReport.pending, (s) => { s.generating = true; s.error = null; });
    b.addCase(generateReport.fulfilled, (s, a) => {
      s.generating = false;
      s.columns = a.payload.columns;
      s.rows = a.payload.rows;
    });
    b.addCase(generateReport.rejected, (s, a) => { s.generating = false; s.error = a.payload as string; });
  },
});

export const { clearReport } = slice.actions;
export default slice.reducer;
