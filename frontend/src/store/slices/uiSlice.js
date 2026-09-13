// src/store/slices/uiSlice.js
import { createSlice } from '@reduxjs/toolkit';

const savedSettings = JSON.parse(localStorage.getItem('cs_ui') || '{}');

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    sidebarOpen:   false,
    darkMode:      savedSettings.darkMode   || false,
    highContrast:  savedSettings.highContrast || false,
    largeFont:     savedSettings.largeFont  || false,
    voiceEnabled:  savedSettings.voiceEnabled !== false,
    activeModule:  'dashboard',
    notifications: [],
    unreadCount:   0,
  },
  reducers: {
    toggleSidebar(s)         { s.sidebarOpen = !s.sidebarOpen; },
    closeSidebar(s)          { s.sidebarOpen = false; },
    toggleDarkMode(s)        { s.darkMode = !s.darkMode; saveUI(s); },
    toggleHighContrast(s)    { s.highContrast = !s.highContrast; saveUI(s); },
    toggleLargeFont(s)       { s.largeFont = !s.largeFont; saveUI(s); },
    toggleVoice(s)           { s.voiceEnabled = !s.voiceEnabled; saveUI(s); },
    setActiveModule(s, a)    { s.activeModule = a.payload; },
    addNotification(s, a) {
      s.notifications.unshift({ id: Date.now(), ...a.payload, read: false, time: new Date() });
      s.unreadCount++;
    },
    markAllRead(s) { s.notifications.forEach(n => n.read = true); s.unreadCount = 0; },
    clearNotifications(s) { s.notifications = []; s.unreadCount = 0; },
  },
});

function saveUI(state) {
  localStorage.setItem('cs_ui', JSON.stringify({
    darkMode: state.darkMode, highContrast: state.highContrast,
    largeFont: state.largeFont, voiceEnabled: state.voiceEnabled,
  }));
}

export const {
  toggleSidebar, closeSidebar, toggleDarkMode, toggleHighContrast,
  toggleLargeFont, toggleVoice, setActiveModule,
  addNotification, markAllRead, clearNotifications,
} = uiSlice.actions;

export default uiSlice.reducer;
