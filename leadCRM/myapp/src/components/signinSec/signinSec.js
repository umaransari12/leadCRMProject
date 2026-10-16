import React, { useState } from 'react'
import { Link, useNavigate } from "react-router-dom"
import AuthLayout from '../authLayout/authLayout'
import PasswordInput from '../passwordInput/passwordInput'
import GoogleAuthButton from '../googleAuthButton/googleAuthButton'
import api from '../../api'
import { saveSession, apiErrorMessage } from '../../session'

const SigninSec = () => {
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const finishSignIn = (data) => {
        saveSession(data);
        navigate("/dashboard");
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await api.post('/api/auth/login', { email: email.trim(), password });
            if (response.data.success) {
                finishSignIn(response.data);
                return;
            }
            setError('Sign in failed. Please try again.');
        } catch (err) {
            setError(apiErrorMessage(err, 'Sign in failed. Please try again.'));
        }
        setLoading(false);
    };

    const handleGoogle = async (credential) => {
        setError('');
        setLoading(true);
        try {
            const response = await api.post('/api/auth/google', { credential });
            if (response.data.success) {
                finishSignIn(response.data);
                return;
            }
            setError('Google sign-in failed. Please try again.');
        } catch (err) {
            setError(apiErrorMessage(err, 'Google sign-in failed. Please try again.'));
        }
        setLoading(false);
    };

    return (
        <AuthLayout
            pageTitle="Sign in"
            title="Welcome back!"
            subtitle="Sign in to your account and continue"
            footer={<>Don't have an account? <Link to="/signup">Sign up</Link></>}
        >
            {error && <div className="notice error" role="alert" style={{ marginTop: 20, marginBottom: 0 }}>{error}</div>}

            <form className="auth_form" onSubmit={handleLogin} noValidate={false}>
                <div className="field">
                    <label className="heading_l" htmlFor="signin_email">Email</label>
                    <input
                        id="signin_email"
                        type="email"
                        name="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        autoComplete="email"
                        required
                    />
                </div>
                <PasswordInput
                    id="signin_password"
                    name="password"
                    label="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    required
                />
                <button type="submit" className="primary_btn submit_btn" disabled={loading}>
                    {loading ? 'Signing in...' : 'Sign In'}
                </button>
            </form>

            <p className="heading_l divider">OR</p>
            <GoogleAuthButton onCredential={handleGoogle} onError={setError} text="signin_with" disabled={loading} />
        </AuthLayout>
    )
}

export default SigninSec
