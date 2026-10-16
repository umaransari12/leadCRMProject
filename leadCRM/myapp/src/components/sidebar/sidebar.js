import React from 'react'
import { NavLink, useNavigate } from "react-router-dom"
import { HouseIcon, AddressBookIcon, UserPlusIcon, ChartBarIcon, GearIcon, SignOutIcon, X } from "@phosphor-icons/react"
import logo from "../../images/logo.svg"
import "./sidebar.scss"

const links = [
    { to: '/dashboard', label: 'Dashboard', Icon: HouseIcon },
    { to: '/lead', label: 'Leads', Icon: AddressBookIcon },
    { to: '/addlead', label: 'Add Lead', Icon: UserPlusIcon },
    { to: '/analytics', label: 'Analytics', Icon: ChartBarIcon },
    { to: '/settings', label: 'Settings', Icon: GearIcon }
];

const Sidebar = ({ open, onClose }) => {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate("/");
    };

    return (
        <aside className={`app_sidebar${open ? ' open' : ''}`} aria-label="Main navigation">
            <div className="sidebar_top">
                <NavLink to="/dashboard" className="logo_link" aria-label="LeadCRM dashboard">
                    <img src={logo} alt="LeadCRM" className="logo" />
                </NavLink>
                <button type="button" className="sidebar_close" onClick={onClose} aria-label="Close menu">
                    <X size={20} weight="bold" />
                </button>
            </div>

            <nav className="sidebar_nav">
                <ul>
                    {links.map(({ to, label, Icon }) => (
                        <li key={to}>
                            <NavLink to={to} className={({ isActive }) => `nav_link heading_l${isActive ? ' active' : ''}`}>
                                <Icon size={22} className="icon" />
                                {label}
                            </NavLink>
                        </li>
                    ))}
                </ul>
            </nav>

            <button type="button" className="logout_btn heading_l" onClick={handleLogout}>
                <SignOutIcon size={22} className="icon" />
                Log out
            </button>
        </aside>
    )
}

export default Sidebar
