# Orbitra — AI Travel Itinerary Generator

A full-stack MERN application that lets users upload travel booking documents (PDFs/images) and automatically generates a structured AI-powered itinerary.

---

# Live:
Deploy: https://anilorbitra.vercel.app
Backend: https://anilorbitra.onrender.com/health


---

## Tech Stack

| Layer      | Technology                                      |
|------------|-------------------------------------------------|
| Frontend   | React 18, React Router v6, Framer Motion        |
| Backend    | Node.js, Express.js                             |
| Database   | MongoDB + Mongoose                              |
| Auth       | JWT (JSON Web Tokens) + bcryptjs                |
| AI         | OpenAI GPT-4o-mini (swappable to Gemini)        |
| OCR        | Tesseract.js (image text extraction)            |
| PDF Parse  | pdf-parse                                       |
| File Upload| Multer                                          |

---

## Project Structure

```
orbitra/
├── backend/
│   ├── config/
│   │   └── db.js               # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js   # Register, login, profile
│   │   └── itineraryController.js  # Upload, generate, CRUD, share
│   ├── middleware/
│   │   ├── auth.js             # JWT protect middleware
│   │   ├── errorHandler.js     # Global error handler
│   │   └── upload.js           # Multer config (PDF/image, 10MB, 5 files)
│   ├── models/
│   │   ├── User.js             # User schema with bcrypt hooks
│   │   └── Itinerary.js        # Rich itinerary schema (days, activities, sharing)
│   ├── routes/
│   │   ├── auth.js             # /api/auth/*
│   │   └── itineraries.js      # /api/itineraries/*
│   ├── utils/
│   │   ├── aiService.js        # OpenAI extraction + generation
│   │   ├── extractor.js        # PDF parse + Tesseract OCR
│   │   └── jwt.js              # Token helpers
│   ├── uploads/                # Temp file storage (auto-cleaned)
│   ├── .env.example
│   ├── package.json
│   └── server.js               # Express app entry point
│
└── frontend/
    ├── public/
    │   └── index.html
    └── src/
        ├── components/
        │   └── shared/
        │       ├── Navbar.js / .css
        ├── context/
        │   └── AuthContext.js  # Global auth state + helpers
        ├── pages/
        │   ├── Landing.js/.css       # Marketing home page
        │   ├── Login.js              # JWT login
        │   ├── Register.js           # Account creation
        │   ├── Dashboard.js/.css     # Itinerary history + stats
        │   ├── UploadPage.js/.css    # Dropzone + processing flow
        │   ├── ItineraryDetail.js/.css  # Day-by-day timeline view
        │   ├── SharedItinerary.js    # Public share view (no login)
        │   └── NotFound.js/.css      # 404 page
        ├── services/
        │   └── api.js          # Axios instance + all API calls
        ├── styles/
        │   └── global.css      # Design system (CSS vars, utilities)
        ├── App.js              # Router + protected routes
        └── index.js
```

---

## Setup & Running

### Prerequisites
- Node.js >= 18
- MongoDB (local or Atlas)
- OpenAI API key

### 1. Clone & install

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Configure environment

```bash
# backend/.env  (copy from .env.example)
PORT=5000
MONGODB_URI=mongodb://localhost:27017/orbitra
JWT_SECRET=your_secret_key_here
JWT_EXPIRES_IN=7d
OPENAI_API_KEY=sk-...
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

```bash
# frontend/.env  (optional, defaults to localhost:5000)
REACT_APP_API_URL=http://localhost:5000/api
```

### 3. Run

```bash
# Terminal 1 — Backend
cd backend
npm run dev      # uses nodemon

# Terminal 2 — Frontend
cd frontend
npm start
```

Open **http://localhost:3000**

---

## API Reference

### Auth
| Method | Endpoint            | Auth | Description          |
|--------|---------------------|------|----------------------|
| POST   | /api/auth/register  | No   | Create account        |
| POST   | /api/auth/login     | No   | Get JWT token         |
| GET    | /api/auth/me        | Yes  | Current user          |
| PUT    | /api/auth/profile   | Yes  | Update name           |

### Itineraries
| Method | Endpoint                        | Auth | Description                    |
|--------|---------------------------------|------|--------------------------------|
| POST   | /api/itineraries/upload         | Yes  | Upload docs → trigger AI       |
| GET    | /api/itineraries                | Yes  | List user's itineraries        |
| GET    | /api/itineraries/:id            | Yes  | Full itinerary detail          |
| GET    | /api/itineraries/:id/status     | Yes  | Poll processing status         |
| DELETE | /api/itineraries/:id            | Yes  | Delete itinerary               |
| POST   | /api/itineraries/:id/share      | Yes  | Enable sharing, get link       |
| POST   | /api/itineraries/:id/unshare    | Yes  | Disable sharing                |
| GET    | /api/itineraries/shared/:token  | No   | View public shared itinerary   |

---

## Key Design Decisions

### Async Processing
Upload returns a `202 Accepted` with `itineraryId` immediately. The frontend polls `/status` every 2 seconds. This avoids HTTP timeouts for large files or slow AI responses.

### Document Extraction Pipeline
1. **PDF** → `pdf-parse` extracts raw text  
2. **Images** → `Tesseract.js` runs OCR  
3. Combined text → OpenAI extracts structured booking JSON  
4. Structured data → OpenAI generates full day-by-day itinerary

### Sharing
Each itinerary gets a unique `nanoid(12)` share token on creation. Sharing is opt-in — calling `/share` sets `isShared: true` and returns a public URL. The `/shared/:token` route requires no authentication.

### Security
- Passwords hashed with bcrypt (12 rounds)  
- JWT expiry configurable via env  
- Rate limiting: 100 req/15min global, 20 uploads/hour  
- File type whitelist + 10MB size limit  
- Uploaded files deleted after processing  
- CORS restricted to `FRONTEND_URL`

---

## MongoDB Schema Highlights

**User**: name, email, hashed password, timestamps  
**Itinerary**: user ref, title, destination, dates, duration, travelers, uploads metadata, extractedData (structured bookings), days (array of `{ day, date, title, activities[] }`), tips, emergencyInfo, shareToken (indexed), isShared, status (processing/completed/failed)

---

## Switching AI Provider

The `aiService.js` uses OpenAI by default. To use **Google Gemini**:

1. Install: `npm install @google/generative-ai`
2. Replace the OpenAI client in `utils/aiService.js` with the Gemini SDK
3. Update `.env`: `GEMINI_API_KEY=...`

The prompt structure is identical — only the API call changes.
