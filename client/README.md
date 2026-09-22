
# InnoTrack

InnoTrack is a full-stack attendance and member management system for innovation sessions, labs, and student programs. It combines a React frontend with an Express + MongoDB backend to manage users, sessions, QR scanning, attendance, and reporting.

## Features

- Role-based login for Mentor, HOD, Coordinator, and Student users
- Member management and tracking
- Session creation and management
- QR-code based attendance marking
- Attendance records and reports
- Dashboard summaries and analytics
- PDF/email-ready reporting support

## Tech Stack

- Frontend: React, Vite, React Router, Chart.js
- Backend: Node.js, Express, MongoDB, Mongoose
- Authentication: JWT + bcrypt
- Extras: QR code generation, PDF generation, mail integration

## Project Structure

- `client/` – React frontend
- `server/` – Express API and database logic

## Prerequisites

Before running the app, make sure you have:

- Node.js 18 or newer
- npm
- MongoDB running locally, or let the app fall back to an in-memory MongoDB instance automatically

## Setup

### 1. Install server dependencies

```bash
cd server
npm install
```

### 2. Configure environment variables

Create a `.env` file inside the `server` folder if needed:

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/innotrack
JWT_SECRET=your_secret_key
```

If MongoDB is not running, the server will automatically try to use an in-memory MongoDB instance.

### 3. Start the backend

```bash
npm run dev
```

The API will run on:

- http://localhost:5000

### 4. Install client dependencies

```bash
cd ../client
npm install
```

### 5. Start the frontend

```bash
npm run dev
```

The frontend will run on:

- http://localhost:5173

## Demo Accounts

The backend seeds demo users automatically.

- Username: `mentor` | Password: `password123`
- Username: `hod` | Password: `password123`
- Username: `coordinator` | Password: `password123`
- Username: `INNO-001` | Password: `password123`
- Username: `INNO-002` | Password: `password123`

## Available Scripts

### Client

```bash
npm run dev
npm run build
npm run preview
npm run lint
```

### Server

```bash
npm run dev
npm run start
npm run seed
```

## Notes

- The app is designed for institutional or club activity tracking.
- Attendance can be processed through session-based QR scans.
- The backend includes fallback handling for local MongoDB connectivity issues.

## License

This project is intended for internal or educational use unless otherwise specified by the project owner.
