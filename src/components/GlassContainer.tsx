import React from 'react';

interface GlassContainerProps {
    children: React.ReactNode;
    className?: string;
    intensity?: 'primary' | 'secondary' | 'table';
}

const GlassContainer: React.FC<GlassContainerProps> = ({ children, className = '', intensity = 'primary' }) => {
    const intensityClasses = {
        primary: 'bg-white/70 backdrop-blur-xl',
        secondary: 'bg-white/50 backdrop-blur-lg',
        table: 'bg-white/60 backdrop-blur-md',
    };

    const baseClasses = `
        saturate-150
        rounded-2xl
        border border-t-white/80 border-l-white/80 border-b-black/5 border-r-black/5
        [box-shadow:0_8px_32px_rgba(0,0,0,0.04),_0_2px_8px_rgba(0,0,0,0.02),inset_0_1px_0_rgba(255,255,255,0.6)]
    `;

    return (
        <div className={`${baseClasses} ${intensityClasses[intensity]} ${className}`}>
            {children}
        </div>
    );
};

export default GlassContainer;
