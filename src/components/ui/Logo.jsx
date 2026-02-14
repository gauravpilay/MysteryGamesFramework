import React from 'react';

export const Logo = ({ className = "w-10 h-10" }) => (
    <img src="/logo.jpg" alt="Simplee5 Logo" className={`${className} object-contain rounded-lg`} />
);
