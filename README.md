# Vinh Khanh Audio Guide

An automated, geofenced audio guide web application tailored specifically for the restaurants and stalls along Vinh Khanh food street, Ho Chi Minh City. Users scan QR codes at restaurant tables to listen to multi-lingual Text-to-Speech (TTS) introductions, view details, and leave reviews. 

The application uses an administrative dashboard for approval workflows and an owner dashboard for stall owners to manage their dishes and audio content dynamically.

## 🚀 Features

- **Geofenced Audio Guide:** Uses native `navigator.geolocation` and the Haversine formula to ensure audio guides automatically pause if the user walks more than 20 meters away from the restaurant.
- **Multi-Lingual TTS:** Integrates seamlessly with the browser `window.speechSynthesis` API, dynamically parsing available OS languages and translating flags into UI selectable buttons (e.g., Vietnamese, English, French, Chinese).
- **QR Code Scanning:** Includes an integrated QR scanner (`html5-qrcode`) for quick access to specific restaurant landing pages.
- **Role-Based Access Control (RBAC):** Distinct dashboards and capabilities for standard users, restaurant owners, and platform administrators, protected by secure JWT authentication.
- **Dynamic Leaflet Map:** Fully integrated map utilizing CartoDB dark tiles to highlight nearby restaurants visually.

## 🛠️ Technology Stack

- **Backend:** Python + FastAPI 
- **Database:** PostgreSQL (with SQLAlchemy)
- **Frontend:** HTML5, Vanilla JavaScript (ES6 Modules), CSS (Glassmorphism UI/UX)
- **Mapping:** Leaflet.js

## 📂 Project Structure

```
.
├── backend/                  # FastAPI Application
│   ├── auth/                 # JWT Authentication & RBAC dependencies
│   ├── routers/              # API Endpoints (users, restaurants, admin)
│   ├── models.py             # SQLAlchemy Database Models
│   ├── schemas.py            # Pydantic validation schemas
│   └── main.py               # Application entry point
├── frontend/                 # Client UI
│   ├── js/                   # Vanilla JS Modules (api, auth, map, owner, admin)
│   ├── pages/                # Specific dashboard and utility HTML files
│   └── index.html            # Premium entry splash page
└── database.py               # Async Engine and Session Configurations
```

## ⚙️ Running Locally

### 1. Backend Setup

1. Open a terminal and navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment (optional but recommended):
   ```bash
   python -m venv .venv
   # Windows:
   .venv\Scripts\activate
   # macOS/Linux:
   source .venv/bin/activate
   ```
3. Install dependencies from `requirements.txt`:
   ```bash
   pip install -r requirements.txt
   ```
4. Create a `.env` file in the root folder with the following variables:
   ```env
   DATABASE_URL=postgresql+asyncpg://<username>:<password>@<host>:<port>/<dbname>
   SECRET_KEY=your_secure_jwt_secret
   ALGORITHM=HS256
   ```
5. Run the server using Uvicorn:
   ```bash
   python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

### 2. Frontend Setup

The frontend does not require a build step (no Node/NPM required). 

1. Install a local development server, such as the **Live Server** extension in VS Code.
2. Open the `frontend/index.html` file.
3. Click "Go Live" (or start your local HTTP server).
4. Navigate to your local server address (usually `http://127.0.0.1:5500/frontend/index.html`).

*(Note: API Requests are routed by default to `localhost:8000`. You can easily adjust the cloud provider endpoint string inside `frontend/js/api.js` before deploying.)*

## 💡 Usage Notes & Simulation

- **Geofence Demo Mode:** For testing purposes outside of the actual food street, navigate to any restaurant's detail page. Above the audio player, you will see a `🛠️ Giả lập Geofencing` tool. Use these buttons to mock your GPS distance and test the audio auto-cutoff without having to physically walk outside.
- **Database:** Ensure you register generic test accounts using the UI to populate the database tables initially. An administrator must approve any submitted restaurants before they appear on the map.
