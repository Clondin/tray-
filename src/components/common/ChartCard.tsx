import React from 'react';
import { SectionCard } from './SectionCard';

interface ChartCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export const ChartCard: React.FC<ChartCardProps> = ({ title, children, className }) => {
  return (
    <SectionCard title={title} className={className}>
      <div className="h-64 flex items-center justify-center text-text-muted">
        {children}
      </div>
    </SectionCard>
  );
};
