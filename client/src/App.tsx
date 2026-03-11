import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { useAppDispatch, useAppSelector } from './store/hooks';
import { setUser, setLoading } from './store/slices/authSlice';
import { AnimatePresence } from 'framer-motion';

// Import actual screens
import WelcomeScreen from './pages/WelcomeScreen';
import LoginScreen from './pages/LoginScreen';
import SignupScreen from './pages/SignupScreen';
import ForgotPasswordScreen from './pages/ForgotPasswordScreen';
import ProfileSetupScreen from './pages/ProfileSetupScreen';
import MainTabs from './pages/MainTabs';
import UserProfileScreen from './pages/UserProfileScreen';
import ChatScreen from './pages/ChatScreen';

const ProtectedRoute = ({ children, requireProfileComplete = false }: { children: React.ReactNode, requireProfileComplete?: boolean }) => {
  const { currentUser, isAuthenticated, loading } = useAppSelector((state) => state.auth);
  const location = useLocation();

  if (loading) return <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center text-white">Loading...</div>;
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />;

  if (requireProfileComplete && currentUser && !currentUser.profile_complete) {
    return <Navigate to="/setup" replace />;
  }

  return <>{children}</>;
};

function App() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const fetchProfile = async (userId: string) => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (!error && data) {
        dispatch(setUser(data));

        // Update last_active
        await supabase
          .from('users')
          .update({ last_active: new Date().toISOString() })
          .eq('user_id', userId);
      } else {
        // If profile doesn't exist yet, we still have the auth user
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          dispatch(setUser({ user_id: user.id, email: user.email, profile_complete: false }));
        }
      }
    };

    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        dispatch(setLoading(false));
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        dispatch(setUser(null));
      }

      if (event === 'SIGNED_OUT') {
        dispatch(setUser(null));
      }
    });

    return () => subscription.unsubscribe();
  }, [dispatch]);

  return (
    <Router>
      <AnimatePresence mode="wait">
        <Routes>
          <Route path="/" element={<WelcomeScreen />} />
          <Route path="/login" element={<LoginScreen />} />
          <Route path="/signup" element={<SignupScreen />} />
          <Route path="/forgot-password" element={<ForgotPasswordScreen />} />

          <Route path="/setup" element={
            <ProtectedRoute>
              <ProfileSetupScreen />
            </ProtectedRoute>
          } />

          <Route path="/home" element={
            <ProtectedRoute requireProfileComplete={true}>
              <MainTabs />
            </ProtectedRoute>
          } />

          <Route path="/profile/:username" element={
            <ProtectedRoute>
              <UserProfileScreen />
            </ProtectedRoute>
          } />

          <Route path="/chat/:conversationId" element={
            <ProtectedRoute>
              <ChatScreen />
            </ProtectedRoute>
          } />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
    </Router>
  );
}

export default App;
