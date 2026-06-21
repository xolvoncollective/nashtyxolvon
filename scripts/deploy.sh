#!/bin/bash

# ====================================================================
# NASHTY OS - Quick Deployment Script
# Deploys to Cloudflare Pages via GitHub
# ====================================================================

echo "🚀 NASHTY OS - Quick Deployment"
echo "================================"
echo ""

# Check if git is clean
if [[ -n $(git status -s) ]]; then
  echo "📝 Changes detected. Committing..."
  git add .
  git commit -m "fix: api-client v3.1, tests, deployment config, storage buckets SQL"
  echo "✓ Changes committed"
else
  echo "✓ No changes to commit"
fi

echo ""
echo "📤 Pushing to GitHub..."
git push origin main

if [ $? -eq 0 ]; then
  echo "✓ Pushed successfully"
  echo ""
  echo "⏳ Cloudflare Pages will auto-deploy in 2-3 minutes"
  echo ""
  echo "📊 Monitor deployment:"
  echo "   https://dash.cloudflare.com/pages"
  echo ""
  echo "🌐 Once deployed, test at:"
  echo "   https://nashtyxolvon2.pages.dev"
  echo "   https://nashtyxolvon2.pages.dev/test-login-flow.html"
  echo ""
  echo "✅ Deployment initiated!"
else
  echo "❌ Push failed. Check your git configuration."
  exit 1
fi
