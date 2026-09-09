'use client';

import React from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang='en'>
      <body style={{ backgroundColor: '#0B0F19', color: '#F8FAFC', fontFamily: 'sans-serif', margin: 0 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '24px', textAlign: 'center' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '12px' }}>Critical System Error</h1>
          <p style={{ fontSize: '0.875rem', color: '#94A3B8', maxWidth: '400px', marginBottom: '24px' }}>
            A critical error occurred at the application root level.
          </p>
          <button
            onClick={() => reset()}
            style={{ padding: '12px 24px', borderRadius: '16px', backgroundColor: '#2563EB', color: 'white', border: 'none', fontWeight: 700, cursor: 'pointer' }}
          >
            Reload Application
          </button>
        </div>
      </body>
    </html>
  );
}
