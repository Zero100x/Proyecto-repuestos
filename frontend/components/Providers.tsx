'use client';

import React, { Suspense } from 'react';
import { usePathname } from 'next/navigation';
import { CompareProvider } from '../lib/compareContext';
import Navbar from './Navbar';
import Footer from './Footer';
import CompareTray from './CompareTray';

function TopChrome() {
  const pathname = usePathname();
  const isAuthPage = pathname === '/login' || pathname?.startsWith('/login');
  if (isAuthPage) return null;
  return <Navbar />;
}

function BottomChrome() {
  const pathname = usePathname();
  const isAuthPage = pathname === '/login' || pathname?.startsWith('/login');
  if (isAuthPage) return null;
  return (
    <>
      <CompareTray />
      <Footer />
    </>
  );
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <CompareProvider>
      <Suspense fallback={<div style={{ height: 68 }} />}>
        <TopChrome />
      </Suspense>
      <main className="main-content-layout">{children}</main>
      <Suspense fallback={null}>
        <BottomChrome />
      </Suspense>
    </CompareProvider>
  );
}
