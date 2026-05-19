
import React from 'react';
import { cn } from '@/lib/utils';

interface LoadingIndicatorProps {
  className?: string;
}

const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({ className }) => {
  return (
    <div className={cn("flex items-center justify-center space-x-2", className)}>
      <div className="h-3 w-3 rounded-full bg-primary animate-dot-bounce" style={{ animationDelay: '0s' }}></div>
      <div className="h-3 w-3 rounded-full bg-primary animate-dot-bounce" style={{ animationDelay: '0.1s' }}></div>
      <div className="h-3 w-3 rounded-full bg-primary animate-dot-bounce" style={{ animationDelay: '0.2s' }}></div>
    </div>
  );
};

export default LoadingIndicator;
