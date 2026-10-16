import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from '../sidebar/sidebar';
import Header from '../header/header';
import './appShell.scss';

// Layout shared by every signed-in page: sidebar + sticky header + scrolling content.
// On tablets and phones the sidebar becomes a drawer that the header's menu button opens.
const AppShell = ({ title, children }) => {
    const [navOpen, setNavOpen] = useState(false);
    const location = useLocation();

    useEffect(() => {
        document.title = title ? `${title} - LeadCRM` : 'LeadCRM';
    }, [title]);

    // Close the drawer after navigating, and when Escape is pressed.
    useEffect(() => {
        setNavOpen(false);
    }, [location.pathname]);

    useEffect(() => {
        if (!navOpen) return undefined;
        const onKey = (event) => event.key === 'Escape' && setNavOpen(false);
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [navOpen]);

    return (
        <div className="app_shell">
            <Sidebar open={navOpen} onClose={() => setNavOpen(false)} />
            {navOpen && <div className="app_scrim" onClick={() => setNavOpen(false)} aria-hidden="true" />}
            <div className="app_main">
                <Header onMenuClick={() => setNavOpen((open) => !open)} menuOpen={navOpen} />
                <main className="app_content">{children}</main>
            </div>
        </div>
    );
};

export default AppShell;
