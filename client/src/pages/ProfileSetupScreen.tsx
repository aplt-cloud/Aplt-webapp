import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setUser } from '../store/slices/authSlice';
import * as Sentry from "@sentry/react";
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Cropper from 'react-easy-crop';

// --- Components ---

const ProgressBar = ({ step }: { step: number }) => (
  <div className="fixed top-0 left-0 w-full h-1 bg-[#1C1C1E] z-50">
    <motion.div
      className="h-full bg-[#007AFF]"
      initial={{ width: 0 }}
      animate={{ width: `${(step / 8) * 100}%` }}
      transition={{ duration: 0.3 }}
    />
    <div className="absolute top-4 left-6 text-[#8E8E93] text-[12px]">
      Step {step} of 8
    </div>
  </div>
);

const ActionSheet = ({ isOpen, onClose, onSelect }: any) => {
  const { t } = useTranslation();
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60" onClick={onClose}>
      <motion.div
        initial={{ y: 300 }} animate={{ y: 0 }} exit={{ y: 300 }}
        className="w-full max-w-md bg-[#1C1C1E] rounded-t-2xl p-6"
        onClick={e => e.stopPropagation()}
      >
        <div className="space-y-4">
          <button className="w-full text-left py-3 text-white font-medium border-b border-[#2C2C2E]" onClick={() => onSelect('camera')}>{t('take_photo')}</button>
          <button className="w-full text-left py-3 text-white font-medium border-b border-[#2C2C2E]" onClick={() => onSelect('gallery')}>{t('choose_from_gallery')}</button>
          <button className="w-full text-left py-3 text-white font-medium" onClick={() => onSelect('file')}>{t('upload_file')}</button>
          <button className="w-full py-4 text-red-500 font-semibold mt-4" onClick={onClose}>{t('cancel') || 'Cancel'}</button>
        </div>
      </motion.div>
    </div>
  );
};

// --- Steps ---

const StepPhoto = ({ data, onUpdate, onNext }: any) => {
  const { t } = useTranslation();
  const { currentUser } = useAppSelector(state => state.auth);
  const [uploading, setUploading] = useState(false);
  const [showSheet, setShowSheet] = useState(false);
  const [tempImage, setTempImage] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onCropComplete = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/heic'].includes(file.type)) {
      alert('Unsupported file format. Please use JPG, PNG, or HEIC.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setTempImage(reader.result as string);
    reader.readAsDataURL(file);
    setShowSheet(false);
  };

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', (error) => reject(error));
      image.src = url;
    });

  const getCroppedImg = async (imageSrc: string, pixelCrop: any) => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/jpeg');
    });
  };

  const handleDone = async () => {
    if (!tempImage || !croppedAreaPixels) return;
    setUploading(true);
    try {
      const croppedBlob = await getCroppedImg(tempImage, croppedAreaPixels) as Blob;
      const fileName = `${Date.now()}-profile.jpg`;
      const filePath = `${currentUser.user_id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(filePath, croppedBlob);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(filePath);

      await onUpdate({ profile_photo_url: publicUrl });
      setTempImage(null);
    } catch (err) {
      Sentry.captureException(err, { extra: { step: 1 } });
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleSkip = () => {
    const dicebearUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.username || currentUser.user_id}`;
    onUpdate({ profile_photo_url: dicebearUrl });
    onNext();
  };

  return (
    <div className="flex flex-col items-center">
      <h2 className="text-[24px] font-bold text-white mb-2 self-start">{t('add_your_photo')}</h2>
      <p className="text-[#8E8E93] mb-12 self-start">{t('upload_photo_sub')}</p>

      {tempImage ? (
        <div className="relative w-full h-[300px] mb-8 bg-black rounded-xl overflow-hidden">
          <Cropper
            image={tempImage}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onCropComplete={onCropComplete}
            onZoomChange={setZoom}
          />
          <div className="absolute bottom-4 left-0 w-full px-4">
             <Button onClick={handleDone} isLoading={uploading}>{t('done')}</Button>
          </div>
        </div>
      ) : (
        <>
          <div
            className="w-[120px] h-[120px] rounded-full bg-[#1C1C1E] flex items-center justify-center mb-8 overflow-hidden border border-[#2C2C2E]"
            onClick={() => setShowSheet(true)}
          >
            {data.profile_photo_url ? (
              <img src={data.profile_photo_url} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <span className="text-4xl text-[#8E8E93]">📷</span>
            )}
          </div>
          <Button onClick={() => setShowSheet(true)} isLoading={uploading}>
            {t('upload_photo')}
          </Button>
          <button onClick={handleSkip} className="mt-4 text-[#007AFF] text-sm">
            {t('skip_for_now')}
          </button>
        </>
      )}

      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".jpg,.jpeg,.png,.heic" />
      <ActionSheet isOpen={showSheet} onClose={() => setShowSheet(false)} onSelect={() => fileInputRef.current?.click()} />
    </div>
  );
};

const StepUsername = ({ data, onUpdate }: any) => {
  const { t } = useTranslation();
  const { currentUser } = useAppSelector(state => state.auth);
  const [username, setUsername] = useState(data.username || '');
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    if (username.length < 3) {
      setIsAvailable(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsChecking(true);
      try {
        const { data: existing, error } = await supabase
          .from('users')
          .select('username')
          .eq('username', username)
          .neq('user_id', currentUser.user_id)
          .maybeSingle();

        if (error) throw error;
        setIsAvailable(!existing);
      } catch (err) {
        console.error(err);
      } finally {
        setIsChecking(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [username, currentUser.user_id]);

  useEffect(() => {
    onUpdate({ username }, false); // Update state without persisting to DB yet
  }, [username]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (val.length <= 20) setUsername(val);
  };

  return (
    <div>
      <h2 className="text-[24px] font-bold text-white mb-8">{t('choose_username')}</h2>
      <div className="relative">
        <span className="absolute left-4 top-[14px] text-white text-[16px]">@</span>
        <Input
          value={username}
          onChange={handleChange}
          className="pl-8"
          placeholder="username"
          error={isAvailable === false ? t('username_taken') : ''}
        />
      </div>
      {isChecking && <p className="text-[#8E8E93] text-xs">Checking...</p>}
      {isAvailable === true && <p className="text-green-500 text-xs">✓ {t('username_available')}</p>}
      <p className="mt-4 text-[#8E8E93] text-xs leading-relaxed">{t('username_hint')}</p>
    </div>
  );
};

const StepDisplayName = ({ data, onUpdate }: any) => {
  const { t } = useTranslation();
  const [displayName, setDisplayName] = useState(data.display_name || '');

  useEffect(() => {
    onUpdate({ display_name: displayName }, false);
  }, [displayName]);

  return (
    <div>
      <h2 className="text-[24px] font-bold text-white mb-2">{t('display_name_heading')}</h2>
      <p className="text-[#8E8E93] mb-8">{t('display_name_sub')}</p>
      <div className="relative">
        <span className="absolute right-0 -top-6 text-[#8E8E93] text-xs">{displayName.length}/30</span>
        <Input value={displayName} onChange={e => setDisplayName(e.target.value.slice(0, 30))} placeholder="Display Name" />
      </div>
    </div>
  );
};

const StepBio = ({ data, onUpdate, onSkip }: any) => {
  const { t } = useTranslation();
  const [bio, setBio] = useState(data.bio || '');
  const getCounterColor = () => {
    if (bio.length >= 145) return 'text-red-500';
    if (bio.length >= 130) return 'text-orange-500';
    return 'text-[#8E8E93]';
  };

  useEffect(() => {
    onUpdate({ bio }, false);
  }, [bio]);

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-[24px] font-bold text-white">{t('tell_about_yourself')}</h2>
        <button onClick={() => onSkip()} className="text-[#007AFF] text-sm">{t('skip')}</button>
      </div>
      <p className="text-[#8E8E93] mb-8">{t('optional')}</p>
      <div className="relative">
        <span className={`absolute right-0 -top-6 text-xs ${getCounterColor()}`}>{bio.length}/150</span>
        <textarea
          value={bio}
          onChange={e => setBio(e.target.value.slice(0, 150))}
          className="w-full bg-[#1C1C1E] border border-[#2C2C2E] rounded-[12px] p-[14px] text-[16px] text-white placeholder-[#48484A] outline-none focus:border-[#007AFF] transition-all h-[120px] resize-none"
          placeholder={t('bio_placeholder')}
        />
      </div>
    </div>
  );
};

// --- Main Setup Component ---

const ProfileSetupScreen: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { currentUser } = useAppSelector(state => state.auth);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadUserData = async () => {
      if (!currentUser) return;
      try {
        const { data, error } = await supabase.from('users').select('*').eq('user_id', currentUser.user_id).single();
        if (data) setFormData(data);
      } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    loadUserData();
  }, [currentUser]);

  const updateFormData = (updates: any, persist = true) => {
    setFormData((prev: any) => ({ ...prev, ...updates }));
    if (persist) {
      persistToSupabase(updates);
    }
  };

  const persistToSupabase = async (updates: any) => {
    setIsSaving(true);
    try {
      const { error } = await supabase.from('users').update(updates).eq('user_id', currentUser.user_id);
      if (error) throw error;
      dispatch(setUser({ ...currentUser, ...updates }));
    } catch (err) {
      Sentry.captureException(err, { extra: { step, updates } });
      alert('Save failed. Please retry.');
    } finally {
      setIsSaving(false);
    }
  };

  const nextStep = async () => {
    // For steps that don't auto-persist on change, persist now
    if (step === 2) await persistToSupabase({ username: formData.username });
    if (step === 3) await persistToSupabase({ display_name: formData.display_name });
    if (step === 4) await persistToSupabase({ bio: formData.bio });

    if (step < 8) setStep(step + 1);
    else navigate('/home');
  };

  const prevStep = () => { if (step > 1) setStep(step - 1); else navigate(-1); };

  if (loading) return <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center text-white text-sm">Loading...</div>;

  const isNextDisabled = () => {
    if (step === 1) return !formData.profile_photo_url;
    if (step === 2) return !formData.username || formData.username.length < 3;
    if (step === 3) return !formData.display_name;
    return false;
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#0A0A0A] relative pt-16">
      <ProgressBar step={step} />
      <main className="flex-1 px-6 pb-48 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            {step === 1 && <StepPhoto data={formData} onUpdate={updateFormData} onNext={nextStep} />}
            {step === 2 && <StepUsername data={formData} onUpdate={updateFormData} />}
            {step === 3 && <StepDisplayName data={formData} onUpdate={updateFormData} />}
            {step === 4 && <StepBio data={formData} onUpdate={updateFormData} onSkip={() => { updateFormData({ bio: '' }); nextStep(); }} />}
            {step > 4 && <div className="text-white">Steps 5-8 placeholder...</div>}
          </motion.div>
        </AnimatePresence>
      </main>
      <div className="fixed bottom-0 left-0 w-full px-6 py-8 bg-[#0A0A0A] border-t border-[#1C1C1E] flex gap-4 z-[55]">
        {step > 1 && <Button variant="ghost" onClick={prevStep} className="flex-1">Back</Button>}
        <Button onClick={nextStep} disabled={isNextDisabled()} isLoading={isSaving} className="flex-1">Next</Button>
      </div>
    </div>
  );
};

export default ProfileSetupScreen;
