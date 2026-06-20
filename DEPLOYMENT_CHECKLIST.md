# ✅ Deployment Checklist - Nashty OS Backend

## Pre-Deployment

### Database Setup
- [ ] Execute `migrations/001_create_missing_tables.sql` in Supabase
- [ ] Verify 4 tables created: `favorites`, `outlet_settings`, `token_blacklist`, `analytics_cache`
- [ ] Create `receipts` storage bucket (public read, 2MB limit)
- [ ] Create `promotions` storage bucket (public read, 5MB limit)
- [ ] Set storage RLS policies for authenticated uploads

### Backend Configuration
- [ ] Copy `.env.example` to `.env`
- [ ] Set `SUPABASE_URL` (https://mzucfndifneytbesirkx.supabase.co)
- [ ] Set `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Set `JWT_SECRET` (strong secret)
- [ ] Set `REFRESH_TOKEN_SECRET` (strong secret)
- [ ] Set `ALLOWED_ORIGINS` (frontend domain)
- [ ] Run `npm install` in `backoffice/backend`
- [ ] Run `npm run build` - verify dist/ folder created
- [ ] Test locally: `npm run dev` → check http://localhost:5000/health

### Railway Setup
- [ ] Install Railway CLI: `npm install -g @railway/cli`
- [ ] Login: `railway login`
- [ ] Link project: `railway link --project 610491e6-4a5d-433b-ae87-760711f4a04a`
- [ ] Set all environment variables in Railway dashboard
- [ ] Verify `railway.json` config exists

## Deployment

### Deploy Backend
- [ ] Run `railway up` or `npm run deploy`
- [ ] Wait for deployment to complete (~2-3 minutes)
- [ ] Check Railway dashboard for deployment status
- [ ] Verify deployment URL: `railway status`
- [ ] Test health endpoint: `curl https://[your-url].railway.app/health`

### Verify API Endpoints
- [ ] `/health` - Returns 200 OK with uptime
- [ ] `/api/auth/refresh` - Token refresh works
- [ ] `/api/favorites` - Get favorites (with auth token)
- [ ] `/api/analytics/top-products` - Analytics data returned
- [ ] `/api/dashboard/kpi` - KPI data calculated correctly
- [ ] `/api/outlets/:id/settings` - Settings CRUD works
- [ ] `/api/orders` - Order creation works

### Test File Uploads
- [ ] Upload logo via `/api/outlets/:id/upload-logo`
- [ ] Verify logo appears in Supabase Storage `receipts` bucket
- [ ] Upload promo images via `/api/outlets/:id/upload-promo-images`
- [ ] Verify images in Supabase Storage `promotions` bucket
- [ ] Check public URLs are accessible

## Post-Deployment

### Frontend Integration
- [ ] Update `api-client-v2.js` `RAILWAY_API_URL` with deployed URL
- [ ] Test POS login flow
- [ ] Test favorites add/remove/reorder
- [ ] Test analytics loading in POS auto-suggest
- [ ] Test receipt customization in Backoffice
- [ ] Test order creation and sync

### Security Verification
- [ ] Rate limiting active (try 11 auth requests in 1 min → should get 429)
- [ ] CORS working (test from frontend domain)
- [ ] JWT authentication required (test without token → 401)
- [ ] File upload validation (try >2MB logo → should reject)
- [ ] HTTPS enforced (Railway auto-provides)

### Monitoring Setup
- [ ] Check Railway logs for errors: `railway logs`
- [ ] Verify winston logs writing to console
- [ ] Review request/response times in Railway metrics
- [ ] Set up error alerts (optional: email/Slack)
- [ ] Document monitoring dashboard URLs

### Performance Check
- [ ] Dashboard KPI query <1s
- [ ] Analytics top products query <2s (with cache)
- [ ] Order creation <500ms
- [ ] Favorites load <500ms
- [ ] Settings load <300ms

## Maintenance

### Database Cleanup (Run Weekly)
- [ ] Execute `SELECT cleanup_expired_tokens();` in Supabase
- [ ] Execute `SELECT cleanup_expired_cache();` in Supabase
- [ ] Check Supabase Storage usage
- [ ] Review activity_logs table size

### Monitoring (Daily)
- [ ] Check Railway deployment status
- [ ] Review error logs
- [ ] Check API response times
- [ ] Verify no critical errors in Railway dashboard

### Updates (Monthly)
- [ ] Run `npm outdated` to check for updates
- [ ] Update dependencies (patch versions)
- [ ] Re-run tests after updates
- [ ] Redeploy if updates applied

## Rollback Plan

### If Deployment Fails
1. Check Railway logs: `railway logs`
2. Identify error (build/runtime/config)
3. Fix issue locally
4. Redeploy: `railway up`

### If API Errors After Deployment
1. Rollback Railway: Railway Dashboard > Deployments > Previous > Redeploy
2. Check environment variables match `.env`
3. Verify database tables exist
4. Check Supabase connection

### If Database Issues
1. Backup current state via Supabase dashboard
2. Re-run migrations if needed
3. Restore from backup if corruption

## Sign-Off

**Deployed By**: ________________  
**Date**: ________________  
**Railway URL**: https://________________.railway.app  
**Version**: 2.0.0  

**Deployment Status**: 
- [ ] All checks passed
- [ ] Ready for production
- [ ] Team notified

---

**Notes:**
_Add any deployment-specific notes or issues encountered here_

---

**Next Deployment**: Follow this checklist again
**Estimated Time**: 30-45 minutes
