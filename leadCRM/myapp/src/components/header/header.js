import React, { useState } from 'react'
import { useNavigate } from "react-router-dom"
import { ListIcon, MagnifyingGlassIcon, CaretDownIcon } from "@phosphor-icons/react"
import "./header.scss"

// The signed-in user was stored by the sign-in/sign-up flow; nothing about a specific person is hardcoded here.
const readStoredUser = () => {
    try {
        const parsed = JSON.parse(localStorage.getItem('user') || 'null');
        return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (error) {
        return {};
    }
};

const getInitials = (name) =>
    (name || '')
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0].toUpperCase())
        .join('') || '?';

const Header = () => {
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [user] = useState(readStoredUser);

    const displayName = user.name || 'User';

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
        <div className="header">
            <div className="container_fluid">
                <div className="header_inr">
                    <div className="menu_searchbar_otr">
                        <div className="menu_wrapper">
                            <button type="button" className="menu_otr" onClick={() => setIsMenuOpen(!isMenuOpen)} aria-label="Menu" aria-expanded={isMenuOpen}>
                                <ListIcon size={22} className='icon' />
                            </button>
                            {isMenuOpen && (
                                <ul className="nav_dropdown">
                                    <li>
                                        <button type="button" className="nav_link" onClick={handleLogout}>Logout</button>
                                    </li>
                                </ul>
                            )}
                        </div>

                        <form className="searchbar_otr" onSubmit={handleSearch} role="search">
                            <button type="submit" className='link' aria-label="Search leads">
                                <MagnifyingGlassIcon size={16} className='icon' />
                            </button>
                            <input
                                type="text"
                                placeholder="Search leads, name, email.."
                                className='input'
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                                aria-label="Search leads"
                            />
                        </form>
                    </div>

                    <div className="notification_profile_otr">
                        <div className="profile_otr">
                            <div className="img_otr">
                                <span className="img initials" aria-hidden="true">{getInitials(displayName)}</span>
                            </div>
                            <div className="content">
                                <h3 className="heading_h3 name">{displayName}</h3>
                                {user.email && <p className="heading_l desc">{user.email}</p>}
                            </div>
                            <CaretDownIcon size={22} className="icon" aria-hidden="true" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Header
