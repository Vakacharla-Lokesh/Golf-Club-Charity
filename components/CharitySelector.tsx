'use client';

import { useState } from 'react';
import { Charity } from '@/lib/types';
import {
  CHARITY_PERCENTAGE_MAX,
  CHARITY_PERCENTAGE_MIN,
  CHARITY_PERCENTAGE_STEP,
} from '@/lib/constants';

interface CharitySelectorProps {
  charities: Charity[];
  selectedId: string | null;
  selectedPercentage: number;
  onUpdate: (charityId: string, percentage: number) => Promise<void>;
  isLoading?: boolean;
  hasActiveSubscription?: boolean;
}

export function CharitySelector({
  charities,
  selectedId,
  selectedPercentage,
  onUpdate,
  isLoading = false,
  hasActiveSubscription = false,
}: CharitySelectorProps) {
  const [localCharityId, setLocalCharityId] = useState(selectedId || '');
  const [localPercentage, setLocalPercentage] = useState(selectedPercentage);
  const [isSaving, setIsSaving] = useState(false);
  const [showError, setShowError] = useState(false);

  const handleSave = async () => {
    if (!localCharityId) {
      setShowError(true);
      setTimeout(() => setShowError(false), 3000);
      return;
    }

    try {
      setIsSaving(true);
      setShowError(false);
      await onUpdate(localCharityId, localPercentage);
    } catch {
      setShowError(true);
    } finally {
      setIsSaving(false);
    }
  };

  const isDisabled = isSaving || isLoading || !hasActiveSubscription;
  const selectedCharity = charities.find((charity) => charity.id === localCharityId);

  return (
    <div
      className={`space-y-4 rounded-xl border-2 bg-white p-6 shadow-md transition ${
        !hasActiveSubscription
          ? 'border-gray-200 bg-gray-50'
          : 'border-blue-100 hover:border-blue-300'
      }`}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900">Select Your Charity</h3>
        {!hasActiveSubscription && (
          <div className="rounded-full bg-yellow-50 px-2 py-1 text-xs font-semibold text-yellow-700">
            Locked
          </div>
        )}
      </div>

      {!hasActiveSubscription && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
          <p className="text-sm text-blue-800">
            <strong>Subscribe first</strong> to choose and support your favorite charity. Your contribution helps them make a real difference.
          </p>
        </div>
      )}

      <div>
        <label htmlFor="charity" className="block text-sm font-semibold text-gray-700">
          Organization
        </label>
        <div className="relative mt-2">
          <select
            id="charity"
            value={localCharityId}
            onChange={(event) => {
              setLocalCharityId(event.target.value);
              setShowError(false);
            }}
            disabled={isDisabled}
            className={`w-full appearance-none rounded-lg border-2 px-4 py-3 pr-14 text-sm font-medium transition focus:outline-none ${
              isDisabled
                ? 'cursor-not-allowed border-gray-200 bg-gray-50 text-gray-400'
                : 'border-blue-200 bg-white text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
            }`}
          >
            <option value="" className="text-gray-600">
              -- Choose a charity --
            </option>
            {charities.map((charity) => (
              <option key={charity.id} value={charity.id} className="text-gray-900">
                {charity.name}
              </option>
            ))}
          </select>
          {isDisabled && (
            <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
              Lock
            </div>
          )}
        </div>
        {showError && !localCharityId && (
          <p className="mt-2 text-sm font-medium text-red-600">Please select a charity</p>
        )}
      </div>

      {selectedCharity && !isDisabled && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-3">
          <p className="text-sm text-green-800">
            <span className="font-semibold">Selected: {selectedCharity.name}</span>
            {selectedCharity.description && (
              <span className="mt-1 block text-xs text-green-700">{selectedCharity.description}</span>
            )}
          </p>
        </div>
      )}

      <div className={isDisabled ? 'pointer-events-none opacity-50' : ''}>
        <div className="mb-2 flex items-center justify-between">
          <label htmlFor="percentage" className="text-sm font-semibold text-gray-700">
            Your Contribution
          </label>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-blue-600">{localPercentage}</span>
            <span className="text-sm font-medium text-gray-600">%</span>
          </div>
        </div>
        <div className="space-y-2">
          <input
            id="percentage"
            type="range"
            min={CHARITY_PERCENTAGE_MIN}
            max={CHARITY_PERCENTAGE_MAX}
            step={CHARITY_PERCENTAGE_STEP}
            value={localPercentage}
            onChange={(event) => setLocalPercentage(parseInt(event.target.value, 10))}
            disabled={isDisabled}
            className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-blue-200 accent-blue-600 disabled:accent-gray-400"
          />
          <p className="text-xs text-gray-600">
            Every subscription payment, {localPercentage}% goes to{' '}
            {selectedCharity?.name || 'your chosen charity'}.
          </p>
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={isDisabled}
        className={`w-full rounded-lg px-4 py-3 font-semibold transition duration-200 ${
          isDisabled
            ? 'cursor-not-allowed bg-gray-200 text-gray-500'
            : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 hover:shadow-lg active:scale-95'
        } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
      >
        {isSaving ? (
          <span className="flex items-center justify-center gap-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            Saving...
          </span>
        ) : isDisabled ? (
          'Subscribe to Save Selection'
        ) : (
          'Save Charity Selection'
        )}
      </button>
    </div>
  );
}
