'use client';
import React from 'react';

export const Section = ({
  title,
  icon,
  children,
}: {
  title: React.ReactNode;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) => {
  const childrenArray = React.Children.toArray(children).filter(Boolean);
  if (childrenArray.length === 0) return null;
  return (
    <div className="break-inside-avoid">
      <h2 className="text-base sm:text-lg flex items-center gap-2 text-primary font-bold mb-3">
        {icon}
        {title}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{children}</div>
    </div>
  );
};
