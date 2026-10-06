'use client';

import React, { useState } from 'react';
import { Volume2 } from 'lucide-react';
import { sounds } from '@/lib/audio';

interface AudioSpeakerProps {
  text: string;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  className?: string;
  as?: 'button' | 'span';
  showSlow?: boolean;
}

export const AudioSpeaker: React.FC<AudioSpeakerProps> = ({
  text,
  size = 'md',
  label,
  className = '',
  as = 'button',
  showSlow = false,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSlowPlaying, setIsSlowPlaying] = useState(false);

  const handlePlay = (e: React.MouseEvent | React.KeyboardEvent, slow: boolean = false) => {
    e.stopPropagation();
    if (slow) {
      setIsSlowPlaying(true);
    } else {
      setIsPlaying(true);
    }

    const timeout = setTimeout(() => {
      setIsPlaying(false);
      setIsSlowPlaying(false);
    }, 5000);

    sounds.speak(text, {
      slow,
      onEnd: () => {
        clearTimeout(timeout);
        setIsPlaying(false);
        setIsSlowPlaying(false);
      },
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent, slow: boolean = false) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handlePlay(e, slow);
    }
  };

  const sizeClasses = {
    sm: 'p-1.5 text-xs',
    md: 'p-2 text-sm',
    lg: 'p-3 text-base',
  };

  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 24,
  };

  const buttonProps = {
    onClick: (e: React.MouseEvent) => handlePlay(e, false),
    onKeyDown: (e: React.KeyboardEvent) => handleKeyDown(e, false),
    title: `Listen to natural pronunciation: "${text}"`,
    className: `inline-flex items-center gap-1.5 rounded-full border-2 border-sky-300 bg-sky-50 text-sky-600 transition-all hover:bg-sky-100 hover:scale-105 active:scale-95 shadow-xs cursor-pointer select-none ${sizeClasses[size]} ${
      isPlaying ? 'ring-2 ring-sky-400 bg-sky-200' : ''
    } ${className}`,
  };

  const slowButtonProps = {
    onClick: (e: React.MouseEvent) => handlePlay(e, true),
    onKeyDown: (e: React.KeyboardEvent) => handleKeyDown(e, true),
    title: `Listen slowly and clearly: "${text}"`,
    className: `inline-flex items-center gap-1 rounded-full border-2 border-amber-300 bg-amber-50 text-amber-700 transition-all hover:bg-amber-100 hover:scale-105 active:scale-95 shadow-xs cursor-pointer select-none ${sizeClasses[size]} ${
      isSlowPlaying ? 'ring-2 ring-amber-400 bg-amber-200' : ''
    }`,
  };

  const speakerButton = as === 'span' ? (
    <span role="button" tabIndex={0} {...buttonProps}>
      <Volume2 size={iconSizes[size]} className={isPlaying ? 'animate-pulse text-sky-700' : ''} />
      {label && <span className="font-semibold">{label}</span>}
    </span>
  ) : (
    <button type="button" {...buttonProps}>
      <Volume2 size={iconSizes[size]} className={isPlaying ? 'animate-pulse text-sky-700' : ''} />
      {label && <span className="font-semibold">{label}</span>}
    </button>
  );

  if (!showSlow) {
    return speakerButton;
  }

  return (
    <div className="inline-flex items-center gap-2">
      {speakerButton}
      {as === 'span' ? (
        <span role="button" tabIndex={0} {...slowButtonProps}>
          <span className="text-sm">🐢</span>
          <span className="text-[11px] font-bold">Lėtai</span>
        </span>
      ) : (
        <button type="button" {...slowButtonProps}>
          <span className="text-sm">🐢</span>
          <span className="text-[11px] font-bold">Lėtai</span>
        </button>
      )}
    </div>
  );
};
