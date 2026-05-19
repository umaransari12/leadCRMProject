const User = require('../models/user');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const generateToken = (id) => {
    
    const secretKey = String(process.env.JWT_SECRET || 'leadcrm_secret_key_2026');
    return jwt.sign({ id }, secretKey, {
        expiresIn: '30d'
    });
};

exports.register = async (req, res) => {
    try {
        
        const { name, email, phone, password } = req.body;

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ success: false, message: 'User already exists' });
        }

        const usernameStr = email ? email.split('@')[0] + Math.floor(100 + Math.random() * 900) : null;

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
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

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
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            
            const secretKey = String(process.env.JWT_SECRET || 'leadcrm_secret_key_2026');
            const decoded = jwt.verify(token, secretKey);
            
            req.user = await User.findById(decoded.id).select('-password');
            if (!req.user) {
                return res.status(401).json({ success: false, message: 'User not found' });
            }
            return next();
        } catch (error) {
            console.error("Backend Protect Middleware Error:", error.message);
            return res.status(401).json({ 
                success: false, 
                message: 'Not authorized, token failed', 
                errorDetails: error.message 
            });
        }
    }

    if (!token) {
        return res.status(401).json({ success: false, message: 'Not authorized, no token' });
    }
};