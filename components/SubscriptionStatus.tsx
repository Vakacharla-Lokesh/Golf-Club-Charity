'use client';

import { Profile } from '@/lib/types';
import { supabase } from '@/lib/db';
import { useState } from 'react';
import { toast } from 'sonner';

interface SubscriptionStatusProps {
  profile: Profile;
  onUpgradeClick?: (plan: 'monthly' | 'yearly') => void;
  onCancelSuccess?: () => void;
}

export function SubscriptionStatus({
  profile,
  onUpgradeClick,
  onCancelSuccess,
}: SubscriptionStatusProps) {
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly');
  const [isCancelConfirm, setIsCancelConfirm] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const statusColors = {
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-gray-100 text-gray-800',
    cancelled: 'bg-red-100 text-red-800',
    lapsed: 'bg-yellow-100 text-yellow-800',
  };

  const statusLabels = {
    active: 'Active',
    inactive: 'Inactive',
    cancelled: 'Cancelled',
    lapsed: 'Lapsed',
  };

  const statusColor = statusColors[profile.subscription_status];
  const statusLabel = statusLabels[profile.subscription_status];
  const isActive = profile.subscription_status === 'active';

  const handleCancelSubscription = async () => {
    setIsCancelling(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error('No active session');
      }

      const response = await fetch('/api/stripe/cancel-subscription', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to cancel subscription');
      }

      toast.success('Subscription cancelled successfully');
      setIsCancelConfirm(false);
      onCancelSuccess?.();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to cancel subscription'
      );
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className="rounded-xl border-2 border-green-100 bg-white p-6 shadow-md">
      <h3 className="text-lg font-bold text-gray-900">Subscription Status</h3>

      <div className="mt-4 space-y-4">
        <div className="flex items-center justify-between">
          <span className="font-medium text-gray-700">Status</span>
          <span
            className={`inline-block rounded-full px-4 py-2 text-sm font-bold ${statusColor}`}
          >
            {statusLabel}
          </span>
        </div>

        <div className="flex items-center justify-between border-t border-gray-100 pt-4">
          <span className="font-medium text-gray-700">Plan</span>
          <span className="font-bold text-gray-900">
            {profile.subscription_plan
              ? profile.subscription_plan.charAt(0).toUpperCase() +
                profile.subscription_plan.slice(1)
              : 'No plan'}
          </span>
        </div>

        {!isActive && (
          <div className="space-y-3 border-t border-gray-100 pt-4">
            <p className="text-sm font-semibold text-gray-800">Choose a Plan:</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setSelectedPlan('monthly')}
                className={`rounded-lg border-2 p-3 text-center font-semibold transition ${
                  selectedPlan === 'monthly'
                    ? 'border-blue-600 bg-blue-50 text-blue-900'
                    : 'border-gray-200 bg-white text-gray-900 hover:border-blue-300'
                }`}
              >
                <div className="text-lg">Rs 499</div>
                <div className="text-xs">/month</div>
              </button>

              <button
                onClick={() => setSelectedPlan('yearly')}
                className={`relative rounded-lg border-2 p-3 text-center font-semibold transition ${
                  selectedPlan === 'yearly'
                    ? 'border-green-600 bg-green-50 text-green-900'
                    : 'border-gray-200 bg-white text-gray-900 hover:border-green-300'
                }`}
              >
                <div className="absolute -top-2 right-2 rounded-full bg-green-500 px-2 py-0.5 text-xs font-bold text-white">
                  SAVE 15%
                </div>
                <div className="text-lg">Rs 4999</div>
                <div className="text-xs">/year</div>
              </button>
            </div>
          </div>
        )}

        {!isActive && (
          <button
            onClick={() => onUpgradeClick?.(selectedPlan)}
            className="mt-4 w-full rounded-lg bg-gradient-to-r from-green-600 to-green-700 px-4 py-3 font-bold text-white transition hover:from-green-700 hover:to-green-800 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 active:scale-95"
          >
            {profile.subscription_status === 'inactive'
              ? 'Start Subscription'
              : 'Renew Subscription'}
          </button>
        )}

        {isActive && !isCancelConfirm && (
          <button
            onClick={() => setIsCancelConfirm(true)}
            className="mt-4 w-full rounded-lg bg-red-500 px-4 py-3 font-bold text-white transition hover:bg-red-600 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 active:scale-95"
          >
            Cancel Subscription
          </button>
        )}

        {isActive && isCancelConfirm && (
          <div className="mt-4 space-y-3 rounded-lg border-2 border-red-200 bg-red-50 p-4">
            <p className="text-sm font-semibold text-red-800">
              Are you sure you want to cancel your subscription?
            </p>
            <p className="text-xs text-red-700">
              You will lose access to charity selection and golf score tracking features.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setIsCancelConfirm(false)}
                className="flex-1 rounded-lg border-2 border-red-300 bg-white px-3 py-2 font-semibold text-red-800 transition hover:bg-red-50"
              >
                Keep Subscription
              </button>
              <button
                onClick={handleCancelSubscription}
                disabled={isCancelling}
                className="flex-1 rounded-lg bg-red-600 px-3 py-2 font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isCancelling ? 'Cancelling...' : 'Confirm Cancel'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
