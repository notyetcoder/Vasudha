
'use client';

import React from 'react';

export const Section = ({ title, icon, children }: { title: string; icon?: React.ReactNode, children: React.ReactNode }) => {
    const childrenArray = React.Children.toArray(children).filter(Boolean);
    if (childrenArray.length === 0) return null;
    return (
        <div className="mb-8 break-inside-avoid">
            <h2 className="text-xl flex items-center gap-3 text-primary font-bold mb-4">{icon}{title}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>
        </div>
    );
};
