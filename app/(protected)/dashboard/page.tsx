'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { supabase } from '@/lib/db';
import { Profile, Charity, GolfScore } from '@/lib/types';
import { SubscriptionStatus } from '@/components/SubscriptionStatus';
import { CharitySelector } from '@/components/CharitySelector';
import { ScoreInput } from '@/components/forms/ScoreInput';
import { ScoresList } from '@/components/ScoresList';
import { STRIPE_PLAN_MONTHLY, STRIPE_PLAN_YEARLY } from '@/lib/constants';

export default function DashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [charities, setCharities] = useState<Charity[]>([]);
  const [scores, setScores] = useState<GolfScore[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get authenticated user
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push('/login');
          return;
        }

        // Fetch profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError || !profileData) {
          console.error('Error fetching profile:', profileError);
          return;
        }

        setProfile(profileData);

        // Fetch charities
        const { data: charitiesData } = await supabase
          .from('charities')
          .select('*')
          .eq('is_active', true)
          .order('is_featured', { ascending: false });

        setCharities(charitiesData || []);

        // Fetch scores
        const { data: scoresData } = await supabase
          .from('golf_scores')
          .select('*')
          .eq('user_id', user.id)
          .order('played_at', { ascending: false });

        setScores(scoresData || []);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const handleCharityUpdate = async (charityId: string, percentage: number) => {
    try {
      const response = await fetch('/api/profile/update-charity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          charityId,
          charityPercentage: percentage,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update charity');
      }

      const { profile: updatedProfile } = await response.json();
      setProfile(updatedProfile);
    } catch (error) {
      console.error('Error updating charity:', error);
      alert('Failed to update charity selection');
    }
  };

  const handleScoreSaved = async () => {
    // Refetch scores
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data: scoresData } = await supabase
      .from('golf_scores')
      .select('*')
      .eq('user_id', user.id)
      .order('played_at', { ascending: false });

    setScores(scoresData || []);
  };

  const handleSubscribeClick = async () => {
    try {
      // For now, open checkout for monthly plan
      // In a real app, user would select plan
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId: STRIPE_PLAN_MONTHLY,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error('Error starting checkout:', error);
      toast.error('Failed to start checkout');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="h-12 w-48 animate-pulse rounded-lg bg-gray-300" />
        <div className="grid gap-6 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-64 animate-pulse rounded-lg bg-gray-300" />
          ))}
        </div>
      </div>
    );
  }

  if (!profile) {
    return <div className="text-center text-red-600">Failed to load profile</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Welcome, {profile.full_name}!</h1>
        <p className="mt-2 text-gray-600">
          Play golf, track scores, and support charities.
        </p>
      </div>

      {/* Dashboard Grid: 5 Modules */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Module 1: Subscription Status */}
        <SubscriptionStatus profile={profile} onUpgradeClick={handleSubscribeClick} />

        {/* Module 2: Charity Selection */}
        <CharitySelector
          charities={charities}
          selectedId={profile.charity_id}
          selectedPercentage={profile.charity_percentage}
          onUpdate={handleCharityUpdate}
        />

        {/* Module 3: Score Entry */}
        <div className="lg:col-span-2">
          <ScoreInput
            onSubmit={handleScoreSaved}
            disabled={profile.subscription_status !== 'active'}
          />
          {profile.subscription_status !== 'active' && (
            <p className="mt-2 text-sm text-yellow-700">
              ⚠️ Score entry is disabled. Please activate your subscription to enter scores.
            </p>
          )}
        </div>

        {/* Module 4: Scores Summary */}
        <div className="lg:col-span-2">
          <ScoresList scores={scores} />
        </div>

        {/* Module 5: Participation & Winnings */}
        <div className="lg:col-span-2 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900">Participation & Winnings</h3>
          <div className="mt-4 space-y-4">
            <div>
              <p className="text-sm text-gray-600">Total Winnings</p>
              <p className="mt-1 text-3xl font-bold text-green-600">₹0.00</p>
            </div>
            <div className="rounded-lg bg-gray-50 p-4">
              <p className="text-sm text-gray-600">
                No draws yet. Draws will be published soon!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
