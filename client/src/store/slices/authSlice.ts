import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AuthState {
  currentUser: any | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  currentUser: null,
  isAuthenticated: false,
  loading: true, // Start as true
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<any>) => {
      state.currentUser = action.payload;
      state.isAuthenticated = !!action.payload;
      state.loading = false;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.loading = false;
    },
    logout: (state) => {
      state.currentUser = null;
      state.isAuthenticated = false;
      state.loading = false;
    }
  },
});

export const { setUser, setLoading, setError, logout } = authSlice.actions;
export default authSlice.reducer;
