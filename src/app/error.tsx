'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application Error Boundary caught error:', error);
  }, [error]);

  return (
    <div className='min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col items-center justify-center p-6 text-center'>
      <div className='w-20 h-20 rounded-3xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mb-6 shadow-xl shadow-rose-500/5'>
        <AlertTriangle className='w-10 h-10' />
      </div>

      <h1 className='text-3xl sm:text-4xl font-black text-white tracking-tight mb-3'>
        Something went wrong
      </h1>

      <p className='text-sm text-slate-400 max-w-md mb-8 leading-relaxed'>
        An unexpected error occurred while loading this section. Our team has been notified.
      </p>

      <div className='flex flex-wrap items-center justify-center gap-3 text-xs font-bold'>
        <button
          onClick={() => reset()}
          className='px-6 py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white flex items-center gap-2 shadow-lg shadow-rose-600/30 transition cursor-pointer'
        >
          <RefreshCw className='w-4 h-4' />
          <span>Try Again</span>
        </button>

        <Link
          href='/'
          className='px-6 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 flex items-center gap-2 transition'
        >
          <Home className='w-4 h-4' />
          <span>Return Home</span>
        </Link>
      </div>
    </div>
  );
}
