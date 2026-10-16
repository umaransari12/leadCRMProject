const User = require('../models/user');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { getJwtSecret } = require('../config');

const generateToken = (id) => {
    return jwt.sign({ id }, getJwtSecret(), {
        expiresIn: '30d'
    });
};

// Only plain strings are accepted from the request body (blocks operator objects like { "$ne": null }).
const asString = (value) => (typeof value === 'string' ? value.trim() : '');

exports.register = async (req, res) => {
    try {
        const body = req.body || {};
        const name = asString(body.name);
        const email = asString(body.email).toLowerCase();
        const phone = asString(body.phone);
        const password = typeof body.password === 'string' ? body.password : '';

        if (!name || !email || !phone || !password) {
            return res.status(400).json({ success: false, message: 'Name, email, phone and password are required' });
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({ success: false, message: 'Please enter a valid email address' });
        }
        if (password.length < 8 || password.length > 72) {
            return res.status(400).json({ success: false, message: 'Password must be between 8 and 72 characters' });
        }

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ success: false, message: 'User already exists' });
        }

        // Use the username the user chose (letters, numbers, . _ -), otherwise generate one from the email.
        const requestedUsername = asString(body.username);
        const usernameStr = /^[A-Za-z0-9._-]{2,30}$/.test(requestedUsername)
            ? requestedUsername
            : email.split('@')[0] + Math.floor(100 + Math.random() * 900);

        const user = await User.create({
            name,
            email,
            phone,
            username: usernameStr,
            password
        });

        res.status(201).json({
            success: true,
            token: generateToken(user._id),
            user: { id: user._id, name: user.name, email: user.email }
        });
    } catch (error) {
        if (error && error.code === 11000) {
            return res.status(400).json({ success: false, message: 'User already exists' });
        }
        console.error('Register error:', error);
        res.status(500).json({ success: false, message: 'Registration failed' });
    }
};

exports.login = async (req, res) => {
    try {
        const body = req.body || {};
        const email = asString(body.email).toLowerCase();
        const password = typeof body.password === 'string' ? body.password : '';
        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and password are required' });
        }

        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        res.json({
            success: true,
            token: generateToken(user._id),
            user: { id: user._id, name: user.name, email: user.email }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Login failed' });
    }
};

exports.protect = async (req, res, next) => {
    const header = req.headers.authorization || '';
    if (!header.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: 'Not authorized, no token' });
    }

    try {
        const token = header.split(' ')[1];
        const decoded = jwt.verify(token, getJwtSecret(), { algorithms: ['HS256'] });

        const user = await User.findById(decoded.id).select('-password');
        if (!user) {
            return res.status(401).json({ success: false, message: 'User not found' });
        }
        req.user = user;
        return next();
    } catch (error) {
        return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
    }
};
