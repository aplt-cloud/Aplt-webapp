import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UIState {
  theme: 'dark' | 'light';
  language: string;
  accentColor: string;
}

const initialState: UIState = {
  theme: 'dark',
  language: 'en',
  accentColor: '#007AFF',
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<'dark' | 'light'>) => {
      state.theme = action.payload;
    },
    setLanguage: (state, action: PayloadAction<string>) => {
      state.language = action.payload;
    },
    setAccentColor: (state, action: PayloadAction<string>) => {
      state.accentColor = action.payload;
    },
  },
});

export const { setTheme, setLanguage, setAccentColor } = uiSlice.actions;
export default uiSlice.reducer;
