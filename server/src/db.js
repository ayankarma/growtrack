/**
 * Database connection pool.
 *
 * Uses the `@neondatabase/serverless` library to connect over HTTP/WebSockets
 * instead of the standard `pg` TCP connection. This bypasses outbound port 5432 
 * blocks which are common on corporate/school networks.
 *
 * Usage in other modules:
 *   const { query, pool } = require('./db');
 *   const result = await query('SELECT * FROM users WHERE id = $1', [userId]);
 */
const { Pool, neonConfig } = require('@neondatabase/serverless');
const ws = require('ws');
require('dotenv').config();

// Tell Neon to use the standard ws library for WebSocket connections
neonConfig.webSocketConstructor = ws;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // The serverless driver handles SSL automatically, no need to manually set rejectUnauthorized
});

// Log pool errors (don't crash the server on idle client errors)
pool.on('error', (err) => {
  console.error('Unexpected pool error on idle client', err);
});

/**
 * Convenience wrapper: runs a parameterized query and returns the result.
 * All queries MUST use parameterized values ($1, $2, ...) — never concatenate
 * user input into the SQL string. This prevents SQL injection.
 *
 * @param {string} text - SQL query with $1, $2... placeholders
 * @param {Array} params - Values for placeholders
 * @returns {Promise<import('@neondatabase/serverless').QueryResult>}
 */
const query = (text, params) => pool.query(text, params);

module.exports = { pool, query };
