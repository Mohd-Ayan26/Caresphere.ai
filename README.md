# 🏥 CareSphere AI — Full-Stack Healthcare Platform

> A comprehensive AI-powered healthcare ecosystem for elderly people and persons with disabilities.

---

## 📋 Table of Contents
1. [Overview](#overview)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Quick Start](#quick-start)
5. [Environment Variables](#environment-variables)
6. [API Documentation](#api-documentation)
7. [Modules](#modules)
8. [Deployment](#deployment)
9. [Accessibility Features](#accessibility-features)

---

## Overview

CareSphere AI is a full-stack MERN healthcare application providing:
- **8 Health Modules** — Medicine, Wellness, Nutrition, Emergency, Health Diary, Gamification, AI Chat, Analytics
- **AI Integration** — Groq LLaMA3 (chatbot, medicine parsing, diet plans), HuggingFace (emotion analysis)
- **Real-Time** — Socket.io emergency alerts, live notifications, caregiver updates
- **Voice Enabled** — Web Speech API input + SpeechSynthesis output
- **Accessible** — High contrast, large font, screen reader, keyboard navigation

---

## Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| React 18 + Redux Toolkit | State management |
| React Router DOM v6 | Client-side routing |
| Tailwind CSS | Utility-first styling |
| Framer Motion | Animations |
| Axios | HTTP client |
| Socket.io Client | Real-time |
| Lucide React | Icons |
| Chart.js + react-chartjs-2 | Analytics charts |

### Backend
| Technology | Purpose |
|---|---|
| Node.js + Express | REST API server |
| MongoDB + Mongoose | Database + ODM |
| JWT + bcryptjs | Auth + security |
| Socket.io | Real-time events |
| Multer | File uploads |
| node-cron | Scheduled jobs |
| Helmet | Security headers |
| express-rate-limit | Rate limiting |
| PDFKit | PDF report generation |

### AI & External APIs (All Free)
| API | Purpose |
|---|---|
| Groq API (LLaMA3-8b) | Chatbot, medicine parsing, diet plans |
| HuggingFace Inference | Emotion/sentiment analysis |
| Web Speech API | Voice input (browser) |
| SpeechSynthesis API | Text-to-speech (browser) |
| OpenStreetMap + Leaflet | Maps, emergency location |
| MongoDB Atlas Free Tier | Database hosting |

---

## Project Structure

```
caresphere/
├── backend/
│   ├── config/
│   │   └── database.js          # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js     # Auth, profile, dashboard
│   │   ├── medicineController.js # Medicine CRUD, OCR, reminders
│   │   ├── wellnessController.js # Mood, journal, meditation
│   │   ├── nutritionController.js# Meals, water, diet AI
│   │   ├── emergencyController.js# SOS, contacts, alerts
│   │   ├── healthController.js   # Symptoms, PDF reports
│   │   ├── gamificationController.js # XP, challenges, leaderboard
│   │   └── chatController.js     # AI chat sessions
│   ├── middleware/
│   │   ├── auth.js               # JWT middleware
│   │   └── index.js              # Error handler, rate limiter, multer
│   ├── models/
│   │   └── index.js              # All 16 MongoDB schemas
│   ├── routes/
│   │   └── index.js              # All API routes
│   ├── services/
│   │   └── aiService.js          # Groq + HuggingFace integration
│   ├── uploads/                  # User-uploaded files
│   ├── server.js                 # Entry point + Socket.io
│   ├── package.json
│   └── .env.example
│
└── frontend/
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── components/
    │   │   └── layout/
    │   │       └── Layout.jsx    # Sidebar, header, navigation
    │   ├── pages/
    │   │   ├── auth/
    │   │   │   ├── LoginPage.jsx
    │   │   │   └── RegisterPage.jsx
    │   │   ├── LandingPage.jsx
    │   │   ├── DashboardPage.jsx
    │   │   ├── MedicinePage.jsx
    │   │   ├── WellnessPage.jsx
    │   │   ├── NutritionPage.jsx
    │   │   ├── EmergencyPage.jsx
    │   │   ├── HealthDiaryPage.jsx
    │   │   ├── GamificationPage.jsx
    │   │   ├── ChatPage.jsx
    │   │   ├── ProfilePage.jsx
    │   │   └── NotFoundPage.jsx
    │   ├── store/
    │   │   ├── index.js
    │   │   └── slices/
    │   │       ├── authSlice.js
    │   │       ├── medicineSlice.js
    │   │       ├── wellnessSlice.js
    │   │       ├── nutritionSlice.js
    │   │       ├── uiSlice.js
    │   │       └── chatSlice.js
    │   ├── services/
    │   │   ├── api.js            # Axios instance with interceptors
    │   │   └── socket.js         # Socket.io client
    │   ├── App.js
    │   ├── index.js
    │   └── index.css             # Tailwind + custom styles
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── package.json
    └── .env.example
```

---

## Quick Start

### Prerequisites
- Node.js v18+
- npm v9+
- MongoDB Atlas account (free tier)
- Groq API key (free at console.groq.com)

### 1. Clone & Install

```bash
# Backend
cd caresphere/backend
npm install

# Frontend
cd caresphere/frontend
npm install
```

### 2. Configure Environment

```bash
# Backend
cp .env.example .env
# Edit .env with your credentials

# Frontend
cp .env.example .env
# Edit with your API URLs
```

### 3. Start Development

```bash
# Terminal 1 — Backend
cd backend
npm run dev      # starts on port 5000

# Terminal 2 — Frontend
cd frontend
npm start        # starts on port 3000
```

### 4. Open App
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api
- API Health: http://localhost:5000/api/health

---

## Environment Variables

### Backend `.env`

```env
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# MongoDB Atlas
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/caresphere

# JWT (use a strong random string, min 32 chars)
JWT_SECRET=your_super_secret_jwt_key_here_minimum_32_characters
JWT_EXPIRES_IN=7d

# Groq AI (free at console.groq.com)
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxx

# HuggingFace (free at huggingface.co/settings/tokens)
HUGGINGFACE_API_KEY=hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Email (Gmail + App Password)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@gmail.com
SMTP_PASS=your_app_password

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads
```

### Frontend `.env`

```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000
```

---

## API Documentation

### Authentication  `POST /api/auth/*`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/register` | ❌ | Register new user |
| POST | `/auth/login` | ❌ | Login, returns JWT |
| GET | `/auth/profile` | ✅ | Get current user profile |
| PUT | `/auth/profile` | ✅ | Update profile (multipart) |
| PUT | `/auth/password` | ✅ | Change password |
| GET | `/auth/dashboard` | ✅ | Dashboard stats |
| POST | `/auth/link-caregiver` | ✅ | Link caregiver by email |
| GET | `/auth/users` | ✅ Admin | List all users |

**Register/Login Response:**
```json
{
  "success": true,
  "token": "eyJhbGci...",
  "user": { "_id": "...", "name": "Jane", "email": "jane@...", "role": "elderly", "xp": 0, "level": 1 }
}
```

---

### Medicines  `GET/POST /api/medicines/*`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/medicines` | All medicines (query: ?active=true) |
| POST | `/medicines` | Add medicine (multipart with prescription image) |
| GET | `/medicines/:id` | Get single medicine |
| PUT | `/medicines/:id` | Update medicine |
| DELETE | `/medicines/:id` | Delete medicine |
| POST | `/medicines/scan` | OCR prescription scan (multipart) |
| GET | `/medicines/reminders/today` | Today's schedule |
| PUT | `/medicines/reminders/:id/status` | Mark taken/missed/snoozed |
| GET | `/medicines/compliance` | Compliance report (?days=30) |
| GET | `/medicines/:id/explain` | AI medicine explanation |

---

### Wellness  `GET/POST /api/wellness/*`

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/wellness/mood` | Log mood entry |
| GET | `/wellness/mood/history` | Mood history (?days=30) |
| POST | `/wellness/journal` | Add journal entry |
| GET | `/wellness/journal` | Get journal entries |
| POST | `/wellness/meditation` | Log meditation session |
| GET | `/wellness/stats` | Wellness statistics |

---

### Nutrition  `GET/POST /api/nutrition/*`

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/nutrition/meals` | Log meal (multipart) |
| GET | `/nutrition/meals/today` | Today's nutrition |
| GET | `/nutrition/meals/history` | History (?days=7) |
| POST | `/nutrition/water` | Log water intake |
| GET | `/nutrition/water/today` | Today's water summary |
| GET | `/nutrition/diet-suggestions` | AI diet plan |
| POST | `/nutrition/recognize-food` | AI food recognition (image) |

---

### Emergency  `GET/POST /api/emergency/*`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/emergency/contacts` | List emergency contacts |
| POST | `/emergency/contacts` | Add contact |
| PUT | `/emergency/contacts/:id` | Update contact |
| DELETE | `/emergency/contacts/:id` | Remove contact |
| POST | `/emergency/sos` | Trigger SOS alert |
| GET | `/emergency/alerts` | Alert history |
| PUT | `/emergency/alerts/:id/resolve` | Resolve alert |

---

### Health Diary  `GET/POST /api/health/*`

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/health/log` | Log symptoms + vitals |
| GET | `/health/logs` | History (?days=30&page=1&limit=15) |
| GET | `/health/logs/:id` | Single log |
| GET | `/health/report` | Download PDF report (?days=30) |
| GET | `/health/vitals/trends` | Vital sign trends |

---

### Gamification  `GET/POST /api/gamification/*`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/gamification/progress` | XP, level, streak, achievements |
| GET | `/gamification/challenges` | Active daily challenges |
| PUT | `/gamification/challenges/:id` | Update challenge progress |
| GET | `/gamification/leaderboard` | Global XP leaderboard |
| POST | `/gamification/login-bonus` | Claim daily login bonus |

---

### AI Chat  `GET/POST /api/chat/*`

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/chat/message` | Send message, get AI response |
| GET | `/chat/sessions` | List chat sessions |
| GET | `/chat/sessions/:id` | Get session messages |
| DELETE | `/chat/sessions/:id` | Delete session |
| POST | `/chat/quick` | Quick question (no session) |

---

## Socket.io Events

### Client → Server
| Event | Payload | Description |
|-------|---------|-------------|
| `join:user` | userId | Join personal notification room |
| `join:caregiver` | caregiverId | Join caregiver monitoring room |
| `emergency:sos` | { userId, location } | Broadcast SOS |
| `location:update` | { userId, lat, lng } | Share live location |
| `chat:typing` | { userId, isTyping } | Typing indicator |
| `reminder:acknowledge` | { reminderId, userId } | Ack reminder |

### Server → Client
| Event | Payload | Description |
|-------|---------|-------------|
| `emergency:{userId}` | alert object | Incoming SOS alert |
| `location:updated` | { userId, lat, lng, timestamp } | Caregiver sees location |
| `chat:typing:{userId}` | { isTyping } | Typing status |
| `reminder:acknowledged` | { reminderId } | Reminder ack'd |

---

## MongoDB Schemas

| Collection | Key Fields |
|---|---|
| Users | name, email, role, xp, level, streak, medicalConditions, allergies |
| Medicines | userId, name, dosage, frequency, times, isActive |
| Reminders | userId, medicineId, scheduledTime, status (pending/taken/missed) |
| MoodLogs | userId, mood, moodScore, emotions, aiAnalysis |
| JournalEntries | userId, content, sentiment, aiInsights |
| Meals | userId, mealType, foods[], totalCalories |
| WaterLogs | userId, amount, unit, logDate |
| EmergencyContacts | userId, name, phone, relation, isPrimary |
| EmergencyAlerts | userId, type, status, location, notifiedContacts |
| Symptoms | userId, symptoms[], vitalSigns, aiSummary |
| Achievements | userId, type, title, xpAwarded |
| Challenges | userId, type, title, target, current, status |
| ChatHistory | userId, messages[], sessionTitle |
| Meditation | userId, type, duration |
| CaregiverLink | caregiverId, patientId, permissions, status |
| WellnessSessions | userId, type, duration |

---

## XP & Gamification System

| Action | XP Reward |
|--------|-----------|
| Medicine taken | +10 XP |
| Mood logged | +5 XP |
| Journal entry | +8 XP |
| Meditation session | +15 XP |
| Meal logged | +5 XP |
| Daily water goal met | +5 XP |
| Daily login | +10 XP (+ streak bonus) |
| Streak bonus | +2 XP per day (max +30) |
| Challenge complete | +20–30 XP |
| Medicine added | +5 XP |
| Level formula | Level = floor(XP / 100) + 1 |

---

## Deployment

### Deploy Backend to Railway / Render

```bash
# 1. Push to GitHub
git init && git add . && git commit -m "CareSphere AI"
git push origin main

# 2. Connect Railway or Render to your repo
# 3. Set environment variables from .env
# 4. Set build command: npm install
# 5. Set start command: npm start
```

### Deploy Frontend to Vercel / Netlify

```bash
# 1. In frontend/.env, set:
REACT_APP_API_URL=https://your-backend.railway.app/api
REACT_APP_SOCKET_URL=https://your-backend.railway.app

# 2. Build
npm run build

# 3. Deploy build/ folder to Vercel or Netlify
```

### MongoDB Atlas Setup

1. Create free cluster at mongodb.com/atlas
2. Create database user
3. Whitelist IP (0.0.0.0/0 for production)
4. Get connection string → paste into `MONGODB_URI`

### Get Free API Keys

| Service | URL | Free Tier |
|---------|-----|-----------|
| Groq AI | console.groq.com | 30 RPM, unlimited tokens |
| HuggingFace | huggingface.co/settings/tokens | Free inference API |
| MongoDB Atlas | mongodb.com/atlas | 512MB free |

---

## Accessibility Features

| Feature | Implementation |
|---------|----------------|
| Large Font Mode | CSS class toggle on `<html>`, scales all text |
| High Contrast | CSS filter: contrast(1.5) |
| Dark Mode | Tailwind `dark:` classes |
| Voice Input | Web Speech API (SpeechRecognition) |
| Voice Output | SpeechSynthesis API for reminders & AI |
| Keyboard Navigation | All interactive elements are focusable |
| Screen Reader | Semantic HTML, ARIA labels |
| Simple UI | Large buttons (min 44px), clear labels |
| Multilingual | preferredLanguage field, voice language setting |
| One-Tap SOS | Large emergency button, immediate action |

---

## Security

- JWT tokens with 7-day expiry
- bcrypt password hashing (12 rounds)
- Helmet.js security headers
- Rate limiting (100 req/15min global, 10 req/15min for auth)
- CORS restricted to frontend origin
- Input validation with express-validator
- File upload restrictions (images/PDF only, 10MB max)
- Environment variables for all secrets
- MongoDB connection with auth

---

## License

MIT License — Free to use, modify, and distribute.

---

Built with ❤️ for elderly people and persons with disabilities.
Made in INDIA
