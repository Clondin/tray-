
import React from 'react';

export const Card: React.FC<{children: React.ReactNode, className?: string}> = ({ children, className }) => (
    <div className={`bg-white border border-gray-200 rounded-xl shadow-md p-6 ${className}`}>
        {children}
    </div>
);
