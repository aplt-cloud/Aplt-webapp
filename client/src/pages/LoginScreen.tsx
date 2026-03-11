import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { handleAuthError } from '../lib/auth';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

const LoginScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error: loginError } = await supabase.auth.signInWithPassword({ email, password });
      if (loginError) throw loginError;

      if (data.user) {
        const { data: userData, error: profileError } = await supabase
          .from('users')
          .select('profile_complete')
          .eq('user_id', data.user.id)
          .single();

        if (profileError) throw profileError;

        if (userData?.profile_complete) {
          navigate('/home');
        } else {
          navigate('/setup');
        }
      }
    } catch (err: any) {
      const message = handleAuthError(err, 'Log In');
      if (message.includes('Invalid login credentials') || message.includes('Incorrect')) {
        setError('Incorrect email or password');
      } else {
        setError('Something went wrong. Please check your connection and try again.');
      }
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

      <h1 className="text-[32px] font-bold text-white mb-8">{t('welcome_back')}</h1>

      <form onSubmit={handleLogin} className="flex-1">
        <Input
          label={t('email')}
          type="email"
          placeholder="email@example.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          disabled={loading}
        />
        <div className="relative">
          <Input
            label={t('password')}
            type="password"
            placeholder="Your password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            showToggle
            disabled={loading}
          />
          <div className="text-right -mt-2 mb-4">
            <Link to="/forgot-password" title={t('forgot_password')} className="text-[#8E8E93] text-[14px]">
              {t('forgot_password')}?
            </Link>
          </div>
        </div>

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        <Button type="submit" isLoading={loading} className="mt-4">
          {t('login')}
        </Button>
      </form>

      <div className="mt-8 text-center">
        <p className="text-[#8E8E93]">
          {t('dont_have_account')} <Link to="/signup" className="text-[#007AFF]">{t('signup')}</Link>
        </p>
      </div>
    </motion.div>
  );
};

export default LoginScreen;
