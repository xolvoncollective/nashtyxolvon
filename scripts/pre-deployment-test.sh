#!/bin/bash
# Automated Pre-Deployment Tests

echo "🧪 Starting Pre-Deployment Tests..."
echo "=================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PASSED=0
FAILED=0

# Test 1: Service Worker Version
echo "📋 Test 1: Checking Service Worker version..."
if grep -q "CACHE_VERSION = 'v2.0.0'" pos/frontend/sw.js; then
    echo -e "${GREEN}✓ PASSED${NC} - Service Worker updated to v2.0.0"
    ((PASSED++))
else
    echo -e "${RED}✗ FAILED${NC} - Service Worker version not updated"
    ((FAILED++))
fi

# Test 2: API Client Configuration
echo "📋 Test 2: Checking API client configuration..."
if grep -q "mzucfndifneytbesirkx.supabase.co" api-client-v3-pure-supabase.js; then
    echo -e "${GREEN}✓ PASSED${NC} - API client configured correctly"
    ((PASSED++))
else
    echo -e "${RED}✗ FAILED${NC} - API client not configured"
    ((FAILED++))
fi

# Test 3: Edge Functions
echo "📋 Test 3: Checking Edge Functions..."
FUNCTIONS=("auth-login" "orders-api" "dashboard-api" "reports-api" "favorites-api" "analytics-api" "settings-api")
for func in "${FUNCTIONS[@]}"; do
    if [ -d "supabase/functions/$func" ]; then
        echo -e "${GREEN}  ✓${NC} $func exists"
    else
        echo -e "${RED}  ✗${NC} $func missing"
        ((FAILED++))
    fi
done
((PASSED++))

# Test 4: Documentation Files
echo "📋 Test 4: Checking documentation files..."
DOCS=("USER_GUIDE.md" "KEYBOARD_SHORTCUTS_REFERENCE.md" "TESTING_GUIDE.md" "DEPLOYMENT_CHECKLIST.md")
for doc in "${DOCS[@]}"; do
    if [ -f "$doc" ]; then
        echo -e "${GREEN}  ✓${NC} $doc exists"
    else
        echo -e "${RED}  ✗${NC} $doc missing"
        ((FAILED++))
    fi
done
((PASSED++))

# Test 5: UI Files
echo "📋 Test 5: Checking UI files..."
if [ -f "backoffice/frontend/settings/receipt-settings.html" ]; then
    echo -e "${GREEN}  ✓${NC} Receipt settings UI exists"
    ((PASSED++))
else
    echo -e "${RED}  ✗${NC} Receipt settings UI missing"
    ((FAILED++))
fi

if [ -f "pos/frontend/settings/keyboard-shortcuts.html" ]; then
    echo -e "${GREEN}  ✓${NC} Keyboard shortcuts UI exists"
    ((PASSED++))
else
    echo -e "${RED}  ✗${NC} Keyboard shortcuts UI missing"
    ((FAILED++))
fi

# Test 6: Customer Display
echo "📋 Test 6: Checking customer display..."
if [ -f "pos/frontend/customer-display.html" ]; then
    echo -e "${GREEN}✓ PASSED${NC} - Customer display HTML exists"
    ((PASSED++))
else
    echo -e "${RED}✗ FAILED${NC} - Customer display HTML missing"
    ((FAILED++))
fi

# Test 7: Service Files
echo "📋 Test 7: Checking service files..."
SERVICES=("cache-manager.js" "connection-monitor.js" "customer-display-manager.js" "encryption-service.js" "favorites-manager.js" "keyboard-shortcuts.js" "offline-queue.js" "receipt-generator.js" "sync-manager.js")
for service in "${SERVICES[@]}"; do
    if [ -f "pos/frontend/js/services/$service" ]; then
        echo -e "${GREEN}  ✓${NC} $service exists"
    else
        echo -e "${RED}  ✗${NC} $service missing"
        ((FAILED++))
    fi
done
((PASSED++))

# Test 8: CSS Files
echo "📋 Test 8: Checking CSS files..."
if [ -f "pos/frontend/css/offline.css" ] && [ -f "pos/frontend/css/connection-monitor.css" ]; then
    echo -e "${GREEN}✓ PASSED${NC} - Required CSS files exist"
    ((PASSED++))
else
    echo -e "${RED}✗ FAILED${NC} - Some CSS files missing"
    ((FAILED++))
fi

# Test 9: Git Status
echo "📋 Test 9: Checking git status..."
if git diff --quiet; then
    echo -e "${GREEN}✓ PASSED${NC} - No uncommitted changes"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠ WARNING${NC} - Uncommitted changes detected"
    git status --short
fi

# Summary
echo ""
echo "=================================="
echo "📊 Test Summary"
echo "=================================="
echo -e "Passed: ${GREEN}$PASSED${NC}"
echo -e "Failed: ${RED}$FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed! Ready for deployment.${NC}"
    exit 0
else
    echo -e "${RED}❌ Some tests failed. Please fix issues before deployment.${NC}"
    exit 1
fi
