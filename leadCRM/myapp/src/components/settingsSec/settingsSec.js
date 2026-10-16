import React, { useEffect, useState } from 'react'
import "./settingsSec.scss"
import api from '../../api'
import PasswordInput from '../passwordInput/passwordInput'
import { updateStoredUser } from '../../session'

const describeError = (err, fallback) =>
    err.response ? err.response.data?.message || fallback : 'Could not reach the server. Check your connection and try again.';

const SettingsSec = () => {
    const [profile, setProfile] = useState({ name: '', email: '', phone: '', username: '', googleLinked: false });
    const [loadingProfile, setLoadingProfile] = useState(true);
    const [profileNotice, setProfileNotice] = useState(null); // { type, text }
    const [savingProfile, setSavingProfile] = useState(false);

    const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [passwordNotice, setPasswordNotice] = useState(null);
    const [savingPassword, setSavingPassword] = useState(false);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const response = await api.get('/api/auth/me');
                if (!cancelled) setProfile(response.data.user);
            } catch (err) {
                if (!cancelled) setProfileNotice({ type: 'error', text: describeError(err, 'Could not load your profile.') });
            } finally {
                if (!cancelled) setLoadingProfile(false);
            }
        })();
        return () => { cancelled = true; };
    }, []);

    const handleProfileChange = (e) => setProfile({ ...profile, [e.target.name]: e.target.value });
    const handlePasswordChange = (e) => setPasswords({ ...passwords, [e.target.name]: e.target.value });

    const saveProfile = async (e) => {
        e.preventDefault();
        setProfileNotice(null);
        setSavingProfile(true);
        try {
            const response = await api.put('/api/auth/me', {
                name: profile.name,
                phone: profile.phone,
                username: profile.username
            });
            setProfile(response.data.user);
            // Keep the name shown in the header in sync.
            updateStoredUser(response.data.user);
            setProfileNotice({ type: 'success', text: 'Profile updated.' });
        } catch (err) {
            setProfileNotice({ type: 'error', text: describeError(err, 'Could not update your profile.') });
        } finally {
            setSavingProfile(false);
        }
    };

    const savePassword = async (e) => {
        e.preventDefault();
        setPasswordNotice(null);
        if (passwords.newPassword !== passwords.confirmPassword) {
            setPasswordNotice({ type: 'error', text: 'The new passwords do not match.' });
            return;
        }
        setSavingPassword(true);
        try {
            await api.put('/api/auth/password', {
                currentPassword: passwords.currentPassword,
                newPassword: passwords.newPassword
            });
            setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
            setPasswordNotice({ type: 'success', text: 'Password changed.' });
        } catch (err) {
            setPasswordNotice({ type: 'error', text: describeError(err, 'Could not change your password.') });
        } finally {
            setSavingPassword(false);
        }
    };

    return (
        <div className="settings_sec">
            <div className="page_head">
                <div>
                    <h1 className="heading_h1 heading">Settings</h1>
                    <p className="heading_l desc">Manage your account</p>
                </div>
            </div>

            <div className="settings_grid">
                <form className="card" onSubmit={saveProfile}>
                    <h2 className="heading_h2 card_title">Profile</h2>
                    {profileNotice && <div className={`notice ${profileNotice.type}`} role={profileNotice.type === 'error' ? 'alert' : 'status'}>{profileNotice.text}</div>}

                    <div className="field">
                        <label className="heading_l" htmlFor="set_name">Full name</label>
                        <input id="set_name" name="name" type="text" value={profile.name || ''} onChange={handleProfileChange} maxLength={100} required disabled={loadingProfile} autoComplete="name" />
                    </div>
                    <div className="field">
                        <label className="heading_l" htmlFor="set_email">Email</label>
                        <input id="set_email" type="email" value={profile.email || ''} readOnly disabled />
                        <small className="heading_m hint">Your email is your sign-in and cannot be changed here.</small>
                    </div>
                    <div className="field">
                        <label className="heading_l" htmlFor="set_phone">Phone</label>
                        <input id="set_phone" name="phone" type="tel" value={profile.phone || ''} onChange={handleProfileChange} maxLength={30} disabled={loadingProfile} autoComplete="tel" />
                    </div>
                    <div className="field">
                        <label className="heading_l" htmlFor="set_username">Username</label>
                        <input id="set_username" name="username" type="text" value={profile.username || ''} onChange={handleProfileChange} maxLength={30} disabled={loadingProfile} autoComplete="username" />
                        <small className="heading_m hint">Letters, numbers, dot, underscore or dash (2 to 30 characters).</small>
                    </div>
                    {profile.googleLinked && <p className="heading_m hint">This account is linked to Google sign-in.</p>}

                    <button type="submit" className="primary_btn" disabled={savingProfile || loadingProfile}>
                        {savingProfile ? 'Saving...' : 'Save profile'}
                    </button>
                </form>

                <form className="card" onSubmit={savePassword}>
                    <h2 className="heading_h2 card_title">Change password</h2>
                    {passwordNotice && <div className={`notice ${passwordNotice.type}`} role={passwordNotice.type === 'error' ? 'alert' : 'status'}>{passwordNotice.text}</div>}

                    <PasswordInput id="set_current" name="currentPassword" label="Current password" value={passwords.currentPassword} onChange={handlePasswordChange} autoComplete="current-password" required />
                    <PasswordInput id="set_new" name="newPassword" label="New password" value={passwords.newPassword} onChange={handlePasswordChange} autoComplete="new-password" minLength={8} maxLength={72} required hint="8 to 72 characters." />
                    <PasswordInput id="set_confirm" name="confirmPassword" label="Confirm new password" value={passwords.confirmPassword} onChange={handlePasswordChange} autoComplete="new-password" minLength={8} maxLength={72} required />

                    <button type="submit" className="primary_btn" disabled={savingPassword}>
                        {savingPassword ? 'Changing...' : 'Change password'}
                    </button>
                </form>
            </div>
        </div>
    )
}

export default SettingsSec;
