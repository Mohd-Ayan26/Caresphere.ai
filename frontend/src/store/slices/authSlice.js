// src/store/slices/authSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';
import toast from 'react-hot-toast';

// Load user from localStorage
const storedUser  = JSON.parse(localStorage.getItem('cs_user')  || 'null');
const storedToken = localStorage.getItem('cs_token') || null;

/* ─── Async Thunks ─── */
export const loginUser = createAsyncThunk('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/login', credentials);
    localStorage.setItem('cs_token', data.token);
    localStorage.setItem('cs_user',  JSON.stringify(data.user));
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Login failed');
  }
});

export const registerUser = createAsyncThunk('auth/register', async (userData, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/register', userData);
    localStorage.setItem('cs_token', data.token);
    localStorage.setItem('cs_user',  JSON.stringify(data.user));
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Registration failed');
  }
});

export const fetchProfile = createAsyncThunk('auth/profile', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/auth/profile');
    localStorage.setItem('cs_user', JSON.stringify(data.user));
    return data.user;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch profile');
  }
});

export const updateProfile = createAsyncThunk('auth/updateProfile', async (formData, { rejectWithValue }) => {
  try {
    const { data } = await api.put('/auth/profile', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    localStorage.setItem('cs_user', JSON.stringify(data.user));
    return data.user;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Update failed');
  }
});

export const fetchDashboardStats = createAsyncThunk('auth/dashboard', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/auth/dashboard');
    return data.stats;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to load stats');
  }
});

/* ─── Slice ─── */
const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user:           storedUser,
    token:          storedToken,
    isAuthenticated: !!storedToken,
    loading:        false,
    error:          null,
    dashboardStats: null,
  },
  reducers: {
    logout(state) {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.dashboardStats = null;
      localStorage.removeItem('cs_token');
      localStorage.removeItem('cs_user');
      toast.success('Logged out successfully.');
    },
    clearError(state) { state.error = null; },
    updateUserLocal(state, action) {
      state.user = { ...state.user, ...action.payload };
      localStorage.setItem('cs_user', JSON.stringify(state.user));
    },
  },
  extraReducers: (builder) => {
    // Login
    builder.addCase(loginUser.pending,   (s) => { s.loading = true; s.error = null; });
    builder.addCase(loginUser.fulfilled,  (s, a) => {
      s.loading = false; s.user = a.payload.user;
      s.token = a.payload.token; s.isAuthenticated = true;
      toast.success(`Welcome back, ${a.payload.user.name}! 👋`);
    });
    builder.addCase(loginUser.rejected,   (s, a) => { s.loading = false; s.error = a.payload; toast.error(a.payload); });
    // Register
    builder.addCase(registerUser.pending,  (s) => { s.loading = true; s.error = null; });
    builder.addCase(registerUser.fulfilled, (s, a) => {
      s.loading = false; s.user = a.payload.user;
      s.token = a.payload.token; s.isAuthenticated = true;
      toast.success('Account created! Welcome to CareSphere AI 🌟');
    });
    builder.addCase(registerUser.rejected,  (s, a) => { s.loading = false; s.error = a.payload; toast.error(a.payload); });
    // Profile
    builder.addCase(fetchProfile.fulfilled,  (s, a) => { s.user = a.payload; });
    builder.addCase(updateProfile.fulfilled, (s, a) => { s.user = a.payload; toast.success('Profile updated!'); });
    // Dashboard
    builder.addCase(fetchDashboardStats.fulfilled, (s, a) => { s.dashboardStats = a.payload; });
  },
});

export const { logout, clearError, updateUserLocal } = authSlice.actions;
export default authSlice.reducer;
