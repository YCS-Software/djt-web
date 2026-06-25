import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  TextField,
  MenuItem,
  Switch,
  FormControlLabel,
  Button,
  Snackbar,
  Alert,
  Typography,
  Divider,
} from '@mui/material';
import { SaveOutlined } from '@mui/icons-material';
import PageHeader from './PageHeader';

export interface SettingField {
  name: string;
  label: string;
  type?: 'text' | 'number' | 'select' | 'switch' | 'textarea';
  options?: { value: string; label: string }[];
  helperText?: string;
  fullWidth?: boolean;
}

export interface SettingsSection {
  heading?: string;
  fields: SettingField[];
}

interface SettingsFormProps {
  title: string;
  subtitle?: string;
  sections: SettingsSection[];
  defaults?: Record<string, any>;
  /** Loads current settings (axios-style). Optional. */
  loader?: () => Promise<any>;
  /** Persists settings. Optional. */
  saver?: (values: Record<string, any>) => Promise<any>;
}

const GREEN = '#14532d';

const SettingsForm: React.FC<SettingsFormProps> = ({ title, subtitle, sections, defaults, loader, saver }) => {
  const allFields = sections.flatMap((s) => s.fields);
  const seed = () => {
    const v: Record<string, any> = {};
    allFields.forEach((f) => (v[f.name] = defaults?.[f.name] ?? (f.type === 'switch' ? false : '')));
    return v;
  };
  const [values, setValues] = useState<Record<string, any>>(seed);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (!loader) return;
    loader()
      .then((res) => {
        const data = res?.data?.settings || res?.data || res;
        if (data && typeof data === 'object') setValues((prev) => ({ ...prev, ...data }));
      })
      .catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const set = (name: string, value: any) => setValues((p) => ({ ...p, [name]: value }));

  const handleSave = async () => {
    if (!saver) {
      setToast({ msg: 'Settings saved locally (no backend endpoint wired)', type: 'success' });
      return;
    }
    setSaving(true);
    try {
      await saver(values);
      setToast({ msg: 'Settings saved', type: 'success' });
    } catch (e: any) {
      setToast({ msg: e?.response?.data?.error || 'Failed to save', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box>
      <PageHeader title={title} subtitle={subtitle} />
      <Card elevation={0} sx={{ border: '1px solid #eef0f3', borderRadius: 2 }}>
        <CardContent>
          {sections.map((section, si) => (
            <Box key={si} sx={{ mb: si < sections.length - 1 ? 3 : 0 }}>
              {section.heading && (
                <>
                  <Typography sx={{ fontSize: 14, fontWeight: 700, color: '#2f3b52', mb: 1.5 }}>
                    {section.heading}
                  </Typography>
                </>
              )}
              <Grid container spacing={2}>
                {section.fields.map((f) => (
                  <Grid item xs={12} sm={f.fullWidth || f.type === 'textarea' ? 12 : 6} key={f.name}>
                    {f.type === 'switch' ? (
                      <FormControlLabel
                        control={
                          <Switch
                            checked={!!values[f.name]}
                            onChange={(e) => set(f.name, e.target.checked)}
                            sx={{ '& .Mui-checked': { color: GREEN } }}
                          />
                        }
                        label={f.label}
                      />
                    ) : (
                      <TextField
                        select={f.type === 'select'}
                        type={f.type === 'number' ? 'number' : 'text'}
                        multiline={f.type === 'textarea'}
                        minRows={f.type === 'textarea' ? 3 : undefined}
                        label={f.label}
                        value={values[f.name] ?? ''}
                        onChange={(e) => set(f.name, e.target.value)}
                        helperText={f.helperText}
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
                    )}
                  </Grid>
                ))}
              </Grid>
              {section.heading && si < sections.length - 1 && <Divider sx={{ mt: 3 }} />}
            </Box>
          ))}
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              startIcon={<SaveOutlined />}
              onClick={handleSave}
              disabled={saving}
              sx={{ bgcolor: GREEN, '&:hover': { bgcolor: '#0f3d22' }, textTransform: 'none', fontWeight: 600 }}
            >
              {saving ? 'Saving…' : 'Save Changes'}
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Snackbar
        open={!!toast}
        autoHideDuration={4000}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        {toast ? (
          <Alert severity={toast.type} variant="filled" onClose={() => setToast(null)}>
            {toast.msg}
          </Alert>
        ) : undefined}
      </Snackbar>
    </Box>
  );
};

export default SettingsForm;
