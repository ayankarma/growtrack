<p align="center">
  <img src="https://em-content.zobj.net/source/apple/391/seedling_1f331.png" width="80" />
</p>

<h1 align="center">🌻 GrowTrack 🌻</h1>
<p align="center"><strong>Plant Habits. Grow Progress.</strong></p>

<p align="center">
  <em>A Stardew Valley-inspired gamified habit tracker.</em><br/>
  Every habit you build grows a living plant in your personal 16-bit pixel-art garden.<br/>
  Stay consistent, watch your garden flourish. Break the streak, and your plants wilt. 🌱➡️🌳
</p>

<p align="center">
  <a href="https://growtrack-swart.vercel.app">🌐 Live Demo</a> •
  <a href="#features">✨ Features</a> •
  <a href="#tech-stack">🛠 Tech Stack</a> •
  <a href="#getting-started">🚀 Getting Started</a>
</p>

---

## 🎮 How It Works

1. **Create a Habit** — Add habits like "Exercise", "Read", or "Meditate".
2. **Log Daily** — Each day you complete a habit, click the log button to water your plant.
3. **Watch It Grow** — Your plant evolves through 8 growth stages based on your streak:

| Streak | Stage | Visual |
|--------|-------|--------|
| Day 1 | Seed | 🫘 |
| Day 3 | Sprout | 🌱 |
| Day 7 | Bud | 🌿 |
| Day 14 | Bloom | 🌸 |
| Day 30 | Sapling | 🌾 |
| Day 60 | Young Tree | 🪴 |
| Day 90 | Mature Tree | 🌳 |
| Day 180 | Fruiting Tree + Birds! | 🍊🐦 |

4. **Unlock Rare Plants** — Hit milestone streaks (3, 7, 30 days) to unlock rare plant varieties tied to your habit category.

---

## ✨ Features

- 🌿 **6×6 Garden Grid** — A personal garden with 36 plots, each tied to a habit.
- 📈 **Streak Engine** — Automatic streak tracking with daily completion detection.
- 🌱 **Plant Evolution** — 8-stage growth system powered by consistency.
- 🏆 **Rare Plant Unlocks** — Category-specific rare plants unlocked at milestone streaks.
- 🔒 **Secure Auth** — JWT-based authentication with httpOnly cookies.
- 📱 **Responsive** — Works on desktop and mobile.

---

## 🛠 Tech Stack

### Frontend
| Tech | Purpose |
|------|---------|
| [React 19](https://react.dev) | UI framework |
| [Vite](https://vitejs.dev) | Build tool & dev server |
| [Tailwind CSS v4](https://tailwindcss.com) | Utility-first styling |
| [React Router v7](https://reactrouter.com) | Client-side routing |
| [Axios](https://axios-http.com) | HTTP client |

### Backend
| Tech | Purpose |
|------|---------|
| [Node.js](https://nodejs.org) | Runtime |
| [Express](https://expressjs.com) | HTTP framework |
| [PostgreSQL](https://www.postgresql.org) | Database |
| [bcrypt](https://github.com/kelektiv/node.bcrypt.js) | Password hashing |
| [JSON Web Tokens](https://jwt.io) | Authentication |

### Deployment
| Service | Purpose |
|---------|---------|
| [Vercel](https://vercel.com) | Frontend hosting |
| [Render](https://render.com) | Backend hosting |
| [Neon](https://neon.tech) | Serverless PostgreSQL |

---

## 📁 Project Structure

```
growtrack/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   │   ├── GardenGrid.jsx
│   │   │   └── HabitList.jsx
│   │   ├── context/        # React context (auth state)
│   │   ├── pages/          # Route-level pages
│   │   │   ├── LoginPage.jsx
│   │   │   └── DashboardPage.jsx
│   │   ├── api.js          # Axios instance
│   │   ├── App.jsx         # Root component + routing
│   │   └── index.css       # Global styles (retro theme)
│   └── package.json
│
├── server/                 # Express backend
│   ├── src/
│   │   ├── routes/
│   │   │   ├── auth.js     # Register, Login, Logout, /me
│   │   │   ├── habits.js   # CRUD + Log + Growth Engine
│   │   │   ├── engine.js   # Growth engine utilities
│   │   │   └── garden.js   # Garden grid endpoints
│   │   ├── middleware/
│   │   │   └── auth.js     # JWT verification middleware
│   │   ├── db.js           # PostgreSQL connection pool
│   │   └── index.js        # Express app entry point
│   └── package.json
│
├── schema.sql              # Database schema
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database (or a [Neon](https://neon.tech) free-tier instance)

### 1. Clone the repo
```bash
git clone https://github.com/ayankarma/growtrack.git
cd growtrack
```

### 2. Set up the database
Run `schema.sql` against your PostgreSQL database to create all tables and seed data.

### 3. Configure the backend
```bash
cd server
cp .env.example .env
```

Fill in your `.env`:
```env
DATABASE_URL=postgresql://user:pass@host/dbname
JWT_SECRET=your-secret-key
PORT=3001
NODE_ENV=development
```

### 4. Install & run
```bash
# Backend
cd server
npm install
npm start

# Frontend (in a new terminal)
cd client
npm install
npm run dev
```

The app will be running at `http://localhost:5173`.

---

## 🗄️ Database Schema

The core tables:

- **`users`** — Accounts (email/password or Google OAuth)
- **`habits`** — User habits with streak tracking
- **`habit_logs`** — Daily completion logs (one per habit per day)
- **`garden_plots`** — 6×6 grid of plots with growth stages
- **`plant_catalog`** — Collectible plant definitions
- **`user_unlocks`** — Tracks which rare plants a user has earned

---

## 🎨 Roadmap

- [x] Core habit CRUD
- [x] Streak calculation engine
- [x] Plant growth state machine (8 stages)
- [x] Rare plant unlock system
- [x] JWT auth with httpOnly cookies
- [x] Cloud deployment (Vercel + Render)
- [x] Retro pixel-art visual overhaul (Stardew Valley / Game Boy aesthetic)
- [ ] Google OAuth integration
- [ ] Social features (visit friends' gardens)
- [ ] Achievements & badges
- [ ] Push notification reminders

---

## 📜 License

This project is open source and available under the [MIT License](LICENSE).

---

<p align="center">
  Made with 💚 by <a href="https://github.com/ayankarma">Ayan Karma</a>
</p>
