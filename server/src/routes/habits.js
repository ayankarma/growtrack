const express = require('express');
const { query } = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Apply auth middleware to ALL routes in this file
router.use(authenticateToken);

/**
 * Helper: Find an empty garden plot for the user.
 */
const findEmptyPlot = async (userId) => {
  const result = await query(
    'SELECT id FROM garden_plots WHERE user_id = $1 AND growth_stage = $2 AND habit_id IS NULL LIMIT 1',
    [userId, 'empty']
  );
  return result.rows[0];
};

/**
 * POST /api/habits
 * Create a new habit and auto-assign to an empty garden plot.
 */
router.post('/', async (req, res) => {
  try {
    const { name, category } = req.body;
    const userId = req.user.id;

    if (!name || !category) {
      return res.status(400).json({ error: 'Name and category are required.' });
    }

    const validCategories = ['health', 'study', 'creative', 'chore'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({ error: 'Invalid category.' });
    }

    // Check if user has an empty plot available
    const emptyPlot = await findEmptyPlot(userId);
    if (!emptyPlot) {
      return res.status(400).json({ error: 'Your garden is full! Archive a habit to free up a plot.' });
    }

    // Insert the new habit
    const insertHabitRes = await query(
      `INSERT INTO habits (user_id, name, category) 
       VALUES ($1, $2, $3) RETURNING *`,
      [userId, name, category]
    );
    const newHabit = insertHabitRes.rows[0];

    // Assign to the empty plot and set state to seed
    await query(
      `UPDATE garden_plots 
       SET habit_id = $1, growth_stage = 'seed', planted_at = now() 
       WHERE id = $2`,
      [newHabit.id, emptyPlot.id]
    );

    res.status(201).json({ habit: newHabit, plot_id: emptyPlot.id });
  } catch (err) {
    console.error('Create habit error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/habits
 * List all active habits for the logged-in user.
 */
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await query(
      `SELECT id, name, category, current_streak, longest_streak, last_completed_date, created_at
       FROM habits 
       WHERE user_id = $1 AND is_archived = false 
       ORDER BY created_at DESC`,
      [userId]
    );
    res.json({ habits: result.rows });
  } catch (err) {
    console.error('Get habits error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PATCH /api/habits/:id
 * Update a habit (name or is_archived status).
 * STRICT FIELD WHITELISTING: user cannot update streaks manually.
 */
router.patch('/:id', async (req, res) => {
  try {
    const habitId = req.params.id;
    const userId = req.user.id;
    const { name, is_archived } = req.body;

    // Verify ownership
    const ownershipCheck = await query('SELECT id FROM habits WHERE id = $1 AND user_id = $2', [habitId, userId]);
    if (ownershipCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Habit not found or access denied.' });
    }

    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(name);
    }
    
    if (is_archived !== undefined) {
      updates.push(`is_archived = $${paramIndex++}`);
      values.push(is_archived);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid fields provided for update.' });
    }

    values.push(habitId, userId); // For the WHERE clause
    const queryStr = `
      UPDATE habits 
      SET ${updates.join(', ')} 
      WHERE id = $${paramIndex++} AND user_id = $${paramIndex++} 
      RETURNING *
    `;

    const result = await query(queryStr, values);
    res.json({ habit: result.rows[0] });
  } catch (err) {
    console.error('Update habit error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/habits/:id/log
 * Log a habit completion for today. Triggers the Growth Engine.
 */
router.post('/:id/log', async (req, res) => {
  try {
    const habitId = req.params.id;
    const userId = req.user.id;
    const { note } = req.body || {};

    // Verify ownership and active status
    const habitCheck = await query(
      'SELECT id, is_archived, category FROM habits WHERE id = $1 AND user_id = $2', 
      [habitId, userId]
    );
    
    if (habitCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Habit not found or access denied.' });
    }
    if (habitCheck.rows[0].is_archived) {
      return res.status(400).json({ error: 'Cannot log an archived habit.' });
    }

    const category = habitCheck.rows[0].category;
    let insertResult;

    // 1. Insert Log
    try {
      insertResult = await query(
        `INSERT INTO habit_logs (habit_id, user_id, log_date, note) 
         VALUES ($1, $2, CURRENT_DATE, $3) RETURNING *`,
        [habitId, userId, note || null]
      );
    } catch (dbError) {
      if (dbError.code === '23505') { // unique_violation
        return res.status(400).json({ error: 'Habit already logged today.' });
      }
      throw dbError; 
    }

    // 2. Streak Calculation Engine
    // We use Postgres to handle the date diffing safely
    const updateHabitRes = await query(`
      WITH streak_calc AS (
        SELECT 
          id,
          CASE 
            WHEN last_completed_date = CURRENT_DATE - 1 THEN current_streak + 1
            WHEN last_completed_date = CURRENT_DATE THEN current_streak
            ELSE 1
          END as new_streak
        FROM habits WHERE id = $1
      )
      UPDATE habits h
      SET 
        current_streak = sc.new_streak,
        longest_streak = GREATEST(h.longest_streak, sc.new_streak),
        last_completed_date = CURRENT_DATE
      FROM streak_calc sc
      WHERE h.id = sc.id
      RETURNING h.current_streak;
    `, [habitId]);

    const { current_streak } = updateHabitRes.rows[0];

    // 3. Plant Evolution Engine (The Extended State Machine)
    let stage = 'seed';
    if (current_streak >= 180) stage = 'fruiting_tree';
    else if (current_streak >= 90) stage = 'mature_tree';
    else if (current_streak >= 60) stage = 'young_tree';
    else if (current_streak >= 30) stage = 'sapling';
    else if (current_streak >= 14) stage = 'bloom';
    else if (current_streak >= 7) stage = 'bud';
    else if (current_streak >= 3) stage = 'sprout';

    const birdsVisiting = current_streak >= 180;

    await query(
      `UPDATE garden_plots 
       SET growth_stage = $1, birds_visiting = $2, last_watered_at = now() 
       WHERE habit_id = $3`,
      [stage, birdsVisiting, habitId]
    );

    // 4. Rare Plant Unlocks
    // In Phase 1 we seeded plants requiring 3, 7, and 30 day streaks
    if ([3, 7, 30].includes(current_streak)) {
      const plantRes = await query(
        'SELECT id FROM plant_catalog WHERE category = $1 AND streak_required = $2 LIMIT 1',
        [category, current_streak]
      );
      
      if (plantRes.rows.length > 0) {
        const plantId = plantRes.rows[0].id;
        // Insert if not exists (using ON CONFLICT DO NOTHING)
        await query(
          `INSERT INTO user_unlocks (user_id, plant_catalog_id, trigger_description) 
           VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
          [userId, plantId, `Unlocked by reaching a ${current_streak}-day streak!`]
        );
      }
    }

    res.status(201).json({ 
      log: insertResult.rows[0], 
      new_streak: current_streak,
      new_stage: stage,
      birds_visiting: birdsVisiting
    });

  } catch (err) {
    console.error('Log habit error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
