import React, { useState } from 'react'
import { EyeIcon, EyeSlashIcon } from "@phosphor-icons/react"
import "./passwordInput.scss"

// Labelled password field with a show/hide toggle. Renders inside a `.field` wrapper so forms can style it.
const PasswordInput = ({ id, label, hint, error, ...inputProps }) => {
    const [visible, setVisible] = useState(false);
    const describedBy = [hint ? `${id}_hint` : '', error ? `${id}_error` : ''].filter(Boolean).join(' ') || undefined;

    return (
        <div className="field">
            <label className="heading_l" htmlFor={id}>{label}</label>
            <div className="pw_wrap">
                <input
                    id={id}
                    type={visible ? 'text' : 'password'}
                    aria-describedby={describedBy}
                    aria-invalid={error ? 'true' : undefined}
                    {...inputProps}
                />
                <button
                    type="button"
                    className="pw_toggle"
                    onClick={() => setVisible((v) => !v)}
                    aria-label={visible ? 'Hide password' : 'Show password'}
                    aria-pressed={visible}
                >
                    {visible ? <EyeSlashIcon size={20} /> : <EyeIcon size={20} />}
                </button>
            </div>
            {hint && <small id={`${id}_hint`} className="heading_m hint">{hint}</small>}
            {error && <small id={`${id}_error`} className="heading_m field_error" role="alert">{error}</small>}
        </div>
    );
};

export default PasswordInput;
