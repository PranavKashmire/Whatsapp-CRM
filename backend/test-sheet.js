require('dotenv').config();
const { fetchAllRows } = require('./services/sheetsPoller');

async function test() {
    try {
        console.log('Testing Sheets API...');
        const rows = await fetchAllRows();
        console.log('Rows found:', rows.length);
        console.log(rows);
    } catch (err) {
        console.error('API Error:', err);
    }
}

test();
