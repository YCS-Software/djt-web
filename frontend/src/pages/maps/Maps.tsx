import React, { useEffect, useState } from 'react';
import { Box, Card, CircularProgress, Chip, Stack } from '@mui/material';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import PageHeader from '../../components/common/PageHeader';
import { locationsApi, stationsApi } from '../../services/api';

// Green SVG pin as a DivIcon — avoids missing default-marker asset issues.
const pin = (color: string) =>
  L.divIcon({
    className: 'djt-pin',
    html: `<svg width="28" height="38" viewBox="0 0 28 38" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 0C6.27 0 0 6.27 0 14c0 9.5 14 24 14 24s14-14.5 14-24C28 6.27 21.73 0 14 0z" fill="${color}"/>
      <circle cx="14" cy="14" r="6" fill="#fff"/></svg>`,
    iconSize: [28, 38],
    iconAnchor: [14, 38],
    popupAnchor: [0, -34],
  });

const LOC_PIN = pin('#14532d');
const STN_PIN = pin('#1565c0');

interface Point {
  id: string;
  name: string;
  lat: number;
  lng: number;
  type: 'location' | 'station';
  meta?: string;
}

const toNum = (v: any) => {
  const n = Number(v);
  return isNaN(n) ? null : n;
};

const Maps: React.FC = () => {
  const [points, setPoints] = useState<Point[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const pts: Point[] = [];
      try {
        const locs = await locationsApi.list();
        const rows = locs.data?.rows || locs.data?.data || locs.data || [];
        (rows as any[]).forEach((r) => {
          const lat = toNum(r.latitude ?? r.lat);
          const lng = toNum(r.longitude ?? r.lng);
          if (lat !== null && lng !== null)
            pts.push({ id: `l-${r.id}`, name: r.name || 'Location', lat, lng, type: 'location', meta: r.city });
        });
      } catch {
        /* ignore */
      }
      try {
        const stns = await stationsApi.list();
        const rows = stns.data?.rows || stns.data?.data || stns.data || [];
        (rows as any[]).forEach((r) => {
          const lat = toNum(r.latitude ?? r.lat);
          const lng = toNum(r.longitude ?? r.lng);
          if (lat !== null && lng !== null)
            pts.push({ id: `s-${r.id}`, name: r.name || 'Station', lat, lng, type: 'station', meta: r.status });
        });
      } catch {
        /* ignore */
      }
      setPoints(pts);
      setLoading(false);
    })();
  }, []);

  const center: [number, number] = points.length ? [points[0].lat, points[0].lng] : [20.5937, 78.9629];

  return (
    <Box>
      <PageHeader title="Maps" subtitle="Geographic view of locations and charging stations" />
      <Stack direction="row" spacing={1.5} mb={2}>
        <Chip size="small" label={`Locations: ${points.filter((p) => p.type === 'location').length}`} sx={{ bgcolor: 'rgba(20,83,45,0.12)', color: '#14532d', fontWeight: 600 }} />
        <Chip size="small" label={`Stations: ${points.filter((p) => p.type === 'station').length}`} sx={{ bgcolor: 'rgba(21,101,192,0.12)', color: '#1565c0', fontWeight: 600 }} />
      </Stack>
      <Card elevation={0} sx={{ border: '1px solid #eef0f3', borderRadius: 2, overflow: 'hidden', height: 560 }}>
        {loading ? (
          <Box display="flex" alignItems="center" justifyContent="center" height="100%">
            <CircularProgress sx={{ color: '#14532d' }} />
          </Box>
        ) : (
          <MapContainer center={center} zoom={points.length ? 6 : 5} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              attribution='&copy; OpenStreetMap contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {points.map((p) => (
              <Marker key={p.id} position={[p.lat, p.lng]} icon={p.type === 'location' ? LOC_PIN : STN_PIN}>
                <Popup>
                  <strong>{p.name}</strong>
                  <br />
                  {p.type === 'location' ? 'Location' : 'Station'}
                  {p.meta ? ` • ${p.meta}` : ''}
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        )}
      </Card>
    </Box>
  );
};

export default Maps;
