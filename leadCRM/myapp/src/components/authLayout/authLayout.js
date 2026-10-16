import React, { useEffect } from 'react'
import dashboard from "../../images/dashboard.png"
import logo from "../../images/logo.svg"
import "./authLayout.scss"

// Shared two-column layout for the sign-in and sign-up screens. The illustration column is hidden on small screens.
const AuthLayout = ({ pageTitle, title, subtitle, children, footer }) => {
  useEffect(() => {
    document.title = pageTitle ? `${pageTitle} - LeadCRM` : 'LeadCRM';
  }, [pageTitle]);

  return (
    <div className="auth_page">
        <div className="auth_visual" aria-hidden="true">
            <img src={dashboard} alt="" />
        </div>
        <main className="auth_panel">
            <div className="auth_card">
                <img src={logo} alt="LeadCRM" className="auth_logo" />
                <h1 className="heading_h1 auth_title">{title}</h1>
                {subtitle && <p className="heading_l auth_subtitle">{subtitle}</p>}
                {children}
                {footer && <p className="heading_l auth_footer">{footer}</p>}
            </div>
        </main>
    </div>
  );
};

export default AuthLayout;
