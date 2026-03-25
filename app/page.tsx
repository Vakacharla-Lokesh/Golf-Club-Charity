'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/db';
import { Charity } from '@/lib/types';

export default function HomePage() {
  const router = useRouter();
  const [featuredCharities, setFeaturedCharities] = useState<Charity[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
      setIsChecking(false);
    };

    checkAuth();

    // Fetch featured charities
    const fetchCharities = async () => {
      const { data } = await supabase
        .from('charities')
        .select('*')
        .eq('is_active', true)
        .eq('is_featured', true)
        .limit(3);

      setFeaturedCharities(data || []);
    };

    fetchCharities();
  }, []);

  const handleCTA = () => {
    if (isAuthenticated) {
      router.push('/dashboard');
    } else {
      router.push('/signup');
    }
  };

  if (isChecking) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="bg-white">
      {/* Navigation */}
      <nav className="flex items-center justify-between p-6 lg:px-8">
        <div className="flex lg:flex-1">
          <Link href="/" className="text-2xl font-bold text-blue-600">
            ⛳ GolfCharity
          </Link>
        </div>
        <div className="flex gap-4">
          {!isAuthenticated && (
            <>
              <Link href="/login">
                <button className="rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-900 hover:bg-gray-50">
                  Sign In
                </button>
              </Link>
              <Link href="/signup">
                <button className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700">
                  Sign Up
                </button>
              </Link>
            </>
          )}
          {isAuthenticated && (
            <Link href="/dashboard">
              <button className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700">
                Dashboard
              </button>
            </Link>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="px-6 py-24 sm:py-32 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-5xl font-bold tracking-tight text-gray-900 sm:text-6xl">
            Play Golf, Support Charities
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-gray-600">
            Subscribe to participate in golf draws and support the charities you care about. Every subscription directly funds charitable causes.
          </p>
          <div className="mt-10 flex items-center justify-center gap-6">
            <button
              onClick={handleCTA}
              className="rounded-lg bg-blue-600 px-8 py-3 font-semibold text-white hover:bg-blue-700 transition-colors"
            >
              Get Started Now
            </button>
            <Link href="/charities">
              <button className="rounded-lg border border-gray-300 px-8 py-3 font-semibold text-gray-900 hover:bg-gray-50 transition-colors">
                View Charities
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-gray-50 px-6 py-24 sm:py-32 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-3xl font-bold text-gray-900 sm:text-4xl">
            How It Works
          </h2>
          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {/* Step 1 */}
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-blue-600 text-white">
                <span className="text-lg font-bold">1</span>
              </div>
              <h3 className="mt-4 font-semibold text-gray-900">Subscribe</h3>
              <p className="mt-2 text-gray-600">
                Choose a monthly or yearly golf subscription plan and select your favorite charity.
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-blue-600 text-white">
                <span className="text-lg font-bold">2</span>
              </div>
              <h3 className="mt-4 font-semibold text-gray-900">Track Scores</h3>
              <p className="mt-2 text-gray-600">
                Log your golf scores and track your performance throughout the month.
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-blue-600 text-white">
                <span className="text-lg font-bold">3</span>
              </div>
              <h3 className="mt-4 font-semibold text-gray-900">Win & Give</h3>
              <p className="mt-2 text-gray-600">
                Participate in draws for prizes while supporting your chosen charity.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Charities */}
      {featuredCharities.length > 0 && (
        <section className="px-6 py-24 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-center text-3xl font-bold text-gray-900 sm:text-4xl">
              Featured Charities
            </h2>
            <div className="mt-16 grid gap-8 md:grid-cols-3">
              {featuredCharities.map((charity) => (
                <Link key={charity.id} href={`/charities/${charity.id}`}>
                  <div className="group cursor-pointer rounded-lg border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                    <div className="h-32 bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                      {charity.image_url ? (
                        <img
                          src={charity.image_url}
                          alt={charity.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="text-white text-4xl">🤝</div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 group-hover:text-blue-600">
                        {charity.name}
                      </h3>
                      <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                        {charity.description}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            <div className="mt-12 text-center">
              <Link href="/charities">
                <button className="rounded-lg border border-gray-300 px-6 py-2 font-semibold text-gray-900 hover:bg-gray-50">
                  Browse All Charities
                </button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="bg-blue-600 px-6 py-16 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Ready to Make a Difference?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-blue-100">
            Join hundreds of golfers supporting charities through our platform.
          </p>
          <button
            onClick={handleCTA}
            className="mt-8 rounded-lg bg-white px-8 py-3 font-semibold text-blue-600 hover:bg-blue-50 transition-colors"
          >
            {isAuthenticated ? 'Go to Dashboard' : 'Get Started for Free'}
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-gray-50 px-6 py-12 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="grid gap-12 md:grid-cols-4">
            <div>
              <h4 className="font-semibold text-gray-900">Platform</h4>
              <ul className="mt-4 space-y-2 text-sm text-gray-600">
                <li>
                  <Link href="/" className="hover:text-gray-900">
                    Home
                  </Link>
                </li>
                <li>
                  <Link href="/charities" className="hover:text-gray-900">
                    Charities
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard" className="hover:text-gray-900">
                    Dashboard
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900">Support</h4>
              <ul className="mt-4 space-y-2 text-sm text-gray-600">
                <li>
                  <a href="#" className="hover:text-gray-900">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-gray-900">
                    Contact Us
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-gray-900">
                    FAQ
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900">Legal</h4>
              <ul className="mt-4 space-y-2 text-sm text-gray-600">
                <li>
                  <a href="#" className="hover:text-gray-900">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-gray-900">
                    Terms of Service
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900">Connect</h4>
              <ul className="mt-4 space-y-2 text-sm text-gray-600">
                <li>
                  <a href="#" className="hover:text-gray-900">
                    Twitter
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-gray-900">
                    Facebook
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-gray-900">
                    Instagram
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 border-t border-gray-200 pt-8 text-center text-sm text-gray-600">
            <p>&copy; 2024 GolfCharity. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
