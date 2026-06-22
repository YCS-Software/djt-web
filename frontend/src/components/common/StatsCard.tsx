import React from 'react';
import { Card, CardContent, Box, Typography, useTheme } from '@mui/material';
import { TrendingUp, TrendingDown } from '@mui/icons-material';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactElement;
  trend?: number;
  trendLabel?: string;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  subtitle?: string;
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon,
  trend,
  trendLabel,
  color = 'primary',
  subtitle,
}) => {
  const theme = useTheme();
  const isPositiveTrend = trend && trend > 0;

  return (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" fontWeight="bold" color="text.primary">
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary">
                {subtitle}
              </Typography>
            )}
            {trend !== undefined && (
              <Box display="flex" alignItems="center" mt={1}>
                {isPositiveTrend ? (
                  <TrendingUp fontSize="small" color="success" />
                ) : (
                  <TrendingDown fontSize="small" color="error" />
                )}
                <Typography
                  variant="body2"
                  color={isPositiveTrend ? 'success.main' : 'error.main'}
                  sx={{ ml: 0.5 }}
                >
                  {Math.abs(trend)}%
                </Typography>
                {trendLabel && (
                  <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
                    {trendLabel}
                  </Typography>
                )}
              </Box>
            )}
          </Box>
          <Box
            sx={{
              p: 1.5,
              borderRadius: 2,
              bgcolor: `${color}.light`,
              color: `${color}.dark`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {React.cloneElement(icon, { fontSize: 'large' })}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default StatsCard;
