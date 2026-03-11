import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { handleAuthError } from '../lib/auth';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

const ForgotPasswordScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/login',
      });
      if (resetError) throw resetError;
      setSuccess(true);
    } catch (err: any) {
      handleAuthError(err, 'Forgot Password');
      setError('Something went wrong. Please check your connection and try again.');
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
      <button onClick={() => navigate(-1)} className="text-white self-start mb-8 flex items-center">
        <span className="mr-2 text-xl">←</span> {t('back')}
      </button>

      {success ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mb-6"
          >
            <span className="text-white text-4xl font-bold">✓</span>
          </motion.div>
          <h2 className="text-2xl font-bold text-white mb-2">{t('check_email')}</h2>
          <p className="text-[#8E8E93]">
            {t('reset_sent_to')} <span className="text-white font-medium">{email}</span>
          </p>
          <Button onClick={() => navigate('/login')} className="mt-12">
            {t('back_to_login')}
          </Button>
        </div>
      ) : (
        <>
          <h1 className="text-[32px] font-bold text-white mb-2">{t('reset_password')}</h1>
          <p className="text-[#8E8E93] mb-8">
            {t('reset_subtext')}
          </p>

          <form onSubmit={handleReset} className="flex-1">
            <Input
              label={t('email')}
              type="email"
              placeholder="email@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              disabled={loading}
              error={error}
            />

            <Button type="submit" isLoading={loading} className="mt-8">
              {t('send_reset_link')}
            </Button>
          </form>
        </>
      )}
    </motion.div>
  );
};

export default ForgotPasswordScreen;
