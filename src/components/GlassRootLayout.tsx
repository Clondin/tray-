import React from 'react';

interface GlassRootLayoutProps {
    children: React.ReactNode;
}

const GlassRootLayout: React.FC<GlassRootLayoutProps> = ({ children }) => {
    return (
        <main
            className="relative max-w-[1400px] mx-auto"
            style={{
                paddingTop: 'var(--space-9)',
                paddingBottom: 'var(--space-10)',
                paddingLeft: 'var(--space-5)',
                paddingRight: 'var(--space-5)',
            }}
        >
            {children}
        </main>
    );
};

export default GlassRootLayout;
