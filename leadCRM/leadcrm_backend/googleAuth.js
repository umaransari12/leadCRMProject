// Server-side verification of a Google Sign-In ID token (the "credential" returned by Google Identity Services).
// The token is verified by Google's tokeninfo endpoint (signature, expiry) and then checked here against OUR client ID,
// so a token minted for a different app is rejected. Never trust a token the browser sends without this check.
const TOKENINFO_URL = 'https://oauth2.googleapis.com/tokeninfo';
const VALID_ISSUERS = ['accounts.google.com', 'https://accounts.google.com'];

class GoogleAuthError extends Error {
    constructor(message, status = 401) {
        super(message);
        this.name = 'GoogleAuthError';
        this.status = status;
    }
}

const verifyGoogleIdToken = async (idToken, { clientId, fetchImpl = fetch } = {}) => {
    if (!clientId) throw new GoogleAuthError('Google sign-in is not configured', 503);
    if (typeof idToken !== 'string' || idToken.length < 20 || idToken.length > 4096) {
        throw new GoogleAuthError('Invalid Google credential');
    }

    let response;
    try {
        response = await fetchImpl(`${TOKENINFO_URL}?id_token=${encodeURIComponent(idToken)}`);
    } catch (error) {
        throw new GoogleAuthError('Could not reach Google to verify the credential', 502);
    }
    if (!response.ok) throw new GoogleAuthError('Invalid Google credential');

    const info = await response.json();
    if (info.aud !== clientId) throw new GoogleAuthError('Google credential was issued for a different application');
    if (!VALID_ISSUERS.includes(info.iss)) throw new GoogleAuthError('Invalid Google credential issuer');
    if (!info.exp || Number(info.exp) * 1000 < Date.now()) throw new GoogleAuthError('Google credential has expired');
    if (String(info.email_verified) !== 'true') throw new GoogleAuthError('Your Google email address is not verified');
    if (!info.email || !info.sub) throw new GoogleAuthError('Google credential is missing account details');

    return {
        googleId: String(info.sub),
        email: String(info.email).toLowerCase(),
        name: String(info.name || info.email.split('@')[0])
    };
};

module.exports = { verifyGoogleIdToken, GoogleAuthError };
