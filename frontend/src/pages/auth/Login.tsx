import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import {
  TextField,
  Button,
  Box,
  Alert,
  InputAdornment,
  IconButton,
  Typography,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  MailOutline,
  LockOutlined,
  ArrowForward,
} from '@mui/icons-material';
import { AppDispatch, RootState } from '../../store';
import { login, clearError } from '../../features/auth/authSlice';

const validationSchema = Yup.object({
  email: Yup.string().email('Invalid email address').required('Email is required'),
  password: Yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
});

const Login: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state: RootState) => state.auth);
  const [showPassword, setShowPassword] = useState(false);

  const formik = useFormik({
    initialValues: { email: '', password: '' },
    validationSchema,
    onSubmit: async (values) => {
      dispatch(clearError());
      const result = await dispatch(login(values));
      if (login.fulfilled.match(result)) {
        navigate('/dashboard');
      }
    },
  });

  return (
    <Box component="form" onSubmit={formik.handleSubmit} noValidate>
      <Box sx={{ textAlign: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={800} sx={{ color: '#0f2e22' }}>
          Welcome back
        </Typography>
        <Typography variant="body2" sx={{ mt: 0.5, color: '#6b7280' }}>
          Sign in to your admin account to continue
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      <TextField
        fullWidth
        id="email"
        name="email"
        label="Email address"
        type="email"
        placeholder="you@company.com"
        value={formik.values.email}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        error={formik.touched.email && Boolean(formik.errors.email)}
        helperText={formik.touched.email && formik.errors.email}
        margin="normal"
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <MailOutline fontSize="small" sx={{ color: '#9aa5b1' }} />
            </InputAdornment>
          ),
        }}
      />

      <TextField
        fullWidth
        id="password"
        name="password"
        label="Password"
        type={showPassword ? 'text' : 'password'}
        placeholder="••••••••"
        value={formik.values.password}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        error={formik.touched.password && Boolean(formik.errors.password)}
        helperText={formik.touched.password && formik.errors.password}
        margin="normal"
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <LockOutlined fontSize="small" sx={{ color: '#9aa5b1' }} />
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position="end">
              <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small">
                {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
              </IconButton>
            </InputAdornment>
          ),
        }}
      />

      <Button
        type="submit"
        fullWidth
        variant="contained"
        size="large"
        disabled={loading}
        endIcon={!loading && <ArrowForward />}
        sx={{
          mt: 3,
          py: 1.3,
          fontWeight: 700,
          fontSize: '1rem',
          borderRadius: 2,
          bgcolor: '#14532d',
          boxShadow: '0 12px 26px rgba(20,83,45,0.30)',
          '&:hover': { bgcolor: '#0f3d22', boxShadow: '0 12px 30px rgba(20,83,45,0.42)' },
        }}
      >
        {loading ? 'Signing in…' : 'Sign In'}
      </Button>

      <Typography variant="caption" align="center" display="block" sx={{ mt: 2, color: '#9aa5b1' }}>
        Authorized administrators only
      </Typography>
    </Box>
  );
};

export default Login;
