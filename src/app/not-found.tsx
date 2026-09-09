import Link from 'next/link';
import { FileQuestion, ArrowLeft, Home, Trophy, Compass } from 'lucide-react';

export default function NotFound() {
  return (
    <div className='min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col items-center justify-center p-6 text-center'>
      <div className='w-20 h-20 rounded-3xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mb-6 shadow-xl shadow-blue-500/5'>
        <FileQuestion className='w-10 h-10' />
      </div>

      <h1 className='text-4xl sm:text-5xl font-black text-white tracking-tight mb-3'>
        404 — Page Not Found
      </h1>

      <p className='text-sm text-slate-400 max-w-md mb-8 leading-relaxed'>
        The page you are looking for does not exist, has been moved, or requires different access permissions.
      </p>

      <div className='flex flex-wrap items-center justify-center gap-3 text-xs font-bold'>
        <Link
          href='/'
          className='px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-2 shadow-lg shadow-blue-600/30 transition'
        >
          <Home className='w-4 h-4' />
          <span>Return Home</span>
        </Link>

        <Link
          href='/hackathons'
          className='px-6 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 flex items-center gap-2 transition'
        >
          <Trophy className='w-4 h-4 text-amber-400' />
          <span>Explore Hackathons</span>
        </Link>

        <Link
          href='/problem-statements'
          className='px-6 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 flex items-center gap-2 transition'
        >
          <Compass className='w-4 h-4 text-emerald-400' />
          <span>Problem Statements</span>
        </Link>
      </div>
    </div>
  );
}
