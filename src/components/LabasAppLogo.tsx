import React from 'react';
import Image from 'next/image';

interface LabasAppLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | number;
  className?: string;
  priority?: boolean;
}

const sizeConfig = {
  sm: { dimension: 32, classStr: 'h-8 w-8 rounded-lg' },
  md: { dimension: 40, classStr: 'h-9 w-9 sm:h-10 sm:w-10 rounded-xl' },
  lg: { dimension: 56, classStr: 'h-14 w-14 rounded-2xl' },
  xl: { dimension: 96, classStr: 'h-24 w-24 rounded-3xl' },
};

export const LabasAppLogo: React.FC<LabasAppLogoProps> = ({
  size = 'md',
  className = '',
  priority = false,
}) => {
  const isNamedSize = typeof size === 'string' && size in sizeConfig;
  const config = isNamedSize ? sizeConfig[size as keyof typeof sizeConfig] : null;
  const pixelSize = typeof size === 'number' ? size : config?.dimension || 40;
  const containerClass = typeof size === 'string' && config ? config.classStr : '';

  return (
    <div
      className={`relative inline-flex shrink-0 select-none overflow-hidden ${containerClass} ${className}`}
      style={typeof size === 'number' ? { width: pixelSize, height: pixelSize } : undefined}
    >
      <Image
        src="/icons/icon-192.png"
        alt="LabasApp - Learn Lithuanian"
        width={pixelSize}
        height={pixelSize}
        priority={priority}
        className="h-full w-full object-contain"
      />
    </div>
  );
};
