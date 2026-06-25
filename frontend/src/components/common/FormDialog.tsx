import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Grid,
  Box,
} from '@mui/material';

export interface FieldDef {
  name: string;
  label: string;
  type?: 'text' | 'email' | 'tel' | 'number' | 'select';
  options?: { value: string; label: string }[];
  required?: boolean;
  /** Render full-width instead of half. */
  fullWidth?: boolean;
  /** Hide this field when editing (e.g. password). */
  createOnly?: boolean;
  helperText?: string;
}

interface FormDialogProps {
  open: boolean;
  title: string;
  fields: FieldDef[];
  initialValues?: Record<string, any>;
  isEdit?: boolean;
  loading?: boolean;
  submitText?: string;
  onSubmit: (values: Record<string, any>) => void;
  onCancel: () => void;
}

const GREEN = '#14532d';

/**
 * Schema-driven create/edit dialog. Pass a `fields` definition and (optionally)
 * `initialValues`; it renders a responsive two-column form, enforces required
 * fields, and returns the collected values via `onSubmit`.
 */
const FormDialog: React.FC<FormDialogProps> = ({
  open,
  title,
  fields,
  initialValues,
  isEdit = false,
  loading = false,
  submitText,
  onSubmit,
  onCancel,
}) => {
  const visibleFields = fields.filter((f) => !(f.createOnly && isEdit));

  const seed = () => {
    const v: Record<string, any> = {};
    visibleFields.forEach((f) => {
      v[f.name] = initialValues?.[f.name] ?? '';
    });
    return v;
  };

  const [values, setValues] = useState<Record<string, any>>(seed);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Re-seed whenever the dialog is (re)opened or the target record changes.
  useEffect(() => {
    if (open) {
      setValues(seed());
      setTouched({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialValues, isEdit]);

  const handleChange = (name: string, value: any) =>
    setValues((prev) => ({ ...prev, [name]: value }));

  const missing = (f: FieldDef) =>
    f.required && (values[f.name] === '' || values[f.name] === null || values[f.name] === undefined);

  const handleSubmit = () => {
    const allTouched: Record<string, boolean> = {};
    visibleFields.forEach((f) => (allTouched[f.name] = true));
    setTouched(allTouched);

    const hasMissing = visibleFields.some((f) => missing(f));
    if (hasMissing) return;

    // Drop empty optional strings so the API receives undefined, not "".
    const payload: Record<string, any> = {};
    Object.entries(values).forEach(([k, v]) => {
      if (v !== '' && v !== null && v !== undefined) payload[k] = v;
    });
    onSubmit(payload);
  };

  return (
    <Dialog open={open} onClose={onCancel} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, color: '#2f3b52' }}>{title}</DialogTitle>
      <DialogContent dividers>
        <Box component="form" noValidate sx={{ mt: 0.5 }}>
          <Grid container spacing={2}>
            {visibleFields.map((f) => (
              <Grid item xs={12} sm={f.fullWidth ? 12 : 6} key={f.name}>
                <TextField
                  select={f.type === 'select'}
                  type={f.type === 'number' ? 'number' : f.type === 'select' ? undefined : f.type || 'text'}
                  label={f.label + (f.required ? ' *' : '')}
                  value={values[f.name] ?? ''}
                  onChange={(e) => handleChange(f.name, e.target.value)}
                  onBlur={() => setTouched((t) => ({ ...t, [f.name]: true }))}
                  error={touched[f.name] && missing(f)}
                  helperText={
                    touched[f.name] && missing(f) ? 'Required' : f.helperText || ' '
                  }
                  size="small"
                  fullWidth
                >
                  {f.type === 'select' &&
                    (f.options || []).map((o) => (
                      <MenuItem key={o.value} value={o.value}>
                        {o.label}
                      </MenuItem>
                    ))}
                </TextField>
              </Grid>
            ))}
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onCancel} disabled={loading} sx={{ textTransform: 'none' }}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading}
          sx={{ bgcolor: GREEN, '&:hover': { bgcolor: '#0f3d22' }, textTransform: 'none', fontWeight: 600 }}
        >
          {loading ? 'Saving…' : submitText || (isEdit ? 'Save Changes' : 'Create')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FormDialog;
