# SmartSwaasth

SmartSwaasth is a **Progressive Web App (PWA)** built on the MERN stack that lets users scan or upload an image of a medicine label / strip, automatically extract the **medicine name** and **expiry date** using an OCR microservice, store the result in MongoDB, and warn the user when medicines are expired or expiring soon — all with **push notifications** and **offline support**.

## ✨ Features

- 📷 **OCR Scanning** — Upload or capture medicine labels; AI extracts name & expiry
- 📊 **Dashboard** — Track all medicines with expiry status (green/yellow/red)
- ⏰ **Smart Reminders** — Daily dosage reminders & expiry alerts via push notifications
- 💊 **Interaction Checker** — Check drug-drug interactions
- 👨‍⚕️ **Caregiver Mode** — OTP-based patient-caregiver connections
- 📱 **Installable PWA** — Install on any device, works offline
- 🔔 **Push Notifications** — Browser push even when app is closed
- 🔒 **Secure** — JWT auth, helmet, rate limiting, encrypted connections

## Architecture

```
React PWA (Vite + Tailwind)  ──►  Node / Express API  ──►  Python OCR (FastAPI + EasyOCR + OpenCV)
                                          │
                                          ▼
                                       MongoDB Atlas
```

## Project structure

```
smart-swaasth/
├── client/         # React + Vite + Tailwind frontend (PWA)
│   ├── public/     # Icons, manifest, service worker assets
│   └── src/        # Components, pages, context, utils
├── server/         # Node + Express + Mongoose backend
│   └── src/        # Routes, controllers, models, services
├── ocr-service/    # Python FastAPI + EasyOCR + OpenCV microservice
├── render.yaml     # Render deployment blueprint
└── README.md
```

## Prerequisites

- Node.js 18+
- Python 3.10+
- MongoDB (local or Atlas)

## Local Development

### 1. OCR service

```bash
cd ocr-service
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app:app --host 0.0.0.0 --port 8000
```

The first run downloads EasyOCR models (a few hundred MB).

### 2. Backend

```bash
cd server
cp .env.example .env               # then edit values
npm install
npm run dev
```

API runs on `http://localhost:5000`.

### 3. Frontend

```bash
cd client
cp .env.example .env
npm install
npm run dev
```

App runs on `http://localhost:5173`.

## Environment Variables

### Server (`server/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Server port (default: 5000) |
| `MONGO_URI` | **Yes** | MongoDB connection string |
| `JWT_SECRET` | **Yes (prod)** | Strong random secret for JWT signing |
| `OCR_SERVICE_URL` | **Yes** | URL of the OCR microservice |
| `CLIENT_ORIGIN` | **Yes** | Frontend URL for CORS |
| `VAPID_PUBLIC_KEY` | For push | VAPID public key |
| `VAPID_PRIVATE_KEY` | For push | VAPID private key |
| `VAPID_EMAIL` | For push | Contact email for VAPID |
| `NODE_ENV` | No | `development` or `production` |
| `USE_MEMORY_DB` | No | Set `true` for in-memory MongoDB |

### Client (`client/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | **Yes** | Backend API URL |
| `VITE_VAPID_PUBLIC_KEY` | For push | VAPID public key (must match server) |

## 🚀 Deployment

### Client → Vercel

1. Push your repo to GitHub
2. Go to [vercel.com](https://vercel.com) → **New Project** → import your repo
3. Set **Root Directory** to `client`
4. Set **Framework Preset** to `Vite`
5. Add environment variables:
   - `VITE_API_URL` = `https://your-server.onrender.com/api`
   - `VITE_VAPID_PUBLIC_KEY` = your VAPID public key
6. Deploy!

### Server + OCR → Render

1. Go to [render.com](https://render.com) → **New** → **Blueprint**
2. Connect your GitHub repo
3. Render will detect `render.yaml` and create both services
4. Set the environment variables for the server:
   - `MONGO_URI`, `JWT_SECRET`, `OCR_SERVICE_URL`, `CLIENT_ORIGIN`
   - `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_EMAIL`
5. Deploy!

After deployment, update `CLIENT_ORIGIN` on the server to match your Vercel URL.

## PWA Features

- **Install** — Click "Install" in Chrome's address bar or "Add to Home Screen" on mobile
- **Offline** — App shell and static assets cached; previously viewed data available offline
- **Push Notifications** — Enable from Dashboard → receive reminders even when browser is closed
- **Auto-updates** — New versions prompt users with a non-intrusive update toast

## API Endpoints

| Method | Endpoint | Purpose |
|--------|---------------------------|--------------------------------------|
| POST | /api/upload-medicine | Upload image (multipart) |
| POST | /api/extract-medicine | Run OCR on uploaded image, save it |
| GET | /api/medicines | List all saved medicines |
| DELETE | /api/medicine/:id | Delete a medicine |
| PUT | /api/medicine/:id | Update a medicine |
| POST | /api/auth/register | Register a new user |
| POST | /api/auth/login | Login |
| GET | /api/auth/me | Get current user |
| POST | /api/push/subscribe | Subscribe to push notifications |
| POST | /api/push/unsubscribe | Unsubscribe from push |
| GET | /api/push/status | Check push subscription status |

## Status colors

- 🟢 Green → safe (> 30 days)
- 🟡 Yellow → expiring within 30 days
- 🔴 Red → expired
