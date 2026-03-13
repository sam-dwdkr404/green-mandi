# 🌱 Green Mandi — Farm-to-Retail Marketplace

A **Low-Bandwidth, Offline-First** marketplace connecting farmers in Nipani directly to urban retailers — no middlemen.

## Features

- 🌾 **Farmer Portal** — List crops, set prices, manage orders
- 🛒 **Retailer Portal** — Browse, search & place bulk orders
- 📡 **Offline First** — Works with minimal/no internet (IndexedDB via Dexie.js)
- 💸 **UPI Payments** — QR codes + PhonePe/GPay/Paytm deep links
- 🗺️ **Map View** — OpenStreetMap + Leaflet showing nearby listings
- ⚡ **Real-Time** — Socket.IO for instant order notifications
- 📱 **Mobile Responsive** — Works on feature phones & smartphones

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, React, Tailwind CSS |
| Backend | Node.js, Express |
| Database | MongoDB, Mongoose |
| Offline | IndexedDB via Dexie.js |
| Payments | UPI QR + Deep Links (PhonePe/GPay/Paytm) |
| Maps | Leaflet + OpenStreetMap |
| Real-Time | Socket.IO |
| Deployment | Vercel (frontend) + Render (backend) + MongoDB Atlas |

## Project Structure

```
green-mandi/
├── frontend/                # Next.js application
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx          # Landing page
│   │   │   ├── auth/             # Login, Register
│   │   │   ├── farmer/           # Farmer dashboard, listings, orders
│   │   │   ├── retailer/         # Retailer browse, orders
│   │   │   ├── listings/[id]     # Listing detail + order placement
│   │   │   ├── orders/[id]       # Order tracking
│   │   │   └── map/              # OpenStreetMap listings view
│   │   ├── components/shared/    # Navbar, shared UI
│   │   ├── lib/
│   │   │   ├── api.ts            # Axios client with offline fallback
│   │   │   ├── db.ts             # Dexie.js IndexedDB setup
│   │   │   └── store.ts          # Zustand auth store
│   │   └── hooks/
│   │       ├── useOffline.ts     # Offline detection + sync
│   │       └── useSocket.ts      # Socket.IO connection
│   └── vercel.json
│
└── backend/                 # Express API
    ├── src/
    │   ├── index.js          # Server entry
    │   ├── models/           # User, Listing, Order schemas
    │   ├── routes/           # auth, listings, orders, users, payments
    │   ├── middleware/        # JWT auth
    │   └── socket/           # Real-time event handlers
    └── render.yaml
```

## Quick Start

### Backend Setup

```bash
cd backend
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret
npm install
npm run dev
# Server runs on http://localhost:5000
```

### Frontend Setup

```bash
cd frontend
cp .env.example .env.local
# Edit .env.local with your backend URL
npm install
npm run dev
# App runs on http://localhost:3000
```

## Deployment

### Backend → Render

1. Push to GitHub
2. Create new Web Service on [render.com](https://render.com)
3. Connect your repo, select `backend/` as root
4. Add environment variables (MONGODB_URI, JWT_SECRET, FRONTEND_URL)
5. Deploy!

### Frontend → Vercel

1. Import project on [vercel.com](https://vercel.com)
2. Set root directory to `frontend/`
3. Add env vars: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SOCKET_URL`
4. Deploy!

### Database → MongoDB Atlas

1. Create free cluster at [mongodb.com/atlas](https://mongodb.com/atlas)
2. Get connection string
3. Add to Render environment variable as `MONGODB_URI`

## API Endpoints

### Auth
- `POST /api/auth/register` — Register farmer/retailer
- `POST /api/auth/login` — Login
- `GET /api/auth/me` — Get current user

### Listings
- `GET /api/listings` — Browse all listings (with filters)
- `POST /api/listings` — Create listing (farmer only)
- `GET /api/listings/:id` — Get listing details
- `PUT /api/listings/:id` — Update listing
- `DELETE /api/listings/:id` — Delete listing

### Orders
- `POST /api/orders` — Place order (retailer only)
- `GET /api/orders/my-orders` — Get user's orders
- `PUT /api/orders/:id/status` — Update order status
- `PUT /api/orders/:id/payment` — Confirm payment

### Payments
- `POST /api/payments/upi/generate` — Generate UPI deep link + QR data

## Offline Behavior

When offline, the app:
1. **Reads** from IndexedDB cache (listings, orders synced on last online session)
2. **Queues** write operations (new orders, status updates) in IndexedDB
3. **Auto-syncs** all queued operations when connectivity is restored
4. Shows persistent offline banner with WifiOff indicator

## UPI Payment Flow

1. Retailer places order → order created in DB
2. Backend generates UPI deep link with farmer's UPI ID
3. Frontend renders:
   - QR code (using `qrcode` library)
   - Direct app links: PhonePe, GPay, Paytm
4. Retailer pays and confirms → order payment status updated
5. Farmer notified via Socket.IO

## License

MIT — Built for Green Mandi Hackathon 2024
