import React from 'react';
import { Box, Typography, Button, Breadcrumbs, Link } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Add, ArrowBack } from '@mui/icons-material';

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

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  breadcrumbs,
  action,
  backButton,
}) => {
  const navigate = useNavigate();

  return (
    <Box mb={3}>
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumbs sx={{ mb: 1 }}>
          {breadcrumbs.map((item, index) => (
            <React.Fragment key={index}>
              {item.path ? (
                <Link
                  component="button"
                  variant="body2"
                  onClick={() => navigate(item.path!)}
                  color="inherit"
                  underline="hover"
                >
                  {item.label}
                </Link>
              ) : (
                <Typography variant="body2" color="text.primary">
                  {item.label}
                </Typography>
              )}
            </React.Fragment>
          ))}
        </Breadcrumbs>
      )}

      {/* Title and Action */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        flexWrap="wrap"
        gap={2}
      >
        <Box display="flex" alignItems="center" gap={1}>
          {backButton && (
            <Button
              startIcon={<ArrowBack />}
              onClick={() => navigate(-1)}
              sx={{ mr: 1 }}
            >
              Back
            </Button>
          )}
          <Box>
            <Typography variant="h4" fontWeight="bold">
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
        </Box>

        {action && (
          <Button
            variant="contained"
            color="primary"
            startIcon={action.icon || <Add />}
            onClick={action.onClick}
          >
            {action.label}
          </Button>
        )}
      </Box>
    </Box>
  );
};

export default PageHeader;
