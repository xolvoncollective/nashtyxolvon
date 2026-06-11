# NASHTY POS - Point of Sale System

Modern, SaaS-ready POS system untuk restoran dengan SQLite untuk development lokal dan siap untuk deployment ke Supabase + Cloudflare.

## 🚀 Features

### POS (Point of Sale)
- ✅ Multi-category menu management
- ✅ Product search dan filtering
- ✅ Shopping cart dengan modifier support
- ✅ Multiple order types (Dine-in, Takeaway, GoFood, GrabFood, ShopeeFood)
- ✅ Multiple payment methods
- ✅ Shift management
- ✅ Order history

### KDS (Kitchen Display System)
- ✅ Real-time order display
- ✅ Timer untuk setiap order
- ✅ Urgency indicators (Fresh, Warning, Urgent)
- ✅ Swipe to complete
- ✅ Filter by order type
- ✅ Auto-sort by urgency

### Backoffice
- ✅ Dashboard dengan KPI metrics
- ✅ Category management
- ✅ Product management
- ✅ Modifier groups
- ✅ User management (Owner, Manager, Cashier, Kitchen)
- ✅ Outlet management
- ✅ Reports
- ✅ Activity logs

## 📁 Project Structure

```
POSLITE/
├── backend/                 # Express.js API Server
│   ├── src/
│   │   ├── db/
│   │   │   ├── database.ts  # Database connection
│   │   │   ├── schema.sql   # Database schema
│   │   │   └── seed.ts      # Seed data
│   │   ├── routes/          # API routes
│   │   │   ├── auth.ts
│   │   │   ├── categories.ts
│   │   │   ├── products.ts
│   │   │   ├── orders.ts
│   │   │   ├── shifts.ts
│   │   │   └── dashboard.ts
│   │   └── index.ts         # Main server file
│   ├── data/                # SQLite database files (auto-created)
│   ├── package.json
│   └── tsconfig.json
├── NASHTY_POS_Mockup.html          # POS UI mockup
├── NASHTY_KDS_Mockup.html          # KDS UI mockup
├── NASHTY_Backoffice_Mockup_8.html # Backoffice UI mockup
└── README.md
```

## 🛠️ Tech Stack

### Backend
- **Runtime:** Node.js + TypeScript
- **Framework:** Express.js
- **Database:** SQLite (development) → Supabase (production)
- **ORM:** better-sqlite3 (raw SQL for performance)
- **Auth:** bcrypt + JWT (ready)
- **Validation:** Zod

### Frontend (Mockup - Ready for React/Vue integration)
- Pure HTML/CSS/JavaScript
- Design system dengan custom CSS variables
- Responsive layout
- Dark/Light mode support

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Setup Environment

```bash
cp .env.example .env
# Edit .env dengan konfigurasi Anda
```

### 3. Initialize Database

```bash
npm run db:seed
```

Ini akan membuat database dan mengisi data demo dengan:
- 1 Tenant (Demo Restaurant)
- 1 Outlet (Galaxy Mall)
- 4 Users (Owner, 2 Cashiers, Kitchen)
- 5 Categories
- 18 Products

### 4. Start Development Server

```bash
npm run dev
```

Server akan berjalan di `http://localhost:3000`

### 5. Open UI Mockups

Buka file HTML di browser:
- **POS:** `NASHTY_POS_Mockup.html`
- **KDS:** `NASHTY_KDS_Mockup.html`
- **Backoffice:** `NASHTY_Backoffice_Mockup_8.html`

## 🔑 Demo Credentials

Login menggunakan PIN:

- **PIN: 0000** - Admin Demo (Owner)
- **PIN: 1234** - Citra Dewi (Cashier)
- **PIN: 2345** - Budi Santoso (Cashier)
- **PIN: 3456** - Ani Kitchen (Kitchen Staff)

## 📡 API Endpoints

### Authentication
- `POST /api/auth/login` - Login dengan PIN
- `GET /api/auth/staff` - Get available staff

### Categories
- `GET /api/categories` - Get all categories
- `GET /api/categories/:id` - Get category by ID

### Products
- `GET /api/products` - Get all products (with filters)
- `GET /api/products/:id` - Get product detail with modifiers
- `PATCH /api/products/:id/favorite` - Toggle favorite

### Orders
- `POST /api/orders` - Create new order
- `GET /api/orders` - Get orders (with filters)
- `GET /api/orders/:id` - Get order by ID
- `PATCH /api/orders/:id/status` - Update order status

### Shifts
- `POST /api/shifts/start` - Start shift
- `POST /api/shifts/:id/end` - End shift
- `GET /api/shifts/active` - Get active shift
- `GET /api/shifts` - Get shift history

### Dashboard
- `GET /api/dashboard/kpi` - Get KPI metrics
- `GET /api/dashboard/recent-orders` - Get recent orders

## 🗄️ Database Schema

Multi-tenant SaaS-ready schema dengan:

- **Tenants** - Business/Brand level
- **Outlets** - Store/Location level
- **Users** - Staff dengan role-based access
- **Categories** - Menu categories
- **Products** - Menu items
- **Modifier Groups** - Product modifiers (Level Pedas, Extra, dll)
- **Orders** - Order transactions
- **Shifts** - Cashier shift management
- **Activity Logs** - Audit trail

## 🚀 Production Deployment

### Supabase Migration

```sql
-- Run schema.sql di Supabase SQL Editor
-- Update connection di database.ts ke Supabase client
```

### Cloudflare Workers

```bash
# Backend dapat di-deploy sebagai Cloudflare Workers
# Atau gunakan Cloudflare Pages untuk frontend
```

## 🎨 Customization

### Theme Colors

Edit CSS variables di mockup HTML files:

```css
:root {
  --or: #E4540C;  /* Orange primary */
  --gn: #22C55E;  /* Green success */
  --rd: #EF4444;  /* Red danger */
  /* ... */
}
```

### Business Logic

Semua business logic ada di `backend/src/routes/`. Edit sesuai kebutuhan:
- Tax calculation
- Service charge
- Discount rules
- Order workflow
- Kitchen timing

## 📊 Features Roadmap

### Phase 1: Current ✅
- [x] Basic POS functionality
- [x] KDS display
- [x] Order management
- [x] Multi-tenant architecture

### Phase 2: Next
- [ ] Payment gateway integration
- [ ] Printer integration (receipt, kitchen)
- [ ] Real-time WebSocket for KDS
- [ ] Advanced reporting
- [ ] Inventory management

### Phase 3: SaaS
- [ ] Multi-outlet sync
- [ ] Subscription management
- [ ] Admin panel
- [ ] Customer app
- [ ] Loyalty program

## 🤝 Integration Ready

Struktur kode sudah siap untuk:
- **Payment Gateway:** Midtrans, Xendit, Stripe
- **Delivery:** GoFood, GrabFood, ShopeeFood API
- **Printer:** ESCPOS, Star Micronics
- **Accounting:** Accurate, Jurnal
- **Cloud:** Supabase, Firebase, AWS

## 📝 License

Proprietary - NASHTY POS System

## 💬 Support

Untuk support dan pertanyaan, hubungi development team.

---

**Built with ❤️ for Indonesian F&B Industry**
