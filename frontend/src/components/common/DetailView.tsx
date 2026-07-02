import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  CircularProgress,
  Chip,
  Divider,
} from '@mui/material';
import PageHeader from './PageHeader';

const LABEL = '#8a94a6';
const VALUE = '#2f3b52';
const CARD_BORDER = '#eef0f3';

export interface DetailField {
  key: string;
  label: string;
  /** Custom formatter; receives the raw value and the whole row. */
  format?: (value: any, row: any) => React.ReactNode;
  /** Render as a status chip. */
  status?: boolean;
  /** Span the full row width. */
  full?: boolean;
}

export interface DetailSection {
  heading?: string;
  fields: DetailField[];
}

interface DetailViewProps {
  title: string;
  subtitle?: string;
  /** axios-style fetcher: (id) => Promise resolving to { data: { row } }. */
  fetcher: (id: string) => Promise<any>;
  sections: DetailSection[];
  /** Field used for the header status chip, if present on the row. */
  titleKey?: string;
  /** Extra content rendered below the field cards (e.g. related tables). */
  children?: (row: any) => React.ReactNode;
}

const chipColor = (raw: any): { bg: string; fg: string } => {
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
  if (value === null || value === undefined || value === '') return <>—</>;
  const c = chipColor(value);
  return (
    <Chip
      label={String(value)}
      size="small"
      sx={{ bgcolor: c.bg, color: c.fg, fontWeight: 600, borderRadius: 1, textTransform: 'capitalize' }}
    />
  );
};

const renderValue = (f: DetailField, row: any): React.ReactNode => {
  const raw = row[f.key];
  if (f.format) return f.format(raw, row);
  if (f.status) return <StatusChip value={raw} />;
  if (raw === null || raw === undefined || raw === '') return '—';
  return String(raw);
};

/**
 * Generic read-only detail page. Reads `:id` from the route, calls `fetcher(id)`,
 * expects `{ data: { row } }` (the djt-app convention), and renders labelled
 * field cards grouped into sections. Handles loading / not-found gracefully.
 */
const DetailView: React.FC<DetailViewProps> = ({
  title,
  subtitle,
  fetcher,
  sections,
  titleKey = 'status',
  children,
}) => {
  const { id } = useParams<{ id: string }>();
  const [row, setRow] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    fetcher(String(id))
      .then((res) => {
        if (!active) return;
        const data = res?.data ?? res;
        setRow(data?.row ?? data?.data ?? data ?? null);
      })
      .catch((e) => active && setError(e?.response?.data?.message || 'Failed to load record'))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [fetcher, id]);

  return (
    <Box>
      <PageHeader title={title} subtitle={subtitle} backButton />

      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight={240}>
          <CircularProgress sx={{ color: '#14532d' }} />
        </Box>
      ) : error || !row ? (
        <Card elevation={0} sx={{ border: `1px solid ${CARD_BORDER}`, borderRadius: 2 }}>
          <CardContent>
            <Typography color="text.secondary">{error || 'Record not found.'}</Typography>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Header summary */}
          <Card elevation={0} sx={{ border: `1px solid ${CARD_BORDER}`, borderRadius: 2, mb: 2.5 }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
              <Typography sx={{ fontSize: 20, fontWeight: 800, color: VALUE }}>
                {row.name || row.sessionCode || row.code || `#${row.id}`}
              </Typography>
              {row[titleKey] !== undefined && titleKey !== 'status' && (
                <Typography sx={{ color: LABEL }}>{String(row[titleKey])}</Typography>
              )}
              {row.status !== undefined && <StatusChip value={row.status} />}
            </CardContent>
          </Card>

          {sections.map((section, si) => (
            <Card
              key={si}
              elevation={0}
              sx={{ border: `1px solid ${CARD_BORDER}`, borderRadius: 2, mb: 2.5 }}
            >
              <CardContent>
                {section.heading && (
                  <>
                    <Typography sx={{ fontSize: 14, fontWeight: 700, color: VALUE, mb: 2 }}>
                      {section.heading}
                    </Typography>
                    <Divider sx={{ mb: 2, borderColor: CARD_BORDER }} />
                  </>
                )}
                <Grid container spacing={2.5}>
                  {section.fields.map((f) => (
                    <Grid item xs={12} sm={f.full ? 12 : 6} md={f.full ? 12 : 4} key={f.key}>
                      <Typography sx={{ fontSize: 12, color: LABEL, fontWeight: 500, mb: 0.5 }}>
                        {f.label}
                      </Typography>
                      <Box sx={{ fontSize: 14.5, fontWeight: 600, color: VALUE }}>
                        {renderValue(f, row)}
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          ))}

          {children && children(row)}
        </>
      )}
    </Box>
  );
};

export default DetailView;
