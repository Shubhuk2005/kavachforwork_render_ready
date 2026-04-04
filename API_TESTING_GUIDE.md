# PowerShell API Testing Guide for Windows

## Quick Start - Run These Commands in PowerShell

### Step 1: Start the Server (in new PowerShell terminal)
```powershell
cd c:\Users\aayus\Downloads\kavachforwork\kavachforwork\server
npm start
```

### Step 2: Test Health Check
```powershell
curl -uri "http://localhost:5000/health" -Method GET
```

**Expected Response:**
```json
{
    "status": "ok",
    "service": "KavachForWork API",
    "timestamp": "2024-04-04T..."
}
```

---

## Complete API Test Commands

### 1. Health Check
```powershell
$response = Invoke-WebRequest -Uri "http://localhost:5000/health" -Method GET
$response.Content | ConvertFrom-Json | Format-Table
```

### 2. User Registration
```powershell
$body = @{
    name = "Test User"
    phone = "9876543210"
    password = "TestPass@123"
    workerType = "delivery_driver"
    city = "Jaipur"
    state = "Rajasthan"
} | ConvertTo-Json

$response = Invoke-WebRequest -Uri "http://localhost:5000/api/auth/register" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body

$data = $response.Content | ConvertFrom-Json
$token = $data.token
Write-Host "Registration successful!"
Write-Host "Token: $($token.Substring(0, 20))..."
Write-Host "Save this token for next tests!"
```

### 3. User Login
```powershell
$body = @{
    phone = "9876543210"
    password = "TestPass@123"
} | ConvertTo-Json

$response = Invoke-WebRequest -Uri "http://localhost:5000/api/auth/login" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body

$data = $response.Content | ConvertFrom-Json
$token = $data.token
Write-Host "Login successful!"
Write-Host "Token: $($token.Substring(0, 20))..."
```

### 4. Get User Profile (requires token)
```powershell
$token = "YOUR_TOKEN_HERE"  # ← Paste your token here

$headers = @{
    "Authorization" = "Bearer $token"
}

$response = Invoke-WebRequest -Uri "http://localhost:5000/api/user/profile" `
    -Method GET `
    -Headers $headers

$response.Content | ConvertFrom-Json | ConvertTo-Json | Write-Host
```

### 5. Get Wallet Balance
```powershell
$token = "YOUR_TOKEN_HERE"

$headers = @{
    "Authorization" = "Bearer $token"
}

$response = Invoke-WebRequest -Uri "http://localhost:5000/api/wallet/balance" `
    -Method GET `
    -Headers $headers

$response.Content | ConvertFrom-Json | Format-Table
```

### 6. Top Up Wallet
```powershell
$token = "YOUR_TOKEN_HERE"

$body = @{
    amount = 100
} | ConvertTo-Json

$headers = @{
    "Authorization" = "Bearer $token"
}

$response = Invoke-WebRequest -Uri "http://localhost:5000/api/wallet/topup" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body `
    -Headers $headers

$response.Content | ConvertFrom-Json | Format-Table
```

### 7. Activate Insurance
```powershell
$token = "YOUR_TOKEN_HERE"

$headers = @{
    "Authorization" = "Bearer $token"
}

$response = Invoke-WebRequest -Uri "http://localhost:5000/api/user/activate-insurance" `
    -Method POST `
    -ContentType "application/json" `
    -Headers $headers

$response.Content | ConvertFrom-Json | Format-Table
```

### 8. Submit Claim
```powershell
$token = "YOUR_TOKEN_HERE"

$body = @{
    location = @{
        lat = 26.91
        lng = 75.78
    }
    weather = @{
        ambientTemp = 45
        humidity = 40
        windSpeed = 5
        precipitation = 0
    }
    sensorData = @{
        deviceTemp = 40
        jitter = 0.5
        isCharging = $false
        networkTypeEncoded = 2
        batteryDrainRate = 0.4
        brightnessLevel = 0.7
        altitudeVariance = 0.2
    }
} | ConvertTo-Json

$headers = @{
    "Authorization" = "Bearer $token"
}

$response = Invoke-WebRequest -Uri "http://localhost:5000/api/claims/submit" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body `
    -Headers $headers

$response.Content | ConvertFrom-Json | ConvertTo-Json | Write-Host
```

### 9. Get My Claims
```powershell
$token = "YOUR_TOKEN_HERE"

$headers = @{
    "Authorization" = "Bearer $token"
}

$response = Invoke-WebRequest -Uri "http://localhost:5000/api/claims/my" `
    -Method GET `
    -Headers $headers

$response.Content | ConvertFrom-Json | ConvertTo-Json | Write-Host
```

### 10. Get Transaction History
```powershell
$token = "YOUR_TOKEN_HERE"

$headers = @{
    "Authorization" = "Bearer $token"
}

$response = Invoke-WebRequest -Uri "http://localhost:5000/api/user/transactions" `
    -Method GET `
    -Headers $headers

$response.Content | ConvertFrom-Json | ConvertTo-Json | Write-Host
```

### 11. Admin Login
```powershell
$body = @{
    email = "admin@kavachforwork.in"
    password = "Admin@Kavach2024"  # ← Change if updated in .env
} | ConvertTo-Json

$response = Invoke-WebRequest -Uri "http://localhost:5000/api/auth/admin/login" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body

$data = $response.Content | ConvertFrom-Json
$adminToken = $data.token
Write-Host "Admin login successful!"
Write-Host "Admin Token: $($adminToken.Substring(0, 20))..."
```

### 12. Get Admin Dashboard Stats
```powershell
$adminToken = "YOUR_ADMIN_TOKEN_HERE"

$headers = @{
    "Authorization" = "Bearer $adminToken"
}

$response = Invoke-WebRequest -Uri "http://localhost:5000/api/admin/stats" `
    -Method GET `
    -Headers $headers

$response.Content | ConvertFrom-Json | ConvertTo-Json | Write-Host
```

### 13. Get All Claims (Admin)
```powershell
$adminToken = "YOUR_ADMIN_TOKEN_HERE"

$headers = @{
    "Authorization" = "Bearer $adminToken"
}

$response = Invoke-WebRequest -Uri "http://localhost:5000/api/admin/claims" `
    -Method GET `
    -Headers $headers

$response.Content | ConvertFrom-Json | ConvertTo-Json | Write-Host
```

### 14. Test Rate Limiting
```powershell
# Try to login 15 times rapidly (limit is 10 per 15 min)
for ($i = 1; $i -le 15; $i++) {
    Write-Host "Attempt $i..."
    
    $body = @{
        phone = "9999999999"
        password = "wrongpassword"
    } | ConvertTo-Json
    
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:5000/api/auth/login" `
            -Method POST `
            -ContentType "application/json" `
            -Body $body `
            -SkipHttpErrorCheck $true
        
        $data = $response.Content | ConvertFrom-Json
        Write-Host "Response: $($data.error)"
    } catch {
        Write-Host "Error: $_"
    }
    
    Start-Sleep -Milliseconds 100
}
```

---

## Expected API Responses

### Success Response (200 OK)
```json
{
    "message": "Operation successful",
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
        "_id": "...",
        "name": "Test User",
        "phone": "9876543210",
        "wallet": { "balance": 100 },
        "isInsured": true
    }
}
```

### Unauthorized Response (401)
```json
{
    "error": "No token provided. Please log in."
}
```

### Rate Limited Response (429)
```json
{
    "error": "Too many login attempts. Please try again in 15 minutes."
}
```

### Validation Error (400)
```json
{
    "errors": [
        {
            "param": "phone",
            "msg": "Valid Indian mobile number required"
        }
    ]
}
```

---

## Common Issues & Solutions

### ❌ Error: "ECONNREFUSED"
**Meaning:** Server is not running
**Solution:**
```powershell
# Start the server in a new terminal
cd c:\Users\aayus\Downloads\kavachforwork\kavachforwork\server
npm start
# Should show: [Server] KavachForWork running on port 5000
```

### ❌ Error: "Invalid credentials"
**Meaning:** Wrong phone/password or user doesn't exist
**Solution:**
- Register new user first
- Use correct phone format (10 digits starting with 6-9)
- Password must be at least 6 characters

### ❌ Error: "mongodb+srv://...403"
**Meaning:** MongoDB connection failed (wrong credentials)
**Solution:**
1. Update `.env` file with correct MongoDB URI
2. Check MongoDB Atlas IP whitelist
3. Verify database user exists

### ❌ Error: "Insurance is not active"
**Meaning:** Cannot submit claim without active insurance
**Solution:**
1. Top up wallet (`/api/wallet/topup`)
2. Activate insurance (`/api/user/activate-insurance`)
3. Must have ₹29 balance for weekly premium

### ❌ Error: "Temperature below heatwave threshold"
**Meaning:** Ambient temperature < 45°C not eligible
**Solution:**
Use `"ambientTemp": 45` or higher in claim

### ❌ Error: "Too many requests"
**Meaning:** Rate limit exceeded
**Solution:**
Wait 15 minutes for auth routes, or wait for global 100-request limit to reset

---

## Testing Checklist

- [ ] Health check returns 200
- [ ] User registration succeeds
- [ ] Token is returned after registration
- [ ] User login succeeds
- [ ] Wallet can be topped up
- [ ] Insurance can be activated
- [ ] Claim can be submitted (requires insurance)
- [ ] Claim shows fraud analysis
- [ ] Admin login works
- [ ] Admin dashboard loads
- [ ] Unauthorized requests return 401
- [ ] Rate limiting works

---

## API Documentation

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/health` | GET | No | Health check |
| `/api/auth/register` | POST | No | Register new user |
| `/api/auth/login` | POST | No | User login |
| `/api/auth/admin/login` | POST | No | Admin login |
| `/api/user/profile` | GET | Yes | Get user profile |
| `/api/user/profile` | PUT | Yes | Update profile |
| `/api/user/activate-insurance` | POST | Yes | Activate weekly coverage |
| `/api/user/transactions` | GET | Yes | Get transactions |
| `/api/wallet/balance` | GET | Yes | Get wallet balance |
| `/api/wallet/topup` | POST | Yes | Add money to wallet |
| `/api/claims/submit` | POST | Yes | Submit claim |
| `/api/claims/my` | GET | Yes | Get my claims |
| `/api/claims/:id` | GET | Yes | Get claim details |
| `/api/admin/stats` | GET | Admin | Dashboard stats |
| `/api/admin/claims` | GET | Admin | All claims |
| `/api/admin/users` | GET | Admin | All users |
| `/api/weather/current` | GET | No | Weather data |

---

## Performance & Load Testing

To test with concurrent requests:

```powershell
# Load test: 100 concurrent requests to health endpoint
$job = @()
for ($i = 1; $i -le 100; $i++) {
    $job += Start-Job -ScriptBlock {
        Invoke-WebRequest -Uri "http://localhost:5000/health" -Method GET | Select-Object StatusCode
    }
}

$job | Wait-Job
$job | Receive-Job | Group-Object StatusCode
```

Should all return `StatusCode: 200`

---

## Next Steps

1. ✅ Verify all APIs working with these commands
2. ✅ Test sign-up/sign-in flows end-to-end
3. ✅ Verify fraud detection is called for claims
4. ✅ Check MongoDB has persisted data
5. ✅ Deploy to production with new .env credentials

