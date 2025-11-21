
import React from 'react';

interface SectionCardProps {
    children: React.ReactNode;
    className?: string;
    title?: React.ReactNode;
    action?: React.ReactNode;
}

export const SectionCard: React.FC<SectionCardProps> = ({ children, className = '', title, action }) => (
    <div className={`bg-white rounded-xl border border-border shadow-card hover:shadow-card-hover transition-shadow duration-300 ${className}`}>
        {(title || action) && (
            <div className="px-6 py-5 border-b border-border flex items-center justify-between">
                {title && (
                    typeof title === 'string' ? (
                        <h3 className="text-base font-semibold text-primary">{title}</h3>
                    ) : (
                        <div className="text-base font-semibold text-primary">{title}</div>
                    )
                )}
                {action && <div>{action}</div>}
            </div>
        )}
        <div className="p-6">
            {children}
        </div>
    </div>
);
