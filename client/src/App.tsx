import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { useAppDispatch, useAppSelector } from './store/hooks';
import { setUser, setLoading } from './store/slices/authSlice';

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

  if (loading) return <div>Loading...</div>;
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />;

  if (requireProfileComplete && currentUser && !currentUser.profile_complete) {
    return <Navigate to="/setup" replace />;
  }

  return <>{children}</>;
};

function App() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        // Fetch user profile to check profile_complete
        supabase
          .from('users')
          .select('*')
          .eq('user_id', session.user.id)
          .single()
          .then(({ data }) => {
             dispatch(setUser(data || { ...session.user, profile_complete: false }));
          });
      } else {
        dispatch(setLoading(false));
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        supabase
          .from('users')
          .select('*')
          .eq('user_id', session.user.id)
          .single()
          .then(({ data }) => {
             dispatch(setUser(data || { ...session.user, profile_complete: false }));
          });

          // Update last_active
          supabase
            .from('users')
            .update({ last_active: new Date().toISOString() })
            .eq('user_id', session.user.id);
      } else {
        dispatch(setUser(null));
      }
    });

    return () => subscription.unsubscribe();
  }, [dispatch]);

  return (
    <Router>
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
    </Router>
  );
}

export default App;
