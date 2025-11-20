import React from 'react';

export const DataTable: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className }) => (
  <div className={`overflow-x-auto ${className}`}>
    <table className="min-w-full divide-y divide-border">
      {children}
    </table>
  </div>
);

export const DataTableHeader: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <thead className="bg-surface-subtle">
    <tr>{children}</tr>
  </thead>
);

export const DataTableHeaderCell: React.FC<{ children: React.ReactNode; align?: 'left' | 'center' | 'right'; className?: string }> = ({ children, align = 'left', className = '' }) => (
  <th className={`py-3 px-4 text-${align} text-xs font-semibold text-secondary uppercase tracking-wider whitespace-nowrap ${className}`}>
    {children}
  </th>
);

export const DataTableBody: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <tbody className="bg-white divide-y divide-border">
    {children}
  </tbody>
);

export const DataTableRow: React.FC<React.HTMLAttributes<HTMLTableRowElement>> = ({ children, onClick, className, ...props }) => (
  <tr onClick={onClick} className={`group transition-colors duration-150 ${className || ''} ${onClick ? 'cursor-pointer hover:bg-surface-hover' : ''}`} {...props}>
    {children}
  </tr>
);

export const DataTableCell: React.FC<{ children: React.ReactNode; align?: 'left' | 'center' | 'right'; className?: string, colSpan?: number }> = ({ children, align = 'left', className = '', colSpan }) => (
  <td className={`px-4 py-3 text-${align} text-sm ${className}`} colSpan={colSpan}>
    {children}
  </td>
);