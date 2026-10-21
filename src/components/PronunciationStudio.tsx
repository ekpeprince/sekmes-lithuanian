'use client';

import React from 'react';
import { SpeakingLab, SpeakingLabProps } from './SpeakingLab';

/**
 * Pronunciation Studio
 * Hybrid validation voice studio with glitch filtering, keyword presence check,
 * and multi-attempt fallback options.
 */
export const PronunciationStudio: React.FC<SpeakingLabProps> = (props) => {
  return <SpeakingLab {...props} />;
};

export default PronunciationStudio;
