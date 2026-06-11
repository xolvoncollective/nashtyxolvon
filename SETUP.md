# Setup Guide - NASHTY POS

## Prerequisites

- Node.js v18+ 
- npm atau yarn
- Browser modern (Chrome, Firefox, Edge)

## Installation Steps

### 1. Install Backend Dependencies

```bash
cd backend
npm install
```

Dependencies yang akan diinstall:
- express - Web framework
- cors - CORS middleware
- better-sqlite3 - SQLite database
- bcryptjs - Password hashing
- jsonwebtoken - JWT auth
- zod - Validation
- nanoid - ID generation
- typescript - TypeScript
- tsx - TypeScript executor

### 2. Create Database & Seed Data

```bash
# Membuat database dan table
npm run db:seed
```

Output yang diharapkan:
```
Clearing existing data...
Seeding tenant...
Seeding outlet...
Seeding users...
Seeding categories...
Seeding products...
✓ Seed completed successfully!

Demo Credentials:
-----------------
PIN: 1234 - Citra Dewi (Cashier)
PIN: 2345 - Budi Santoso (Cashier)
PIN: 0000 - Admin Demo (Owner)
```

### 3. Start Development Server

```bash
npm run dev
```

Output:
```
╔═══════════════════════════════════════╗
║   NASHTY POS Backend Server Started   ║
╠═══════════════════════════════════════╣
║  Port: 3000                           ║
║  Env:  development                    ║
║  DB:   SQLite (Local)                 ║
╚═══════════════════════════════════════╝
```

### 4. Test API

```bash
# Test health endpoint
curl http://localhost:3000/health

# Test auth
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"pin":"1234"}'

# Test get staff
curl http://localhost:3000/api/auth/staff

# Test get categories
curl "http://localhost:3000/api/categories?tenantId=demo-tenant"

# Test get products
curl "http://localhost:3000/api/products?tenantId=demo-tenant"
```

### 5. Open UI Mockups

Buka di browser:

1. **POS Interface**
   ```
   file:///C:/Users/farsya/NashtyFinal/POSLITE/NASHTY_POS_Mockup.html
   ```

2. **KDS Interface**
   ```
   file:///C:/Users/farsya/NashtyFinal/POSLITE/NASHTY_KDS_Mockup.html
   ```

3. **Backoffice Interface**
   ```
   file:///C:/Users/farsya/NashtyFinal/POSLITE/NASHTY_Backoffice_Mockup_8.html
   ```

## Database Location

Database SQLite berada di:
```
backend/data/nashtypos.db
```

Untuk reset database, hapus file tersebut dan jalankan `npm run db:seed` lagi.

## Troubleshooting

### Error: Cannot find module

Pastikan sudah run `npm install` di folder backend:
```bash
cd backend
npm install
```

### Error: ENOENT database

Database akan otomatis dibuat saat pertama kali run. Jika error, pastikan folder `backend/data` ada:
```bash
mkdir -p backend/data
```

### Port 3000 already in use

Ubah port di file `.env`:
```
PORT=3001
```

### CORS Error

Pastikan CORS_ORIGIN di `.env` sudah sesuai atau set ke `*` untuk development:
```
CORS_ORIGIN=*
```

## Next Steps

### Integrate Frontend dengan Backend

Mockup HTML saat ini standalone. Untuk integrasi:

1. **Setup Frontend Framework**
   ```bash
   # React
   npx create-react-app frontend
   
   # Vue
   npm create vue@latest frontend
   
   # Svelte
   npm create vite@latest frontend -- --template svelte
   ```

2. **Install HTTP Client**
   ```bash
   npm install axios
   # or
   npm install @tanstack/react-query
   ```

3. **Configure API Base URL**
   ```js
   const API_BASE = 'http://localhost:3000/api';
   ```

4. **Implement API Calls**
   ```js
   // Example: Login
   async function login(pin) {
     const response = await fetch(`${API_BASE}/auth/login`, {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ pin })
     });
     return response.json();
   }
   ```

### Add Real-time Updates

Untuk KDS yang real-time:

1. Install Socket.IO:
   ```bash
   npm install socket.io socket.io-client
   ```

2. Setup Socket.IO di backend:
   ```ts
   import { Server } from 'socket.io';
   
   const io = new Server(server, {
     cors: { origin: '*' }
   });
   
   io.on('connection', (socket) => {
     console.log('Client connected');
     
     socket.on('new-order', (order) => {
       io.emit('order-created', order);
     });
   });
   ```

3. Connect dari frontend:
   ```js
   import io from 'socket.io-client';
   
   const socket = io('http://localhost:3000');
   
   socket.on('order-created', (order) => {
     console.log('New order:', order);
     // Update UI
   });
   ```

### Deploy to Production

1. **Setup Supabase**
   ```bash
   npm install @supabase/supabase-js
   ```

2. **Migrate Database**
   - Copy schema.sql ke Supabase SQL Editor
   - Run migration

3. **Update Database Connection**
   ```ts
   import { createClient } from '@supabase/supabase-js';
   
   const supabase = createClient(
     process.env.SUPABASE_URL,
     process.env.SUPABASE_SERVICE_KEY
   );
   ```

4. **Deploy Backend to Cloudflare Workers**
   ```bash
   npm install -g wrangler
   wrangler init
   wrangler deploy
   ```

## Development Tips

### Watch Mode

Backend sudah menggunakan `tsx watch` untuk auto-reload saat ada perubahan file.

### Debug Mode

Set environment variable:
```bash
NODE_ENV=development npm run dev
```

### Database Browser

Install SQLite browser untuk melihat data:
- **DB Browser for SQLite**: https://sqlitebrowser.org/
- **DBeaver**: https://dbeaver.io/

### API Testing

Gunakan tools:
- **Postman**: https://www.postman.com/
- **Insomnia**: https://insomnia.rest/
- **Thunder Client**: VS Code extension

## Support

Jika ada masalah, cek:
1. Node.js version: `node --version` (harus v18+)
2. npm version: `npm --version`
3. Port availability: `netstat -an | findstr 3000`
4. Logs di console

---

Happy Coding! 🚀
