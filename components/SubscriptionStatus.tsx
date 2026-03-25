import { Profile } from '@/lib/types';

interface SubscriptionStatusProps {
  profile: Profile;
  onUpgradeClick?: () => void;
}

export function SubscriptionStatus({
  profile,
  onUpgradeClick,
}: SubscriptionStatusProps) {
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

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="font-semibold text-gray-900">Subscription Status</h3>

      <div className="mt-4 space-y-4">
        {/* Status Badge */}
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Status</span>
          <span className={`inline-block rounded-full px-3 py-1 text-sm font-semibold ${statusColor}`}>
            {statusLabel}
          </span>
        </div>

        {/* Plan */}
        <div className="flex items-center justify-between border-t border-gray-100 pt-4">
          <span className="text-gray-600">Plan</span>
          <span className="font-semibold text-gray-900">
            {profile.subscription_plan
              ? profile.subscription_plan.charAt(0).toUpperCase() +
                profile.subscription_plan.slice(1)
              : 'No plan'}
          </span>
        </div>

        {/* Action Button */}
        {profile.subscription_status !== 'active' && (
          <button
            onClick={onUpgradeClick}
            className="mt-4 w-full rounded-lg bg-blue-600 py-2 font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {profile.subscription_status === 'inactive'
              ? 'Start Subscription'
              : 'Renew Subscription'}
          </button>
        )}
      </div>
    </div>
  );
}
