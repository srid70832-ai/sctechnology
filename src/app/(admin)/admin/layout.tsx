'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { Loader2, ShieldAlert } from 'lucide-react';
import { AdminGeminiChatWidget } from '@/components/admin/AdminGeminiChatWidget';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, firebaseUser, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const userEmail = (user?.email || firebaseUser?.email || '').toLowerCase().trim();
  const isAdminEmail = userEmail === 'srics2425@gmail.com' || userEmail === 'admin@sctech.com' || userEmail === 'superadmin@sctech.com';
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' || isAdminEmail;

  useEffect(() => {
    if (!loading) {
      if (!firebaseUser && !user) {
        router.replace('/login?redirect=' + encodeURIComponent(pathname));
      } else if (!isAdmin) {
        router.replace('/dashboard');
      }
    }
  }, [loading, user, firebaseUser, isAdmin, router, pathname]);

  if (loading) {
    return (
      <div className='min-h-screen bg-[#060A12] flex flex-col items-center justify-center text-slate-400 gap-3'>
        <Loader2 className='w-8 h-8 animate-spin text-blue-500' />
        <span className='text-xs font-semibold tracking-wider uppercase text-slate-500'>Verifying Admin Authorization...</span>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className='min-h-screen bg-[#060A12] flex flex-col items-center justify-center text-slate-400 gap-4 p-6 text-center'>
        <div className='w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center'>
          <ShieldAlert className='w-7 h-7' />
        </div>
        <div className='space-y-1 max-w-sm'>
          <h2 className='text-lg font-bold text-white'>Access Restricted</h2>
          <p className='text-xs text-slate-400'>
            This area requires Administrative privileges. Redirecting to your student dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {children}
      <AdminGeminiChatWidget />
    </>
  );
}
