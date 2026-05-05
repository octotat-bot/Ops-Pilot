/**
 * seedUsers.js — Creates default admin, manager, and employee accounts.
 * Run with: node src/scripts/seedUsers.js
 */

require('dotenv').config({ path: `${__dirname}/../../.env` });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true, lowercase: true },
    password: { type: String, select: false },
    role: { type: String, enum: ['employee', 'manager', 'admin'], default: 'employee' },
    status: { type: String, default: 'active' },
    manager: { type: mongoose.Schema.ObjectId, ref: 'User' }
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', userSchema);

const SEED_USERS = [
    { name: 'Admin User',    email: 'admin@gmail.com',    password: 'admin123',    role: 'admin' },
    { name: 'Manager User',  email: 'manager@gmail.com',  password: 'manager123',  role: 'manager' },
    { name: 'Employee User', email: 'employee@gmail.com', password: 'employee123', role: 'employee' },
];

const run = async () => {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB:', mongoose.connection.name, '\n');

    for (const u of SEED_USERS) {
        const hashed = await bcrypt.hash(u.password, 12);
        await User.findOneAndUpdate(
            { email: u.email },
            { name: u.name, password: hashed, role: u.role, status: 'active' },
            { upsert: true, new: true }
        );
        console.log(`✅ Created ${u.role.padEnd(8)} → ${u.email}  /  password: ${u.password}`);
    }

    console.log('\n🎉 Done! Use the credentials above to log in.');
    process.exit(0);
};

run().catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
});
