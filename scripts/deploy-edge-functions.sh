#!/bin/bash
# ═══════════════════════════════════════════════════════════════════
# NASHTY OS - Deploy All Edge Functions to Supabase
# Target: Production Launch (June 22, 2026)
# ═══════════════════════════════════════════════════════════════════

echo ""
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║                                                           ║"
echo "║   🚀 NASHTY OS - Edge Functions Deployment              ║"
echo "║                                                           ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}❌ Supabase CLI not installed!${NC}"
    echo ""
    echo "Install with:"
    echo "  npm install -g supabase"
    echo "  # or"
    echo "  brew install supabase/tap/supabase"
    echo ""
    exit 1
fi

echo -e "${BLUE}📋 Supabase CLI Version:${NC}"
supabase --version
echo ""

# Check if logged in
echo -e "${BLUE}🔐 Checking authentication...${NC}"
if ! supabase projects list &> /dev/null; then
    echo -e "${YELLOW}⚠️  Not logged in to Supabase${NC}"
    echo ""
    echo "Login with:"
    echo "  supabase login"
    echo ""
    exit 1
fi
echo -e "${GREEN}✓${NC} Authenticated"
echo ""

# List of Edge Functions to deploy
FUNCTIONS=(
    "auth-login"
    "orders-api"
    "dashboard-api"
    "reports-api"
    "favorites-api"
    "analytics-api"
    "settings-api"
)

# Project ref
PROJECT_REF="mzucfndifneytbesirkx"

echo -e "${BLUE}🎯 Target Project:${NC} ${PROJECT_REF}"
echo -e "${BLUE}📦 Functions to deploy:${NC} ${#FUNCTIONS[@]}"
echo ""

# Deploy counter
SUCCESS=0
FAILED=0

# Deploy each function
for func in "${FUNCTIONS[@]}"; do
    echo "────────────────────────────────────────────────────────────"
    echo -e "${BLUE}📤 Deploying:${NC} ${func}"
    echo ""
    
    # Check if function directory exists
    if [ ! -d "supabase/functions/${func}" ]; then
        echo -e "${RED}  ✗ Directory not found: supabase/functions/${func}${NC}"
        ((FAILED++))
        continue
    fi
    
    # Deploy function
    if supabase functions deploy ${func} --project-ref ${PROJECT_REF} --no-verify-jwt; then
        echo -e "${GREEN}  ✓ ${func} deployed successfully${NC}"
        ((SUCCESS++))
    else
        echo -e "${RED}  ✗ ${func} deployment failed${NC}"
        ((FAILED++))
    fi
    echo ""
done

echo "════════════════════════════════════════════════════════════"
echo -e "${BLUE}📊 Deployment Summary${NC}"
echo "════════════════════════════════════════════════════════════"
echo -e "Successful: ${GREEN}${SUCCESS}${NC}"
echo -e "Failed: ${RED}${FAILED}${NC}"
echo ""

# Set JWT secrets if deploying for the first time
if [ $SUCCESS -gt 0 ]; then
    echo "────────────────────────────────────────────────────────────"
    echo -e "${BLUE}🔑 Setting JWT Secrets...${NC}"
    echo ""
    
    # Check if secrets exist
    echo "Checking existing secrets..."
    supabase secrets list --project-ref ${PROJECT_REF}
    echo ""
    
    echo -e "${YELLOW}⚠️  Set JWT secrets manually if not already set:${NC}"
    echo ""
    echo "  supabase secrets set JWT_SECRET=ZaidunkMargin --project-ref ${PROJECT_REF}"
    echo "  supabase secrets set REFRESH_TOKEN_SECRET=ZaidunkMarginRefresh --project-ref ${PROJECT_REF}"
    echo ""
    
    read -p "Do you want to set JWT secrets now? (y/N): " -n 1 -r
    echo ""
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Setting JWT_SECRET..."
        supabase secrets set JWT_SECRET=ZaidunkMargin --project-ref ${PROJECT_REF}
        
        echo "Setting REFRESH_TOKEN_SECRET..."
        supabase secrets set REFRESH_TOKEN_SECRET=ZaidunkMarginRefresh --project-ref ${PROJECT_REF}
        
        echo -e "${GREEN}✓ Secrets set successfully${NC}"
    else
        echo -e "${YELLOW}⚠️  Skipped. Set secrets manually later.${NC}"
    fi
    echo ""
fi

# Final status
echo "════════════════════════════════════════════════════════════"
if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ ALL EDGE FUNCTIONS DEPLOYED SUCCESSFULLY!${NC}"
    echo ""
    echo -e "${BLUE}Next steps:${NC}"
    echo "1. Verify functions: supabase functions list --project-ref ${PROJECT_REF}"
    echo "2. Test endpoints in browser: https://nashtyxolvon2.pages.dev"
    echo "3. Check logs: supabase functions logs <function-name> --project-ref ${PROJECT_REF}"
    echo "4. Run initial data script: psql \$DATABASE_URL < database/initial-data-production.sql"
    echo ""
    exit 0
else
    echo -e "${RED}❌ SOME DEPLOYMENTS FAILED${NC}"
    echo ""
    echo "Check errors above and retry failed functions manually:"
    echo "  supabase functions deploy <function-name> --project-ref ${PROJECT_REF}"
    echo ""
    exit 1
fi
