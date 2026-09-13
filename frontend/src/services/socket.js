// src/services/socket.js — Socket.io Client
import { io } from 'socket.io-client';

let socket = null;

export const initSocket = (userId) => {
  if (socket?.connected) return socket;

  socket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000', {
    transports: ['websocket', 'polling'],
    timeout:    20000,
  });

  socket.on('connect', () => {
    console.log('🔌 Socket connected');
    if (userId) socket.emit('join:user', userId);
  });

  socket.on('disconnect', () => console.log('🔌 Socket disconnected'));
  socket.on('connect_error', (err) => console.error('Socket error:', err.message));

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) { socket.disconnect(); socket = null; }
};

export const emitSOS = (userId, location) => {
  socket?.emit('emergency:sos', { userId, location, timestamp: new Date() });
};

export const emitLocationUpdate = (userId, lat, lng) => {
  socket?.emit('location:update', { userId, lat, lng });
};

export default { initSocket, getSocket, disconnectSocket, emitSOS, emitLocationUpdate };
