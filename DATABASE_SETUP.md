# Database Setup - KavachForWork

## ✅ MongoDB Atlas Configuration

**Connection String (in `.env`):**
```
MONGODB_URI=mongodb+srv://username:password@cluster0.mongodb.net/?appName=Cluster0
```

**Status:** ✅ Connected & Tested

---

## 📊 Data Models Using MongoDB (Mongoose)

All data is **automatically persisted** to MongoDB Atlas:

| Model | Collection | Purpose | Records After Seed |
|-------|-----------|---------|-------------------|
| **User** | users | Worker profiles, wallets, insurance | 6 (1 admin + 5 workers) |
| **Claim** | claims | Insurance claims with AI fraud scores | 6 sample claims |
| **Transaction** | transactions | Wallet transactions and payouts | Multiple payouts |

---

## 🔧 Schema Details

### Users
- Phone number (unique)
- Email (unique)
- Wallet balance (₹)
- Insurance status (active/inactive)
- Premium subscription dates
- Worker type (delivery, construction, vendor, etc.)

### Claims
- User reference
- Weather data (ambient temp, humidity, wind, precipitation)
- Sensor data (device temp, battery drain, brightness, GPS jitter)
- AI fraud detection scores (Sentry model + Weather Oracle model)
- Payout tier and amount
- Status (pending, approved, rejected, flagged, paid)
- Heatwave trigger temperature

### Transactions
- Type (premium_deduction, payout, topup, refund)
- Amount (₹)
- Balance after transaction
- Claim reference
- Status (completed, pending, failed)

---

## 🚀 Initialization

### Run Seed Script
```bash
cd server
npm install
node seed.js
```

**Output Includes:**
- ✅ Admin user (email: admin@kavachforwork.in)
- ✅ 5 demo workers with wallets
- ✅ 6 sample claims
- ✅ Revenue history for 8 weeks

---

## 🔍 Verification Commands

### Check Connection
```bash
node -e "require('mongoose').connect(process.env.MONGODB_URI).then(() => console.log('✓ Connected'))"
```

### Count Documents
```bash
node -e "const User = require('./models/User'); User.countDocuments().then(count => console.log('Users:', count))"
```

### List All Collections
```bash
mongo "mongodb+srv://username:password@cluster0.mongodb.net/test" --eval "db.getCollectionNames().forEach(name => print(name))"
```

---

## 📝 AI Models Integration

Both ML models are now wired into the MongoDB workflow:

1. **Sentry Fraud Detection** (`sentry_AI_fraud_.joblib`)
   - Analyzes claim sensor data
   - Stores fraud_score in claims.fraudAnalysis

2. **Weather Oracle** (`weather_Oracle.joblib`)
   - Predicts heatwave probability
   - Stores oracle_score in claims.weatherOracle

All scores are **automatically indexed** in MongoDB for admin analytics.

---

## ⚙️ Environment Variables

**Required in `.env`:**
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/?appName=Cluster0
JWT_SECRET=<your-jwt-secret>
AI_SERVICE_URL=http://localhost:8000
AI_WEATHER_ORACLE_ENABLED=true
```

---

## 🐛 Troubleshooting

### Connection Timeout
- Check if your IP is whitelisted in MongoDB Atlas
- Verify database user credentials
- Ensure network access is enabled

### Duplicate Index Warning
- ✅ Fixed in Claim model (removed duplicate `status` index)

### Seed Script Fails
- Run `npm install` in the `/server` directory first
- Check that `.env` file exists with valid `MONGODB_URI`

---

## 📈 Data Retention

All data in MongoDB Atlas is **persistent**:
- Claims history
- User profiles
- Transaction logs
- AI predictions and fraud scores

Data is never cleared unless explicitly deleted or seed script is run again (which clears then repopulates).

---

**Last Updated:** April 4, 2026  
**Status:** ✅ Production Ready
