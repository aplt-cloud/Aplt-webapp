import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { handleAuthError } from '../lib/auth';
import { calculateAge, getAgeTier, validateEmail } from '../utils/authUtils';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

const SignupScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [dob, setDob] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showToS, setShowToS] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  useEffect(() => {
    if (email && !validateEmail(email)) {
      setErrors(prev => ({ ...prev, email: 'Please enter a valid email address' }));
    } else {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.email;
        return newErrors;
      });
    }
  }, [email]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!validateEmail(email)) newErrors.email = 'Please enter a valid email address';
    if (password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match';

    const age = calculateAge(dob);
    if (!dob) {
      newErrors.dob = 'Date of birth is required';
    } else if (age < 13) {
      newErrors.dob = 'You must be at least 13 years old to use aplt';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });

      if (error) throw error;

      if (data.user) {
        const ageTier = getAgeTier(age);
        const { error: profileError } = await supabase.from('users').insert({
          user_id: data.user.id,
          email,
          date_of_birth: dob,
          age_tier: ageTier,
          created_at: new Date().toISOString()
        });

        if (profileError) throw profileError;
        navigate('/setup');
      }
    } catch (err: any) {
      const message = handleAuthError(err, 'Sign Up');
      if (message.includes('already exists')) {
        setErrors({ general: 'An account with this email already exists. Try logging in.' });
      } else {
        setErrors({ general: 'Something went wrong. Please check your connection and try again.' });
      }
    } finally {
      setLoading(false);
    }
  };

  const Modal = ({ title, content, onClose }: { title: string, content: string, onClose: () => void }) => (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 p-6"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
        className="bg-[#1C1C1E] p-6 rounded-2xl max-w-sm max-h-[70vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <h3 className="text-xl font-bold mb-4">{title}</h3>
        <p className="text-[#8E8E93] text-sm leading-relaxed">{content}</p>
        <Button onClick={onClose} className="mt-6">{t('close')}</Button>
      </motion.div>
    </motion.div>
  );

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

      <h1 className="text-[32px] font-bold text-white mb-8">{t('create_account')}</h1>

      <form onSubmit={handleSignup} className="flex-1">
        <Input
          label={t('email')}
          type="email"
          placeholder="email@example.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          error={errors.email}
          disabled={loading}
        />
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
          placeholder="Repeat password"
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
          error={errors.confirmPassword}
          showToggle
          disabled={loading}
        />
        <Input
          label={t('dob_label')}
          type="date"
          value={dob}
          onChange={e => setDob(e.target.value)}
          error={errors.dob}
          disabled={loading}
        />

        {errors.general && <p className="text-red-500 text-sm mb-4">{errors.general}</p>}

        <Button type="submit" isLoading={loading} className="mt-4">
          {t('create_account')}
        </Button>
      </form>

      <div className="mt-8 text-center">
        <p className="text-[#8E8E93]">
          {t('already_have_account')} <Link to="/login" className="text-[#007AFF]">{t('login')}</Link>
        </p>
      </div>

      <div className="mt-auto pt-8 text-center px-4">
        <p className="text-[#8E8E93] text-[12px] leading-tight">
          {t('tos_privacy_agreement').split(t('tos'))[0]}
          <span onClick={() => setShowToS(true)} className="text-[#007AFF] cursor-pointer">{t('tos')}</span>
          {t('tos_privacy_agreement').split(t('tos'))[1]?.split(t('privacy_policy'))[0]}
          <span onClick={() => setShowPrivacy(true)} className="text-[#007AFF] cursor-pointer">{t('privacy_policy')}</span>
        </p>
      </div>

      <AnimatePresence>
        {showToS && (
          <Modal
            title={t('tos')}
            content="Placeholder for Terms of Service content. By using aplt, you agree to follow our guidelines..."
            onClose={() => setShowToS(false)}
          />
        )}
        {showPrivacy && (
          <Modal
            title={t('privacy_policy')}
            content="Placeholder for Privacy Policy. We value your privacy and handle your data with care..."
            onClose={() => setShowPrivacy(false)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default SignupScreen;
