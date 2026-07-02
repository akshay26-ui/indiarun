'use client';

import dynamic from 'next/dynamic';

const LandingPageClient = dynamic(
  () => import('../../design/components/landing/LandingPageClient'),
  { ssr: false }
);

export default function HomePage() {
  return (
    <main className="min-h-screen relative">
      <LandingPageClient />
    </main>
  );
}
