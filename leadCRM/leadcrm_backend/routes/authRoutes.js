const express = require('express');
const router = express.Router();
const { register, login, googleLogin, getMe, updateMe, changePassword, protect } = require('../controllers/authController');
const { createRateLimiter } = require('../rateLimit');

// Sign-in style endpoints are rate limited per IP to slow down password guessing.
const authLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, max: Number(process.env.AUTH_RATE_LIMIT_MAX) || 30 });

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/google', authLimiter, googleLogin);

router.get('/me', protect, getMe);
router.put('/me', protect, updateMe);
router.put('/password', authLimiter, protect, changePassword);

module.exports = router;
