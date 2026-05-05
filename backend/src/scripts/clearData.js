/**
 * clearData.js — Wipes all collections in the OpsPilot database.
 * Run with: node src/scripts/clearData.js
 */

require('dotenv').config({ path: `${__dirname}/../../.env` });
const mongoose = require('mongoose');

const COLLECTIONS = [
    'users',
    'requests',
    'requeststages',
    'templates',
    'templateversions',
    'delegations',
    'activities',
    'notifications',
];

const run = async () => {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB:', mongoose.connection.name);

    for (const col of COLLECTIONS) {
        try {
            const result = await mongoose.connection.collection(col).deleteMany({});
            console.log(`🗑️  Cleared "${col}" — ${result.deletedCount} documents removed`);
        } catch (err) {
            console.log(`⚠️  Skipped "${col}" (may not exist): ${err.message}`);
        }
    }

    console.log('\n✅ Database wiped. Ready for a fresh start.');
    process.exit(0);
};

run().catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
});
