const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const errorMiddleware = require('./middlewares/errorMiddleware');  // Import the error handling middleware

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Default Route
app.get('/', (req, res) => {
    res.send('Server is running successfully! 🚀');
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/gallery', require('./routes/gallery'));

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ MongoDB Connected Successfully'))
    .catch(err => console.error('❌ MongoDB Connection Failed:', err));

// Error Middleware (This should be placed after all routes and other middleware)
app.use(errorMiddleware);  // This handles errors and sends the response

// Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
