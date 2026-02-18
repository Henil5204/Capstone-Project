# SHIFT-UP – Full Stack Workforce Management App

## 📁 Project Structure

```
shiftup/
├── backend/                    ← Node.js / Express API
│   ├── config/
│   │   └── db.js              ← MongoDB connection
│   ├── middleware/
│   │   ├── auth.js            ← JWT protect + authorize + generateToken
│   │   ├── errorHandler.js    ← Global error handler
│   │   └── logger.js          ← Request logger
│   ├── models/
│   │   ├── User.js            ← User schema (employee/manager/owner)
│   │   ├── Shift.js           ← Shift schema
│   │   ├── SwapRequest.js     ← Swap request schema
│   │   ├── Notification.js    ← Notification schema
│   │   └── Attendance.js      ← Attendance schema
│   ├── routes/
│   │   ├── auth.js            ← POST /register, POST /login, GET /me
│   │   ├── shifts.js          ← CRUD shifts, /week, /today, /publish
│   │   ├── swaps.js           ← GET/POST swaps, approve/reject
│   │   ├── notifications.js   ← GET, mark read, delete
│   │   ├── users.js           ← employees list, reports, availability
│   │   └── dashboard.js       ← Manager dashboard summary
│   ├── .env                   ← Environment variables
│   ├── .env.example           ← Template for .env
│   ├── server.js              ← Express app entry point
│   └── seed.js                ← Database seeder with demo data
│
└── frontend/                  ← React App
    ├── src/
    │   ├── api.js             ← Axios client with JWT interceptor
    │   ├── App.js             ← Root component + routing
    │   ├── App.css            ← Global design system (DM Sans + Bebas Neue)
    │   ├── index.js           ← React entry point
    │   ├── context/
    │   │   └── AuthContext.jsx ← Global auth state (login/logout/register)
    │   ├── pages/
    │   │   ├── homepage/
    │   │   │   └── Home.jsx   ← Marketing landing page
    │   │   ├── employee_login/
    │   │   │   ├── Login.jsx  ← Login with portal tabs
    │   │   │   └── Register.jsx ← Registration form
    │   │   ├── employee_portal/
    │   │   │   ├── EmployeePortal.jsx  ← Employee nav wrapper
    │   │   │   ├── Schedule.jsx        ← Weekly shift calendar view
    │   │   │   ├── ShiftSwap.jsx       ← Submit + view swap requests
    │   │   │   ├── Availability.jsx    ← Weekly availability grid
    │   │   │   └── Notifications.jsx   ← Notification inbox
    │   │   └── manager_portal/
    │   │       ├── ManagerPortal.jsx   ← Manager nav wrapper
    │   │       ├── ManagerDashboard.jsx ← Coverage + hours + alerts
    │   │       ├── ManagerSchedule.jsx  ← Drag-and-drop schedule planner
    │   │       ├── SwapApprovals.jsx    ← Approve/reject swap requests
    │   │       ├── StaffReport.jsx      ← Reports & analytics
    │   │       └── EmployeeOverview.jsx ← Employee cards + export
    │   └── .env               ← Frontend env (API base URL)
    └── package.json
```

---

## 🚀 Setup & Running

### Prerequisites
- Node.js 16+
- MongoDB (local or MongoDB Atlas)

### 1. Backend Setup

```bash
cd backend
npm install

# Edit .env with your MongoDB URI and JWT secret
cp .env.example .env
# Edit .env:
#   MONGO_URI=mongodb://localhost:27017/shiftup
#   JWT_SECRET=your_secret_here

# Seed demo data (optional but recommended)
node seed.js

# Start server
npm run dev        # Development with auto-reload
npm start          # Production
```

Backend runs on: `http://localhost:5000`

### 2. Frontend Setup

```bash
cd frontend
npm install
npm start
```

Frontend runs on: `http://localhost:3000`

---

## 🔑 API Endpoints

### Auth
| Method | Endpoint          | Access  | Description         |
|--------|-------------------|---------|---------------------|
| POST   | /api/auth/register | Public  | Register new user   |
| POST   | /api/auth/login    | Public  | Login + get JWT     |
| GET    | /api/auth/me       | Any     | Get my profile      |
| PUT    | /api/auth/me       | Any     | Update my profile   |

### Shifts
| Method | Endpoint              | Access    | Description              |
|--------|-----------------------|-----------|--------------------------|
| GET    | /api/shifts           | Any       | Get shifts (filtered by role) |
| GET    | /api/shifts/week      | Any       | Get shifts for date range |
| GET    | /api/shifts/today     | Mgr/Owner | Today's coverage         |
| POST   | /api/shifts           | Mgr/Owner | Create shift             |
| PUT    | /api/shifts/:id       | Mgr/Owner | Update shift             |
| DELETE | /api/shifts/:id       | Mgr/Owner | Delete shift             |
| POST   | /api/shifts/publish   | Mgr/Owner | Publish drafts + notify employees |

### Swap Requests
| Method | Endpoint                  | Access    | Description         |
|--------|---------------------------|-----------|---------------------|
| GET    | /api/swaps                | Any       | Get swaps           |
| POST   | /api/swaps                | Employee  | Submit swap request |
| PUT    | /api/swaps/:id/approve    | Mgr/Owner | Approve swap        |
| PUT    | /api/swaps/:id/reject     | Mgr/Owner | Reject swap         |

### Notifications
| Method | Endpoint                      | Access | Description          |
|--------|-------------------------------|--------|----------------------|
| GET    | /api/notifications            | Any    | Get my notifications |
| PUT    | /api/notifications/:id/read   | Any    | Mark one as read     |
| PUT    | /api/notifications/read-all   | Any    | Mark all as read     |
| DELETE | /api/notifications/:id        | Any    | Delete notification  |

### Users
| Method | Endpoint                       | Access    | Description            |
|--------|--------------------------------|-----------|------------------------|
| GET    | /api/users/employees           | Mgr/Owner | All employees + stats  |
| GET    | /api/users/reports/weekly      | Mgr/Owner | Hours & cost report    |
| PUT    | /api/users/me/availability     | Employee  | Update availability    |

### Dashboard
| Method | Endpoint       | Access    | Description              |
|--------|----------------|-----------|--------------------------|
| GET    | /api/dashboard | Mgr/Owner | Manager dashboard data   |

---

## 👤 Demo Accounts (after running seed.js)

| Role     | Email                    | Password     |
|----------|--------------------------|--------------|
| Employee | maria@shiftup.com        | password123  |
| Employee | kevin@shiftup.com        | password123  |
| Manager  | manager@shiftup.com      | password123  |
| Owner    | owner@shiftup.com        | password123  |

---

## 🔒 JWT Authentication Flow

1. User logs in → receives `Bearer <token>` 
2. Token stored in `localStorage` as `shiftup_token`
3. Axios interceptor attaches token to every request header
4. On 401 → auto logout + redirect to login
5. Token expires per `JWT_EXPIRE` in `.env` (default: 7d)

---

## 🎨 Design System

- **Fonts**: Bebas Neue (headings) + DM Sans (body)
- **Primary**: `#f5b800` (yellow)
- **Dark**: `#1a1a1a`
- **Background**: `#f0f0ec`
- CSS prefix: `su-` to avoid conflicts
