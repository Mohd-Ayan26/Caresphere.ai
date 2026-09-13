// src/store/index.js — Redux Toolkit Store
import { configureStore } from '@reduxjs/toolkit';
import authReducer        from './slices/authSlice';
import medicineReducer    from './slices/medicineSlice';
import wellnessReducer    from './slices/wellnessSlice';
import nutritionReducer   from './slices/nutritionSlice';
import uiReducer          from './slices/uiSlice';
import chatReducer        from './slices/chatSlice';

const store = configureStore({
  reducer: {
    auth:      authReducer,
    medicine:  medicineReducer,
    wellness:  wellnessReducer,
    nutrition: nutritionReducer,
    ui:        uiReducer,
    chat:      chatReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false }),
});

export default store;
