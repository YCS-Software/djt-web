import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Box, Paper, Typography, Stack, Grid } from '@mui/material';
import { keyframes } from '@mui/system';
import {
  EvStationOutlined,
  BoltOutlined,
  PersonOutlineOutlined,
  EventNoteOutlined,
  InsightsOutlined,
  AccountBalanceWalletOutlined,
  ShieldOutlined,
} from '@mui/icons-material';
import { RootState } from '../../store';
import BrandLogo from '../common/BrandLogo';

// ── Dark forest palette ──────────────────────────────────────────────────────
const ACCENT = '#34d399'; // bright emerald
const GOLD = '#d4a73a';
const LIGHT = '#e8f3ec';
const MUTED = 'rgba(232,243,236,0.62)';

// ── Keyframes ────────────────────────────────────────────────────────────────
const flow = keyframes`to { stroke-dashoffset: -40; }`;
const scan = keyframes`0%{ transform: translateY(0); opacity:.2 } 10%{opacity:1} 90%{opacity:1} 100%{ transform: translateY(46px); opacity:.2 }`;
const pulse = keyframes`0%,100%{ transform:scale(1); opacity:.5 } 50%{ transform:scale(1.7); opacity:0 }`;
const fill = keyframes`0%{ transform:scaleY(.15) } 70%{ transform:scaleY(1) } 100%{ transform:scaleY(1) }`;
const bob = keyframes`0%,100%{ transform:translateY(0) } 50%{ transform:translateY(-4px) }`;
const spark = keyframes`0%,100%{ opacity:.2 } 50%{ opacity:1 }`;
const floaty = keyframes`0%,100%{ transform:translateY(0) } 50%{ transform:translateY(-8px) }`;
const rise = keyframes`from{ opacity:0; transform:translateY(14px) } to{ opacity:1; transform:translateY(0) }`;
const barGrow = keyframes`0%{ transform:scaleY(.25) } 100%{ transform:scaleY(1) }`;
const drawLine = keyframes`to { stroke-dashoffset: 0; }`;

// ── Full-page background: locations map + charge analytics (faint, animated) ──
const BackgroundViz: React.FC = () => (
  <Box
    aria-hidden
    component="svg"
    viewBox="0 0 1440 900"
    preserveAspectRatio="xMidYMid slice"
    sx={{
      position: 'absolute',
      inset: 0,
      width: '100%',
      height: '100%',
      zIndex: 0,
      pointerEvents: 'none',
      '& .route': { strokeDasharray: '5 10', animation: `${flow} 3s linear infinite` },
      '& .pinring': { transformOrigin: 'center', animation: `${pulse} 3s ease-out infinite` },
      '& .pinring2': { transformOrigin: 'center', animation: `${pulse} 3s ease-out infinite`, animationDelay: '1.5s' },
      '& .abar': { transformBox: 'fill-box', transformOrigin: 'bottom', animation: `${barGrow} 2.8s ease-in-out infinite alternate` },
      '& .aline': { strokeDasharray: 360, strokeDashoffset: 360, animation: `${drawLine} 3.5s ease-in-out infinite alternate` },
    }}
  >
    {/* faint location map (routes + pins) */}
    <g stroke={ACCENT} strokeOpacity="0.10" strokeWidth="2" fill="none">
      <path className="route" d="M-20 220 C 220 140, 420 320, 720 200 S 1200 120, 1480 240" />
      <path className="route" d="M-20 640 C 260 560, 520 720, 860 600 S 1260 560, 1480 660" />
      <path d="M300 -20 L360 920" strokeOpacity="0.05" />
      <path d="M980 -20 L1040 920" strokeOpacity="0.05" />
    </g>
    {[
      [180, 210], [700, 200], [1180, 250], [430, 640], [880, 600], [1230, 660], [560, 380],
    ].map(([x, y], i) => (
      <g key={i} transform={`translate(${x} ${y})`}>
        <circle className={i % 2 ? 'pinring2' : 'pinring'} r="16" fill={ACCENT} fillOpacity="0.10" />
        <path d="M0 -12 a9 9 0 0 1 9 9 c0 7 -9 15 -9 15 s-9 -8 -9 -15 a9 9 0 0 1 9 -9 z" fill={ACCENT} fillOpacity="0.22" />
      </g>
    ))}

    {/* faint charge analytics (bars + trend line), placed near the EV charging scene */}
    <g transform="translate(520 520)" opacity="0.6">
      <line x1="0" y1="160" x2="360" y2="160" stroke="rgba(255,255,255,0.10)" strokeWidth="1.5" />
      {[40, 90, 60, 120, 80, 140, 110].map((h, i) => (
        <rect
          key={i}
          className="abar"
          x={i * 50}
          y={160 - h}
          width="26"
          height={h}
          rx="4"
          fill={ACCENT}
          fillOpacity={0.12 + (i % 3) * 0.04}
          style={{ animationDelay: `${i * 0.25}s` }}
        />
      ))}
      <path
        className="aline"
        d="M13 120 L63 70 L113 95 L163 40 L213 75 L263 25 L313 55"
        fill="none"
        stroke={GOLD}
        strokeOpacity="0.45"
        strokeWidth="2.5"
      />
    </g>
  </Box>
);

// ── Animated EV charging scene with QR-connection (pure SVG + CSS) ────────────
const EvScene: React.FC = () => (
  <Box
    component="svg"
    viewBox="0 0 520 320"
    role="img"
    aria-label="EV charging via QR connection at a station"
    sx={{
      width: '100%',
      maxWidth: 560,
      height: 'auto',
      display: 'block',
      filter: 'drop-shadow(0 18px 40px rgba(0,0,0,0.45))',
      '& .cable': { strokeDasharray: '10 14', animation: `${flow} 1s linear infinite` },
      '& .qrlink': { strokeDasharray: '4 8', animation: `${flow} 0.9s linear infinite` },
      '& .ring': { transformOrigin: 'center', animation: `${pulse} 2.4s ease-out infinite` },
      '& .battFill': { transformBox: 'fill-box', transformOrigin: 'bottom', animation: `${fill} 3.6s ease-in-out infinite` },
      '& .car': { transformOrigin: 'center', animation: `${bob} 4s ease-in-out infinite` },
      '& .scanline': { animation: `${scan} 2.2s ease-in-out infinite` },
      '& .spark': { animation: `${spark} 1.8s ease-in-out infinite` },
      '& .spark2': { animation: `${spark} 1.8s ease-in-out infinite`, animationDelay: '.7s' },
      '& .spark3': { animation: `${spark} 1.8s ease-in-out infinite`, animationDelay: '1.3s' },
    }}
  >
    <defs>
      <linearGradient id="body" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#10503a" />
        <stop offset="100%" stopColor="#0a2c20" />
      </linearGradient>
      <linearGradient id="batt" x1="0" y1="1" x2="0" y2="0">
        <stop offset="0%" stopColor={ACCENT} />
        <stop offset="100%" stopColor="#a7f3d0" />
      </linearGradient>
      <radialGradient id="halo" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor={ACCENT} stopOpacity="0.5" />
        <stop offset="100%" stopColor={ACCENT} stopOpacity="0" />
      </radialGradient>
      <clipPath id="qrclip"><rect x="36" y="60" width="58" height="58" rx="6" /></clipPath>
    </defs>

    {/* ground */}
    <line x1="40" y1="262" x2="470" y2="262" stroke="rgba(255,255,255,0.12)" strokeWidth="2" />
    <ellipse cx="320" cy="266" rx="120" ry="10" fill="rgba(0,0,0,0.25)" />

    {/* QR panel (phone scanning to connect) */}
    <g>
      <rect x="30" y="52" width="70" height="86" rx="10" fill="#0e2a1e" stroke="rgba(52,211,153,0.45)" />
      <rect x="36" y="60" width="58" height="58" rx="6" fill="#06140e" />
      {/* QR squares */}
      <g fill={ACCENT} fillOpacity="0.9">
        <rect x="42" y="66" width="14" height="14" rx="2" />
        <rect x="46" y="70" width="6" height="6" fill="#06140e" />
        <rect x="74" y="66" width="14" height="14" rx="2" />
        <rect x="78" y="70" width="6" height="6" fill="#06140e" />
        <rect x="42" y="98" width="14" height="14" rx="2" />
        <rect x="46" y="102" width="6" height="6" fill="#06140e" />
        <rect x="64" y="66" width="4" height="4" /><rect x="64" y="76" width="4" height="4" />
        <rect x="64" y="92" width="4" height="4" /><rect x="74" y="92" width="4" height="4" />
        <rect x="84" y="92" width="4" height="4" /><rect x="64" y="102" width="4" height="14" />
        <rect x="74" y="104" width="14" height="4" /><rect x="84" y="110" width="4" height="6" />
      </g>
      {/* scanning beam */}
      <g clipPath="url(#qrclip)">
        <rect className="scanline" x="36" y="62" width="58" height="3" fill={ACCENT} opacity="0.9" />
      </g>
      <text x="65" y="132" textAnchor="middle" fontSize="8" fill={MUTED} fontFamily="inherit">SCAN TO CHARGE</text>
    </g>

    {/* QR -> station data link */}
    <path className="qrlink" d="M100 96 C 130 96, 140 150, 150 150" fill="none" stroke={GOLD} strokeWidth="2" strokeLinecap="round" />

    {/* charging station */}
    <g>
      <rect x="150" y="118" width="50" height="116" rx="12" fill="#0e2a1e" stroke="rgba(52,211,153,0.4)" />
      <rect x="160" y="130" width="30" height="38" rx="5" fill="#06140e" stroke={ACCENT} strokeOpacity="0.6" />
      <path d="M178 136 l-8 16 h6 l-3 11 l12 -18 h-6 z" fill={ACCENT} />
      <circle cx="175" cy="190" r="5.5" fill={GOLD} />
      <rect x="166" y="202" width="18" height="6" rx="3" fill="rgba(255,255,255,0.15)" />
    </g>

    {/* cable: station -> car (animated energy flow) */}
    <path d="M200 168 C 238 168, 238 212, 282 212" fill="none" stroke="#0a3326" strokeWidth="7" strokeLinecap="round" />
    <path className="cable" d="M200 168 C 238 168, 238 212, 282 212" fill="none" stroke={ACCENT} strokeWidth="3.5" strokeLinecap="round" />

    {/* car */}
    <g className="car">
      <circle className="ring" cx="286" cy="212" r="12" fill="url(#halo)" />
      <circle cx="286" cy="212" r="4" fill={ACCENT} />
      <path d="M296 216 q6 -46 60 -50 q26 -2 44 18 q40 4 60 18 q14 6 14 14 l-178 0 z" fill="url(#body)" stroke="rgba(52,211,153,0.45)" strokeWidth="1.5" />
      <path d="M322 172 q24 -6 40 12 l-58 0 q6 -8 18 -12 z" fill="#0b3526" stroke="rgba(167,243,208,0.35)" />
      <path d="M328 172 q18 -4 30 8 l-40 0 q4 -5 10 -8 z" fill="rgba(167,243,208,0.18)" />
      <circle cx="472" cy="212" r="3.5" fill={GOLD} />
      <circle cx="336" cy="230" r="16" fill="#06140e" stroke="rgba(255,255,255,0.25)" strokeWidth="3" />
      <circle cx="336" cy="230" r="5" fill="#1b3a2c" />
      <circle cx="430" cy="230" r="16" fill="#06140e" stroke="rgba(255,255,255,0.25)" strokeWidth="3" />
      <circle cx="430" cy="230" r="5" fill="#1b3a2c" />
      {/* floating battery indicator */}
      <g transform="translate(386 112)">
        <rect x="-2" y="-8" width="44" height="6" rx="2" fill="rgba(255,255,255,0.18)" />
        <rect x="-8" y="-2" width="56" height="70" rx="9" fill="none" stroke="rgba(167,243,208,0.5)" strokeWidth="2.5" />
        <rect className="battFill" x="-3" y="2" width="46" height="62" rx="6" fill="url(#batt)" />
        <path d="M26 16 l-12 24 h9 l-5 16 l16 -28 h-9 z" fill="#06241a" opacity="0.85" />
      </g>
    </g>

    {/* ambient sparks */}
    <g fill={ACCENT}>
      <circle className="spark" cx="240" cy="70" r="3" />
      <circle className="spark2" cx="470" cy="90" r="2.5" />
      <circle className="spark3" cx="150" cy="250" r="2.5" />
      <circle className="spark2" cx="500" cy="160" r="2" />
    </g>
  </Box>
);

const features = [
  { icon: <EvStationOutlined />, label: 'Charging Stations' },
  { icon: <BoltOutlined />, label: 'Live Sessions' },
  { icon: <PersonOutlineOutlined />, label: 'EV Drivers' },
  { icon: <EventNoteOutlined />, label: 'Smart Scheduling' },
  { icon: <InsightsOutlined />, label: 'Reports & Analytics' },
  { icon: <AccountBalanceWalletOutlined />, label: 'Wallet & Payments' },
];

const AuthLayout: React.FC = () => {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        position: 'relative',
        overflow: 'hidden',
        background:
          'radial-gradient(1100px 700px at 12% 8%, #0d3b29 0%, transparent 55%), radial-gradient(900px 700px at 95% 95%, #0a3022 0%, transparent 50%), linear-gradient(135deg, #04130d 0%, #082018 55%, #0a2a1d 100%)',
      }}
    >
      {/* faint dot grid */}
      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          inset: 0,
          zIndex: 0,
          opacity: 0.45,
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
          maskImage: 'radial-gradient(circle at 35% 40%, black, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(circle at 35% 40%, black, transparent 80%)',
        }}
      />

      {/* locations map + charge analytics backdrop */}
      <BackgroundViz />

      {/* LEFT — branded animated hero + feature showcase */}
      <Box
        sx={{
          flex: { md: '1 1 50%', lg: '1 1 54%' },
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
          zIndex: 1,
          p: { md: 4, lg: 7 },
          color: LIGHT,
        }}
      >
        {/* logo (transparent BrandLogo — no black box) */}
        <Box sx={{ animation: `${floaty} 6s ease-in-out infinite` }}>
          <BrandLogo height={40} color="#eaf4ee" />
        </Box>

        {/* headline + scene */}
        <Box sx={{ animation: `${rise} .6s ease` }}>
          <Typography variant="h4" fontWeight={800} sx={{ maxWidth: 460, lineHeight: 1.2 }}>
            Power every EV vehicle, charge station and payment — from one console.
          </Typography>
          <Typography variant="body1" sx={{ mt: 1.5, maxWidth: 460, color: MUTED }}>
            Real-time control of your EV charging network: stations, live sessions, drivers and revenue.
          </Typography>
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
            <EvScene />
          </Box>
        </Box>

        {/* feature showcase */}
        <Grid container spacing={1.5} sx={{ maxWidth: 560 }}>
          {features.map((f) => (
            <Grid item xs={6} sm={4} key={f.label}>
              <Stack
                direction="row"
                spacing={1.25}
                alignItems="center"
                sx={{
                  p: 1.25,
                  borderRadius: 2,
                  bgcolor: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  transition: 'all .2s ease',
                  '&:hover': { bgcolor: 'rgba(52,211,153,0.10)', borderColor: 'rgba(52,211,153,0.4)' },
                }}
              >
                <Box sx={{ color: ACCENT, display: 'flex' }}>{f.icon}</Box>
                <Typography variant="caption" sx={{ color: LIGHT, fontWeight: 600, lineHeight: 1.2 }}>
                  {f.label}
                </Typography>
              </Stack>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* RIGHT — sign-in card (light) */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          zIndex: 1,
          px: { xs: 2.5, sm: 4 },
          py: 4,
          pr: { md: 6, lg: 12 },
        }}
      >
        <Paper
          elevation={0}
          sx={{
            width: '100%',
            maxWidth: 420,
            p: { xs: 3.5, sm: 5 },
            borderRadius: 4,
            bgcolor: '#ffffff',
            border: '1px solid #ece7d6',
            boxShadow: '0 30px 80px rgba(0,0,0,0.45)',
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
            <BrandLogo height={34} color="#14532d" />
          </Box>

          <Outlet />

          <Stack
            direction="row"
            spacing={2.5}
            justifyContent="center"
            sx={{ mt: 3, pt: 2.5, borderTop: '1px solid #eef0f3' }}
          >
            <Stack direction="row" spacing={0.75} alignItems="center" sx={{ color: '#6b7280' }}>
              <ShieldOutlined sx={{ fontSize: 16, color: '#15803d' }} />
              <Typography variant="caption">Secure access</Typography>
            </Stack>
            <Stack direction="row" spacing={0.75} alignItems="center" sx={{ color: '#6b7280' }}>
              <BoltOutlined sx={{ fontSize: 16, color: GOLD }} />
              <Typography variant="caption">OCPP 1.6J</Typography>
            </Stack>
          </Stack>
        </Paper>
      </Box>
    </Box>
  );
};

export default AuthLayout;
