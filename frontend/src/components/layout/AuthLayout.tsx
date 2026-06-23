import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Box, Paper, Typography, Stack } from '@mui/material';
import {
  EvStation,
  QrCode2,
  LocationOn,
  BoltOutlined,
} from '@mui/icons-material';
import { RootState } from '../../store';

/**
 * Inline SVG brand scene for the auth left panel.
 * Pure CSS/SVG — no external/network assets. Depicts a stylized map with
 * electric station location pins, a charging bolt, and a QR payment square.
 */
const BrandScene: React.FC = () => (
  <Box
    component="svg"
    viewBox="0 0 400 300"
    sx={{
      width: '100%',
      maxWidth: 460,
      height: 'auto',
      display: 'block',
      filter: 'drop-shadow(0 12px 28px rgba(0,0,0,0.35))',
    }}
    role="img"
    aria-label="EV charging stations on a map with QR wallet payments"
  >
    <defs>
      <linearGradient id="cardGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#0b3d2e" />
        <stop offset="100%" stopColor="#06241b" />
      </linearGradient>
      <linearGradient id="boltGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#69F0AE" />
        <stop offset="100%" stopColor="#00C853" />
      </linearGradient>
      <radialGradient id="pinGlow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#69F0AE" stopOpacity="0.55" />
        <stop offset="100%" stopColor="#69F0AE" stopOpacity="0" />
      </radialGradient>
    </defs>

    {/* Map card */}
    <rect x="20" y="24" width="360" height="252" rx="20" fill="url(#cardGrad)" />
    <rect
      x="20"
      y="24"
      width="360"
      height="252"
      rx="20"
      fill="none"
      stroke="#1de9b6"
      strokeOpacity="0.22"
    />

    {/* Map roads / routes */}
    <g stroke="#1de9b6" strokeOpacity="0.28" strokeWidth="2" fill="none">
      <path d="M40 120 C120 80, 180 170, 360 110" strokeDasharray="6 8" />
      <path d="M60 230 C150 200, 200 250, 350 210" strokeDasharray="6 8" />
      <path d="M120 40 L150 260" strokeOpacity="0.14" />
      <path d="M250 40 L270 260" strokeOpacity="0.14" />
    </g>

    {/* Location pins (electric stations) */}
    <g>
      <circle cx="110" cy="110" r="22" fill="url(#pinGlow)" />
      <path
        d="M110 90 a14 14 0 0 1 14 14 c0 11 -14 24 -14 24 s-14 -13 -14 -24 a14 14 0 0 1 14 -14 z"
        fill="#00C853"
      />
      <circle cx="110" cy="104" r="6" fill="#06241b" />
    </g>
    <g>
      <circle cx="300" cy="200" r="18" fill="url(#pinGlow)" />
      <path
        d="M300 184 a11 11 0 0 1 11 11 c0 9 -11 19 -11 19 s-11 -10 -11 -19 a11 11 0 0 1 11 -11 z"
        fill="#69F0AE"
      />
      <circle cx="300" cy="195" r="4.5" fill="#06241b" />
    </g>

    {/* Charging bolt badge */}
    <g transform="translate(196 70)">
      <circle r="30" fill="#06241b" stroke="#00C853" strokeWidth="2" />
      <path
        d="M6 -16 L-10 4 L-1 4 L-6 16 L10 -4 L1 -4 Z"
        fill="url(#boltGrad)"
      />
    </g>

    {/* QR payment square */}
    <g transform="translate(232 152)">
      <rect width="92" height="92" rx="12" fill="#ffffff" />
      <g fill="#06241b">
        <rect x="12" y="12" width="22" height="22" rx="3" />
        <rect x="18" y="18" width="10" height="10" fill="#ffffff" />
        <rect x="58" y="12" width="22" height="22" rx="3" />
        <rect x="64" y="18" width="10" height="10" fill="#ffffff" />
        <rect x="12" y="58" width="22" height="22" rx="3" />
        <rect x="18" y="64" width="10" height="10" fill="#ffffff" />
        <rect x="44" y="12" width="6" height="6" />
        <rect x="44" y="24" width="6" height="6" />
        <rect x="44" y="44" width="6" height="6" />
        <rect x="56" y="44" width="6" height="6" />
        <rect x="68" y="44" width="12" height="6" />
        <rect x="44" y="56" width="6" height="24" />
        <rect x="56" y="68" width="12" height="12" />
        <rect x="74" y="56" width="6" height="6" />
        <rect x="74" y="74" width="6" height="6" />
      </g>
    </g>
  </Box>
);

const features = [
  { icon: <LocationOn fontSize="small" />, label: 'Live station map' },
  { icon: <QrCode2 fontSize="small" />, label: 'QR wallet top-ups' },
  { icon: <BoltOutlined fontSize="small" />, label: 'Real-time analytics' },
];

const AuthLayout: React.FC = () => {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex' }}>
      {/* Left branded visual panel — hidden on small screens */}
      <Box
        sx={{
          flex: { md: '1 1 52%', lg: '1 1 58%' },
          display: { xs: 'none', md: 'flex' },
          position: 'relative',
          flexDirection: 'column',
          justifyContent: 'space-between',
          overflow: 'hidden',
          color: '#E8F5E9',
          p: { md: 5, lg: 7 },
          background:
            'linear-gradient(135deg, #06241b 0%, #0b3d2e 45%, #0a5c46 100%)',
        }}
      >
        {/* Subtle circuit / grid overlay */}
        <Box
          aria-hidden
          sx={{
            position: 'absolute',
            inset: 0,
            opacity: 0.5,
            backgroundImage:
              'linear-gradient(rgba(29,233,182,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(29,233,182,0.06) 1px, transparent 1px)',
            backgroundSize: '38px 38px',
            maskImage:
              'radial-gradient(circle at 30% 30%, black, transparent 80%)',
            WebkitMaskImage:
              'radial-gradient(circle at 30% 30%, black, transparent 80%)',
          }}
        />
        {/* Accent glow */}
        <Box
          aria-hidden
          sx={{
            position: 'absolute',
            top: '-10%',
            right: '-10%',
            width: 420,
            height: 420,
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(0,200,83,0.28) 0%, rgba(0,200,83,0) 70%)',
          }}
        />

        {/* Brand */}
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background:
                  'linear-gradient(135deg, #00C853 0%, #69F0AE 100%)',
                boxShadow: '0 6px 18px rgba(0,200,83,0.45)',
              }}
            >
              <EvStation sx={{ color: '#06241b', fontSize: 28 }} />
            </Box>
            <Box>
              <Typography
                variant="h5"
                fontWeight={800}
                sx={{ lineHeight: 1, letterSpacing: 0.5 }}
              >
                DJT EV
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: 'rgba(232,245,233,0.7)' }}
              >
                Smart EV Charging • Stations • Wallet
              </Typography>
            </Box>
          </Stack>
        </Box>

        {/* Centerpiece scene + headline */}
        <Box
          sx={{
            position: 'relative',
            zIndex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: 3,
          }}
        >
          <BrandScene />
          <Box>
            <Typography
              variant="h4"
              fontWeight={700}
              sx={{ maxWidth: 420, lineHeight: 1.25 }}
            >
              Power every charge, station, and payment from one console.
            </Typography>
            <Typography
              variant="body1"
              sx={{ mt: 1.5, maxWidth: 420, color: 'rgba(232,245,233,0.75)' }}
            >
              Map your network, manage QR wallet transfers, and monitor charging
              in real time.
            </Typography>
          </Box>
        </Box>

        {/* Feature highlights */}
        <Stack
          direction="row"
          spacing={3}
          flexWrap="wrap"
          useFlexGap
          sx={{ position: 'relative', zIndex: 1 }}
        >
          {features.map((f) => (
            <Stack
              key={f.label}
              direction="row"
              spacing={1}
              alignItems="center"
              sx={{ color: 'rgba(232,245,233,0.92)' }}
            >
              <Box
                sx={{
                  display: 'flex',
                  color: '#69F0AE',
                }}
              >
                {f.icon}
              </Box>
              <Typography variant="body2" fontWeight={500}>
                {f.label}
              </Typography>
            </Stack>
          ))}
        </Stack>
      </Box>

      {/* Right form panel */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.default',
          p: { xs: 2, sm: 4 },
        }}
      >
        <Paper
          elevation={0}
          sx={{
            width: '100%',
            maxWidth: 420,
            p: { xs: 3, sm: 5 },
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            boxShadow: '0 12px 40px rgba(0,0,0,0.06)',
          }}
        >
          {/* Compact brand for small screens (left panel hidden) */}
          <Box
            sx={{
              display: { xs: 'flex', md: 'none' },
              alignItems: 'center',
              gap: 1.5,
              mb: 3,
            }}
          >
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'primary.main',
              }}
            >
              <EvStation sx={{ color: 'white', fontSize: 26 }} />
            </Box>
            <Typography variant="h6" fontWeight={800} color="primary">
              DJT EV
            </Typography>
          </Box>

          <Outlet />
        </Paper>
      </Box>
    </Box>
  );
};

export default AuthLayout;
