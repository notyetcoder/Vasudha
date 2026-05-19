'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';

const PLACEHOLDER_URL = 'https://placehold.co/150x150.png';

function isPlaceholder(url?: string | null): boolean {
  if (!url) return true;
  if (url.includes('placehold.co')) return true;
  return false;
}

// Deterministic color based on name initial
function getBgColor(name: string): string {
  const colors = [
    'bg-violet-600', 'bg-indigo-600', 'bg-blue-600', 'bg-teal-600',
    'bg-emerald-600', 'bg-amber-600', 'bg-orange-600', 'bg-rose-600',
  ];
  const idx = (name.charCodeAt(0) || 0) % colors.length;
  return colors[idx];
}

interface UserAvatarProps {
  name: string;
  profilePictureUrl?: string | null;
  size?: number;       // pixel size, used for width/height on <Image>
  className?: string;
  isDeceased?: boolean;
  priority?: boolean;
}

export default function UserAvatar({
  name,
  profilePictureUrl,
  size = 100,
  className,
  isDeceased,
  priority = false,
}: UserAvatarProps) {
  const showFallback = isPlaceholder(profilePictureUrl);
  const initial = (name || '?').charAt(0).toUpperCase();
  const bgColor = getBgColor(initial);

  const deceasedRing = isDeceased ? 'border-4 border-amber-400 p-0.5' : 'border-4 border-background';

  if (showFallback) {
    // Render an initial-letter circle
    const fontSize = Math.max(12, Math.round(size * 0.38));
    return (
      <div
        className={cn(
          'rounded-full flex items-center justify-center shrink-0 shadow-md text-white font-bold',
          bgColor,
          deceasedRing,
          className,
        )}
        style={{ width: size, height: size, fontSize }}
        aria-label={`Avatar for ${name}`}
      >
        {initial}
      </div>
    );
  }

  return (
    <Image
      src={profilePictureUrl!}
      alt={`Profile of ${name}`}
      width={size}
      height={size}
      priority={priority}
      loading={priority ? 'eager' : 'lazy'}
      data-ai-hint="profile avatar"
      className={cn('rounded-full shadow-md object-cover', deceasedRing, className)}
    />
  );
}
