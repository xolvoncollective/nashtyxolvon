#!/bin/bash
# Supabase Deployment Verification Script

echo "🔍 Supabase Deployment Verification"
echo "===================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PASSED=0
FAILED=0

SUPABASE_URL="https://mzucfndifneytbesirkx.supabase.co"
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16dWNmbmRpZm5leXRiZXNpcmt4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzNDA1MzUsImV4cCI6MjA5NjkxNjUzNX0.fUynF1mfZCyy48aFkwz3_G52-4hd4EE-b5gpG7k0mpg"

# Test 1: Edge Functions Endpoints
echo -e "${BLUE}📋 Test 1: Checking Edge Functions...${NC}"
FUNCTIONS=("auth-login" "orders-api" "dashboard-api" "reports-api" "favorites-api" "analytics-api" "settings-api")

for func in "${FUNCTIONS[@]}"; do
    response=$(curl -s -o /dev/null -w "%{http_code}" \
        -X OPTIONS \
        "${SUPABASE_URL}/functions/v1/${func}" \
        -H "apikey: ${ANON_KEY}")
    
    if [ "$response" == "200" ] || [ "$response" == "204" ]; then
        echo -e "${GREEN}  ✓${NC} ${func} - accessible"
        ((PASSED++))
    else
        echo -e "${RED}  ✗${NC} ${func} - not accessible (HTTP ${response})"
        ((FAILED++))
    fi
done

# Test 2: Auth Login Endpoint
echo ""
echo -e "${BLUE}📋 Test 2: Testing auth-login endpoint...${NC}"
auth_response=$(curl -s -X POST \
    "${SUPABASE_URL}/functions/v1/auth-login" \
    -H "Content-Type: application/json" \
    -H "apikey: ${ANON_KEY}" \
    -d '{"test": true}')

if echo "$auth_response" | grep -q "error\|success"; then
    echo -e "${GREEN}  ✓${NC} auth-login endpoint responding"
    echo -e "${GREEN}    Response: ${auth_response:0:100}...${NC}"
    ((PASSED++))
else
    echo -e "${RED}  ✗${NC} auth-login endpoint not responding correctly"
    echo -e "${RED}    Response: ${auth_response}${NC}"
    ((FAILED++))
fi

# Test 3: Storage Buckets
echo ""
echo -e "${BLUE}📋 Test 3: Checking Storage buckets...${NC}"

# Check receipts bucket
receipts_response=$(curl -s -o /dev/null -w "%{http_code}" \
    "${SUPABASE_URL}/storage/v1/bucket/receipts")

if [ "$receipts_response" == "200" ]; then
    echo -e "${GREEN}  ✓${NC} receipts bucket exists"
    ((PASSED++))
else
    echo -e "${RED}  ✗${NC} receipts bucket not found (HTTP ${receipts_response})"
    ((FAILED++))
fi

# Check promotions bucket
promotions_response=$(curl -s -o /dev/null -w "%{http_code}" \
    "${SUPABASE_URL}/storage/v1/bucket/promotions")

if [ "$promotions_response" == "200" ]; then
    echo -e "${GREEN}  ✓${NC} promotions bucket exists"
    ((PASSED++))
else
    echo -e "${RED}  ✗${NC} promotions bucket not found (HTTP ${promotions_response})"
    ((FAILED++))
fi

# Test 4: CORS Headers
echo ""
echo -e "${BLUE}📋 Test 4: Checking CORS headers...${NC}"
cors_response=$(curl -s -I \
    -X OPTIONS \
    "${SUPABASE_URL}/functions/v1/auth-login" \
    -H "Origin: http://localhost:3000" \
    -H "apikey: ${ANON_KEY}")

if echo "$cors_response" | grep -qi "access-control-allow-origin"; then
    echo -e "${GREEN}  ✓${NC} CORS headers present"
    ((PASSED++))
else
    echo -e "${RED}  ✗${NC} CORS headers missing"
    ((FAILED++))
fi

# Test 5: API Client Configuration
echo ""
echo -e "${BLUE}📋 Test 5: Checking API client configuration...${NC}"
if grep -q "$SUPABASE_URL" api-client-v3-pure-supabase.js 2>/dev/null; then
    echo -e "${GREEN}  ✓${NC} API client configured with correct URL"
    ((PASSED++))
else
    echo -e "${RED}  ✗${NC} API client not configured or file missing"
    ((FAILED++))
fi

if grep -q "$ANON_KEY" api-client-v3-pure-supabase.js 2>/dev/null; then
    echo -e "${GREEN}  ✓${NC} API client has anon key"
    ((PASSED++))
else
    echo -e "${RED}  ✗${NC} API client missing anon key"
    ((FAILED++))
fi

# Test 6: Check if Supabase CLI is installed
echo ""
echo -e "${BLUE}📋 Test 6: Checking Supabase CLI...${NC}"
if command -v supabase &> /dev/null; then
    echo -e "${GREEN}  ✓${NC} Supabase CLI installed"
    supabase --version
    ((PASSED++))
else
    echo -e "${YELLOW}  ⚠${NC} Supabase CLI not installed (optional for deployment)"
fi

# Test 7: Check JWT secrets (if CLI available)
if command -v supabase &> /dev/null; then
    echo ""
    echo -e "${BLUE}📋 Test 7: Checking JWT secrets...${NC}"
    echo -e "${YELLOW}  ⚠${NC} Run manually: supabase secrets list"
    echo -e "     Expected: JWT_SECRET, REFRESH_TOKEN_SECRET"
fi

# Summary
echo ""
echo "===================================="
echo -e "${BLUE}📊 Verification Summary${NC}"
echo "===================================="
echo -e "Passed: ${GREEN}$PASSED${NC}"
echo -e "Failed: ${RED}$FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All verifications passed! System ready for deployment.${NC}"
    echo ""
    echo -e "${BLUE}Next steps:${NC}"
    echo "1. Deploy Edge Functions: supabase functions deploy <name>"
    echo "2. Set JWT secrets: supabase secrets set JWT_SECRET=ZaidunkMargin"
    echo "3. Test authentication flow in browser"
    echo "4. Monitor function logs: supabase functions logs --tail"
    exit 0
else
    echo -e "${RED}❌ Some verifications failed. Please fix issues before deployment.${NC}"
    echo ""
    echo -e "${BLUE}Common fixes:${NC}"
    echo "- Deploy functions: supabase functions deploy <function-name>"
    echo "- Create storage buckets in Supabase Dashboard"
    echo "- Update API client with correct URLs"
    echo "- Set CORS headers in Edge Functions"
    exit 1
fi
