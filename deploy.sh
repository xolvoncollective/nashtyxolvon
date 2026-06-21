#!/bin/bash

# =============================================
# POS Enhancement - Quick Deploy Script
# =============================================

echo "🚀 POS Enhancement Deployment"
echo "=============================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Backend Setup
echo -e "${YELLOW}Step 1: Backend Setup${NC}"
echo "Installing backend dependencies..."
cd backoffice/backend

if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: package.json not found${NC}"
    exit 1
fi

npm install

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Dependencies installed${NC}"
else
    echo -e "${RED}✗ Failed to install dependencies${NC}"
    exit 1
fi

# Step 2: Environment Setup
echo ""
echo -e "${YELLOW}Step 2: Environment Configuration${NC}"

if [ ! -f ".env" ]; then
    echo "Creating .env file from template..."
    cp .env.example .env
    echo -e "${YELLOW}⚠ Please edit .env with your Supabase credentials${NC}"
    echo "  SUPABASE_URL=your-url"
    echo "  SUPABASE_SERVICE_KEY=your-key"
    echo ""
    read -p "Press Enter after you've configured .env..."
else
    echo -e "${GREEN}✓ .env file already exists${NC}"
fi

# Step 3: Database Migration
echo ""
echo -e "${YELLOW}Step 3: Database Migration${NC}"
echo "Migration SQL location: backoffice/backend/migrations/add_favorites_and_settings.sql"
echo ""
echo "Please run this SQL in Supabase SQL Editor:"
echo "1. Go to Supabase Dashboard > SQL Editor"
echo "2. Copy contents of migrations/add_favorites_and_settings.sql"
echo "3. Execute the SQL"
echo ""
read -p "Press Enter after you've run the migration..."

# Step 4: Verify Frontend
echo ""
echo -e "${YELLOW}Step 4: Frontend Verification${NC}"

if [ ! -f "../../pos/frontend/index.html" ]; then
    echo -e "${RED}✗ Frontend index.html not found${NC}"
else
    # Check if script tags exist
    if grep -q "keyboard-shortcuts.js" ../../pos/frontend/index.html && \
       grep -q "receipt-generator.js" ../../pos/frontend/index.html && \
       grep -q "customer-display-manager.js" ../../pos/frontend/index.html; then
        echo -e "${GREEN}✓ All enhancement scripts are integrated${NC}"
    else
        echo -e "${RED}✗ Some enhancement scripts are missing${NC}"
        exit 1
    fi
fi

# Step 5: Start Server
echo ""
echo -e "${YELLOW}Step 5: Starting Server${NC}"
echo "Server will start on http://localhost:3000"
echo ""
echo "Available endpoints:"
echo "  POST   /api/favorites"
echo "  GET    /api/favorites?userId=X"
echo "  DELETE /api/favorites/:productId"
echo "  PUT    /api/favorites/reorder"
echo "  GET    /api/analytics/top-products"
echo "  GET    /api/outlets/:id/receipt-settings"
echo "  PUT    /api/outlets/:id/receipt-settings"
echo "  GET    /api/outlets/:id/display-settings"
echo "  PUT    /api/outlets/:id/display-settings"
echo ""
echo -e "${GREEN}✓ Deployment complete!${NC}"
echo ""
echo "Starting server..."
npm start
