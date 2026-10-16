// Central place for required configuration. No secret has a built-in fallback value.
require('dotenv').config();

const getJwtSecret = () => {
    const secret = process.env.JWT_SECRET;
    if (!secret || secret.length < 32) {
        throw new Error('JWT_SECRET must be set (environment variable) to a random string of at least 32 characters');
    }
    return secret;
};

// Origins allowed to call the API from a browser on a different origin.
// Production on Vercel serves the frontend and API from the same origin, so no CORS origin is needed there.
const getAllowedOrigins = () => {
    const configured = (process.env.CLIENT_URL || '')
        .split(',')
        .map((o) => o.trim())
        .filter(Boolean);
    if (process.env.NODE_ENV !== 'production') configured.push('http://localhost:3000');
    return configured;
};

// Google OAuth web client ID (public identifier, not a secret). Google sign-in stays disabled while this is unset.
const getGoogleClientId = () => (process.env.GOOGLE_CLIENT_ID || '').trim();

module.exports = { getJwtSecret, getAllowedOrigins, getGoogleClientId };
