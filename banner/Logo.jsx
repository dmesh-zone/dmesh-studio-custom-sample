import React from 'react';
import { useThemeContext } from '../../ThemeContext';
import logoLight from './My Custom Logo Light.svg';
import logoDark from './My Custom Logo Dark.svg';

export default function Logo() {
    const { mode } = useThemeContext();

    return (
        <img
            src={mode === 'dark' ? logoDark : logoLight}
            alt="NextGen Logo"
            style={{ height: '32px', width: 'auto' }}
        />
    );
}
