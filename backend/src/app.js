const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');

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

// CORS Configuration - Allow production and all Vercel preview deployments
const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        // Allow production frontend
        const allowedOrigins = [
            'https://ops-pilot-two.vercel.app',
            process.env.FRONTEND_URL
        ];

        // Allow all Vercel preview deployments (*.vercel.app)
        if (origin.includes('vercel.app') || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Security HTTP headers
app.use(helmet());

if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));

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
