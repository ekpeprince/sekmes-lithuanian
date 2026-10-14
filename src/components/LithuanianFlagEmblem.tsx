import React from 'react';

interface LithuanianFlagEmblemProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const LithuanianFlagEmblem: React.FC<LithuanianFlagEmblemProps> = ({
  size = 'md',
  className = '',
}) => {
  const sizeMap = {
    sm: 'h-7 w-7 sm:h-8 sm:w-8',
    md: 'h-9 w-9 sm:h-10 sm:w-10',
    lg: 'h-11 w-11',
    xl: 'h-24 w-24',
  };

  return (
    <div
      className={`relative ${sizeMap[size]} rounded-full overflow-hidden border-2 border-amber-300/90 shadow-md shrink-0 flex flex-col select-none transition-transform ${className}`}
      role="img"
      aria-label="Lithuania flag emblem"
    >
      <div className="h-1/3 w-full bg-[#FDB913]" />
      <div className="h-1/3 w-full bg-[#006A44]" />
      <div className="h-1/3 w-full bg-[#C1272D]" />
      {/* Subtle glossy gradient overlay for premium tactile feel */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-black/10 pointer-events-none rounded-full" />
    </div>
  );
};
