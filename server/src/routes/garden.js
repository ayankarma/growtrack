const express = require('express');
const { query } = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);

/**
 * GET /api/garden
 * Returns all 36 garden plots for the logged-in user.
 */
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await query(
      `SELECT gp.id, gp.plot_x, gp.plot_y, gp.growth_stage, gp.birds_visiting, 
              gp.planted_at, gp.last_watered_at, gp.habit_id,
              h.name as habit_name, h.category as habit_category
       FROM garden_plots gp
       LEFT JOIN habits h ON gp.habit_id = h.id
       WHERE gp.user_id = $1
       ORDER BY gp.plot_y, gp.plot_x`,
      [userId]
    );
    res.json({ plots: result.rows });
  } catch (err) {
    console.error('Get garden error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
