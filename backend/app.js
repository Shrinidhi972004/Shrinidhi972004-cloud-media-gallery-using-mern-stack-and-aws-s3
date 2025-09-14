const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const compression = require('compression');
const errorMiddleware = require('./middlewares/errorMiddleware');
const validateEnvironment = require('./config/validateEnv');

dotenv.config();

// Validate environment variables before starting
validateEnvironment();

const app = express();

// Security middleware
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false // Disable for file uploads
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api/', limiter);

// Upload specific rate limiting
const uploadLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // limit each IP to 20 uploads per windowMs
    message: 'Too many uploads from this IP, please try again later.',
});
app.use('/api/gallery/upload', uploadLimiter);

// Logging
if (process.env.NODE_ENV !== 'production') {
    app.use(morgan('dev'));
} else {
    app.use(morgan('combined'));
}

// Compression
app.use(compression());

// Other middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:9000',
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Default Route
app.get('/', (req, res) => {
    res.send('Server is running successfully! 🚀');
});

// Health check endpoint for Docker
app.get('/health', (req, res) => {
    const healthCheck = {
        uptime: process.uptime(),
        message: 'OK',
        timestamp: Date.now(),
        environment: process.env.NODE_ENV,
        memory: process.memoryUsage(),
        database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
    };
    
    try {
        res.status(200).json(healthCheck);
    } catch (error) {
        healthCheck.message = error;
        res.status(503).json(healthCheck);
    }
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/gallery', require('./routes/gallery'));

// MongoDB Connection
// Connect to MongoDB Atlas
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ Connected to MongoDB Atlas'))
    .catch((err) => {
        console.error('❌ MongoDB Atlas Connection Failed:', err.message);
        process.exit(1);
    });

// Error Middleware (This should be placed after all routes and other middleware)
app.use(errorMiddleware);  // This handles errors and sends the response

// Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
