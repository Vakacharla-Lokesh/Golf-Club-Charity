'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/db';
import { isAdmin } from '@/lib/auth';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push('/login');
          return;
        }

        const isUserAdmin = isAdmin(user.email || '');
        if (!isUserAdmin) {
          router.push('/dashboard');
          return;
        }

        setIsAuthorized(true);
      } catch (error) {
        console.error('Error checking admin access:', error);
        router.push('/dashboard');
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminAccess();
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-gray-600">Loading admin panel...</div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-600">Unauthorized access</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Admin Sidebar */}
      <div className="w-64 border-r border-gray-200 bg-white p-6">
        <h2 className="text-lg font-bold text-gray-900">Admin Panel</h2>

        <nav className="mt-8 space-y-4">
          <a
            href="/admin"
            className="block rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            📊 Dashboard
          </a>
          <a
            href="/admin/draws"
            className="block rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            🎯 Manage Draws
          </a>
          <a
            href="/admin/charities"
            className="block rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            🤝 Manage Charities
          </a>
          <a
            href="/admin/users"
            className="block rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            👥 Users
          </a>
          <a
            href="/dashboard"
            className="block rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 mt-8"
          >
            ← Back to Dashboard
          </a>
        </nav>
      </div>

      {/* Admin Content */}
      <div className="flex-1">
        <div className="mx-auto max-w-6xl px-8 py-12">{children}</div>
      </div>
    </div>
  );
}
