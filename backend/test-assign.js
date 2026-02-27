require('dotenv').config();
const { assignCaller } = require('./services/assignment');

async function test() {
    try {
        const result = await assignCaller({ state: 'Maharashtra' });
        console.log(result);
    } catch (e) {
        console.error('Assign Caller Error:', e);
    }
}
test();
