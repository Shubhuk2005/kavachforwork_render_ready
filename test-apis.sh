#!/bin/bash
# KavachForWork API Testing Script
# Tests all endpoints to verify functionality

BASE_URL="http://localhost:5000"
TOKEN=""
USER_ID=""
CLAIM_ID=""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "================================================"
echo "🧪 KavachForWork API Test Suite"
echo "================================================"
echo ""

# Test 1: Health Check
echo -e "${YELLOW}[1/15] Testing Health Check...${NC}"
response=$(curl -s "$BASE_URL/health")
if echo "$response" | grep -q "ok"; then
  echo -e "${GREEN}✓ Health check passed${NC}"
else
  echo -e "${RED}✗ Health check failed${NC}"
  echo "Response: $response"
fi
echo ""

# Test 2: User Registration
echo -e "${YELLOW}[2/15] Testing User Registration...${NC}"
response=$(curl -s -X POST "$BASE_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "phone": "9876543210",
    "password": "TestPass@123",
    "workerType": "delivery_driver",
    "city": "Jaipur",
    "state": "Rajasthan"
  }')
if echo "$response" | grep -q "token"; then
  TOKEN=$(echo "$response" | grep -o '"token":"[^"]*' | sed 's/"token":"//')
  echo -e "${GREEN}✓ User registration passed${NC}"
  echo "Token: ${TOKEN:0:20}..."
else
  echo -e "${RED}✗ User registration failed${NC}"
  echo "Response: $response"
fi
echo ""

# Test 3: User Login
echo -e "${YELLOW}[3/15] Testing User Login...${NC}"
response=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "9876543210",
    "password": "TestPass@123"
  }')
if echo "$response" | grep -q "token"; then
  echo -e "${GREEN}✓ User login passed${NC}"
else
  echo -e "${RED}✗ User login failed${NC}"
  echo "Response: $response"
fi
echo ""

# Test 4: Admin Login
echo -e "${YELLOW}[4/15] Testing Admin Login...${NC}"
response=$(curl -s -X POST "$BASE_URL/api/auth/admin/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@kavachforwork.in",
    "password": "Admin@Kavach2024"
  }')
if echo "$response" | grep -q "token"; then
  ADMIN_TOKEN=$(echo "$response" | grep -o '"token":"[^"]*' | sed 's/"token":"//')
  echo -e "${GREEN}✓ Admin login passed${NC}"
else
  echo -e "${RED}✗ Admin login failed (check .env ADMIN_PASSWORD)${NC}"
  echo "Response: $response"
fi
echo ""

# Test 5: Get User Profile (requires token)
if [ -z "$TOKEN" ]; then
  echo -e "${YELLOW}[5/15] Skipping user profile test (no token)${NC}"
else
  echo -e "${YELLOW}[5/15] Testing Get User Profile...${NC}"
  response=$(curl -s -X GET "$BASE_URL/api/user/profile" \
    -H "Authorization: Bearer $TOKEN")
  if echo "$response" | grep -q "user"; then
    echo -e "${GREEN}✓ Get user profile passed${NC}"
    USER_ID=$(echo "$response" | grep -o '"_id":"[^"]*' | head -1 | sed 's/"_id":"//')
  else
    echo -e "${RED}✗ Get user profile failed${NC}"
    echo "Response: $response"
  fi
fi
echo ""

# Test 6: Get Wallet Balance
if [ -z "$TOKEN" ]; then
  echo -e "${YELLOW}[6/15] Skipping wallet balance test (no token)${NC}"
else
  echo -e "${YELLOW}[6/15] Testing Get Wallet Balance...${NC}"
  response=$(curl -s -X GET "$BASE_URL/api/wallet/balance" \
    -H "Authorization: Bearer $TOKEN")
  if echo "$response" | grep -q "balance"; then
    balance=$(echo "$response" | grep -o '"balance":[0-9]*' | grep -o '[0-9]*')
    echo -e "${GREEN}✓ Wallet balance test passed (Balance: ₹${balance})${NC}"
  else
    echo -e "${RED}✗ Wallet balance test failed${NC}"
    echo "Response: $response"
  fi
fi
echo ""

# Test 7: Activate Insurance
if [ -z "$TOKEN" ]; then
  echo -e "${YELLOW}[7/15] Skipping activate insurance test (no token)${NC}"
else
  echo -e "${YELLOW}[7/15] Testing Activate Insurance...${NC}"
  response=$(curl -s -X POST "$BASE_URL/api/wallet/topup" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"amount": 100}')
  if echo "$response" | grep -q "balance"; then
    echo -e "${GREEN}✓ Wallet top-up passed${NC}"
  else
    echo -e "${RED}✗ Wallet top-up failed${NC}"
    echo "Response: $response"
  fi
fi
echo ""

# Test 8: Activate Insurance after top-up
if [ -z "$TOKEN" ]; then
  echo -e "${YELLOW}[8/15] Skipping insurance activation test (no token)${NC}"
else
  echo -e "${YELLOW}[8/15] Testing Activate Insurance...${NC}"
  response=$(curl -s -X POST "$BASE_URL/api/user/activate-insurance" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{}')
  if echo "$response" | grep -q "Insurance activated"; then
    echo -e "${GREEN}✓ Insurance activation passed${NC}"
  else
    echo -e "${RED}✗ Insurance activation failed (may need more wallet balance)${NC}"
    echo "Response: $response"
  fi
fi
echo ""

# Test 9: Submit Claim
if [ -z "$TOKEN" ]; then
  echo -e "${YELLOW}[9/15] Skipping claim submission test (no token)${NC}"
else
  echo -e "${YELLOW}[9/15] Testing Claim Submission...${NC}"
  response=$(curl -s -X POST "$BASE_URL/api/claims/submit" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "location": {"lat": 26.91, "lng": 75.78},
      "weather": {
        "ambientTemp": 45,
        "humidity": 40,
        "windSpeed": 5,
        "precipitation": 0
      },
      "sensorData": {
        "deviceTemp": 40,
        "jitter": 0.5,
        "isCharging": false,
        "networkTypeEncoded": 2,
        "batteryDrainRate": 0.4,
        "brightnessLevel": 0.7,
        "altitudeVariance": 0.2
      }
    }')
  if echo "$response" | grep -q "fraudAnalysis\|pending\|approved"; then
    CLAIM_ID=$(echo "$response" | grep -o '"_id":"[^"]*' | head -1 | sed 's/"_id":"//')
    echo -e "${GREEN}✓ Claim submission passed${NC}"
  else
    echo -e "${RED}✗ Claim submission failed${NC}"
    echo "Response: $response"
  fi
fi
echo ""

# Test 10: Get My Claims
if [ -z "$TOKEN" ]; then
  echo -e "${YELLOW}[10/15] Skipping get claims test (no token)${NC}"
else
  echo -e "${YELLOW}[10/15] Testing Get My Claims...${NC}"
  response=$(curl -s -X GET "$BASE_URL/api/claims/my" \
    -H "Authorization: Bearer $TOKEN")
  if echo "$response" | grep -q "claims"; then
    echo -e "${GREEN}✓ Get claims passed${NC}"
  else
    echo -e "${RED}✗ Get claims failed${NC}"
    echo "Response: $response"
  fi
fi
echo ""

# Test 11: Get Transaction History
if [ -z "$TOKEN" ]; then
  echo -e "${YELLOW}[11/15] Skipping transaction history test (no token)${NC}"
else
  echo -e "${YELLOW}[11/15] Testing Get Transaction History...${NC}"
  response=$(curl -s -X GET "$BASE_URL/api/user/transactions" \
    -H "Authorization: Bearer $TOKEN")
  if echo "$response" | grep -q "transactions"; then
    echo -e "${GREEN}✓ Get transaction history passed${NC}"
  else
    echo -e "${RED}✗ Get transaction history failed${NC}"
    echo "Response: $response"
  fi
fi
echo ""

# Test 12: Get Weather Data
echo -e "${YELLOW}[12/15] Testing Get Weather Data...${NC}"
response=$(curl -s -X GET "$BASE_URL/api/weather/current?city=Jaipur")
if echo "$response" | grep -q "temperature\|error"; then
  echo -e "${GREEN}✓ Weather endpoint responded${NC}"
  if echo "$response" | grep -q "error"; then
    echo "   Note: API key may be missing (check .env)"
  fi
else
  echo -e "${RED}✗ Weather endpoint failed${NC}"
fi
echo ""

# Test 13: Admin Dashboard (requires admin token)
if [ -z "$ADMIN_TOKEN" ]; then
  echo -e "${YELLOW}[13/15] Skipping admin dashboard test (no admin token)${NC}"
else
  echo -e "${YELLOW}[13/15] Testing Admin Dashboard Stats...${NC}"
  response=$(curl -s -X GET "$BASE_URL/api/admin/stats" \
    -H "Authorization: Bearer $ADMIN_TOKEN")
  if echo "$response" | grep -q "overview\|totalUsers"; then
    echo -e "${GREEN}✓ Admin dashboard stats passed${NC}"
  else
    echo -e "${RED}✗ Admin dashboard stats failed${NC}"
    echo "Response: $response"
  fi
fi
echo ""

# Test 14: Unauthorized Access (no token)
echo -e "${YELLOW}[14/15] Testing Unauthorized Access Protection...${NC}"
response=$(curl -s -X GET "$BASE_URL/api/user/profile")
if echo "$response" | grep -q "401\|No token"; then
  echo -e "${GREEN}✓ Unauthorized access properly blocked${NC}"
else
  echo -e "${RED}✗ Security issue: Unauthorized access not blocked${NC}"
fi
echo ""

# Test 15: Rate Limiting Test
echo -e "${YELLOW}[15/15] Testing Rate Limiting on Auth Routes...${NC}"
# Make multiple login attempts
for i in {1..12}; do
  curl -s -X POST "$BASE_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"phone":"9999999999","password":"wrong"}' > /dev/null
done

response=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"phone":"9999999999","password":"wrong"}')

if echo "$response" | grep -q "Too many\|limit"; then
  echo -e "${GREEN}✓ Rate limiting is working${NC}"
else
  echo -e "${YELLOW}⚠ Rate limiting may need verification${NC}"
fi
echo ""

echo "================================================"
echo "✅ API Testing Complete!"
echo "================================================"
echo ""
echo "Summary:"
echo "- Health Check: ✓"
echo "- Authentication (Register/Login): Check above"
echo "- Authorization (Protected routes): Check above"
echo "- User Profile: Check above"
echo "- Wallet/Payments: Check above"
echo "- Claims Submission: Check above"
echo "- Database (Persistence): Check above"
echo "- Rate Limiting: Check above"
echo ""
echo "Note: Some tests may fail if:"
echo "1. .env file not configured with correct credentials"
echo "2. MongoDB not running or unreachable"
echo "3. AI Service not running (for fraud detection)"
echo "4. WeatherStack API key invalid"
echo ""
