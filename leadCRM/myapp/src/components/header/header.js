import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from "react-router-dom"
import { ListIcon, MagnifyingGlassIcon, BellIcon, CaretDownIcon } from "@phosphor-icons/react"
import img from "../../images/umar.png"
import "./header.scss"

const navLinks = [
    { id: 1, title: "My Profile", path: "/profile" },
    { id: 2, title: "Settings", path: "/settings" },
    { id: 3, title: "Support", path: "/support" }
];

const Header = () => {
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    
    const [userData, setUserData] = useState({ name: 'Umar Hayat' });

    useEffect(() => {
     
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
            try {
                const parsedUser = JSON.parse(savedUser);
                if (parsedUser && parsedUser.name) {
                    setUserData({ name: parsedUser.name });
                }
            } catch (error) {
                console.error("Header localstorage parsing error:", error);
            }
        }
    }, []);

   
    const handleLogout = (e) => {
        e.preventDefault();
        localStorage.removeItem('token');
        localStorage.removeItem('user'); 
        navigate("/"); 
    };

    return (
        <div className="header">
            <div className="container_fluid">
                <div className="header_inr">
                    <div className="menu_searchbar_otr">
                        <div className="menu_wrapper">
                            <button className="menu_otr" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                                <ListIcon size={22} className='icon' />
                            </button>
                            {isMenuOpen && (
                                <ul className="nav_dropdown">
                                    {navLinks.map((link) => (
                                        <li key={link.id} onClick={() => setIsMenuOpen(false)}>
                                            <Link to={link.path} className="nav_link">
                                                {link.title}
                                            </Link>
                                        </li>
                                    ))}
                                   
                                    <li onClick={handleLogout}>
                                        <a href="/" className="nav_link">Logout</a>
                                    </li>
                                </ul>
                            )}
                        </div>

                        <div className="searchbar_otr">
                            <Link to="/" className='link'>
                                <MagnifyingGlassIcon size={16} className='icon' />
                            </Link>
                            <input type="text" placeholder="Search leads, name, email.." className='input' />
                            <p className="heading_l text">Ctrl + K</p>
                        </div>
                    </div>

                    <div className="notification_profile_otr">
                        <Link to="/" className='notification'>
                            <BellIcon size={22} className="icon" />
                        </Link>
                        <div className="profile_otr">
                            <div className="img_otr">
                                <img src={img} alt="img" className='img' />
                            </div>
                            <div className="content">
                                <h3 className="heading_h3 name">{userData.name}</h3>
                                <p className="heading_l desc">Admin</p>
                            </div>
                            <Link to="/" className='arrow'>
                                <CaretDownIcon size={22} className="icon" />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Header