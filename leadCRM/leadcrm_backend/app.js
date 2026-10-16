const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { getJwtSecret, getAllowedOrigins } = require('./config');
const { connectDb } = require('./db');

getJwtSecret(); // fail fast if the JWT secret is missing

const app = express();

const allowedOrigins = getAllowedOrigins();
app.use(cors({
    origin: (origin, callback) => {
        // No Origin header = same-origin or non-browser request; otherwise it must be in the allow-list.
        if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
        return callback(null, false);
    }
}));
app.use(express.json({ limit: '100kb' }));

app.get('/', (req, res) => {
    res.send('LeadCRM Backend Server is running perfectly!');
});

// Reports state only; does not open a database connection.
app.get('/api/health', (req, res) => {
    res.json({ success: true, status: 'ok', database: mongoose.connection.readyState === 1 ? 'connected' : 'not connected yet' });
});

// Every other API route needs the database.
app.use('/api', async (req, res, next) => {
    try {
        await connectDb();
        next();
    } catch (err) {
        console.error('Database connection error:', err.message);
        res.status(503).json({ success: false, message: 'Database unavailable' });
    }
});

app.use('/api/leads', require('./routes/leadRoutes'));
app.use('/api/auth', require('./routes/authRoutes'));

app.use('/api', (req, res) => {
    res.status(404).json({ success: false, message: 'Not found' });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
    const status = err.status || err.statusCode;
    if (status >= 400 && status < 500) {
        return res.status(status).json({ success: false, message: status === 413 ? 'Request body too large' : 'Invalid request' });
    }
    console.error('Unhandled error:', err);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
});

module.exports = app;
