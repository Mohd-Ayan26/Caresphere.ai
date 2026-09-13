// src/store/slices/wellnessSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';
import toast from 'react-hot-toast';

export const logMood = createAsyncThunk('wellness/logMood', async (data, { rejectWithValue }) => {
  try { const res = await api.post('/wellness/mood', data); toast.success('Mood logged! +5 XP 😊'); return res.data.log; }
  catch (e) { return rejectWithValue(e.response?.data?.message); }
});

export const fetchMoodHistory = createAsyncThunk('wellness/moodHistory', async (days = 30, { rejectWithValue }) => {
  try { const { data } = await api.get(`/wellness/mood/history?days=${days}`); return data; }
  catch (e) { return rejectWithValue(e.response?.data?.message); }
});

export const addJournal = createAsyncThunk('wellness/addJournal', async (data, { rejectWithValue }) => {
  try { const res = await api.post('/wellness/journal', data); toast.success('Journal saved! +8 XP 📝'); return res.data.entry; }
  catch (e) { return rejectWithValue(e.response?.data?.message); }
});

export const fetchJournals = createAsyncThunk('wellness/fetchJournals', async (_, { rejectWithValue }) => {
  try { const { data } = await api.get('/wellness/journal'); return data.entries; }
  catch (e) { return rejectWithValue(e.response?.data?.message); }
});

export const logMeditation = createAsyncThunk('wellness/logMeditation', async (data, { rejectWithValue }) => {
  try { const res = await api.post('/wellness/meditation', data); toast.success('Meditation complete! +15 XP 🧘'); return res.data.session; }
  catch (e) { return rejectWithValue(e.response?.data?.message); }
});

export const fetchWellnessStats = createAsyncThunk('wellness/stats', async (_, { rejectWithValue }) => {
  try { const { data } = await api.get('/wellness/stats'); return data.stats; }
  catch (e) { return rejectWithValue(e.response?.data?.message); }
});

const wellnessSlice = createSlice({
  name: 'wellness',
  initialState: { moodLogs: [], avgScore: 0, journals: [], stats: null, loading: false, error: null },
  reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchMoodHistory.fulfilled, (s, a) => { s.moodLogs = a.payload.logs; s.avgScore = a.payload.avgScore; });
    b.addCase(fetchJournals.fulfilled,    (s, a) => { s.journals = a.payload; });
    b.addCase(fetchWellnessStats.fulfilled, (s, a) => { s.stats = a.payload; });
    b.addCase(logMood.pending,   (s) => { s.loading = true; });
    b.addCase(logMood.fulfilled, (s, a) => { s.loading = false; s.moodLogs.unshift(a.payload); });
    b.addCase(logMood.rejected,  (s, a) => { s.loading = false; s.error = a.payload; });
  },
});

export default wellnessSlice.reducer;
