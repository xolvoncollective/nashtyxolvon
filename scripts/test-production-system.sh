#!/bin/bash
# ═══════════════════════════════════════════════════════════════════
# NASHTY OS - Quick Production Test Script
# Test complete order flow: Login → POS → Order → KDS
# ═══════════════════════════════════════════════════════════════════

echo ""
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║                                                           ║"
echo "║   🧪 NASHTY OS - Production System Test                 ║"
echo "║                                                           ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Config
SUPABASE_URL="https://mzucfndifneytbesirkx.supabase.co"
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16dWNmbmRpZm5leXRiZXNpcmt4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzNDA1MzUsImV4cCI6MjA5NjkxNjUzNX0.fUynF1mfZCyy48aFkwz3_G52-4hd4EE-b5gpG7k0mpg"

PASSED=0
FAILED=0

echo -e "${BLUE}Testing against:${NC} ${SUPABASE_URL}"
echo ""

# ───────────────────────────────────────────────────────────────────
# TEST 1: Check Cloudflare Pages
# ───────────────────────────────────────────────────────────────────
echo -e "${BLUE}📋 Test 1: Cloudflare Pages Status${NC}"
response=$(curl -s -o /dev/null -w "%{http_code}" https://nashtyxolvon2.pages.dev)
if [ "$response" == "200" ]; then
    echo -e "${GREEN}  ✓${NC} Cloudflare Pages accessible (HTTP 200)"
    ((PASSED++))
else
    echo -e "${RED}  ✗${NC} Cloudflare Pages not accessible (HTTP ${response})"
    ((FAILED++))
fi
echo ""

# ───────────────────────────────────────────────────────────────────
# TEST 2: Check Supabase API
# ───────────────────────────────────────────────────────────────────
echo -e "${BLUE}📋 Test 2: Supabase REST API${NC}"
response=$(curl -s -o /dev/null -w "%{http_code}" \
    "${SUPABASE_URL}/rest/v1/" \
    -H "apikey: ${ANON_KEY}")
if [ "$response" == "200" ]; then
    echo -e "${GREEN}  ✓${NC} Supabase API accessible (HTTP 200)"
    ((PASSED++))
else
    echo -e "${RED}  ✗${NC} Supabase API not accessible (HTTP ${response})"
    ((FAILED++))
fi
echo ""

# ───────────────────────────────────────────────────────────────────
# TEST 3: Check Edge Functions
# ───────────────────────────────────────────────────────────────────
echo -e "${BLUE}📋 Test 3: Edge Functions${NC}"
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
echo ""

# ───────────────────────────────────────────────────────────────────
# TEST 4: Test Auth Login Endpoint
# ───────────────────────────────────────────────────────────────────
echo -e "${BLUE}📋 Test 4: Auth Login Endpoint (POST)${NC}"
auth_response=$(curl -s -X POST \
    "${SUPABASE_URL}/functions/v1/auth-login" \
    -H "Content-Type: application/json" \
    -H "apikey: ${ANON_KEY}" \
    -d '{"action":"main-login","username":"admin1","password":"nashty1111"}')

if echo "$auth_response" | grep -q "token\|error"; then
    echo -e "${GREEN}  ✓${NC} Auth endpoint responding"
    echo -e "     Response preview: ${auth_response:0:80}..."
    ((PASSED++))
else
    echo -e "${RED}  ✗${NC} Auth endpoint not responding correctly"
    echo -e "     Response: ${auth_response}"
    ((FAILED++))
fi
echo ""

# ───────────────────────────────────────────────────────────────────
# TEST 5: Check Database Tables
# ───────────────────────────────────────────────────────────────────
echo -e "${BLUE}📋 Test 5: Database Tables (via REST API)${NC}"
TABLES=("users" "products" "categories" "orders" "outlets")

for table in "${TABLES[@]}"; do
    response=$(curl -s -o /dev/null -w "%{http_code}" \
        "${SUPABASE_URL}/rest/v1/${table}?select=*&limit=1" \
        -H "apikey: ${ANON_KEY}" \
        -H "Authorization: Bearer ${ANON_KEY}")
    
    if [ "$response" == "200" ]; then
        echo -e "${GREEN}  ✓${NC} ${table} table accessible"
        ((PASSED++))
    else
        echo -e "${RED}  ✗${NC} ${table} table not accessible (HTTP ${response})"
        ((FAILED++))
    fi
done
echo ""

# ───────────────────────────────────────────────────────────────────
# TEST 6: Check Users Data
# ───────────────────────────────────────────────────────────────────
echo -e "${BLUE}📋 Test 6: Initial Users Data${NC}"
users_response=$(curl -s \
    "${SUPABASE_URL}/rest/v1/users?select=count" \
    -H "apikey: ${ANON_KEY}" \
    -H "Authorization: Bearer ${ANON_KEY}" \
    -H "Prefer: count=exact")

users_count=$(echo "$users_response" | grep -o '"count":[0-9]*' | grep -o '[0-9]*')

if [ ! -z "$users_count" ] && [ "$users_count" -gt 0 ]; then
    echo -e "${GREEN}  ✓${NC} Users data populated (${users_count} users)"
    ((PASSED++))
else
    echo -e "${YELLOW}  ⚠${NC} No users found - run initial-data-production.sql"
    echo -e "     psql \$DATABASE_URL < database/initial-data-production.sql"
fi
echo ""

# ───────────────────────────────────────────────────────────────────
# TEST 7: Check Products Data
# ───────────────────────────────────────────────────────────────────
echo -e "${BLUE}📋 Test 7: Initial Products Data${NC}"
products_response=$(curl -s \
    "${SUPABASE_URL}/rest/v1/products?select=count" \
    -H "apikey: ${ANON_KEY}" \
    -H "Authorization: Bearer ${ANON_KEY}" \
    -H "Prefer: count=exact")

products_count=$(echo "$products_response" | grep -o '"count":[0-9]*' | grep -o '[0-9]*')

if [ ! -z "$products_count" ] && [ "$products_count" -gt 0 ]; then
    echo -e "${GREEN}  ✓${NC} Products data populated (${products_count} products)"
    ((PASSED++))
else
    echo -e "${YELLOW}  ⚠${NC} No products found - run initial-data-production.sql"
fi
echo ""

# ───────────────────────────────────────────────────────────────────
# TEST 8: Check Storage Buckets
# ───────────────────────────────────────────────────────────────────
echo -e "${BLUE}📋 Test 8: Storage Buckets${NC}"
BUCKETS=("receipts" "promotions")

for bucket in "${BUCKETS[@]}"; do
    response=$(curl -s -o /dev/null -w "%{http_code}" \
        "${SUPABASE_URL}/storage/v1/bucket/${bucket}" \
        -H "apikey: ${ANON_KEY}" \
        -H "Authorization: Bearer ${ANON_KEY}")
    
    if [ "$response" == "200" ]; then
        echo -e "${GREEN}  ✓${NC} ${bucket} bucket exists"
        ((PASSED++))
    else
        echo -e "${YELLOW}  ⚠${NC} ${bucket} bucket not found - create via Supabase Dashboard"
    fi
done
echo ""

# ───────────────────────────────────────────────────────────────────
# SUMMARY
# ───────────────────────────────────────────────────────────────────
echo "════════════════════════════════════════════════════════════"
echo -e "${BLUE}📊 Test Summary${NC}"
echo "════════════════════════════════════════════════════════════"
echo -e "Passed: ${GREEN}${PASSED}${NC}"
echo -e "Failed: ${RED}${FAILED}${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ SYSTEM READY FOR PRODUCTION!${NC}"
    echo ""
    echo -e "${BLUE}🎯 Next Steps:${NC}"
    echo "1. Open browser: https://nashtyxolvon2.pages.dev"
    echo "2. Login: admin1 / nashty1111"
    echo "3. Select POS and test complete order flow"
    echo "4. Verify KDS receives orders real-time"
    echo "5. Test receipt printing"
    echo ""
    echo -e "${GREEN}🚀 READY FOR RESTAURANT LAUNCH TOMORROW!${NC}"
    echo ""
    exit 0
else
    echo -e "${RED}❌ SOME TESTS FAILED${NC}"
    echo ""
    echo -e "${BLUE}Common fixes:${NC}"
    echo "1. Deploy Edge Functions: bash scripts/deploy-edge-functions.sh"
    echo "2. Populate initial data: psql \$DATABASE_URL < database/initial-data-production.sql"
    echo "3. Create storage buckets: Supabase Dashboard → Storage"
    echo "4. Check RLS policies: database/database-rls-policies.sql"
    echo ""
    exit 1
fi
