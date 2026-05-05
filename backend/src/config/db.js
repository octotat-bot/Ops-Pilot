const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);

        // Auto-seed a default admin if the DB has no users at all.
        // This prevents being locked out after a fresh deploy or DB wipe.
        await seedDefaultAdmin();
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

const seedDefaultAdmin = async () => {
    try {
        const User = require('../models/User');
        const count = await User.countDocuments();
        if (count > 0) return; // Users already exist — nothing to do

        const DEFAULT_EMAIL    = process.env.DEFAULT_ADMIN_EMAIL    || 'admin@opspilot.com';
        const DEFAULT_PASSWORD = process.env.DEFAULT_ADMIN_PASSWORD || 'Admin@123';

        const hashed = await bcrypt.hash(DEFAULT_PASSWORD, 12);
        await User.create({
            name: 'System Admin',
            email: DEFAULT_EMAIL,
            password: hashed,
            role: 'admin',
            status: 'active'
        });

        console.log('');
        console.log('┌─────────────────────────────────────────────┐');
        console.log('│  🚀  Default admin account created           │');
        console.log(`│  📧  Email:    ${DEFAULT_EMAIL.padEnd(29)} │`);
        console.log(`│  🔑  Password: ${DEFAULT_PASSWORD.padEnd(29)} │`);
        console.log('│  ⚠️   Change this password after first login! │');
        console.log('└─────────────────────────────────────────────┘');
        console.log('');
    } catch (err) {
        console.error('Auto-seed failed (non-fatal):', err.message);
    }
};

module.exports = connectDB;

