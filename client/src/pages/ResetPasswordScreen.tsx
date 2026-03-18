import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { handleAuthError } from '../lib/auth';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

const ResetPasswordScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (password.length < 8) {
      newErrors.password = t('password_too_short') || 'Password must be at least 8 characters';
    }
    if (password !== confirmPassword) {
      newErrors.confirmPassword = t('passwords_dont_match') || 'Passwords do not match';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      // Redirect to login after success
      navigate('/login');
    } catch (err: any) {
      const message = handleAuthError(err, 'Reset Password');
      setErrors({ general: message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="flex flex-col min-h-screen bg-[#0A0A0A] px-6 py-12"
    >
      <h1 className="text-[32px] font-bold text-white mb-2">{t('new_password')}</h1>
      <p className="text-[#8E8E93] mb-8">
        {t('enter_new_password')}
      </p>

      <form onSubmit={handleReset} className="flex-1">
        <Input
          label={t('password')}
          type="password"
          placeholder="Min 8 characters"
          value={password}
          onChange={e => setPassword(e.target.value)}
          error={errors.password}
          showToggle
          disabled={loading}
        />
        <Input
          label={t('confirm_password')}
          type="password"
          placeholder="Repeat new password"
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
          error={errors.confirmPassword}
          showToggle
          disabled={loading}
        />

        {errors.general && <p className="text-red-500 text-sm mb-4">{errors.general}</p>}

        <Button type="submit" isLoading={loading} className="mt-8">
          {t('save_password')}
        </Button>
      </form>
    </motion.div>
  );
};

export default ResetPasswordScreen;
