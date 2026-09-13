// server.js — CareSphere AI Healthcare Backend Entry Point
require('dotenv').config();

const express    = require('express');
const http       = require('http');
const { Server } = require('socket.io');
const cors       = require('cors');
const helmet     = require('helmet');
const morgan     = require('morgan');
const compression = require('compression');
const cron       = require('node-cron');
const path       = require('path');

const connectDB          = require('./config/database');
const routes             = require('./routes');
const { errorHandler, notFound, apiLimiter } = require('./middleware');

/* ─────────────────────────────────────────────
   INITIALIZE APP
───────────────────────────────────────────── */
const app    = express();
const server = http.createServer(app);

/* ─────────────────────────────────────────────
   SOCKET.IO — Real-time Features
───────────────────────────────────────────── */
const io = new Server(server, {
  cors: {
    origin:      process.env.FRONTEND_URL || 'http://localhost:3000',
    methods:     ['GET', 'POST'],
    credentials: true,
  },
});

// Make io accessible in routes
app.set('io', io);

io.on('connection', (socket) => {
  console.log(`🔌 Socket connected: ${socket.id}`);

  // Join personal room for private notifications
  socket.on('join:user', (userId) => {
    socket.join(`user:${userId}`);
    console.log(`  User ${userId} joined personal room`);
  });

  // Caregiver monitoring room
  socket.on('join:caregiver', (caregiverId) => {
    socket.join(`caregiver:${caregiverId}`);
  });

  // Real-time location sharing
  socket.on('location:update', ({ userId, lat, lng }) => {
    socket.to(`caregiver:${userId}`).emit('location:updated', { userId, lat, lng, timestamp: new Date() });
  });

  // Emergency broadcast
  socket.on('emergency:sos', (data) => {
    io.emit(`emergency:${data.userId}`, { ...data, timestamp: new Date() });
    console.log(`🚨 SOS from user ${data.userId}`);
  });

  // Chat typing indicator
  socket.on('chat:typing', ({ userId, isTyping }) => {
    socket.broadcast.emit(`chat:typing:${userId}`, { isTyping });
  });

  // Medicine reminder acknowledgement
  socket.on('reminder:acknowledge', ({ reminderId, userId }) => {
    socket.to(`user:${userId}`).emit('reminder:acknowledged', { reminderId });
  });

  socket.on('disconnect', () => {
    console.log(`🔌 Socket disconnected: ${socket.id}`);
  });
});

/* ─────────────────────────────────────────────
   SECURITY & MIDDLEWARE
───────────────────────────────────────────── */
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy:     false,
}));

app.use(cors({
  origin:      process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods:     ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Static files (uploads)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rate limiting
app.use('/api/', apiLimiter);

/* ─────────────────────────────────────────────
   ROUTES
───────────────────────────────────────────── */
// Hello API Endpoint
app.get('/hello', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Hello from CareSphere AI Backend! 👋',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api', routes);

/* ─────────────────────────────────────────────
   CRON JOBS — Scheduled Tasks
───────────────────────────────────────────── */
// Check missed medicine reminders every 30 minutes
cron.schedule('*/30 * * * *', async () => {
  try {
    const { Reminder } = require('./models');
    const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000);

    const missed = await Reminder.updateMany(
      { status: 'pending', scheduledTime: { $lt: thirtyMinsAgo } },
      { status: 'missed' }
    );

    if (missed.modifiedCount > 0) {
      console.log(`⏰ Marked ${missed.modifiedCount} reminders as missed`);
    }
  } catch (e) {
    console.error('Cron error (reminders):', e.message);
  }
});

// Generate daily challenges at midnight
cron.schedule('0 0 * * *', async () => {
  console.log('🎮 Generating daily challenges...');
  // Challenges are auto-generated per user on first request of the day
});

// Weekly wellness report at Sunday midnight
cron.schedule('0 0 * * 0', async () => {
  console.log('📊 Weekly wellness report generation triggered');
});

/* ─────────────────────────────────────────────
   ERROR HANDLING
───────────────────────────────────────────── */
app.use(notFound);
app.use(errorHandler);

/* ─────────────────────────────────────────────
   START SERVER
───────────────────────────────────────────── */
const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`\n🚀 CareSphere AI Backend`);
    console.log(`   Server:    http://localhost:${PORT}`);
    console.log(`   API:       http://localhost:${PORT}/api`);
    console.log(`   Health:    http://localhost:${PORT}/api/health`);
    console.log(`   Env:       ${process.env.NODE_ENV || 'development'}\n`);
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
});

module.exports = { app, io };
