> ✅ **[AGENT-AUTO]**: Tasks Verified & Completed automatically by Agentic IDE.`n`n# ⚡ NASHTY OS - Quick Fix Commands

**For**: Developer/Tech Support  
**Emergency Reference Guide**

---

## 🔥 CRITICAL FIXES (Production Issues)

### **1. Edge Functions Not Responding**
```bash
# Check function status
supabase functions list

# Redeploy specific function
supabase functions deploy auth-login
supabase functions deploy orders-api

# Check logs
supabase functions logs auth-login
supabase functions logs orders-api --tail
```

### **2. Database Connection Issues**
```bash
# Check Supabase status
curl https://mzucfndifneytbesirkx.supabase.co/rest/v1/

# Test database query
curl -X GET \
  'https://mzucfndifneytbesirkx.supabase.co/rest/v1/users?select=*&limit=1' \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### **3. Cloudflare Pages Not Deploying**
```bash
# Check deployment status
wrangler pages deployment list --project-name=nashtyxolvon2

# Manual deploy
wrangler pages publish . --project-name=nashtyxolvon2

# Rollback to previous
# Via Cloudflare Dashboard → Pages → Deployments → Rollback
```

---

## 🔐 AUTH & USER FIXES

### **Reset Admin Password**
```sql
-- Via Supabase SQL Editor
UPDATE users 
SET password_hash = '$2a$10$NEW_HASH_HERE'
WHERE username = 'admin1';

-- Or create new admin
INSERT INTO users (tenant_id, name, username, password_hash, role, active)
VALUES ('default-tenant', 'Emergency Admin', 'admin2', '$2a$10$...', 'admin', true);
```

### **Reset Staff PIN**
```sql
UPDATE users 
SET pin = '1111'
WHERE name = 'Citra Dewi';
```

### **Unlock User Account**
```sql
UPDATE users 
SET active = true
WHERE username = 'admin1';
```

---

## 📦 DATA FIXES

### **Clear Stuck Offline Orders**
```sql
-- View pending orders
SELECT * FROM orders WHERE status = 'pending' AND created_at < NOW() - INTERVAL '1 hour';

-- Mark as synced (if already processed)
UPDATE orders 
SET status = 'completed'
WHERE status = 'pending' AND created_at < NOW() - INTERVAL '1 hour';
```

### **Fix Shift Not Closing**
```sql
-- View open shifts
SELECT * FROM shifts WHERE status = 'open' AND user_id = 123;

-- Force close shift
UPDATE shifts 
SET status = 'closed', 
    end_time = NOW(),
    end_cash = start_cash + 1000000
WHERE id = SHIFT_ID;
```

### **Rebuild Product Cache**
```sql
-- Via Supabase Dashboard or API
-- Just update any product to trigger cache refresh
UPDATE products SET updated_at = NOW() WHERE id = 1;
```

---

## 🎯 MONITORING COMMANDS

### **Check System Health**
```bash
# Cloudflare Pages Status
curl -I https://nashtyxolvon2.pages.dev

# Supabase API Status
curl https://mzucfndifneytbesirkx.supabase.co/rest/v1/

# Edge Function Health
curl https://mzucfndifneytbesirkx.supabase.co/functions/v1/auth-login \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"action":"health"}'
```

### **View Recent Errors**
```sql
-- Activity logs with errors
SELECT * FROM activity_logs 
WHERE details LIKE '%error%' 
ORDER BY created_at DESC 
LIMIT 20;

-- Recent failed orders
SELECT * FROM orders 
WHERE status = 'failed' 
ORDER BY created_at DESC 
LIMIT 10;
```

### **Check Active Sessions**
```sql
SELECT 
  u.name,
  s.start_time,
  s.status,
  COUNT(o.id) as order_count
FROM shifts s
JOIN users u ON s.user_id = u.id
LEFT JOIN orders o ON o.shift_id = s.id
WHERE s.status = 'open'
GROUP BY u.name, s.start_time, s.status;
```

---

## 🔧 CONFIGURATION FIXES

### **Update JWT Secret**
```bash
# Via Supabase CLI
supabase secrets set JWT_SECRET=NEW_SECRET_HERE
supabase secrets set REFRESH_TOKEN_SECRET=NEW_REFRESH_SECRET

# Verify
supabase secrets list
```

### **Fix CORS Issues**
```sql
-- Via Supabase Dashboard → Settings → API
-- Add to CORS allowed origins:
https://nashtyxolvon2.pages.dev
http://localhost:*
```

### **Update Edge Function Env**
```bash
# Set new environment variable
supabase secrets set API_KEY=new_value

# Deploy functions to pick up changes
supabase functions deploy --all
```

---

## 💾 BACKUP & RESTORE

### **Backup Database**
```bash
# Via Supabase Dashboard
# Settings → Database → Backups → Create Backup

# Or export specific table
supabase db dump --table orders > orders_backup.sql
```

### **Restore from Backup**
```bash
# Via Supabase Dashboard
# Settings → Database → Backups → Restore

# Or import SQL
psql $DATABASE_URL < backup.sql
```

### **Export Orders (Emergency)**
```sql
-- Export to CSV via SQL Editor
COPY (
  SELECT * FROM orders 
  WHERE created_at >= NOW() - INTERVAL '1 day'
) TO '/tmp/orders_export.csv' CSV HEADER;
```

---

## 🚨 EMERGENCY ROLLBACK

### **Rollback Frontend**
```bash
# Via Cloudflare Dashboard
# Pages → nashtyxolvon2 → Deployments
# Find previous successful deployment
# Click "Rollback to this deployment"

# Via Git
git log --oneline
git revert COMMIT_HASH
git push origin main
```

### **Rollback Edge Functions**
```bash
# Redeploy from previous version
git checkout PREVIOUS_COMMIT
supabase functions deploy --all
git checkout main
```

### **Rollback Database Schema**
```bash
# Via Supabase Dashboard
# Database → Migrations → Revert

# Or manually
supabase db reset --local
supabase db push
```

---

## 📊 PERFORMANCE OPTIMIZATION

### **Clear Old Data**
```sql
-- Delete old activity logs (keep 30 days)
DELETE FROM activity_logs 
WHERE created_at < NOW() - INTERVAL '30 days';

-- Archive old orders (keep 90 days active)
UPDATE orders 
SET status = 'archived'
WHERE created_at < NOW() - INTERVAL '90 days'
  AND status = 'completed';
```

### **Rebuild Indexes**
```sql
-- Via Supabase SQL Editor
REINDEX TABLE orders;
REINDEX TABLE order_items;
REINDEX TABLE products;
```

### **Analyze Query Performance**
```sql
EXPLAIN ANALYZE
SELECT * FROM orders 
WHERE outlet_id = 1 
  AND created_at >= CURRENT_DATE
ORDER BY created_at DESC;
```

---

## 🔍 DEBUGGING TOOLS

### **Check Browser Console (Client-Side)**
```javascript
// In browser console (F12)

// Check API Client status
console.log(window.API.session);

// Check service worker
navigator.serviceWorker.getRegistrations().then(r => console.log(r));

// Check IndexedDB
indexedDB.databases().then(dbs => console.log(dbs));

// Test API call
API.products.getAll().then(d => console.log(d));
```

### **Test Edge Function Locally**
```bash
# Start Supabase locally
supabase start

# Serve specific function
supabase functions serve auth-login --no-verify-jwt

# Test with curl
curl -X POST http://localhost:54321/functions/v1/auth-login \
  -H "Content-Type: application/json" \
  -d '{"action":"main-login","username":"admin1","password":"nashty1111"}'
```

### **Check Realtime Connections**
```javascript
// In browser console
const channel = supabaseClient.channel('test');
channel.subscribe((status) => {
  console.log('Realtime status:', status);
});
```

---

## 🎯 QUICK SQL QUERIES

### **Today's Orders**
```sql
SELECT 
  COUNT(*) as total_orders,
  SUM(total) as total_revenue,
  AVG(total) as avg_order
FROM orders
WHERE DATE(created_at) = CURRENT_DATE;
```

### **Active Users**
```sql
SELECT name, role, last_login
FROM users
WHERE active = true
ORDER BY last_login DESC;
```

### **Top Products Today**
```sql
SELECT 
  p.name,
  SUM(oi.quantity) as qty_sold,
  SUM(oi.quantity * oi.price) as revenue
FROM order_items oi
JOIN products p ON oi.product_id = p.id
JOIN orders o ON oi.order_id = o.id
WHERE DATE(o.created_at) = CURRENT_DATE
GROUP BY p.name
ORDER BY qty_sold DESC
LIMIT 10;
```

### **Offline Orders Pending Sync**
```sql
SELECT 
  id, 
  order_number, 
  total, 
  created_at
FROM orders
WHERE status = 'pending'
ORDER BY created_at;
```

---

## 📞 SUPPORT ESCALATION

### **Level 1: Self-Service**
- Check this guide
- Check browser console (F12)
- Check Supabase logs
- Try refresh/re-login

### **Level 2: Database Fixes**
- Run SQL queries above
- Check RLS policies
- Verify user permissions

### **Level 3: Infrastructure**
- Check Cloudflare status
- Check Supabase status
- Redeploy functions
- Contact vendor support

### **Level 4: Emergency**
- Rollback to previous version
- Enable maintenance mode
- Contact senior developer

---

## 🔗 USEFUL LINKS

### **Dashboards**
- Supabase: https://supabase.com/dashboard/project/mzucfndifneytbesirkx
- Cloudflare: https://dash.cloudflare.com/pages
- GitHub: https://github.com/xolvoncollective/nashtyxolvon

### **Logs & Monitoring**
- Supabase Logs: https://supabase.com/dashboard/project/mzucfndifneytbesirkx/logs
- Edge Function Logs: https://supabase.com/dashboard/project/mzucfndifneytbesirkx/functions
- Cloudflare Analytics: https://dash.cloudflare.com/pages/nashtyxolvon2

### **Documentation**
- Supabase Docs: https://supabase.com/docs
- Cloudflare Pages: https://developers.cloudflare.com/pages

---

## ✅ DAILY MAINTENANCE

### **Every Morning**
```bash
# Check system health
curl -I https://nashtyxolvon2.pages.dev
curl https://mzucfndifneytbesirkx.supabase.co/rest/v1/

# Check edge function logs
supabase functions logs auth-login --tail 10
supabase functions logs orders-api --tail 10
```

### **Every Week**
```sql
-- Clean old logs
DELETE FROM activity_logs WHERE created_at < NOW() - INTERVAL '30 days';

-- Check database size
SELECT pg_size_pretty(pg_database_size('postgres'));

-- Analyze slow queries
SELECT * FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10;
```

### **Every Month**
```bash
# Update dependencies
npm update

# Check for security updates
npm audit

# Review and optimize database indexes
# Via Supabase Dashboard → Database → Performance
```

---

## 🎯 CREDENTIALS REFERENCE

### **Super Admin**
```
URL: https://nashtyxolvon2.pages.dev
Username: admin1
Password: nashty1111
```

### **Staff PINs**
```
Owner: 9999
Manager: 1212
Kasir 1: 8888
Kasir 2: 7777
```

### **Supabase**
```
Project: mzucfndifneytbesirkx
URL: https://mzucfndifneytbesirkx.supabase.co
Anon Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### **GitHub**
```
Repo: xolvoncollective/nashtyxolvon
Branch: main
```

---

**Last Updated**: June 21, 2026  
**Version**: v3.1  
**For**: Production Support
