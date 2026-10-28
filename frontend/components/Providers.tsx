'use client';

import React, { Suspense } from 'react';
import { usePathname } from 'next/navigation';
import { CompareProvider } from '../lib/compareContext';
import Navbar from './Navbar';
import Footer from './Footer';
import CompareTray from './CompareTray';

export default function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname === '/login' || pathname?.startsWith('/login');

  return (
    <CompareProvider>
      {!isAuthPage && (
        <Suspense fallback={<div style={{ height: 72 }} />}>
          <Navbar />
        </Suspense>
      )}
      <main className="main-content-layout">{children}</main>
      {!isAuthPage && <CompareTray />}
      {!isAuthPage && <Footer />}
    </CompareProvider>
  );
}
