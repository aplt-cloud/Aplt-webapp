import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface ConversationsState {
  conversations: any[];
  unreadCount: number;
}

const initialState: ConversationsState = {
  conversations: [],
  unreadCount: 0,
};

const conversationsSlice = createSlice({
  name: 'conversations',
  initialState,
  reducers: {
    setConversations: (state, action: PayloadAction<any[]>) => {
      state.conversations = action.payload;
    },
    setUnreadCount: (state, action: PayloadAction<number>) => {
      state.unreadCount = action.payload;
    },
  },
});

export const { setConversations, setUnreadCount } = conversationsSlice.actions;
export default conversationsSlice.reducer;
