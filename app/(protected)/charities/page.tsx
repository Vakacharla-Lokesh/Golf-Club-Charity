'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/db';
import { Charity } from '@/lib/types';

export default function CharitiesPage() {
  const [charities, setCharities] = useState<Charity[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCharities = async () => {
      try {
        let query = supabase
          .from('charities')
          .select('*')
          .eq('is_active', true)
          .order('is_featured', { ascending: false })
          .order('name', { ascending: true });

        // Filter by search query if provided
        if (searchQuery) {
          query = query.ilike('name', `%${searchQuery}%`);
        }

        const { data, error } = await query;

        if (error) throw error;
        setCharities(data || []);
      } catch (error) {
        console.error('Error fetching charities:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const debounce = setTimeout(() => {
      fetchCharities();
    }, 300); // Debounce search requests

    return () => clearTimeout(debounce);
  }, [searchQuery]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Supported Charities</h1>
        <p className="mt-2 text-gray-600">
          Choose a charity to support with a portion of your subscription.
        </p>
      </div>

      {/* Search Bar */}
      <div>
        <input
          type="text"
          placeholder="Search charities..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full max-w-md rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-64 animate-pulse rounded-lg bg-gray-300"
            />
          ))}
        </div>
      )}

      {/* Charities Grid */}
      {!isLoading && charities.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {charities.map((charity) => (
            <Link key={charity.id} href={`/charities/${charity.id}`}>
              <div className="group relative h-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md">
                {/* Featured Badge */}
                {charity.is_featured && (
                  <div className="absolute right-0 top-0 rounded-bl-lg bg-blue-600 px-3 py-1 text-xs font-semibold text-white">
                    Featured
                  </div>
                )}

                {/* Image Placeholder */}
                <div className="h-40 bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                  {charity.image_url ? (
                    <img
                      src={charity.image_url}
                      alt={charity.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="text-center text-white">
                      <div className="text-4xl">🤝</div>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex h-full flex-col p-4">
                  <h3 className="font-semibold text-gray-900 group-hover:text-blue-600">
                    {charity.name}
                  </h3>
                  <p className="mt-2 flex-1 text-sm text-gray-600 line-clamp-2">
                    {charity.description || 'No description available'}
                  </p>
                  <button className="mt-4 w-full rounded-lg bg-blue-600 py-2 font-medium text-white hover:bg-blue-700 transition-colors">
                    View Details →
                  </button>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && charities.length === 0 && (
        <div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-12 text-center">
          <div className="text-4xl mb-4">🔍</div>
          <p className="text-gray-600">
            {searchQuery
              ? 'No charities match your search'
              : 'No charities available'}
          </p>
        </div>
      )}
    </div>
  );
}
