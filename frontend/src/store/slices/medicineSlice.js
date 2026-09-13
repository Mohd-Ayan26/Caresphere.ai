// src/store/slices/medicineSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';
import toast from 'react-hot-toast';

export const fetchMedicines = createAsyncThunk('medicine/fetchAll', async (_, { rejectWithValue }) => {
  try { const { data } = await api.get('/medicines?active=true'); return data.medicines; }
  catch (err) { return rejectWithValue(err.response?.data?.message); }
});

export const fetchTodayReminders = createAsyncThunk('medicine/reminders', async (_, { rejectWithValue }) => {
  try { const { data } = await api.get('/medicines/reminders/today'); return data.reminders; }
  catch (err) { return rejectWithValue(err.response?.data?.message); }
});

export const addMedicine = createAsyncThunk('medicine/add', async (formData, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/medicines', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
    toast.success('Medicine added! +5 XP'); return data.medicine;
  } catch (err) { toast.error(err.response?.data?.message || 'Failed'); return rejectWithValue(err.response?.data?.message); }
});

export const deleteMedicine = createAsyncThunk('medicine/delete', async (id, { rejectWithValue }) => {
  try {
    await api.delete(`/medicines/${id}`);
    toast.success('Medicine and reminders deleted');
    return id;
  } catch (err) { toast.error(err.response?.data?.message || 'Failed to delete medicine'); return rejectWithValue(err.response?.data?.message); }
});

export const markReminderStatus = createAsyncThunk('medicine/markReminder', async ({ id, status }, { rejectWithValue }) => {
  try {
    const { data } = await api.put(`/medicines/reminders/${id}/status`, { status });
    if (status === 'taken') toast.success('Medicine taken! +10 XP');
    return data.reminder;
  } catch (err) { return rejectWithValue(err.response?.data?.message); }
});

export const fetchComplianceReport = createAsyncThunk('medicine/compliance', async (days = 30, { rejectWithValue }) => {
  try { const { data } = await api.get(`/medicines/compliance?days=${days}`); return data.report; }
  catch (err) { return rejectWithValue(err.response?.data?.message); }
});

const medicineSlice = createSlice({
  name: 'medicine',
  initialState: { medicines: [], reminders: [], compliance: null, loading: false, error: null },
  reducers: { clearError(s) { s.error = null; } },
  extraReducers: (b) => {
    b.addCase(fetchMedicines.pending,    (s) => { s.loading = true; });
    b.addCase(fetchMedicines.fulfilled,  (s, a) => { s.loading = false; s.medicines = a.payload; });
    b.addCase(fetchMedicines.rejected,   (s, a) => { s.loading = false; s.error = a.payload; });
    b.addCase(fetchTodayReminders.fulfilled, (s, a) => { s.reminders = a.payload; });
    b.addCase(addMedicine.fulfilled,     (s, a) => { s.medicines.unshift(a.payload); });
    b.addCase(deleteMedicine.fulfilled,  (s, a) => {
      s.medicines = s.medicines.filter(m => m._id !== a.payload);
      s.reminders = s.reminders.filter(r => r.medicineId?._id !== a.payload && r.medicineId !== a.payload);
    });
    b.addCase(markReminderStatus.fulfilled, (s, a) => {
      const idx = s.reminders.findIndex(r => r._id === a.payload._id);
      if (idx !== -1) s.reminders[idx] = a.payload;
    });
    b.addCase(fetchComplianceReport.fulfilled, (s, a) => { s.compliance = a.payload; });
  },
});

export const { clearError: clearMedicineError } = medicineSlice.actions;
export default medicineSlice.reducer;
