'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { supabase } from '@/lib/db';

export function Header() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      // Clear from Supabase client
      await supabase.auth.signOut();

      // Clear cookies via API
      await fetch('/api/auth/logout', { method: 'POST' });

      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <header className="border-b border-gray-200 bg-white shadow-sm">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <Link href="/dashboard" className="text-2xl font-bold text-blue-600">
            Golf Charity
          </Link>

          <nav className="hidden space-x-6 md:flex">
            <Link
              href="/dashboard"
              className="text-gray-600 hover:text-gray-900"
            >
              Dashboard
            </Link>
            <Link href="/charities" className="text-gray-600 hover:text-gray-900">
              Charities
            </Link>
          </nav>

          <div className="flex items-center space-x-4">
            <button
              onClick={handleLogout}
              disabled={isLoading}
              className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
            >
              {isLoading ? 'Logging out...' : 'Logout'}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
