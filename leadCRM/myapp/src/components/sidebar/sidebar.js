import React from 'react'
import { Link, useNavigate } from "react-router-dom"
import { HouseIcon, AddressBookIcon, UserPlusIcon, UsersIcon, ChartBarIcon, GearIcon, SignOutIcon } from "@phosphor-icons/react"
import logo from "../../images/logo.svg"
import "./sidebar.scss"

const Sidebar = () => {
    const navigate = useNavigate();

    const handleLogout = (e) => {
        e.preventDefault(); 
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate("/"); 
    };

    return (
        <div className="sidebar">
            <div className="container_fluid">
                <div className="sidebar_inr">
                    <div className="nav_logo_otr">
                        <Link to="/dashboard" className="logo_otr">
                            <img src={logo} alt="logo" className='logo' />
                        </Link>
                        <nav className="nav_otr">
                            <ul className="nav_ul">
                                <li className="nav_li">
                                   <Link to="/dashboard" className='heading_l link'><HouseIcon size={22} className="icon" /> Dashboard</Link>
                                </li>
                                <li className="nav_li">
                                   <Link to="/lead" className='heading_l link'><AddressBookIcon size={22} className="icon" /> Leads</Link>
                                </li>
                                <li className="nav_li">
                                   <Link to="/addlead" className='heading_l link'><UserPlusIcon size={22} className="icon" /> Add Lead</Link>
                                </li>
                                <li className="nav_li">
                                   <Link to="/dashboard" className='heading_l link'><UsersIcon size={22} className="icon" /> Users</Link>
                                </li>
                                <li className="nav_li">
                                   <Link to="/dashboard" className='heading_l link'><ChartBarIcon size={22} className="icon" /> Analytics</Link>
                                </li>
                                <li className="nav_li">
                                   <Link to="/dashboard" className='heading_l link'><GearIcon size={22} className="icon" /> Settings</Link>
                                </li>
                            </ul>
                        </nav>
                    </div>
                    <div className="action_otr" onClick={handleLogout} >
                        <span className='heading_l link'><SignOutIcon size={22} className="icon" />Log out</span>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Sidebar