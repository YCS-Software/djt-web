import React from 'react';
import { Box, Typography } from '@mui/material';
import logo from '../../assets/djt-haika-logo.png';

interface BrandLogoProps {
  /** Pixel height of the mark (the wordmark scales from this). */
  height?: number;
  /** Wordmark color. */
  color?: string;
}

/**
 * The full "DJT HAIKA" horizontal lockup — the leaf/battery mark next to the
 * serif "DJT HAIKA" wordmark, reproduced to match the brand logo. Crisp at any
 * size and theme-able via the `color` prop.
 */
const BrandLogo: React.FC<BrandLogoProps> = ({ height = 34, color = '#2f4a33' }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: `${Math.round(height * 0.28)}px` }}>
    <Box component="img" src={logo} alt="DJT Haika" sx={{ height, width: height }} />
    <Typography
      component="span"
      sx={{
        fontFamily: 'Georgia, "Times New Roman", "Playfair Display", serif',
        fontWeight: 700,
        fontSize: Math.round(height * 0.6),
        letterSpacing: Math.max(1, Math.round(height * 0.06)),
        color,
        lineHeight: 1,
        whiteSpace: 'nowrap',
        userSelect: 'none',
      }}
    >
      DJT&nbsp;HAIKA
    </Typography>
  </Box>
);

export default BrandLogo;
