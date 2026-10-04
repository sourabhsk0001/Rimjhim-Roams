'use client';

import React from 'react';
import { TopographyBackground, TopographyBackgroundProps } from '@/components/background/TopographyBackground';

export { TopographyBackground } from '@/components/background/TopographyBackground';

export function GlobalTopographyBackground(props: TopographyBackgroundProps) {
  return (
    <TopographyBackground
      variant="app"
      intensity="subtle"
      interactive={true}
      {...props}
    />
  );
}

export default GlobalTopographyBackground;
