const express = require('express');
const morgan = require('morgan');
const cors = require('cors');

const AppError = require('./utils/AppError');
const globalErrorHandler = require('./middleware/errorController');

const authRouter = require('./routes/authRoutes');
const templateRouter = require('./routes/templateRoutes');
const requestRouter = require('./routes/requestRoutes');
const userRouter = require('./routes/userRoutes');
const notificationRouter = require('./routes/notificationRoutes');
const activityRouter = require('./routes/activityRoutes');
const analyticsRouter = require('./routes/analyticsRoutes');
const delegationRouter = require('./routes/delegationRoutes');

const app = express();

// CORS Configuration
const corsOptions = {
    origin: [
        process.env.FRONTEND_URL || 'https://ops-pilot-two.vercel.app',
        'https://ops-pilot-two.vercel.app'
    ],
    credentials: true,
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

app.use(express.json());

// Health Check
app.get('/', (req, res) => {
    res.status(200).json({ status: 'success', message: 'OpsPilot API is running!' });
});

app.use('/api/v1/auth', authRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/templates', templateRouter);
app.use('/api/v1/requests', requestRouter);
app.use('/api/v1/notifications', notificationRouter);
app.use('/api/v1/activity', activityRouter);
app.use('/api/v1/analytics', analyticsRouter);
app.use('/api/v1/delegations', delegationRouter);

app.use((req, res, next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
