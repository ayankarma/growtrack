/* eslint-disable camelcase */

/**
 * Migration 001: Initial Schema
 *
 * Creates the full GrowTrack database schema:
 *   - Custom ENUM types (category, rarity, growth_stage)
 *   - users table (email/password + Google OAuth)
 *   - habits table (daily habits with cached streak fields)
 *   - habit_logs table (one log per habit per day)
 *   - plant_catalog table (seed data reference for all plants)
 *   - garden_plots table (6x6 grid per user)
 *   - user_unlocks table (streak-based plant unlocks)
 *
 * Key design notes:
 *   - UUIDs for user-facing IDs (no sequential leaking)
 *   - SERIAL for plant_catalog (seed data, not sensitive)
 *   - Denormalized user_id on habit_logs for fast scoped queries
 *   - Cached streak fields on habits (written only by the growth engine)
 *   - Health as 0-100 integer for gradual decay (not binary alive/dead)
 *   - Plants never fully die — minimum state is seed (per design decision)
 */

/** @type {import('node-pg-migrate').ColumnDefinitions | undefined} */
exports.shorthands = undefined;

/** @param pgm {import('node-pg-migrate').MigrationBuilder} */
exports.up = (pgm) => {
  // ─── ENUM Types ──────────────────────────────────────────────────────
  // Using Postgres ENUMs to enforce valid values at the DB level.
  // This makes illegal states unrepresentable.

  pgm.createType('category', ['health', 'study', 'creative', 'chore']);
  pgm.createType('rarity', ['common', 'uncommon', 'rare', 'legendary']);
  pgm.createType('growth_stage', ['empty', 'seed', 'sprout', 'bud', 'bloom']);

  // ─── Users ───────────────────────────────────────────────────────────
  // password_hash is nullable: Google OAuth users don't have a password.
  // google_id is nullable + unique: email/password users don't have one.
  // Postgres allows multiple NULLs in a UNIQUE column, so this works.

  pgm.createTable('users', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    email: { type: 'text', notNull: true, unique: true },
    password_hash: { type: 'text' }, // nullable for OAuth-only users
    display_name: { type: 'text', notNull: true },
    google_id: { type: 'text', unique: true }, // nullable for email/password users
    avatar_url: { type: 'text' },
    created_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('now()'),
    },
    updated_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('now()'),
    },
  });

  // ─── Habits ──────────────────────────────────────────────────────────
  // current_streak and longest_streak are CACHED values.
  // Source of truth = habit_logs. Only the growth engine writes these.
  // last_completed_date is DATE (not timestamp) because streaks count
  // calendar days, not exact times.

  pgm.createTable('habits', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    user_id: {
      type: 'uuid',
      notNull: true,
      references: '"users"',
      onDelete: 'CASCADE',
    },
    name: { type: 'text', notNull: true },
    category: { type: 'category', notNull: true },
    is_archived: { type: 'boolean', notNull: true, default: false },
    current_streak: { type: 'integer', notNull: true, default: 0 },
    longest_streak: { type: 'integer', notNull: true, default: 0 },
    last_completed_date: { type: 'date' }, // nullable: never completed yet
    created_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('now()'),
    },
    updated_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('now()'),
    },
  });

  pgm.createIndex('habits', 'user_id');

  // ─── Habit Logs ──────────────────────────────────────────────────────
  // One row per habit per calendar day.
  // user_id is denormalized (could join through habits) to avoid a join
  // on every scoped query. Every API call does WHERE user_id = $1.
  // The UNIQUE constraint on (habit_id, log_date) prevents double-logging.

  pgm.createTable('habit_logs', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    habit_id: {
      type: 'uuid',
      notNull: true,
      references: '"habits"',
      onDelete: 'CASCADE',
    },
    user_id: {
      type: 'uuid',
      notNull: true,
      references: '"users"',
      onDelete: 'CASCADE',
    },
    log_date: { type: 'date', notNull: true },
    note: { type: 'text' },
    created_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('now()'),
    },
  });

  // Prevent completing the same habit twice on the same day
  pgm.addConstraint('habit_logs', 'habit_logs_habit_id_log_date_unique', {
    unique: ['habit_id', 'log_date'],
  });

  // Dashboard query: "what did this user complete today/this week?"
  pgm.createIndex('habit_logs', ['user_id', 'log_date']);

  // Streak query: "last N completions for this habit, newest first"
  pgm.createIndex('habit_logs', ['habit_id', { name: 'log_date', sort: 'DESC' }]);

  // ─── Plant Catalog ───────────────────────────────────────────────────
  // Seed data — SERIAL IDs are fine here (not user-facing secrets).
  // streak_required maps to unlock thresholds:
  //   0 = common (unlocked on signup)
  //   3 = uncommon, 7 = rare, 30 = legendary
  // sprite_key is a string reference to a frontend asset, NOT a URL.
  // This decouples the DB from asset hosting.

  pgm.createTable('plant_catalog', {
    id: { type: 'serial', primaryKey: true },
    name: { type: 'text', notNull: true },
    category: { type: 'category', notNull: true },
    rarity: { type: 'rarity', notNull: true, default: 'common' },
    streak_required: { type: 'integer', notNull: true, default: 0 },
    sprite_key: { type: 'text', notNull: true },
    description: { type: 'text' },
  });

  // Same plant name can exist in different categories, but not twice
  // within the same category.
  pgm.addConstraint('plant_catalog', 'plant_catalog_name_category_unique', {
    unique: ['name', 'category'],
  });

  // ─── Garden Plots ────────────────────────────────────────────────────
  // Fixed 6x6 grid. 36 rows created per user on signup.
  // CHECK constraints enforce grid bounds (0-5).
  // habit_id is nullable (empty plots) and UNIQUE (one habit per plot).
  // ON DELETE SET NULL: deleting/archiving a habit clears the plot
  // but doesn't destroy the grid slot.
  //
  // Health (0-100) enables gradual decay:
  //   - Each missed day (after 2-day grace) drops health by ~25
  //   - At health 0, growth_stage regresses one level
  //   - At seed + health 0, plant stays at seed (never empties)
  //   - Health resets to 50 after a regression

  pgm.createTable('garden_plots', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    user_id: {
      type: 'uuid',
      notNull: true,
      references: '"users"',
      onDelete: 'CASCADE',
    },
    plot_x: { type: 'integer', notNull: true },
    plot_y: { type: 'integer', notNull: true },
    habit_id: {
      type: 'uuid',
      unique: true,
      references: '"habits"',
      onDelete: 'SET NULL',
    },
    plant_catalog_id: {
      type: 'integer',
      references: '"plant_catalog"',
    },
    growth_stage: {
      type: 'growth_stage',
      notNull: true,
      default: 'empty',
    },
    health: { type: 'integer', notNull: true, default: 100 },
    planted_at: { type: 'timestamptz' },
    last_watered_at: { type: 'timestamptz' },
  });

  // Grid bounds: 0-5 for a 6x6 garden
  pgm.addConstraint('garden_plots', 'garden_plots_plot_x_check', {
    check: 'plot_x >= 0 AND plot_x <= 5',
  });
  pgm.addConstraint('garden_plots', 'garden_plots_plot_y_check', {
    check: 'plot_y >= 0 AND plot_y <= 5',
  });
  // Health bounds: 0-100
  pgm.addConstraint('garden_plots', 'garden_plots_health_check', {
    check: 'health >= 0 AND health <= 100',
  });
  // One plot per grid position per user
  pgm.addConstraint('garden_plots', 'garden_plots_user_plot_unique', {
    unique: ['user_id', 'plot_x', 'plot_y'],
  });

  pgm.createIndex('garden_plots', 'user_id');

  // ─── User Unlocks ───────────────────────────────────────────────────
  // Tracks which plants a user has earned via streaks.
  // No row = locked. Row exists = unlocked. Simple presence check.
  // UNIQUE(user_id, plant_catalog_id) prevents duplicate unlocks.

  pgm.createTable('user_unlocks', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    user_id: {
      type: 'uuid',
      notNull: true,
      references: '"users"',
      onDelete: 'CASCADE',
    },
    plant_catalog_id: {
      type: 'integer',
      notNull: true,
      references: '"plant_catalog"',
    },
    trigger_description: { type: 'text', notNull: true },
    unlocked_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('now()'),
    },
  });

  pgm.addConstraint('user_unlocks', 'user_unlocks_user_plant_unique', {
    unique: ['user_id', 'plant_catalog_id'],
  });

  pgm.createIndex('user_unlocks', 'user_id');

  // ─── Updated_at trigger ──────────────────────────────────────────────
  // Automatically update the updated_at column on every row modification
  // for tables that have it. This keeps updated_at accurate without
  // relying on application code to set it.

  pgm.sql(`
    CREATE OR REPLACE FUNCTION trigger_set_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = now();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);

  pgm.sql(`
    CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
  `);

  pgm.sql(`
    CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON habits
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
  `);
};

/** @param pgm {import('node-pg-migrate').MigrationBuilder} */
exports.down = (pgm) => {
  // Drop in reverse dependency order
  pgm.sql('DROP TRIGGER IF EXISTS set_updated_at ON habits;');
  pgm.sql('DROP TRIGGER IF EXISTS set_updated_at ON users;');
  pgm.sql('DROP FUNCTION IF EXISTS trigger_set_updated_at();');

  pgm.dropTable('user_unlocks');
  pgm.dropTable('garden_plots');
  pgm.dropTable('plant_catalog');
  pgm.dropTable('habit_logs');
  pgm.dropTable('habits');
  pgm.dropTable('users');

  pgm.dropType('growth_stage');
  pgm.dropType('rarity');
  pgm.dropType('category');
};
