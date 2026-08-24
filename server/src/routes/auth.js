const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const { query } = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ─── Helper Functions ───────────────────────────────────────────────

/**
 * Creates a JWT and sets it as an httpOnly cookie.
 */
const setAuthCookie = (res, userId) => {
  const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
  
  res.cookie('jwt', token, {
    httpOnly: true, // Prevents XSS attacks (JS cannot read it)
    secure: process.env.NODE_ENV === 'production', // Use HTTPS in production
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // Needed for cross-origin if frontend/backend differ
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days in ms
  });
};

/**
 * Generates the 36 (6x6) empty garden plots for a new user.
 */
const createGardenPlots = async (userId) => {
  // We use a single batch insert query for efficiency
  const values = [];
  let paramIndex = 1;
  const placeholders = [];
  
  for (let x = 0; x < 6; x++) {
    for (let y = 0; y < 6; y++) {
      values.push(userId, x, y);
      placeholders.push(`($${paramIndex++}, $${paramIndex++}, $${paramIndex++})`);
    }
  }

  await query(
    `INSERT INTO garden_plots (user_id, plot_x, plot_y) VALUES ${placeholders.join(',')}`,
    values
  );
};

/**
 * Unlocks common plants (streak_required = 0) for a new user.
 */
const unlockCommonPlants = async (userId) => {
  await query(`
    INSERT INTO user_unlocks (user_id, plant_catalog_id, trigger_description)
    SELECT $1, id, 'Unlocked on signup'
    FROM plant_catalog
    WHERE streak_required = 0
  `, [userId]);
};


// ─── Routes ─────────────────────────────────────────────────────────

/**
 * POST /api/auth/register
 * Register a new user with email and password.
 */
router.post('/register', async (req, res) => {
  try {
    const { email, password, display_name } = req.body;

    // Basic validation
    if (!email || !password || !display_name) {
      return res.status(400).json({ error: 'All fields are required.' });
    }
    
    // Check if user already exists
    const userCheck = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (userCheck.rows.length > 0) {
      return res.status(409).json({ error: 'Email already in use.' });
    }

    // Hash password (10 salt rounds is standard)
    const password_hash = await bcrypt.hash(password, 10);

    // Create user
    const insertResult = await query(
      `INSERT INTO users (email, password_hash, display_name) 
       VALUES ($1, $2, $3) RETURNING id, email, display_name, avatar_url`,
      [email, password_hash, display_name]
    );
    const user = insertResult.rows[0];

    // Initialize garden and unlocks
    await createGardenPlots(user.id);
    await unlockCommonPlants(user.id);

    // Set cookie and respond
    setAuthCookie(res, user.id);
    res.status(201).json({ user });

  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


/**
 * POST /api/auth/login
 * Log in with email and password.
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    // Find user
    const result = await query(
      'SELECT id, email, password_hash, display_name, avatar_url FROM users WHERE email = $1', 
      [email]
    );
    const user = result.rows[0];

    // If user doesn't exist or is a Google-only user (no password_hash)
    if (!user || !user.password_hash) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Set cookie and respond (omit password hash from response)
    setAuthCookie(res, user.id);
    delete user.password_hash;
    res.json({ user });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


/**
 * POST /api/auth/google
 * Log in or register via Google OAuth.
 */
router.post('/google', async (req, res) => {
  try {
    const { credential } = req.body; // The ID token from Google's frontend SDK

    if (!credential) {
      return res.status(400).json({ error: 'Google credential missing.' });
    }

    // Verify the Google token securely
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    const { sub: google_id, email, name, picture } = payload;

    // Check if user exists by google_id OR email
    let result = await query('SELECT * FROM users WHERE google_id = $1 OR email = $2', [google_id, email]);
    let user = result.rows[0];

    if (user) {
      // If user exists by email but doesn't have a google_id, link them
      if (!user.google_id) {
        await query('UPDATE users SET google_id = $1 WHERE id = $2', [google_id, user.id]);
      }
    } else {
      // New user! Create them.
      const insertResult = await query(
        `INSERT INTO users (email, display_name, google_id, avatar_url) 
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [email, name, google_id, picture]
      );
      user = insertResult.rows[0];

      // Initialize garden and unlocks
      await createGardenPlots(user.id);
      await unlockCommonPlants(user.id);
    }

    // Set cookie and respond
    setAuthCookie(res, user.id);
    delete user.password_hash; // Just in case
    res.json({ user });

  } catch (err) {
    console.error('Google OAuth error:', err);
    res.status(401).json({ error: 'Invalid Google token.' });
  }
});


/**
 * POST /api/auth/logout
 * Clears the httpOnly cookie to log the user out.
 */
router.post('/logout', (req, res) => {
  res.clearCookie('jwt', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  });
  res.json({ message: 'Logged out successfully' });
});


/**
 * GET /api/auth/me
 * Returns the currently logged in user based on the httpOnly cookie.
 * Requires the `authenticateToken` middleware.
 */
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const result = await query(
      'SELECT id, email, display_name, avatar_url, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ user: result.rows[0] });
  } catch (err) {
    console.error('/me error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
