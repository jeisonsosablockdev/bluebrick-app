'use client';

import React from 'react';
import { LandingHeroData } from '../domain';
import { HeroSection } from './hero-section';
import { SplashScreen } from './splash-screen';

export interface LandingPageClientProps {
  hero: LandingHeroData;
}

export function LandingPageClient({ hero }: LandingPageClientProps) {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <SplashScreen />
      <HeroSection hero={hero} />
    </main>
  );
}
