import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { useAppDispatch, useAppSelector } from './store/hooks';
import { setUser, setLoading } from './store/slices/authSlice';

// Import actual screens
import WelcomeScreen from './pages/WelcomeScreen';
import LoginScreen from './pages/LoginScreen';
import SignupScreen from './pages/SignupScreen';
import ForgotPasswordScreen from './pages/ForgotPasswordScreen';
import ResetPasswordScreen from './pages/ResetPasswordScreen';
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

const AuthHandler = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  useEffect(() => {
    // Check for password reset token in URL hash
    const checkRecoveryHash = () => {
      const hash = window.location.hash;
      if (hash && hash.includes('access_token') && (hash.includes('type=recovery') || hash.includes('type=signup'))) {
        // Redirection should happen, but we let the component handle setSession
        navigate('/reset-password', { replace: true });
        return true;
      }
      return false;
    };

    const isRecovery = checkRecoveryHash();

    const fetchProfile = async (userId: string) => {
      try {
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
          } else {
            dispatch(setLoading(false));
          }
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
        dispatch(setLoading(false));
      }
    };

    // Use a try-catch for the initial session check
    const initSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (session?.user) {
          await fetchProfile(session.user.id);
        } else if (!isRecovery) {
          dispatch(setLoading(false));
        }
      } catch (err) {
        console.error('Session initialization error:', err);
        if (!isRecovery) dispatch(setLoading(false));
      }
    };

    initSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      try {
        if (event === 'PASSWORD_RECOVERY') {
          navigate('/reset-password', { replace: true });
          return;
        }

        if (session?.user) {
          fetchProfile(session.user.id);
        } else {
          dispatch(setUser(null));
        }

        if (event === 'SIGNED_OUT') {
          dispatch(setUser(null));
        }
      } catch (err) {
        console.error('Auth state change error:', err);
      }
    });

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [dispatch, navigate]);

  return null;
};

function App() {
  return (
    <Router>
      <AuthHandler />
      <Routes>
        <Route path="/" element={<WelcomeScreen />} />
        <Route path="/login" element={<LoginScreen />} />
        <Route path="/signup" element={<SignupScreen />} />
        <Route path="/forgot-password" element={<ForgotPasswordScreen />} />
        <Route path="/reset-password" element={<ResetPasswordScreen />} />

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
