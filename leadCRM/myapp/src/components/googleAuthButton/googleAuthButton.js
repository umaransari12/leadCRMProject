import React from 'react'
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google'
import "./googleAuthButton.scss"

// Google sign-in / sign-up. The button only works when REACT_APP_GOOGLE_CLIENT_ID is set at build time; the ID token
// Google returns is sent to POST /api/auth/google, where the server verifies it before issuing a session.
// Without a client ID the button is shown disabled and explains why (no fake success).
const clientId = (process.env.REACT_APP_GOOGLE_CLIENT_ID || '').trim();

export const isGoogleConfigured = Boolean(clientId);

const GoogleAuthButton = ({ onCredential, onError, text = 'continue_with', disabled = false }) => {
    if (!isGoogleConfigured) {
        return (
            <div className="google_disabled" title="Google sign-in has not been configured for this site yet">
                <button type="button" disabled className="google_btn_disabled heading_l">
                    Continue with Google (not configured)
                </button>
            </div>
        );
    }

    return (
        <GoogleOAuthProvider clientId={clientId}>
            <div className={`google_slot${disabled ? ' is_disabled' : ''}`}>
                <GoogleLogin
                    onSuccess={(response) => response.credential && onCredential(response.credential)}
                    onError={() => onError && onError('Google sign-in was cancelled or failed. Please try again.')}
                    text={text}
                    shape="rectangular"
                    width="320"
                />
            </div>
        </GoogleOAuthProvider>
    );
};

export default GoogleAuthButton;
