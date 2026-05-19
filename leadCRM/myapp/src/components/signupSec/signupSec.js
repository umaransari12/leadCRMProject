import React, { useState } from 'react'
import { useGoogleLogin } from '@react-oauth/google';
import { Link, useNavigate } from "react-router-dom"
import { UserIcon, EnvelopeSimpleIcon, PhoneIcon, LockSimpleIcon } from "@phosphor-icons/react"
import dashboard from "../../images/dashboard.png"
import google from "../../images/google.svg"
import "./signupSec.scss"
import axios from 'axios'

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

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
        console.log("Google Token Success:", tokenResponse);
        alert("Google Auth Success! Data backend par bheja ja raha hai.");
    },
    onError: () => console.log('Google Login Failed')
});

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match!');
            return;
        }

        setLoading(true);

        try {
            const response = await axios.post('http://localhost:5000/api/auth/register', {
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                username: formData.username,
                password: formData.password
            });

            if (response.data.success) {
                alert('Account created successfully! Redirecting to Sign In...');
                navigate('/'); 
            }
      } catch (err) {
            console.error("Full Frontend Error Objects:", err);
            setError(err.response?.data?.message || err.message || 'Registration failed.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="signup_sec">
            <div className="container_fluid">
                <div className="signup_inr">
                    <div className="row">
                        <div className="col_img_otr">
                            <div className="col_img_inr">
                                <img src={dashboard} alt="img" className='img' />
                            </div>
                        </div>
                        <div className="col_signup_otr">
                            <div className="col_signup_inr">
                                <p className="heading_l signin">Already have an account <Link to="/" className='link'>Sign In</Link></p>
                                <h1 className="heading_h1 heading">Create your account</h1>
                                <p className="heading_l desc">Fill in the details below to get started</p>
                                
                                {error && <div style={{ color: 'red', marginBottom: '15px', fontSize: '14px', fontWeight: 'bold' }}>{error}</div>}
                                
                                <form className="form_otr" onSubmit={handleSubmit}>
                                    <div className="signup_form">
                                        <div className="input_otr">
                                            <label className='heading_l text'>Full Name</label>
                                            <div className="input_wrapper">
                                                <UserIcon size={18} className='icon' />
                                                <input 
                                                    type="text" 
                                                    name="name"
                                                    value={formData.name}
                                                    onChange={handleChange}
                                                    className='input' 
                                                    placeholder='Enter your full name' 
                                                    required 
                                                />
                                            </div>
                                        </div>
                                        <div className="input_otr">
                                            <label className='heading_l text'>Email</label>
                                            <div className="input_wrapper">
                                                <EnvelopeSimpleIcon size={18} className="icon" />
                                                <input 
                                                    type="email" 
                                                    name="email"
                                                    value={formData.email}
                                                    onChange={handleChange}
                                                    className='input' 
                                                    placeholder='Enter your email' 
                                                    required 
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="signup_form">
                                        <div className="input_otr">
                                            <label className='heading_l text'>Phone Number</label>
                                            <div className="input_wrapper">
                                                <PhoneIcon size={18} className="icon" />
                                                <input 
                                                    type="text" 
                                                    name="phone"
                                                    value={formData.phone}
                                                    onChange={handleChange}
                                                    className='input' 
                                                    placeholder='Enter your phone number' 
                                                    required 
                                                />
                                            </div>
                                        </div>
                                        <div className="input_otr">
                                            <label className='heading_l text'>Username</label>
                                            <div className="input_wrapper">
                                                <UserIcon size={18} className='icon' />
                                                <input 
                                                    type="text" 
                                                    name="username"
                                                    value={formData.username}
                                                    onChange={handleChange}
                                                    className='input' 
                                                    placeholder='Choose a username' 
                                                    required 
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="input_otr">
                                        <label className='heading_l text'>Password</label>
                                        <div className="input_wrapper">
                                            <LockSimpleIcon size={18} className="icon" />
                                            <input 
                                                type="password" 
                                                name="password"
                                                value={formData.password}
                                                onChange={handleChange}
                                                className='input' 
                                                placeholder='Create a password' 
                                                required 
                                                minLength="6"
                                            />
                                        </div>
                                    </div>
                                    <div className="input_otr">
                                        <label className='heading_l text'>Confirm Password</label>
                                        <div className="input_wrapper">
                                            <LockSimpleIcon size={18} className="icon" />
                                            <input 
                                                type="password" 
                                                name="confirmPassword"
                                                value={formData.confirmPassword}
                                                onChange={handleChange}
                                                className='input' 
                                                placeholder='Confirm your password' 
                                                required 
                                            />
                                        </div>
                                    </div>
                                    <div className="checkbox_otr">
                                        <input type="checkbox" className='check_box' required />
                                        <label className='heading_l text'>I agree the <Link to="/" className='link'>Terms of Service</Link> and <Link to="/" className='link'>Privacy Policy</Link></label>
                                    </div>
                                    <button type="submit" className='primary_btn btn' disabled={loading}>
                                        {loading ? 'Creating Account...' : 'Create Account'}
                                    </button>
                                </form>
                                <p className="heading_l or">OR</p>
                                <div className="action_otr" onClick={googleLogin}>
                                    <img src={google} alt="icon" className='icon' />
                                    <button type="button" className='btn'>Sign up with google</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default SignupSec