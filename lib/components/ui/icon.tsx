import type { LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
('use client');

interface IconProps {
  icon: LucideIcon;
  className?: string;
}

export function Icon({ icon: LucideIcon, className }: IconProps): JSX.Element {
  return <LucideIcon className={cn('', className)} />;
}

// Add a default export to fix the build error
export default Icon;
