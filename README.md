# 🌐 HyperLocal — Live Community Resource Exchange Platform

A full-stack real-time platform where campus/community members can **request or offer help and resources** — food, tools, rides, study help — matched by geolocation.

---

## 📦 Tech Stack

| Layer          | Technology                              |
|----------------|-----------------------------------------|
| Frontend       | React 18 + Vite + Tailwind CSS          |
| Backend        | Node.js + Express.js                    |
| Database       | MongoDB + Mongoose (geospatial indexes) |
| Real-time      | Socket.io (chat, notifications, status) |
| Auth           | JWT + bcryptjs                          |
| Maps           | Google Maps JavaScript API (optional)   |
| HTTP Client    | Axios                                   |
| State          | React Context API                       |

---

## 📁 Folder Structure

```
hyperlocal/
├── backend/
│   ├── config/
│   │   └── db.js                  # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js      # Register, login, profile
│   │   ├── requestController.js   # CRUD + geo filtering
│   │   ├── messageController.js   # Chat messages
│   │   └── userController.js      # Profiles, nearby users, ratings
│   ├── middleware/
│   │   ├── auth.js                # JWT protect middleware
│   │   └── error.js               # Global error handler
│   ├── models/
│   │   ├── User.js                # User schema (geospatial, bcrypt)
│   │   ├── Request.js             # Request schema (2dsphere index)
│   │   └── Message.js             # Message schema
│   ├── routes/
│   │   ├── auth.js
│   │   ├── requests.js
│   │   ├── messages.js
│   │   └── users.js
│   ├── utils/
│   │   └── generateToken.js       # JWT generator
│   ├── seed.js                    # Sample data seeder
│   ├── server.js                  # Entry point + Socket.io
│   ├── .env.example
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── ProtectedRoute.jsx
    │   │   ├── RequestCard.jsx
    │   │   └── Sidebar.jsx
    │   ├── context/
    │   │   ├── AuthContext.jsx        # JWT + socket lifecycle
    │   │   └── NotificationContext.jsx # Real-time notifications
    │   ├── hooks/
    │   │   └── useGeolocation.js
    │   ├── pages/
    │   │   ├── AuthPage.jsx           # Login + Register
    │   │   ├── Dashboard.jsx          # Stats, feed, nearby users
    │   │   ├── RequestFeed.jsx        # Filterable request list
    │   │   ├── CreateRequest.jsx      # Post a request + map picker
    │   │   ├── RequestDetail.jsx      # Single request + respond
    │   │   ├── ChatPage.jsx           # Real-time 1-to-1 chat
    │   │   └── ProfilePage.jsx        # Edit profile + ratings
    │   ├── utils/
    │   │   ├── api.js                 # Axios instance
    │   │   ├── socket.js              # Socket.io singleton
    │   │   └── helpers.js             # Formatters, constants
    │   ├── App.jsx                    # Router
    │   ├── main.jsx
    │   └── index.css                  # Design system / Tailwind
    ├── index.html
    ├── vite.config.js
    ├── tailwind.config.js
    ├── .env.example
    └── package.json
```

---

## 🚀 Setup Instructions

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)
- Git

---

### Step 1 — Clone & Install

```bash
# Clone the repo
git clone <your-repo-url>
cd hyperlocal

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

---

### Step 2 — Configure Environment Variables

**Backend** (`backend/.env`):
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/hyperlocal
JWT_SECRET=your_super_secret_key_change_this
JWT_EXPIRE=7d
CLIENT_URL=http://localhost:5173
```

**Frontend** (`frontend/.env`):
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

> ⚠️ Google Maps key is **optional** — the app works without it, using device GPS coordinates instead.

---

### Step 3 — Start MongoDB

**Option A — Local MongoDB:**
```bash
mongod --dbpath /usr/local/var/mongodb
# or on Linux:
sudo systemctl start mongod
```

**Option B — MongoDB Atlas:**
1. Create a free cluster at https://cloud.mongodb.com
2. Whitelist your IP (Network Access → Add IP → Allow from anywhere)
3. Copy the connection string and paste into `MONGO_URI`

---

### Step 4 — Seed Sample Data (optional but recommended)

```bash
cd backend
node seed.js
```

Output:
```
✅ Connected to MongoDB
🗑  Cleared existing data
👤 Created 5 users
📋 Created 6 requests
💬 Created 5 messages

🎉 Seed complete! Test credentials:
   aryan@test.com / password123
   priya@test.com / password123
   rahul@test.com / password123
   sneha@test.com / password123
   dev@test.com   / password123
```

---

### Step 5 — Run the Application

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
# Server running on http://localhost:5000
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
# App running on http://localhost:5173
```

Open http://localhost:5173 in your browser.

---

## 📡 API Endpoints

### Auth
| Method | Endpoint              | Access  | Description            |
|--------|-----------------------|---------|------------------------|
| POST   | `/api/auth/register`  | Public  | Register new user      |
| POST   | `/api/auth/login`     | Public  | Login, receive JWT     |
| GET    | `/api/auth/me`        | Private | Get current user       |
| PUT    | `/api/auth/profile`   | Private | Update profile         |

### Requests
| Method | Endpoint                   | Access  | Description                    |
|--------|----------------------------|---------|--------------------------------|
| GET    | `/api/requests`            | Private | List requests (geo + filters)  |
| POST   | `/api/requests`            | Private | Create a new request           |
| GET    | `/api/requests/my`         | Private | Current user's requests        |
| GET    | `/api/requests/:id`        | Private | Get single request             |
| PUT    | `/api/requests/:id`        | Private | Update request (owner only)    |
| DELETE | `/api/requests/:id`        | Private | Delete request (owner only)    |
| POST   | `/api/requests/:id/respond`| Private | Volunteer to help              |

### Messages
| Method | Endpoint              | Access  | Description                |
|--------|-----------------------|---------|----------------------------|
| GET    | `/api/messages`       | Private | List all conversations     |
| POST   | `/api/messages`       | Private | Send a message             |
| GET    | `/api/messages/:userId` | Private | Get conversation with user |

### Users
| Method | Endpoint              | Access  | Description           |
|--------|-----------------------|---------|-----------------------|
| GET    | `/api/users/nearby`   | Private | Nearby users (geo)    |
| GET    | `/api/users/:id`      | Private | Get user profile      |
| POST   | `/api/users/:id/rate` | Private | Rate a user (1–5)     |

---

## ⚡ Socket.io Events

| Event                   | Direction         | Description                    |
|-------------------------|-------------------|--------------------------------|
| `user:join`             | Client → Server   | Mark user as online            |
| `user:online`           | Server → All      | Broadcast online/offline status|
| `message:send`          | Client → Server   | Send a DM                      |
| `message:receive`       | Server → Receiver | Deliver incoming message       |
| `message:sent`          | Server → Sender   | Confirm delivery               |
| `typing:start`          | Client → Server   | Start typing indicator         |
| `typing:stop`           | Client → Server   | Stop typing indicator          |
| `request:new`           | Client → Server   | Broadcast new request          |
| `request:notification`  | Server → All      | Notify nearby users            |

---

## 🗃️ Database Models

### User
```
name, email, password (hashed), avatar, location (GeoJSON Point),
rating { average, count }, isVerified, isOnline, lastSeen, bio
```

### Request
```
user (ref), title, description, category, urgency, status,
location (GeoJSON Point), respondents [], fulfilledBy, expiresAt
```

### Message
```
sender (ref), receiver (ref), content, relatedRequest (ref), isRead
```

---

## 🌍 Google Maps Setup (Optional)

1. Go to https://console.cloud.google.com
2. Create a project → Enable **Maps JavaScript API** + **Geocoding API**
3. Create an API key → Restrict to your domain
4. Add to `frontend/.env`:
   ```
   VITE_GOOGLE_MAPS_API_KEY=AIzaSy...your_key
   ```
5. The map will appear in the Create Request form

> Without a Maps key the app still works — it uses browser GPS coordinates.

---

## 🔐 Security Notes

- Passwords are hashed with bcrypt (10 salt rounds)
- JWT tokens expire after 7 days
- All `/api/requests`, `/api/messages`, `/api/users` routes are protected
- Input validation via Mongoose schema validators
- CORS restricted to `CLIENT_URL`
- `.env` files are gitignored — never commit secrets

---

## 📱 Pages & Features

| Page            | URL                  | Features                                           |
|-----------------|----------------------|----------------------------------------------------|
| Auth            | `/login`, `/register`| JWT login/register, auto-location on register      |
| Dashboard       | `/dashboard`         | Stats, nearby feed, community users, my requests   |
| Request Feed    | `/feed`              | Filters by urgency/category/radius, real-time updates |
| Create Request  | `/create-request`    | Form + Google Maps pin picker                      |
| Request Detail  | `/requests/:id`      | Full view, respond, status management              |
| Chat            | `/chat`              | Real-time 1-to-1 messaging, typing indicators      |
| Profile         | `/profile`, `/users/:id` | Edit profile, star ratings, request history    |

---

## 🐛 Troubleshooting

**MongoDB connection fails:**
```bash
# Check if MongoDB is running
sudo systemctl status mongod
# Or start it
sudo systemctl start mongod
```

**Port already in use:**
```bash
lsof -i :5000   # find process
kill -9 <PID>   # kill it
```

**Frontend can't reach backend:**
- Ensure backend is running on port 5000
- Check `VITE_API_URL` in `frontend/.env`
- The Vite proxy in `vite.config.js` forwards `/api` calls automatically

**Socket not connecting:**
- Ensure `VITE_SOCKET_URL` matches the backend URL
- Check browser console for WebSocket errors

---

## 📄 License

MIT — free to use and modify.

---

## 🚀 Deployment Architecture

* **Frontend**: Recommended to deploy on Vercel or Netlify.
* **Backend**: Recommended to deploy on Render or Railway.
* **Database**: MongoDB Atlas.

> **Note on Windows PowerShell**: If you encounter `npm : File C:\Program Files\nodejs\npm.ps1 cannot be loaded because running scripts is disabled` when running `npm install` locally, you can bypass this by running `cmd /c npm install` instead.
