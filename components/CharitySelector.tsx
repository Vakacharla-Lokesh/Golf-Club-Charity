'use client';

import { useState } from 'react';
import { Charity } from '@/lib/types';
import { CHARITY_PERCENTAGE_MIN, CHARITY_PERCENTAGE_MAX } from '@/lib/constants';

interface CharitySelectorProps {
  charities: Charity[];
  selectedId: string | null;
  selectedPercentage: number;
  onUpdate: (charityId: string, percentage: number) => Promise<void>;
  isLoading?: boolean;
}

export function CharitySelector({
  charities,
  selectedId,
  selectedPercentage,
  onUpdate,
  isLoading = false,
}: CharitySelectorProps) {
  const [localCharityId, setLocalCharityId] = useState(selectedId || '');
  const [localPercentage, setLocalPercentage] = useState(selectedPercentage);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!localCharityId) {
      alert('Please select a charity');
      return;
    }

    try {
      setIsSaving(true);
      await onUpdate(localCharityId, localPercentage);
    } finally {
      setIsSaving(false);
    }
  };

  const isDisabled = isSaving || isLoading;

  return (
    <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="font-semibold text-gray-900">Select Charity</h3>

      {/* Charity Dropdown */}
      <div>
        <label htmlFor="charity" className="block text-sm font-medium text-gray-700">
          Organization
        </label>
        <select
          id="charity"
          value={localCharityId}
          onChange={(e) => setLocalCharityId(e.target.value)}
          disabled={isDisabled}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50"
        >
          <option value="">-- Choose a charity --</option>
          {charities.map((charity) => (
            <option key={charity.id} value={charity.id}>
              {charity.name}
            </option>
          ))}
        </select>
      </div>

      {/* Percentage Slider */}
      <div>
        <div className="flex items-center justify-between">
          <label htmlFor="percentage" className="block text-sm font-medium text-gray-700">
            Contribution %
          </label>
          <span className="text-sm font-semibold text-blue-600">{localPercentage}%</span>
        </div>
        <input
          id="percentage"
          type="range"
          min={CHARITY_PERCENTAGE_MIN}
          max={CHARITY_PERCENTAGE_MAX}
          value={localPercentage}
          onChange={(e) => setLocalPercentage(parseInt(e.target.value, 10))}
          disabled={isDisabled}
          className="mt-2 w-full"
        />
        <p className="mt-1 text-xs text-gray-500">
          Of your subscription amount goes to this charity
        </p>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={isDisabled}
        className="w-full rounded-lg bg-blue-600 py-2 font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
      >
        {isSaving ? 'Saving...' : 'Save Charity Selection'}
      </button>
    </div>
  );
}
