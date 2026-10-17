'use client';

import React, { Suspense } from 'react';
import { CompareProvider } from '../lib/compareContext';
import Navbar from './Navbar';
import Footer from './Footer';
import CompareTray from './CompareTray';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <CompareProvider>
      <Suspense fallback={<div style={{ height: 72 }} />}>
        <Navbar />
      </Suspense>
      <main className="main-content-layout">{children}</main>
      <CompareTray />
      <Footer />
    </CompareProvider>
  );
}
