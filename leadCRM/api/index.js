// Vercel serverless entry: serves the Express app from leadcrm_backend for every /api/* request.
// (Locally, the backend is started with `npm start` in leadcrm_backend, which uses server.js instead.)
module.exports = require('../leadcrm_backend/app');
