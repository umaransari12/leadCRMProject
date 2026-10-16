const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a name']
    },
    email: {
        type: String,
        required: [true, 'Please add an email'],
        unique: true,
        trim: true,
        lowercase: true
    },
    // Accounts created through Google sign-in have no phone number until the user adds one in Settings.
    phone: {
        type: String,
        required: [function () { return !this.googleId; }, 'Please add a phone number'],
        default: ''
    },
    username: {
        type: String,
        required: false,
        default: ''
    },
    // Set when the account was created with, or linked to, a Google account (the Google "sub" identifier).
    googleId: {
        type: String,
        index: true,
        sparse: true
    },
    password: {
        type: String,
        required: [true, 'Please add a password'],
        select: false
    }
}, {
    timestamps: true
});

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

module.exports = mongoose.model('User', userSchema);
