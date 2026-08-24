const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const habitRoutes = require('./routes/habits');
const engineRoutes = require('./routes/engine');
const gardenRoutes = require('./routes/garden');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json()); // Parse JSON bodies
app.use(cookieParser()); // Parse cookies (needed for JWT httpOnly cookie)

// CORS setup (must allow credentials for httpOnly cookies to work cross-origin)
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173', // Vite default port
  credentials: true, // Allow cookies to be sent
}));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/habits', habitRoutes);
app.use('/api/engine', engineRoutes);
app.use('/api/garden', gardenRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`GrowTrack Server running on port ${PORT}`);
});
