const app = require('../src/app');
const connectDB = require('../src/config/db');

// Connect to database (Serverless requires connection inside the handler or reused)
connectDB();

// Export the app for Vercel Serverless
module.exports = app;
