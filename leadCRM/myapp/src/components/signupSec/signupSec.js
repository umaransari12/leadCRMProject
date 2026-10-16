import React, { useState } from 'react'
import { Link, useNavigate } from "react-router-dom"
import AuthLayout from '../authLayout/authLayout'
import PasswordInput from '../passwordInput/passwordInput'
import GoogleAuthButton from '../googleAuthButton/googleAuthButton'
import api from '../../api'
import { saveSession, apiErrorMessage } from '../../session'

const SignupSec = () => {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        username: '',
        password: '',
        confirmPassword: ''
    });
    const [agreed, setAgreed] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [touchedConfirm, setTouchedConfirm] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const passwordTooShort = formData.password.length > 0 && formData.password.length < 8;
    const passwordsMismatch = touchedConfirm && formData.confirmPassword.length > 0 && formData.password !== formData.confirmPassword;

    const finishSignUp = (data) => {
        // The API signs the new user in; go straight to the dashboard.
        saveSession(data);
        navigate('/dashboard');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.password.length < 8) {
            setError('Password must be at least 8 characters.');
            return;
        }
        if (formData.password !== formData.confirmPassword) {
            setTouchedConfirm(true);
            setError('Passwords do not match.');
            return;
        }

        setLoading(true);
        try {
            const response = await api.post('/api/auth/register', {
                name: formData.name.trim(),
                email: formData.email.trim(),
                phone: formData.phone.trim(),
                username: formData.username.trim(),
                password: formData.password
            });

            if (response.data.success) {
                finishSignUp(response.data);
                return;
            }
            setError('Registration failed. Please try again.');
        } catch (err) {
            setError(apiErrorMessage(err, 'Registration failed. Please try again.'));
        }
        setLoading(false);
    };

    const handleGoogle = async (credential) => {
        setError('');
        setLoading(true);
        try {
            const response = await api.post('/api/auth/google', { credential });
            if (response.data.success) {
                finishSignUp(response.data);
                return;
            }
            setError('Google sign-up failed. Please try again.');
        } catch (err) {
            setError(apiErrorMessage(err, 'Google sign-up failed. Please try again.'));
        }
        setLoading(false);
    };

    return (
        <AuthLayout
            pageTitle="Create account"
            title="Create your account"
            subtitle="Fill in the details below to get started"
            footer={<>Already have an account? <Link to="/">Sign in</Link></>}
        >
            {error && <div className="notice error" role="alert" style={{ marginTop: 20, marginBottom: 0 }}>{error}</div>}

            <form className="auth_form" onSubmit={handleSubmit}>
                <div className="field_row">
                    <div className="field">
                        <label className="heading_l" htmlFor="signup_name">Full name</label>
                        <input id="signup_name" type="text" name="name" value={formData.name} onChange={handleChange}
                            placeholder="Your full name" autoComplete="name" maxLength={100} required />
                    </div>
                    <div className="field">
                        <label className="heading_l" htmlFor="signup_email">Email</label>
                        <input id="signup_email" type="email" name="email" value={formData.email} onChange={handleChange}
                            placeholder="you@example.com" autoComplete="email" maxLength={254} required />
                    </div>
                </div>

                <div className="field_row">
                    <div className="field">
                        <label className="heading_l" htmlFor="signup_phone">Phone number</label>
                        <input id="signup_phone" type="tel" name="phone" value={formData.phone} onChange={handleChange}
                            placeholder="Your phone number" autoComplete="tel" maxLength={30} required />
                    </div>
                    <div className="field">
                        <label className="heading_l" htmlFor="signup_username">Username (optional)</label>
                        <input id="signup_username" type="text" name="username" value={formData.username} onChange={handleChange}
                            placeholder="Choose a username" autoComplete="off" maxLength={30} pattern="[A-Za-z0-9._\-]{2,30}"
                            title="2 to 30 letters, numbers, dots, underscores or dashes" />
                    </div>
                </div>

                <PasswordInput
                    id="signup_password"
                    name="password"
                    label="Password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Create a password"
                    autoComplete="new-password"
                    minLength={8}
                    maxLength={72}
                    required
                    hint="At least 8 characters."
                    error={passwordTooShort ? 'Password is too short.' : ''}
                />
                <PasswordInput
                    id="signup_confirm"
                    name="confirmPassword"
                    label="Confirm password"
                    value={formData.confirmPassword}
                    onChange={(e) => { handleChange(e); setTouchedConfirm(true); }}
                    placeholder="Re-enter your password"
                    autoComplete="new-password"
                    maxLength={72}
                    required
                    error={passwordsMismatch ? 'Passwords do not match.' : ''}
                />

                <label className="heading_l terms" htmlFor="signup_terms">
                    <input id="signup_terms" type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} required />
                    <span>I agree to the Terms of Service and Privacy Policy</span>
                </label>

                <button type="submit" className="primary_btn submit_btn" disabled={loading}>
                    {loading ? 'Creating account...' : 'Create Account'}
                </button>
            </form>

            <p className="heading_l divider">OR</p>
            <GoogleAuthButton onCredential={handleGoogle} onError={setError} text="signup_with" disabled={loading} />
        </AuthLayout>
    )
}

export default SignupSec
