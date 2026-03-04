import React from 'react';
import { NavLink } from 'react-router-dom';   // ← 改用 NavLink

const Header: React.FC = () => {
    const navItems = [
        { name: 'Home', path: '/' },
        { name: 'About', path: '/about' },
        { name: 'Translate', path: '/translate' },
        { name: 'Contacts', path: '/contacts' },
    ];

    return (
        <header>
            <nav>
                {navItems.map((item) => (
                    <NavLink
                        key={item.name}
                        to={item.path}
                        className={({ isActive }) =>
                            `nav-items ${isActive ? 'active' : ''}`
                        }
                    >
                        {item.name}
                    </NavLink>
                ))}
            </nav>
        </header>
    );
};

export default Header;