import React from 'react';
import { motion, Variants } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Button from '../components/ui/Button';

const WelcomeScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: 'easeOut' }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="flex flex-col items-center justify-center min-h-screen bg-[#0A0A0A] px-6 text-center"
    >
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-sm"
      >
        <motion.div variants={itemVariants} className="text-[80px] mb-4">
          🤖
        </motion.div>

        <motion.h1 variants={itemVariants} className="text-[40px] font-bold text-white mb-2">
          aplt
        </motion.h1>

        <motion.p variants={itemVariants} className="text-[#8E8E93] text-[18px] mb-12">
          {t('tagline')}
        </motion.p>

        <motion.div variants={itemVariants} className="space-y-4">
          <Button onClick={() => navigate('/signup')}>
            {t('signup')}
          </Button>
          <Button variant="ghost" onClick={() => navigate('/login')}>
            {t('login')}
          </Button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default WelcomeScreen;
