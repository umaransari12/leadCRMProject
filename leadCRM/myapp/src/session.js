// Session handling: the API issues a JWT at sign-in/sign-up; it is kept in localStorage and sent by api.js.
export const saveSession = ({ token, user }) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
};

// Merges profile changes into the stored user and tells open components (e.g. the header) to re-read it.
export const USER_CHANGED_EVENT = 'leadcrm:user-changed';
export const readStoredUser = () => {
    try {
        const parsed = JSON.parse(localStorage.getItem('user') || 'null');
        return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (error) {
        return {};
    }
};
export const updateStoredUser = (changes) => {
    localStorage.setItem('user', JSON.stringify({ ...readStoredUser(), ...changes }));
    window.dispatchEvent(new Event(USER_CHANGED_EVENT));
};

export const clearSession = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
};

export const apiErrorMessage = (err, fallback) =>
    err.response
        ? err.response.data?.message || fallback
        : 'Could not reach the server. Check your connection and try again.';
