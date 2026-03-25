'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/db';

interface DrawStats {
  totalDraws: number;
  draftDraws: number;
  publishedDraws: number;
  totalParticipants: number;
  totalSubscriptions: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DrawStats>({
    totalDraws: 0,
    draftDraws: 0,
    publishedDraws: 0,
    totalParticipants: 0,
    totalSubscriptions: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch draws stats
        const { data: allDraws } = await supabase
          .from('draws')
          .select('status')
          .throwOnError();

        const { data: allParticipants } = await supabase
          .from('draw_entries')
          .select('user_id')
          .throwOnError();

        const { data: allSubscriptions } = await supabase
          .from('subscriptions')
          .select('status')
          .eq('status', 'active')
          .throwOnError();

        const draftDraws = (allDraws || []).filter((d) => d.status === 'draft').length;
        const publishedDraws = (allDraws || []).filter((d) => d.status === 'published').length;
        const uniqueParticipants = new Set((allParticipants || []).map((p) => p.user_id)).size;

        setStats({
          totalDraws: allDraws?.length || 0,
          draftDraws,
          publishedDraws,
          totalParticipants: uniqueParticipants,
          totalSubscriptions: allSubscriptions?.length || 0,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="h-12 w-48 animate-pulse rounded-lg bg-gray-300" />
        <div className="grid gap-6 md:grid-cols-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-lg bg-gray-300" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="mt-2 text-gray-600">Platform overview and management tools.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-5">
        {/* Total Draws */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="text-sm font-medium text-gray-600">Total Draws</div>
          <div className="mt-2 text-3xl font-bold text-gray-900">{stats.totalDraws}</div>
          <p className="mt-1 text-xs text-gray-500">
            {stats.draftDraws} draft, {stats.publishedDraws} published
          </p>
        </div>

        {/* Published Draws */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="text-sm font-medium text-gray-600">Published</div>
          <div className="mt-2 text-3xl font-bold text-green-600">{stats.publishedDraws}</div>
          <p className="mt-1 text-xs text-gray-500">Live draws</p>
        </div>

        {/* Total Participants */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="text-sm font-medium text-gray-600">Participants</div>
          <div className="mt-2 text-3xl font-bold text-blue-600">{stats.totalParticipants}</div>
          <p className="mt-1 text-xs text-gray-500">Unique users</p>
        </div>

        {/* Active Subscriptions */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="text-sm font-medium text-gray-600">Active Subscriptions</div>
          <div className="mt-2 text-3xl font-bold text-purple-600">
            {stats.totalSubscriptions}
          </div>
          <p className="mt-1 text-xs text-gray-500">Revenue active</p>
        </div>

        {/* Health Status */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="text-sm font-medium text-gray-600">System Status</div>
          <div className="mt-2 flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-green-500" />
            <span className="font-semibold text-green-600">Operational</span>
          </div>
          <p className="mt-1 text-xs text-gray-500">All systems normal</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Link href="/admin/draws">
            <button className="w-full rounded-lg border-2 border-dashed border-blue-300 bg-blue-50 p-6 text-left hover:bg-blue-100 transition-colors">
              <div className="text-2xl mb-2">🎯</div>
              <h3 className="font-semibold text-gray-900">Manage Draws</h3>
              <p className="mt-1 text-sm text-gray-600">Create, simulate, or publish draws</p>
            </button>
          </Link>

          <Link href="/admin/charities">
            <button className="w-full rounded-lg border-2 border-dashed border-green-300 bg-green-50 p-6 text-left hover:bg-green-100 transition-colors">
              <div className="text-2xl mb-2">🤝</div>
              <h3 className="font-semibold text-gray-900">Manage Charities</h3>
              <p className="mt-1 text-sm text-gray-600">Add, edit, or feature charities</p>
            </button>
          </Link>

          <Link href="/admin/users">
            <button className="w-full rounded-lg border-2 border-dashed border-purple-300 bg-purple-50 p-6 text-left hover:bg-purple-100 transition-colors">
              <div className="text-2xl mb-2">👥</div>
              <h3 className="font-semibold text-gray-900">View Users</h3>
              <p className="mt-1 text-sm text-gray-600">Monitor user subscriptions & activity</p>
            </button>
          </Link>
        </div>
      </div>

      {/* Recent Activity Placeholder */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Recent Activity</h2>
        <div className="text-center py-12">
          <p className="text-gray-600">Activity log coming soon...</p>
        </div>
      </div>
    </div>
  );
}
