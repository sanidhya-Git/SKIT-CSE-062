'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { getErrorMessage } from '@/lib/utils';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Grid from '@mui/material/Grid';

export default function RegisterPage() {
  const router = useRouter();
  const { setSession } = useAuth();
  const { showToast } = useToast();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    organisationName: '',
  });
  const [errors, setErrors] = useState<Partial<typeof form>>({});
  const [loading, setLoading] = useState(false);

  const setField = (key: keyof typeof form, value: string) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const validate = () => {
    const errs: Partial<typeof form> = {};
    if (!form.name.trim()) errs.name = 'Full name is required.';
    if (!form.email) errs.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Enter a valid email.';
    if (!form.password) errs.password = 'Password is required.';
    else if (form.password.length < 8) errs.password = 'Password must be at least 8 characters.';
    else if (!/[A-Z]/.test(form.password)) errs.password = 'Password must contain at least one uppercase letter.';
    else if (!/[0-9]/.test(form.password)) errs.password = 'Password must contain at least one number.';
    if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match.';
    if (!form.organisationName.trim()) errs.organisationName = 'Organisation name is required.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const res = await authApi.register({
        name: form.name.trim(),
        email: form.email,
        password: form.password,
        organisationName: form.organisationName.trim(),
      });
      setSession(res.token, res.user);
      showToast('success', 'Account created', 'Welcome to OneOps AI.');
      router.push('/overview');
    } catch (err) {
      showToast('error', 'Registration failed', getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-card">
      <div className="auth-logo">
        <div className="auth-logo-mark">O</div>
        <span className="auth-logo-text">OneOps AI</span>
      </div>

      <h1 className="auth-heading">Create your account</h1>
      <p className="auth-subheading">Set up your team workspace in under a minute.</p>

      <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <Grid container spacing={1.5}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Full name"
              type="text"
              autoComplete="name"
              value={form.name}
              onChange={e => setField('name', e.target.value)}
              error={!!errors.name}
              helperText={errors.name}
              fullWidth
              required
              placeholder="Jane Smith"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Organisation"
              type="text"
              value={form.organisationName}
              onChange={e => setField('organisationName', e.target.value)}
              error={!!errors.organisationName}
              helperText={errors.organisationName}
              fullWidth
              required
              placeholder="Acme Corp"
            />
          </Grid>
        </Grid>

        <TextField
          label="Work email"
          type="email"
          autoComplete="email"
          value={form.email}
          onChange={e => setField('email', e.target.value)}
          error={!!errors.email}
          helperText={errors.email}
          fullWidth
          required
          placeholder="jane@company.com"
        />

        <Grid container spacing={1.5}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Password"
              type="password"
              autoComplete="new-password"
              value={form.password}
              onChange={e => setField('password', e.target.value)}
              error={!!errors.password}
              helperText={errors.password || 'Min 8 chars, one uppercase, one number'}
              fullWidth
              required
              placeholder="Min 8 chars"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Confirm password"
              type="password"
              autoComplete="new-password"
              value={form.confirmPassword}
              onChange={e => setField('confirmPassword', e.target.value)}
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword}
              fullWidth
              required
              placeholder="••••••••"
            />
          </Grid>
        </Grid>

        <Button
          type="submit"
          variant="contained"
          size="large"
          fullWidth
          disabled={loading}
          sx={{ mt: 0.5, py: 1.25 }}
        >
          {loading && <CircularProgress size={18} sx={{ color: 'white', mr: 1 }} />}
          {loading ? 'Creating account…' : 'Create account'}
        </Button>
      </form>

      <div className="auth-footer">
        Already have an account?{' '}
        <Link href="/login" style={{ color: '#000', fontWeight: 600 }}>
          Sign in
        </Link>
      </div>
    </div>
  );
}
