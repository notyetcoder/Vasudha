
import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface LoadingIndicatorProps {
  className?: string;
}

const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({ className }) => {
  return (
    <div className={cn("flex items-center justify-center", className)}>
      <Loader2 className="h-4 w-4 animate-spin" />
    </div>
  );
};

export default LoadingIndicator;
