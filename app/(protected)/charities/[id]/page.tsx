'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/db';
import { Charity } from '@/lib/types';

export default function CharityDetailPage() {
  const params = useParams();
  const router = useRouter();
  const charityId = params.id as string;

  const [charity, setCharity] = useState<Charity | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCharity = async () => {
      if (!charityId) return;

      try {
        const { data, error: fetchError } = await supabase
          .from('charities')
          .select('*')
          .eq('id', charityId)
          .eq('is_active', true)
          .single();

        if (fetchError || !data) {
          setError('Charity not found');
          return;
        }

        setCharity(data);
      } catch (err) {
        console.error('Error fetching charity:', err);
        setError('Failed to load charity details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCharity();
  }, [charityId]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-64 animate-pulse rounded-lg bg-gray-300" />
        <div className="h-12 w-48 animate-pulse rounded-lg bg-gray-300" />
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-4 animate-pulse rounded-lg bg-gray-300" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !charity) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6">
        <h2 className="font-semibold text-red-900">{error || 'Charity not found'}</h2>
        <p className="mt-2 text-red-700">
          The charity you're looking for doesn't exist or is no longer available.
        </p>
        <Link href="/charities">
          <button className="mt-4 rounded-lg bg-red-600 px-4 py-2 font-medium text-white hover:bg-red-700">
            ← Back to Charities
          </button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Back Button */}
      <Link href="/charities">
        <button className="flex items-center text-blue-600 hover:text-blue-700 font-medium">
          ← Back to Charities
        </button>
      </Link>

      {/* Charity Header */}
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
        {/* Hero Image */}
        <div className="h-64 bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center overflow-hidden">
          {charity.image_url ? (
            <img
              src={charity.image_url}
              alt={charity.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="text-white text-6xl">🤝</div>
          )}
        </div>

        {/* Details */}
        <div className="p-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900">{charity.name}</h1>
              {charity.is_featured && (
                <span className="mt-2 inline-block rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-800">
                  ⭐ Featured Charity
                </span>
              )}
            </div>
          </div>

          <div className="mt-6 prose prose-sm max-w-none text-gray-700">
            <p>{charity.description || 'No description available'}</p>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/dashboard">
              <button className="flex-1 rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700 transition-colors">
                Support This Charity
              </button>
            </Link>
            <a
              href="https://example.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 rounded-lg border border-gray-300 px-6 py-3 font-medium text-gray-900 hover:bg-gray-50 transition-colors text-center"
            >
              Learn More
            </a>
          </div>
        </div>
      </div>

      {/* Additional Info */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Total Supported */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="text-sm font-medium text-gray-600">Total Supporters</div>
          <div className="mt-2 text-3xl font-bold text-green-600">0</div>
          <p className="mt-1 text-sm text-gray-500">Users supporting this charity</p>
        </div>

        {/* Amount Raised */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="text-sm font-medium text-gray-600">Amount Raised</div>
          <div className="mt-2 text-3xl font-bold text-green-600">₹0.00</div>
          <p className="mt-1 text-sm text-gray-500">From subscriptions</p>
        </div>

        {/* Participation Rate */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="text-sm font-medium text-gray-600">Participation</div>
          <div className="mt-2 text-3xl font-bold text-cyan-600">0%</div>
          <p className="mt-1 text-sm text-gray-500">Of total platform</p>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
        <h3 className="text-xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h3>
        <div className="space-y-6">
          <div>
            <h4 className="font-semibold text-gray-900">How are charities selected?</h4>
            <p className="mt-2 text-gray-600">
              Charities are carefully vetted and selected based on their transparency, impact, and alignment with our platform values.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900">How much of my subscription goes to the charity?</h4>
            <p className="mt-2 text-gray-600">
              You control the percentage! You can set anywhere from 10% to 100% of your subscription amount to go to your selected charity.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900">Can I change my charity selection?</h4>
            <p className="mt-2 text-gray-600">
              Yes! You can change your charity selection anytime from your dashboard. The change takes effect on your next billing cycle.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
