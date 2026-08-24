const express = require('express');
const { query } = require('../db');

const router = express.Router();

/**
 * POST /api/engine/decay
 * CRON JOB ENDPOINT
 * 
 * Secure endpoint called once a day (e.g. at midnight).
 * Finds all habits that missed their grace period (2 days) and downgrades
 * their garden plot's growth stage by one tier.
 */
router.post('/decay', async (req, res) => {
  try {
    // 1. Verify cron secret (must be passed in headers)
    const engineSecret = req.headers['x-engine-secret'];
    if (engineSecret !== process.env.ENGINE_SECRET) {
      return res.status(401).json({ error: 'Unauthorized engine access.' });
    }

    // 2. Find all habits that haven't been completed in >= 3 days
    // This allows a 2-day grace period (e.g., if last_completed was Monday, Tuesday and Wednesday are grace. Thursday it decays.)
    const staleHabitsRes = await query(`
      SELECT h.id as habit_id, p.id as plot_id, p.growth_stage 
      FROM habits h
      JOIN garden_plots p ON h.id = p.habit_id
      WHERE h.is_archived = false 
        AND (h.last_completed_date < CURRENT_DATE - INTERVAL '2 days' OR h.last_completed_date IS NULL)
        AND p.growth_stage != 'seed'
    `);

    const staleHabits = staleHabitsRes.rows;

    if (staleHabits.length === 0) {
      return res.json({ message: 'No plants to decay today.', decayed_count: 0 });
    }

    // 3. Process decay for each stale habit
    let decayCount = 0;
    
    // Define the downgrade paths
    const downgradeMap = {
      fruiting_tree: 'mature_tree',
      mature_tree: 'young_tree',
      young_tree: 'sapling',
      sapling: 'bloom',
      bloom: 'bud',
      bud: 'sprout',
      sprout: 'seed',
    };

    for (const item of staleHabits) {
      const newStage = downgradeMap[item.growth_stage] || 'seed';
      
      await query(
        `UPDATE garden_plots 
         SET growth_stage = $1, birds_visiting = false 
         WHERE id = $2`,
        [newStage, item.plot_id]
      );
      
      decayCount++;
    }

    res.json({ message: 'Decay engine ran successfully.', decayed_count: decayCount });
    
  } catch (err) {
    console.error('Decay engine error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
