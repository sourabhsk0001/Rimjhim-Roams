'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Topography, TopographyProps } from '@/components/ui/Topography';

interface GlobalTopographyBackgroundProps {
  topographyProps?: Partial<TopographyProps>;
}

export function GlobalTopographyBackground({
  topographyProps
}: GlobalTopographyBackgroundProps) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // IMPORTANT: The Topography background should appear on every
  // authenticated/application page and internal website page EXCEPT
  // the Introduction/Landing/Home page ("/") which must remain completely unchanged.
  if (!mounted || pathname === '/') {
    return null;
  }

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none transition-opacity duration-700 ease-in-out"
      style={{ opacity: 1 }}
    >
      <Topography
        lowColor="#5227FF"
        midColor="#3b82f6"
        highColor="#0f172a"
        speed={0.22}
        morphAmount={2.5}
        morphSpeed={0.035}
        bands={2.5}
        thickness={0.012}
        scale={1.05}
        pixelSize={1.0}
        glow={0.35}
        colorMode="elevation"
        contrast={2.8}
        brightness={1.05}
        fillBands={false}
        opacity={0.22}
        grain={true}
        grainIntensity={0.03}
        mouseInteraction={true}
        mouseRadius={0.35}
        mouseStrength={0.4}
        className="w-full h-full"
        {...topographyProps}
      />
    </div>
  );
}

export default GlobalTopographyBackground;
