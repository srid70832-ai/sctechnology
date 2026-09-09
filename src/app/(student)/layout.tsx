'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { Loader2 } from 'lucide-react';

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const { user, firebaseUser, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !firebaseUser && !user) {
      router.replace('/login?redirect=' + encodeURIComponent(pathname));
    }
  }, [loading, user, firebaseUser, router, pathname]);

  if (loading) {
    return (
      <div className='min-h-screen bg-[#0B0F19] flex flex-col items-center justify-center text-slate-400 gap-3'>
        <Loader2 className='w-8 h-8 animate-spin text-blue-500' />
        <span className='text-xs font-semibold tracking-wider uppercase text-slate-500'>Authenticating Session...</span>
      </div>
    );
  }

  return <>{children}</>;
}
