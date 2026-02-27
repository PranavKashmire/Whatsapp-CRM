const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');

let dbPromise;

async function getDb() {
  if (!dbPromise) {
    dbPromise = open({
      filename: path.join(__dirname, 'database.sqlite'),
      driver: sqlite3.Database
    });
  }
  return dbPromise;
}

module.exports = {
  // Polyfill db.query to return { rows } just like pg does
  query: async (text, params = []) => {
    const db = await getDb();
    
    // Determine if it's a SELECT or a mutation
    if (text.trim().toUpperCase().startsWith('SELECT')) {
      const rows = await db.all(text, params);
      return { rows };
    } else {
      // INSERT, UPDATE, DELETE
      const result = await db.run(text, params);
      
      // If there's a RETURNING clause (common in the existing code), SQLite via sqlite3
      // doesn't natively return the row via db.run.
      // Easiest polyfill: if returning, just do a follow-up SELECT or assume 
      // the caller queries by lastID if needed.
      // Note: For true RETURNING support in SQLite >= 3.35, db.all is required.
      if (text.includes('RETURNING *')) {
           const modifiedText = text.replace(/RETURNING \*/g, '');
           const runRes = await db.run(modifiedText, params);
           if (runRes.lastID) {
              const rows = await db.all(`SELECT * FROM ${text.match(/INTO (\w+)|UPDATE (\w+)/i)[1] || text.match(/INTO (\w+)|UPDATE (\w+)/i)[2]} WHERE id = ?`, [runRes.lastID]);
              return { rows };
           }
           return { rows: [] };
      }
      
      return { rows: [], lastID: result.lastID, changes: result.changes };
    }
  },
  getDb
};
