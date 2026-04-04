# 🔒 SECURITY FIXES & IMPLEMENTATION GUIDE

## URGENT: Immediate Actions (Before Any Deployment)

### 1. SET NEW CREDENTIALS ⚠️ CRITICAL

**Step 1: Generate New JWT Secret**
```bash
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
```
Copy the output and add to your `.env` file

**Step 2: Update MongoDB Password**
1. Go to https://cloud.mongodb.com/v2/projects
2. Select your KavachForWork project
3. Go to **Database Access** → Click your user → **Edit**
4. Generate new password
5. Copy new password
6. Update `.env`:
   ```env
   MONGODB_URI=mongodb+srv://username:[NEW_PASSWORD]@cluster0.mongodb.net/?appName=Cluster0
   ```

**Step 3: Rotate API Keys**
- WeatherStack: https://weatherstack.com/dashboard → Regenerate API Key
- Anthropic: https://console.anthropic.com → Create new key
- Razorpay: https://dashboard.razorpay.com/app/keys (test keys - OK to keep)

**Step 4: Generate Admin Password**
```bash
# Use a password manager or generate:
openssl rand -base64 12
```
Update `.env`:
```env
ADMIN_PASSWORD=your_new_generated_password_here
```

---

## Implementation Priority

### Priority 1: IMMEDIATE (Today)
- [x] Fix `.env.example` to remove sensitive values
- [x] Remove hardcoded API keys from `weather.js`
- [x] Parameterize `seed.js` demo password
- [ ] **Run this command to remove .env from git history:**
```bash
# If .env was ever committed, remove it:
git filter-branch --tree-filter "rm -f .env" HEAD

# Or simpler (single commit):
git rm --cached .env
git commit -m "Remove .env (credentials)"
git push origin main --force-with-lease  # ⚠️ Only if not shared with others
```

- [ ] Update `.env` with NEW credentials (keep it private, never commit)
- [ ] Test that all APIs still work with new credentials

### Priority 2: HIGH (This Week)
- [ ] Implement Razorpay webhook signature verification
- [ ] Add CSRF protection middleware
- [ ] Migrate localStorage tokens to HttpOnly cookies
- [ ] Implement refresh token rotation
- [ ] Add request logging with request IDs

### Priority 3: MEDIUM (Next 2 Weeks)
- [ ] Field-level encryption for PII (Aadhaar, phone, location)
- [ ] Implement OTP verification for sign-up
- [ ] Add audit logging for claim decisions
- [ ] Rate limiting per IP per endpoint
- [ ] API documentation with OpenAPI/Swagger

### Priority 4: NICE-TO-HAVE
- [ ] 2FA for admin accounts
- [ ] SMS/Email notifications for sensitive actions
- [ ] Behavioral analysis to detect fraud
- [ ] IP geofencing to India only
- [ ] Device fingerprinting

---

## Code Changes Already Made

### ✅ Fixed Files

**1. `.env.example`** - Removed all sensitive values
```bash
# BEFORE: Contains real API keys and passwords
WEATHERSTACK_API_KEY=your_weatherstack_api_key_here
JWT_SECRET=your_randomly_generated_secret

# AFTER: Placeholders only
WEATHERSTACK_API_KEY=your_weatherstack_api_key_here
JWT_SECRET=your_randomly_generated_secret_minimum_32_characters_long
```

**2. `server/routes/weather.js`** - Removed hardcoded API key fallback
```javascript
// BEFORE:
const WEATHERSTACK_KEY = process.env.WEATHERSTACK_API_KEY || 'your_weatherstack_api_key_here';

// AFTER:
const WEATHERSTACK_KEY = process.env.WEATHERSTACK_API_KEY;
if (!WEATHERSTACK_KEY) {
  console.warn('⚠️  WARNING: WEATHERSTACK_API_KEY not set in environment. Weather routes will fail.');
}
```

**3. `server/seed.js`** - Parameterized demo password
```javascript
// BEFORE:
password: 'Demo@1234'  // Hardcoded

// AFTER:
const DEMO_PASSWORD = process.env.DEMO_PASSWORD || 'Demo@1234';
password: DEMO_PASSWORD
```

---

## Recommended Security Fixes (Next Steps)

### Fix 1: Implement Razorpay Signature Verification

**File:** `server/routes/wallet.js`

**Current Code (UNSAFE):**
```javascript
// In production: verify Razorpay payment signature here
// For demo: direct top-up
const updatedUser = await User.findByIdAndUpdate(
  req.user._id,
  { $inc: { 'wallet.balance': amount } },
  { new: true }
);
```

**Fixed Code:**
```javascript
const crypto = require('crypto');

router.post('/topup', protect, [
  body('razorpayOrderId').notEmpty(),
  body('razorpayPaymentId').notEmpty(),
  body('razorpaySignature').notEmpty(),
], async (req, res) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, amount } = req.body;

    // Verify Razorpay signature
    const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
    hmac.update(razorpayOrderId + '|' + razorpayPaymentId);
    const signatureGenerated = hmac.digest('hex');

    if (signatureGenerated !== razorpaySignature) {
      return res.status(400).json({ error: 'Payment verification failed' });
    }

    // Only then update wallet
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $inc: { 'wallet.balance': amount } },
      { new: true }
    );

    // ... rest of code
  } catch (err) {
    res.status(500).json({ error: 'Payment processing failed' });
  }
});
```

---

### Fix 2: Add CSRF Protection

**Install package:**
```bash
npm install --save csurf cookie-parser
```

**Update `server/index.js`:**
```javascript
const cookieParser = require('cookie-parser');
const csrf = require('csurf');

app.use(cookieParser());

// CSRF protection for state-changing requests
const csrfProtection = csrf({ cookie: true });

app.get('/api/csrf-token', csrfProtection, (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

// Apply to all POST/PUT/DELETE routes
app.use('/api/', csrfProtection);
```

**Frontend usage:**
```javascript
// Get CSRF token
const response = await fetch('http://localhost:5000/api/csrf-token');
const { csrfToken } = await response.json();

// Include in requests
fetch('http://localhost:5000/api/claims/submit', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': csrfToken,
  },
  body: JSON.stringify(claimData),
});
```

---

### Fix 3: Migrate to HttpOnly Cookies

**File: `server/routes/auth.js`**

**Current (UNSAFE - localStorage vulnerable to XSS):**
```javascript
res.json({
  message: 'User registered successfully!',
  token: generateToken(user._id),  // ← returned to client, stored in localStorage
  user: user.toPublic(),
});
```

**Better approach - HttpOnly Cookies:**
```javascript
const token = generateToken(user._id);

res
  .cookie('auth_token', token, {
    httpOnly: true,      // ← JS cannot access (XSS safe)
    secure: process.env.NODE_ENV === 'production', // HTTPS only
    sameSite: 'strict',  // ← CSRF safe
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  })
  .json({
    message: 'User registered successfully!',
    user: user.toPublic(),
  });
```

**Update auth middleware to read from cookie:**
```javascript
const protect = async (req, res, next) => {
  try {
    const token = req.cookies.auth_token || req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token provided' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    
    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};
```

---

### Fix 4: Add Request Logging

**Install package:**
```bash
npm install --save morgan
```

**Update `server/index.js`:**
```javascript
const morgan = require('morgan');
const fs = require('fs');

// Create logs directory
if (!fs.existsSync('logs')) fs.mkdirSync('logs');

// Request logging
const stream = fs.createWriteStream('logs/api.log', { flags: 'a' });
app.use(morgan(':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" - :response-time ms', { stream }));

// Console logging (development)
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}
```

---

### Fix 5: Field-Level Encryption for PII

**Install package:**
```bash
npm install --save crypto-js
```

**Update `server/models/User.js`:**
```javascript
const CryptoJS = require('crypto-js');
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'change-in-production';

userSchema.pre('save', function(next) {
  // Encrypt sensitive fields
  if (this.isModified('aadhaar') && this.aadhaar) {
    this.aadhaar = CryptoJS.AES.encrypt(this.aadhaar, ENCRYPTION_KEY).toString();
  }
  if (this.isModified('phone') && this.phone) {
    // Store last 4 digits unencrypted for reference
    this.phoneMasked = this.phone.slice(-4);
    this.phone = CryptoJS.AES.encrypt(this.phone, ENCRYPTION_KEY).toString();
  }
  next();
});

userSchema.methods.getAadhaar = function() {
  if (this.aadhaar) {
    return CryptoJS.AES.decrypt(this.aadhaar, ENCRYPTION_KEY).toString(CryptoJS.enc.Utf8);
  }
  return null;
};
```

---

## Testing Checklist

### Test 1: Verify New Credentials
```bash
# 1. Update .env with new credentials
# 2. Start server
npm start

# 3. Test health check
curl http://localhost:5000/health

# Expected: {"status":"ok","service":"KavachForWork API",...}
```

### Test 2: Verify Authentication Works
```bash
# Register new user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "phone": "9999888877",
    "password": "TestPass@123",
    "workerType": "delivery_driver",
    "city": "Jaipur",
    "state": "Rajasthan"
  }'

# Expected: {"message":"User registered successfully!","token":"...","user":{...}}
```

### Test 3: Verify No Hardcoded Keys
```bash
# Search for exposed credentials
grep -r "your_weatherstack_api_key_here" . --exclude-dir=node_modules
grep -r "your_randomly_generated_secret" . --exclude-dir=node_modules
grep -r "Admin@Kavach2024" . --exclude-dir=node_modules

# Should return NOTHING if properly fixed
```

### Test 4: Verify .env not in git
```bash
# Check git history
git log --all --source --full-history -- .env

# Remove if found:
git filter-branch --tree-filter "rm -f .env" HEAD
```

---

## Deployment Checklist

- [ ] Generate new JWT_SECRET
- [ ] Change MongoDB password in Atlas
- [ ] Rotate all API keys
- [ ] Generate new ADMIN_PASSWORD
- [ ] Update .env file locally (NEVER COMMIT)
- [ ] Verify .env removed from git history
- [ ] Test all APIs with new credentials
- [ ] Update `.env` on production server
- [ ] Restart services
- [ ] Verify health check passes
- [ ] Test sign-up, sign-in, claims submission
- [ ] Verify no error logs expose credentials
- [ ] Set up monitoring/alerts

---

## Production Environment Variables

**Never hardcode these. Use environment secrets:**

- Docker Secrets / Docker Compose Secrets
- AWS Secrets Manager
- Kubernetes Secrets
- Environment variable files (gitignored)
- CI/CD pipeline secrets

**Example with Docker:**
```dockerfile
# Dockerfile
FROM node:18
WORKDIR /app
COPY . .
RUN npm install
EXPOSE 5000
CMD ["node", "index.js"]

# docker-compose.yml
services:
  server:
    build: ./server
    ports:
      - "5000:5000"
    environment:
      - MONGODB_URI=${MONGODB_URI}
      - JWT_SECRET=${JWT_SECRET}
      - NODE_ENV=production
    env_file:
      - .env.production  # ← gitignored file with real values
```

---

## Emergency Response (If Credentials Leaked)

If you suspect credentials are compromised:

1. **Immediately rotate all credentials**
   - MongoDB password (Atlas)
   - JWT_SECRET
   - API keys (WeatherStack, Anthropic, Razorpay)
   - Admin password

2. **Clean up git history**
   ```bash
   git filter-branch --tree-filter "rm -f .env" HEAD
   git push --force-with-lease
   ```

3. **Monitor for unauthorized access**
   - Check MongoDB access logs
   - Check API quota usage
   - Review all claims for suspicious activity

4. **Notify users if data accessed**
   - Be transparent about what was exposed
   - Advise users to change passwords
   - Implement additional security measures

---

## Security Best Practices Summary

✅ **DO:**
- Store secrets in environment variables
- Use strong passwords (>16 chars, mixed case)
- Implement rate limiting
- Use HTTPS in production
- Validate all user input
- Use bcrypt for passwords (already done ✓)
- Implement audit logging
- Use JWT with short expiration
- Implement CORS properly
- Hash sensitive fields

❌ **DON'T:**
- Hardcode secrets in code
- Use weak passwords
- Log sensitive data
- Expose stack traces to client
- Trust client-side validation only
- Use MD5/SHA1 for passwords
- Store tokens in localStorage (use cookies)
- Disable CORS for development
- Use `eval()` or `exec()`
- Skip input validation

---

## Questions?

If you need clarification on any security fix:
1. Check SECURITY_AUDIT.md for detailed findings
2. Review the code changes in git diff
3. Test locally before deploying
4. Use `.env.example` as a template

**Remember: Security is ongoing, not a one-time fix.**

