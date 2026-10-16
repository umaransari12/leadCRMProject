import React, { useState } from 'react'
import { Link, useNavigate } from "react-router-dom"
import dashboard from "../../images/dashboard.png"
import logo from "../../images/logo.svg"
import "./signinSec.scss"
import api from '../../api'

const SigninSec = () => {
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await api.post('/api/auth/login', {
                email,
                password
            });

            if (response.data.success) {
                // Securely store the JWT Token and User info inside localStorage
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('user', JSON.stringify(response.data.user));

                navigate("/dashboard");
            }
        } catch (err) {
            setError(
                err.response
                    ? err.response.data?.message || 'Login failed. Please try again.'
                    : 'Could not reach the server. Check your connection and try again.'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="signin_sec">
            <div className="container_fluid">
                <div className="signin_inr">
                    <div className="row">
                        <div className="col_img_otr">
                            <div className="col_img_inr">
                                <img src={dashboard} alt="img" className='img' />
                            </div>
                        </div>
                        <div className="col_signin_otr">
                            <div className="col_signin_inr">
                                <div className="logo_otr">
                                    <img src={logo} alt="logo" className='logo' />
                                </div>
                                <h1 className="heading_h1 heading">Welcome Back!</h1>
                                <p className="heading_l desc">Sign in to your account and continue</p>
                                
                                {error && <div style={{ color: 'red', marginBottom: '15px', fontSize: '14px', fontWeight: 'bold' }}>{error}</div>}
                                <form className="form_otr" onSubmit={handleLogin}>
                                    <div className="input_otr">
                                        <label className='heading_l text'>Email</label>
                                        <input 
                                            type="email" 
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className='input' 
                                            placeholder='you@example.com'
                                            required
                                        />
                                    </div>
                                    <div className="input_otr">
                                        <div className="password">
                                            <label className='heading_l text'>Password</label>
                                        </div>
                                        <input 
                                            type="password" 
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className='input' 
                                            placeholder='Enter your password'
                                            required
                                        />
                                    </div>
                                    <button type="submit" className='primary_btn btn' disabled={loading}>
                                        {loading ? 'Signing In...' : 'Sign In'}
                                    </button>
                                </form>
                                <p className="heading_l signup">Don't have an account? <Link to="/signup" className='link'>Sign up</Link></p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default SigninSec