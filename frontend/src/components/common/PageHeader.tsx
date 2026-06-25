import React from 'react';
import { Box, Typography, Button, Breadcrumbs, Link } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Add, ArrowBack, HomeOutlined, NavigateNext } from '@mui/icons-material';

interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  action?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactElement;
  };
  backButton?: boolean;
}

const GREEN = '#14532d';
const VALUE = '#2f3b52';
const LABEL = '#8a94a6';

/**
 * Page header matching the DJT EV console: a breadcrumb row in the form
 * "Title | home > crumbs > Title", an optional subtitle, and an optional
 * right-aligned primary action button.
 */
const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  breadcrumbs,
  action,
  backButton,
}) => {
  const navigate = useNavigate();

  return (
    <Box
      mb={3}
      display="flex"
      justifyContent="space-between"
      alignItems="center"
      flexWrap="wrap"
      gap={2}
    >
      <Box display="flex" alignItems="center" gap={1}>
        {backButton && (
          <Button startIcon={<ArrowBack />} onClick={() => navigate(-1)} sx={{ minWidth: 0 }}>
            Back
          </Button>
        )}
        <Box>
          <Breadcrumbs
            separator={<NavigateNext fontSize="small" sx={{ color: LABEL }} />}
            sx={{ fontSize: 14 }}
          >
            <Typography sx={{ fontWeight: 700, color: VALUE, fontSize: 18 }}>{title}</Typography>
            <Link
              component="button"
              underline="none"
              onClick={() => navigate('/dashboard')}
              sx={{ display: 'flex', alignItems: 'center', color: LABEL }}
            >
              <HomeOutlined sx={{ fontSize: 18 }} />
            </Link>
            {(breadcrumbs || []).map((item, index) =>
              item.path ? (
                <Link
                  key={index}
                  component="button"
                  underline="hover"
                  onClick={() => navigate(item.path!)}
                  sx={{ color: LABEL, fontSize: 14 }}
                >
                  {item.label}
                </Link>
              ) : (
                <Typography key={index} sx={{ color: LABEL, fontSize: 14 }}>
                  {item.label}
                </Typography>
              )
            )}
            <Typography sx={{ color: GREEN, fontWeight: 600, fontSize: 14 }}>{title}</Typography>
          </Breadcrumbs>
          {subtitle && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {subtitle}
            </Typography>
          )}
        </Box>
      </Box>

      {action && (
        <Button
          variant="contained"
          startIcon={action.icon || <Add />}
          onClick={action.onClick}
          sx={{ bgcolor: GREEN, '&:hover': { bgcolor: '#0f3d22' }, textTransform: 'none', fontWeight: 600 }}
        >
          {action.label}
        </Button>
      )}
    </Box>
  );
};

export default PageHeader;
