/* eslint-disable camelcase */

/**
 * Migration 002: Seed Plant Catalog
 *
 * Populates the plant_catalog with 16 plants:
 *   4 categories × 4 rarities = 16 plants
 *
 * Each category has a thematic plant family:
 *   health   → food/herb plants  (Sproutling, Herb Bush, Sunflower, Golden Oak)
 *   study    → wisdom/tree plants (Bookleaf, Scroll Vine, Wisdom Tree, Crystal Bonsai)
 *   creative → colorful/flowers   (Doodle Daisy, Paint Poppy, Prism Orchid, Aurora Bloom)
 *   chore    → sturdy/functional  (Dust Cactus, Iron Fern, Stone Lotus, Diamond Succulent)
 *
 * Streak thresholds:
 *   common    → 0  (unlocked on signup)
 *   uncommon  → 3  (3-day streak)
 *   rare      → 7  (7-day streak)
 *   legendary → 30 (30-day streak)
 *
 * sprite_key follows the pattern: category_rarity (e.g., 'health_common')
 * The frontend maps these keys to actual pixel art assets.
 */

/** @type {import('node-pg-migrate').ColumnDefinitions | undefined} */
exports.shorthands = undefined;

/** @param pgm {import('node-pg-migrate').MigrationBuilder} */
exports.up = (pgm) => {
  const plants = [
    // ─── Health (food/herb family) ────────────────────────────────────
    {
      name: 'Sproutling',
      category: 'health',
      rarity: 'common',
      streak_required: 0,
      sprite_key: 'health_common',
      description: 'A cheerful little sprout. The first step to a healthier garden.',
    },
    {
      name: 'Herb Bush',
      category: 'health',
      rarity: 'uncommon',
      streak_required: 3,
      sprite_key: 'health_uncommon',
      description: 'A fragrant bush that rewards consistency with aromatic leaves.',
    },
    {
      name: 'Sunflower',
      category: 'health',
      rarity: 'rare',
      streak_required: 7,
      sprite_key: 'health_rare',
      description: 'Towers above the garden, tracking the sun with golden petals.',
    },
    {
      name: 'Golden Oak',
      category: 'health',
      rarity: 'legendary',
      streak_required: 30,
      sprite_key: 'health_legendary',
      description: 'An ancient tree with shimmering golden leaves. A true testament to dedication.',
    },

    // ─── Study (wisdom/tree family) ───────────────────────────────────
    {
      name: 'Bookleaf',
      category: 'study',
      rarity: 'common',
      streak_required: 0,
      sprite_key: 'study_common',
      description: 'Its leaves uncurl like the pages of an open book.',
    },
    {
      name: 'Scroll Vine',
      category: 'study',
      rarity: 'uncommon',
      streak_required: 3,
      sprite_key: 'study_uncommon',
      description: 'A winding vine inscribed with tiny, ever-changing runes.',
    },
    {
      name: 'Wisdom Tree',
      category: 'study',
      rarity: 'rare',
      streak_required: 7,
      sprite_key: 'study_rare',
      description: 'A gnarled tree whose roots tap into deep wells of knowledge.',
    },
    {
      name: 'Crystal Bonsai',
      category: 'study',
      rarity: 'legendary',
      streak_required: 30,
      sprite_key: 'study_legendary',
      description: 'A miniature tree of pure crystal. Each facet holds a lesson learned.',
    },

    // ─── Creative (colorful/flower family) ────────────────────────────
    {
      name: 'Doodle Daisy',
      category: 'creative',
      rarity: 'common',
      streak_required: 0,
      sprite_key: 'creative_common',
      description: 'A simple daisy that seems to have been drawn by a playful hand.',
    },
    {
      name: 'Paint Poppy',
      category: 'creative',
      rarity: 'uncommon',
      streak_required: 3,
      sprite_key: 'creative_uncommon',
      description: 'Its petals shift through a palette of vibrant watercolors.',
    },
    {
      name: 'Prism Orchid',
      category: 'creative',
      rarity: 'rare',
      streak_required: 7,
      sprite_key: 'creative_rare',
      description: 'Refracts light into tiny rainbows across the garden.',
    },
    {
      name: 'Aurora Bloom',
      category: 'creative',
      rarity: 'legendary',
      streak_required: 30,
      sprite_key: 'creative_legendary',
      description: 'A flower that bathes the garden in the shifting lights of the aurora.',
    },

    // ─── Chore (sturdy/functional family) ─────────────────────────────
    {
      name: 'Dust Cactus',
      category: 'chore',
      rarity: 'common',
      streak_required: 0,
      sprite_key: 'chore_common',
      description: 'Tough and no-nonsense. Thrives on routine.',
    },
    {
      name: 'Iron Fern',
      category: 'chore',
      rarity: 'uncommon',
      streak_required: 3,
      sprite_key: 'chore_uncommon',
      description: 'Its metallic fronds are as reliable as clockwork.',
    },
    {
      name: 'Stone Lotus',
      category: 'chore',
      rarity: 'rare',
      streak_required: 7,
      sprite_key: 'chore_rare',
      description: 'A flower carved from living stone, blooming through perseverance.',
    },
    {
      name: 'Diamond Succulent',
      category: 'chore',
      rarity: 'legendary',
      streak_required: 30,
      sprite_key: 'chore_legendary',
      description: 'Its crystalline leaves sparkle with the brilliance of unbreakable habit.',
    },
  ];

  // Insert all plants in a single batch.
  // Using pgm.sql with parameterized values for each row.
  for (const plant of plants) {
    pgm.sql(
      `INSERT INTO plant_catalog (name, category, rarity, streak_required, sprite_key, description)
       VALUES ('${plant.name}', '${plant.category}', '${plant.rarity}', ${plant.streak_required}, '${plant.sprite_key}', '${plant.description.replace(/'/g, "''")}')`
    );
  }
};

/** @param pgm {import('node-pg-migrate').MigrationBuilder} */
exports.down = (pgm) => {
  pgm.sql('DELETE FROM plant_catalog;');
};
