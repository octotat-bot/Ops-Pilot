const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

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

// Data sanitization against NoSQL injection attacks
// Custom middleware: express-mongo-sanitize is incompatible with Express 5
// because req.query is a read-only getter in Express 5.
// We sanitize only req.body and req.params which are safe to mutate.
const sanitizeValue = (obj) => {
    if (obj === null || typeof obj !== 'object') return;
    for (const key of Object.keys(obj)) {
        if (key.startsWith('$') || key.includes('.')) {
            delete obj[key];
        } else {
            sanitizeValue(obj[key]);
        }
    }
};

app.use((req, res, next) => {
    if (req.body) sanitizeValue(req.body);
    if (req.params) sanitizeValue(req.params);
    next();
});

// Rate limiting - prevent brute-force on auth routes
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // Limit each IP to 20 auth requests per window
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        status: 'fail',
        message: 'Too many login attempts from this IP, please try again after 15 minutes.'
    }
});

// General API rate limiter (loose - prevents scraping/abuse)
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        status: 'fail',
        message: 'Too many requests from this IP, please try again later.'
    }
});

// Health Check
app.get('/', (req, res) => {
    res.status(200).json({ status: 'success', message: 'OpsPilot API is running!' });
});

// Apply rate limiters
app.use('/api/v1/auth', authLimiter, authRouter);
app.use('/api/v1/', apiLimiter);

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
