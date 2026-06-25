import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  TextField,
  MenuItem,
  Button,
  Typography,
  Stack,
} from '@mui/material';
import { DownloadOutlined, QrCode2Outlined } from '@mui/icons-material';
import PageHeader from '../../components/common/PageHeader';
import { stationsApi } from '../../services/api';

const GREEN = '#14532d';

const QrGenerator: React.FC = () => {
  const [stations, setStations] = useState<any[]>([]);
  const [stationId, setStationId] = useState('');
  const [custom, setCustom] = useState('');
  const [size, setSize] = useState('300');

  useEffect(() => {
    stationsApi
      .list()
      .then((r) => setStations((r.data?.rows || r.data?.data || r.data || []) as any[]))
      .catch(() => setStations([]));
  }, []);

  const station = stations.find((s) => String(s.id) === stationId);
  const data = useMemo(() => {
    if (custom.trim()) return custom.trim();
    if (station) return `https://djt-ev.web.app/charge/${station.code || station.id}`;
    return '';
  }, [custom, station]);

  const qrUrl = data
    ? `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(data)}`
    : '';

  const download = async () => {
    if (!qrUrl) return;
    try {
      const res = await fetch(qrUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `qr-${station?.code || 'djt-ev'}.png`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      window.open(qrUrl, '_blank');
    }
  };

  return (
    <Box>
      <PageHeader title="QR Generator" subtitle="Generate and download QR codes for stations & connectors" />
      <Grid container spacing={2.5}>
        <Grid item xs={12} md={6}>
          <Card elevation={0} sx={{ border: '1px solid #eef0f3', borderRadius: 2 }}>
            <CardContent>
              <Typography sx={{ fontSize: 14, fontWeight: 700, color: '#2f3b52', mb: 2 }}>
                QR Content
              </Typography>
              <Stack spacing={2}>
                <TextField select label="Station" value={stationId} onChange={(e) => setStationId(e.target.value)} size="small" fullWidth>
                  <MenuItem value="">— Select a station —</MenuItem>
                  {stations.map((s) => (
                    <MenuItem key={s.id} value={String(s.id)}>
                      {s.name} {s.code ? `(${s.code})` : ''}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  label="Custom URL / text (overrides station)"
                  value={custom}
                  onChange={(e) => setCustom(e.target.value)}
                  size="small"
                  fullWidth
                  placeholder="https://…"
                />
                <TextField select label="Size (px)" value={size} onChange={(e) => setSize(e.target.value)} size="small" sx={{ maxWidth: 160 }}>
                  {['200', '300', '400', '512'].map((s) => (
                    <MenuItem key={s} value={s}>
                      {s} × {s}
                    </MenuItem>
                  ))}
                </TextField>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card elevation={0} sx={{ border: '1px solid #eef0f3', borderRadius: 2, height: '100%' }}>
            <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 360 }}>
              {qrUrl ? (
                <>
                  <Box component="img" src={qrUrl} alt="QR code" sx={{ width: 260, height: 260, borderRadius: 1 }} />
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, wordBreak: 'break-all', textAlign: 'center', maxWidth: 300 }}>
                    {data}
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<DownloadOutlined />}
                    onClick={download}
                    sx={{ mt: 2, bgcolor: GREEN, '&:hover': { bgcolor: '#0f3d22' }, textTransform: 'none', fontWeight: 600 }}
                  >
                    Download PNG
                  </Button>
                </>
              ) : (
                <Stack alignItems="center" spacing={1} sx={{ color: '#9aa5b1' }}>
                  <QrCode2Outlined sx={{ fontSize: 64 }} />
                  <Typography>Select a station or enter custom text</Typography>
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default QrGenerator;
