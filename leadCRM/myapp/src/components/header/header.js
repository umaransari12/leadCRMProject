import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from "react-router-dom"
import { ListIcon, MagnifyingGlassIcon, BellIcon, CaretDownIcon } from "@phosphor-icons/react"
import useLeads from '../../useLeads'
import { buildNotifications } from '../../leadUtils'
import { readStoredUser, USER_CHANGED_EVENT } from '../../session'
import "./header.scss"

const getInitials = (name) =>
    (name || '')
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0].toUpperCase())
        .join('') || '?';

const Header = ({ onMenuClick, menuOpen }) => {
    const navigate = useNavigate();
    const [openMenu, setOpenMenu] = useState(null); // null | 'notifications' | 'profile'
    const [searchText, setSearchText] = useState('');
    // The signed-in user comes from the stored session; nothing about a specific person is hardcoded here.
    const [user, setUser] = useState(readStoredUser);
    const headerRef = useRef(null);
    const { leads } = useLeads();

    const notifications = useMemo(() => buildNotifications(leads), [leads]);
    const displayName = user.name || 'User';

    // Close an open dropdown when clicking elsewhere or pressing Escape.
    useEffect(() => {
        if (!openMenu) return undefined;
        const onPointerDown = (event) => {
            if (headerRef.current && !headerRef.current.contains(event.target)) setOpenMenu(null);
        };
        const onKey = (event) => event.key === 'Escape' && setOpenMenu(null);
        document.addEventListener('mousedown', onPointerDown);
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('mousedown', onPointerDown);
            document.removeEventListener('keydown', onKey);
        };
    }, [openMenu]);

    // Re-read the user when Settings changes the profile.
    useEffect(() => {
        const refresh = () => setUser(readStoredUser());
        window.addEventListener(USER_CHANGED_EVENT, refresh);
        return () => window.removeEventListener(USER_CHANGED_EVENT, refresh);
    }, []);

    const toggle = (name) => setOpenMenu((current) => (current === name ? null : name));

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate("/");
    };

    const handleSearch = (e) => {
        e.preventDefault();
        const query = searchText.trim();
        navigate(query ? `/lead?q=${encodeURIComponent(query)}` : '/lead');
    };

    return (
        <header className="app_header" ref={headerRef}>
            <button type="button" className="menu_btn" onClick={onMenuClick} aria-label="Open menu" aria-expanded={Boolean(menuOpen)}>
                <ListIcon size={24} />
            </button>

            <form className="header_search" onSubmit={handleSearch} role="search">
                <button type="submit" className="search_btn" aria-label="Search leads">
                    <MagnifyingGlassIcon size={18} />
                </button>
                <input
                    type="search"
                    placeholder="Search leads by name, email or phone"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    aria-label="Search leads"
                />
            </form>

            <div className="header_actions">
                <div className="menu_wrap">
                    <button
                        type="button"
                        className="icon_btn"
                        onClick={() => toggle('notifications')}
                        aria-label={`Notifications${notifications.length ? ` (${notifications.length})` : ''}`}
                        aria-expanded={openMenu === 'notifications'}
                    >
                        <BellIcon size={22} />
                        {notifications.length > 0 && <span className="badge">{notifications.length}</span>}
                    </button>
                    {openMenu === 'notifications' && (
                        <div className="dropdown notifications" role="menu">
                            <p className="dropdown_title heading_h3">Notifications</p>
                            {notifications.length === 0 ? (
                                <p className="dropdown_empty heading_l">You're all caught up.</p>
                            ) : (
                                <ul>
                                    {notifications.map((item) => (
                                        <li key={item.id}>
                                            <Link to={item.to} className="dropdown_item heading_l" onClick={() => setOpenMenu(null)}>
                                                {item.text}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            )}
                            <p className="dropdown_note heading_m">Based on your leads.</p>
                        </div>
                    )}
                </div>

                <div className="menu_wrap">
                    <button
                        type="button"
                        className="profile_btn"
                        onClick={() => toggle('profile')}
                        aria-label="Account menu"
                        aria-expanded={openMenu === 'profile'}
                    >
                        <span className="avatar" aria-hidden="true">{getInitials(displayName)}</span>
                        <span className="profile_text">
                            <span className="heading_h3 name">{displayName}</span>
                            {user.email && <span className="heading_m email">{user.email}</span>}
                        </span>
                        <CaretDownIcon size={16} aria-hidden="true" className="caret" />
                    </button>
                    {openMenu === 'profile' && (
                        <div className="dropdown profile" role="menu">
                            <Link to="/settings" className="dropdown_item heading_l" onClick={() => setOpenMenu(null)}>
                                Settings
                            </Link>
                            <button type="button" className="dropdown_item heading_l" onClick={handleLogout}>
                                Log out
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    )
}

export default Header
