// src/store/slices/nutritionSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';
import toast from 'react-hot-toast';

export const fetchTodayNutrition = createAsyncThunk('nutrition/today', async (_, { rejectWithValue }) => {
  try { const { data } = await api.get('/nutrition/meals/today'); return data; }
  catch (e) { return rejectWithValue(e.response?.data?.message); }
});

export const addMeal = createAsyncThunk('nutrition/addMeal', async (formData, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/nutrition/meals', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
    toast.success('Meal logged! +5 XP 🥗'); return data.meal;
  } catch (e) { return rejectWithValue(e.response?.data?.message); }
});

export const fetchTodayWater = createAsyncThunk('nutrition/water', async (_, { rejectWithValue }) => {
  try { const { data } = await api.get('/nutrition/water/today'); return data; }
  catch (e) { return rejectWithValue(e.response?.data?.message); }
});

export const logWater = createAsyncThunk('nutrition/logWater', async ({ amount, unit = 'ml' }, { rejectWithValue }) => {
  try { const { data } = await api.post('/nutrition/water', { amount, unit }); return data; }
  catch (e) { return rejectWithValue(e.response?.data?.message); }
});

const nutritionSlice = createSlice({
  name: 'nutrition',
  initialState: { meals: [], totals: {}, waterData: null, loading: false },
  reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchTodayNutrition.fulfilled, (s, a) => { s.meals = a.payload.meals; s.totals = a.payload.totals; });
    b.addCase(addMeal.fulfilled,  (s, a) => { s.meals.push(a.payload); });
    b.addCase(fetchTodayWater.fulfilled, (s, a) => { s.waterData = a.payload; });
    b.addCase(logWater.fulfilled, (s, a) => { s.waterData = a.payload; });
  },
});

export default nutritionSlice.reducer;

// ─────────────────────────────────────────────
// src/store/slices/uiSlice.js
// ─────────────────────────────────────────────
