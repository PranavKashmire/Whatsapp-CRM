require('dotenv').config();
const db = require('./index');

const callers = [
  { name: 'Arjun Sharma', role: 'Senior Caller', languages: ['Hindi', 'English'], assigned_states: ['Maharashtra', 'Rajasthan', 'Delhi'], daily_limit: 60 },
  { name: 'Priya Nair', role: 'Caller', languages: ['Malayalam', 'English', 'Tamil'], assigned_states: ['Kerala', 'Tamil Nadu'], daily_limit: 50 },
  { name: 'Rohan Desai', role: 'Senior Caller', languages: ['Marathi', 'Hindi', 'English'], assigned_states: ['Maharashtra', 'Goa'], daily_limit: 60 },
  { name: 'Sneha Reddy', role: 'Caller', languages: ['Telugu', 'Hindi', 'English'], assigned_states: ['Andhra Pradesh', 'Telangana'], daily_limit: 45 },
  { name: 'Kiran Kumar', role: 'Junior Caller', languages: ['Kannada', 'Hindi', 'English'], assigned_states: ['Karnataka'], daily_limit: 40 },
];

const leads = [
  { name: 'Rahul Mehta', phone: '9876543210', source: 'Meta Forms', city: 'Mumbai', state: 'Maharashtra', notes: 'Interested in premium plan' },
  { name: 'Anita Pillai', phone: '9123456789', source: 'Reels', city: 'Kochi', state: 'Kerala', notes: 'Asked about pricing' },
  { name: 'Vikram Singh', phone: '9988776655', source: 'Meta Forms', city: 'Jaipur', state: 'Rajasthan', notes: '' },
  { name: 'Deepa Rao', phone: '9871234560', source: 'Story', city: 'Hyderabad', state: 'Telangana', notes: 'Callback requested' },
  { name: 'Amit Patil', phone: '9765432109', source: 'Reels', city: 'Pune', state: 'Maharashtra', notes: '' },
  { name: 'Kavitha Menon', phone: '9654321098', source: 'Meta Forms', city: 'Bangalore', state: 'Karnataka', notes: 'Saw product demo' },
  { name: 'Suresh Iyer', phone: '9543210987', source: 'Story', city: 'Chennai', state: 'Tamil Nadu', notes: '' },
  { name: 'Pooja Gupta', phone: '9432109876', source: 'Reels', city: 'Delhi', state: 'Delhi', notes: 'High priority' },
];

async function seed() {
  try {
    // Insert callers
    for (const c of callers) {
      // Need a subquery to avoid inserting duplicates
      const { rows } = await db.query('SELECT id FROM callers WHERE name = ?', [c.name]);
      if (rows.length === 0) {
        await db.query(
          `INSERT INTO callers (name, role, languages, assigned_states, daily_limit)
           VALUES (?,?,?,?,?)`,
          [c.name, c.role, JSON.stringify(c.languages), JSON.stringify(c.assigned_states), c.daily_limit]
        );
      }
    }
    console.log('✅ Seeded callers');

    // Get caller IDs for assignment
    const { rows: callerRows } = await db.query('SELECT id FROM callers ORDER BY id');

    // Insert leads with round-robin assignment for seed
    for (let i = 0; i < leads.length; i++) {
      const l = leads[i];
      const caller = callerRows[i % callerRows.length];
      const { rows } = await db.query('SELECT id FROM leads WHERE phone = ?', [l.phone]);
      if (rows.length === 0) {
        await db.query(
          `INSERT INTO leads (name, phone, timestamp, source, city, state, notes, assigned_caller_id)
           VALUES (?,?,CURRENT_TIMESTAMP,?,?,?,?,?)`,
          [l.name, l.phone, l.source, l.city, l.state, l.notes, caller.id]
        );
      }
    }
    console.log('✅ Seeded leads');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  }
}

seed();
