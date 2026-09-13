// src/store/slices/chatSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const sendChatMessage = createAsyncThunk('chat/send', async ({ message, sessionId }, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/chat/message', { message, sessionId });
    return data;
  } catch (e) { return rejectWithValue(e.response?.data?.message || 'AI unavailable'); }
});

export const fetchChatSessions = createAsyncThunk('chat/sessions', async (_, { rejectWithValue }) => {
  try { const { data } = await api.get('/chat/sessions'); return data.sessions; }
  catch (e) { return rejectWithValue(e.response?.data?.message); }
});

const chatSlice = createSlice({
  name: 'chat',
  initialState: {
    sessions:      [],
    currentSession: null,
    messages:      [],
    loading:       false,
    error:         null,
  },
  reducers: {
    addLocalMessage(s, a) { s.messages.push(a.payload); },
    setSession(s, a)      { s.currentSession = a.payload._id; s.messages = a.payload.messages || []; },
    clearChat(s)          { s.currentSession = null; s.messages = []; },
  },
  extraReducers: (b) => {
    b.addCase(sendChatMessage.pending,   (s) => { s.loading = true; s.error = null; });
    b.addCase(sendChatMessage.fulfilled, (s, a) => {
      s.loading = false;
      s.currentSession = a.payload.sessionId;
      s.messages.push({ role: 'assistant', content: a.payload.response, timestamp: new Date() });
    });
    b.addCase(sendChatMessage.rejected,  (s, a) => {
      s.loading = false; s.error = a.payload;
      s.messages.push({ role: 'assistant', content: `Sorry, I'm having trouble right now. Please try again. Error: ${a.payload}`, timestamp: new Date() });
    });
    b.addCase(fetchChatSessions.fulfilled, (s, a) => { s.sessions = a.payload; });
  },
});

export const { addLocalMessage, setSession, clearChat } = chatSlice.actions;
export default chatSlice.reducer;
