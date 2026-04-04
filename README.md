# 🛡️ KavachForWork

**AI-powered climate protection for gig workers and delivery riders in India.**

Dynamic weekly pricing by registered state and city. Weather-trigger payouts with hardware-backed fraud detection via an 8-signal Random Forest AI.

---

## 🏗️ Architecture

```
kavachforwork/
├── client/          # React + Vite + Tailwind (frontend)
├── server/          # Node.js + Express + Socket.io (backend)
├── ai/              # Python FastAPI + scikit-learn (fraud detection)
├── mobile/          # Capacitor + Android Java (sensor bridge)
└── docker-compose.yml
```

### Tech Stack
| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS, React Router, Recharts, React-Leaflet |
| Backend | Node.js, Express, MongoDB (Mongoose), Socket.io, node-cron |
| AI/ML | FastAPI, scikit-learn RandomForest, joblib |
| Auth | JWT (7-day expiry), bcrypt (12 rounds) |
| Weather Oracle | WeatherStack API (`WEATHERSTACK_API_KEY` from `.env`) |
| Mobile | Capacitor, Android Java (KavachPlugin) |
| Payments | Razorpay (demo mode — no real charges) |

---

## 🚀 Quick Start (Local)

### Prerequisites
- Node.js 20+
- Python 3.11+
- MongoDB Atlas account (cloud) or MongoDB (local)

### 1. Clone & Setup
```bash
git clone <repo>
cd kavachforwork
cp .env.example .env
# Edit .env with your MongoDB Atlas URI and other keys
```

### 2. MongoDB Atlas Setup
1. Create a cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Get your connection string: `mongodb+srv://<username>:<password>@<cluster>.mongodb.net/?appName=Cluster0`
3. Add it to `.env` as: `MONGODB_URI=<your-atlas-uri>`
4. Create a database user with read/write permissions
5. Whitelist your IP address

### 2. Install Dependencies
```bash
# Install all at once
npm run install:all

# Or individually
cd server && npm install
cd ../client && npm install
cd ../ai && pip install -r requirements.txt
```

### 3. Seed Database
```bash
cd server && node seed.js
# Creates admin user + demo workers + sample claims
```

### 4. Start All Services
```bash
# From root — starts server + client + AI concurrently
npm run dev
```

**Services:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000
- AI Service: http://localhost:8000
- API Docs: http://localhost:8000/docs

---

## 🐳 Docker (One Command)

```bash
docker-compose up --build
```

App runs at: http://localhost:3000

---

## 🔐 Login Credentials

After seeding:

| Role | Email/Phone | Password |
|------|-------------|----------|
| Admin | admin@kavachforwork.in | Admin@Kavach2024 |
| Demo Worker | 9876543210 | Demo@1234 |

---

## 📱 Key Features

### User Flow
1. **Register** → ₹100 signup bonus added automatically
2. **Top Up Wallet** → Add any amount above the minimum top-up
3. **Activate Insurance** → Your state-based weekly premium is deducted for 7-day coverage
4. **File Claim** → Check temp → Collect sensors → AI verify → Payout to wallet, bank, or UPI

### Admin Dashboard
- Real-time claim stream via Socket.io
- Revenue vs Payouts chart (Recharts AreaChart)
- Fraud analytics (PieChart)
- Live worker map (React-Leaflet)
- Approve/reject claims manually

### AI Fraud Detection (Sentry Model)
```
Features (8 signals):
  ambient_temp          - WeatherStack oracle temperature
  device_temp           - Battery temperature (°C) — KEY SIGNAL
  is_charging           - 1=charging (indoor fraud flag)
  network_type_encoded  - 0=WiFi (indoor), 2=mobile (outdoor)
  brightness_level      - 0-1 (outdoor → max brightness)
  battery_drain_rate    - higher drain = more usage = outdoor
  jitter                - GPS signal noise (outdoor movement)
  altitude_variance     - Movement indicator

Payout logic:
  45°C+ trigger required
  Severity affects the payout tier
  Final amount is scaled from the worker's registered max payout
  Approved money can be routed to wallet, bank, or UPI
```

---

## 🌡️ Weather Oracle

Using **WeatherStack API** (set `WEATHERSTACK_API_KEY` in `.env`):
- Real-time temp at GPS coordinates
- Free tier: 250 calls/month
- Fallback: mock data in dev mode

The repo can also use a local weather oracle model at `weather_Oracle.joblib` for payout trigger verification.
- Model type: `RandomForestRegressor`
- Features: `temperature_c`, `humidity`, `wind_speed_ms`, `precipitation_mm`
- AI endpoint: `POST /oracle/predict`
- Enable it by setting `AI_WEATHER_ORACLE_ENABLED=true`
- For GitHub-friendly copies, keep this file out of normal Git history or store it with Git LFS

---

## 📲 Android Setup (Mobile)

```bash
cd client && npm run build
cd ../mobile
npx cap init
npx cap add android
npx cap copy android
npx cap open android
```

The `KavachPlugin.java` bridges to native battery temperature sensor.

---

## 🔌 API Endpoints

### Auth
```
POST /api/auth/register
POST /api/auth/login
POST /api/auth/admin/login
GET  /api/auth/me
```

### User
```
GET  /api/user/profile
PUT  /api/user/profile
POST /api/user/activate-insurance
GET  /api/user/transactions
```

### Claims
```
POST /api/claims/submit
GET  /api/claims/my
GET  /api/claims/:id
```

### Weather
```
GET  /api/weather/heatwave?lat=26.9&lng=75.8
GET  /api/weather/current?city=Jaipur
GET  /api/weather/aqi?lat=26.9&lng=75.8
```

### Wallet
```
GET  /api/wallet/balance
POST /api/wallet/topup
```

### Admin (requires admin JWT)
```
GET  /api/admin/stats
GET  /api/admin/revenue
GET  /api/admin/claims
PUT  /api/admin/claims/:id
GET  /api/admin/workers/map
GET  /api/admin/fraud-stats
```

### AI Service (FastAPI)
```
POST http://localhost:8000/verify-claim
GET  http://localhost:8000/model-info
GET  http://localhost:8000/docs  (Swagger UI)
```

---

## ☁️ Deployment

### Vercel (Frontend)
```bash
cd client
vercel --prod
# Set env: VITE_API_URL=https://your-api.railway.app/api
```

### Railway (Backend + MongoDB)
```bash
railway up
# Set all env vars from .env.example
```

### Render (AI Service)
- Connect GitHub repo
- Root dir: `ai/`
- Start cmd: `uvicorn main:app --host 0.0.0.0 --port $PORT`

---

## 📋 Environment Variables

See `.env.example` for all required variables.

Critical ones:
```env
MONGODB_URI=mongodb://localhost:27017/kavachforwork
JWT_SECRET=your_32_char_secret
WEATHERSTACK_API_KEY=your_weatherstack_api_key_here
AI_SERVICE_URL=http://localhost:8000
```

---

## ⚠️ Disclaimer

KavachForWork is an **InsurTech prototype** built to demonstrate parametric microinsurance concepts. It is NOT a licensed insurance product. For production use, IRDAI (Insurance Regulatory and Development Authority of India) registration and compliance are required.

---

*Built with ❤️ for India's outdoor workers*
