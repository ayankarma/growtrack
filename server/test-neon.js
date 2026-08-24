require('dotenv').config();
const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.DATABASE_URL);

async function run() {
  try {
    const result = await sql.query('SELECT 1 as num, $1 as param', ['hello']);
    console.log('Result:', result);
    console.log('Is array?', Array.isArray(result));
    console.log('Has rows?', !!result.rows);
  } catch (err) {
    console.error(err);
  }
}
run();
