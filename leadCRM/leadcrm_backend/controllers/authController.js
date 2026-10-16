const crypto = require('crypto');
const User = require('../models/user');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { getJwtSecret, getGoogleClientId } = require('../config');
const { verifyGoogleIdToken, GoogleAuthError } = require('../googleAuth');

const generateToken = (id) => {
    return jwt.sign({ id }, getJwtSecret(), {
        expiresIn: '30d'
    });
};

// Only plain strings are accepted from the request body (blocks operator objects like { "$ne": null }).
const asString = (value) => (typeof value === 'string' ? value.trim() : '');

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_PATTERN = /^[A-Za-z0-9._-]{2,30}$/;

const publicUser = (user) => ({
    id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone || '',
    username: user.username || '',
    googleLinked: Boolean(user.googleId)
});

const validPassword = (password) => password.length >= 8 && password.length <= 72;

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
        if (name.length > 100 || phone.length > 30 || email.length > 254) {
            return res.status(400).json({ success: false, message: 'One of the fields is too long' });
        }
        if (!EMAIL_PATTERN.test(email)) {
            return res.status(400).json({ success: false, message: 'Please enter a valid email address' });
        }
        if (!validPassword(password)) {
            return res.status(400).json({ success: false, message: 'Password must be between 8 and 72 characters' });
        }

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ success: false, message: 'User already exists' });
        }

        // Use the username the user chose (letters, numbers, . _ -), otherwise generate one from the email.
        const requestedUsername = asString(body.username);
        const usernameStr = USERNAME_PATTERN.test(requestedUsername)
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
            user: publicUser(user)
        });
    } catch (error) {
        if (error && error.code === 11000) {
            return res.status(400).json({ success: false, message: 'User already exists' });
        }
        console.error('Register error:', error.message);
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
            user: publicUser(user)
        });
    } catch (error) {
        console.error('Login error:', error.message);
        res.status(500).json({ success: false, message: 'Login failed' });
    }
};

// Google sign-in / sign-up. The browser sends the ID token ("credential") from Google Identity Services; it is
// verified server-side and checked against GOOGLE_CLIENT_ID before any account is created or a token is issued.
exports.googleLogin = async (req, res) => {
    try {
        const credential = (req.body || {}).credential;
        const google = await verifyGoogleIdToken(credential, { clientId: getGoogleClientId() });

        let user = await User.findOne({ email: google.email });
        if (user) {
            if (user.googleId && user.googleId !== google.googleId) {
                return res.status(401).json({ success: false, message: 'This email is linked to a different Google account' });
            }
            if (!user.googleId) {
                // Verified Google email matches an existing account: link it.
                user.googleId = google.googleId;
                await user.save();
            }
        } else {
            // No password is ever known for Google-created accounts; store a random unusable one.
            user = await User.create({
                name: google.name,
                email: google.email,
                username: google.email.split('@')[0],
                googleId: google.googleId,
                password: crypto.randomBytes(32).toString('hex')
            });
        }

        res.json({ success: true, token: generateToken(user._id), user: publicUser(user) });
    } catch (error) {
        if (error instanceof GoogleAuthError) {
            return res.status(error.status).json({ success: false, message: error.message });
        }
        console.error('Google login error:', error.message);
        res.status(500).json({ success: false, message: 'Google sign-in failed' });
    }
};

exports.getMe = async (req, res) => {
    res.json({ success: true, user: publicUser(req.user) });
};

exports.updateMe = async (req, res) => {
    try {
        const body = req.body || {};
        const name = asString(body.name);
        const phone = asString(body.phone);
        const username = asString(body.username);

        if (!name) return res.status(400).json({ success: false, message: 'Name is required' });
        if (name.length > 100 || phone.length > 30) {
            return res.status(400).json({ success: false, message: 'One of the fields is too long' });
        }
        if (username && !USERNAME_PATTERN.test(username)) {
            return res.status(400).json({ success: false, message: 'Username may use letters, numbers, . _ - (2 to 30 characters)' });
        }

        const user = await User.findById(req.user._id);
        user.name = name;
        user.phone = phone;
        if (username) user.username = username;
        await user.save();

        res.json({ success: true, message: 'Profile updated', user: publicUser(user) });
    } catch (error) {
        console.error('Profile update error:', error.message);
        res.status(500).json({ success: false, message: 'Could not update profile' });
    }
};

exports.changePassword = async (req, res) => {
    try {
        const body = req.body || {};
        const currentPassword = typeof body.currentPassword === 'string' ? body.currentPassword : '';
        const newPassword = typeof body.newPassword === 'string' ? body.newPassword : '';

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ success: false, message: 'Current and new password are required' });
        }
        if (!validPassword(newPassword)) {
            return res.status(400).json({ success: false, message: 'New password must be between 8 and 72 characters' });
        }

        const user = await User.findById(req.user._id).select('+password');
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Current password is incorrect' });
        }
        if (currentPassword === newPassword) {
            return res.status(400).json({ success: false, message: 'New password must be different from the current one' });
        }

        user.password = newPassword; // hashed by the model's pre-save hook
        await user.save();

        res.json({ success: true, message: 'Password changed' });
    } catch (error) {
        console.error('Password change error:', error.message);
        res.status(500).json({ success: false, message: 'Could not change password' });
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
