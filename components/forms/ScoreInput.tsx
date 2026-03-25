'use client';

import { useState } from 'react';
import { GolfScore } from '@/lib/types';
import { GOLF_SCORE_MIN, GOLF_SCORE_MAX } from '@/lib/constants';

interface ScoreInputProps {
  onSubmit: (score: GolfScore) => Promise<void>;
  isLoading?: boolean;
  disabled?: boolean;
}

export function ScoreInput({
  onSubmit,
  isLoading = false,
  disabled = false,
}: ScoreInputProps) {
  const [score, setScore] = useState('');
  const [playedAt, setPlayedAt] = useState('');
  const [error, setError] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate
    if (!score || !playedAt) {
      setError('Please enter both score and date');
      return;
    }

    const scoreNum = parseInt(score, 10);
    if (scoreNum < GOLF_SCORE_MIN || scoreNum > GOLF_SCORE_MAX) {
      setError(
        `Score must be between ${GOLF_SCORE_MIN} and ${GOLF_SCORE_MAX}`
      );
      return;
    }

    try {
      setIsSending(true);

      const response = await fetch('/api/scores/upsert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          score: scoreNum,
          playedAt: new Date(playedAt).toISOString(),
        }),
      });

      if (!response.ok) {
        const result = await response.json();
        setError(result.error || 'Failed to save score');
        return;
      }

      const result = await response.json();
      await onSubmit(result.score);

      // Clear form
      setScore('');
      setPlayedAt('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSending(false);
    }
  };

  const isSubmitting = isSending || isLoading;

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
      <h3 className="font-semibold text-gray-900">Add Golf Score</h3>

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        {/* Score Input */}
        <div>
          <label htmlFor="score" className="block text-sm font-medium text-gray-700">
            Score
          </label>
          <input
            id="score"
            type="number"
            min={GOLF_SCORE_MIN}
            max={GOLF_SCORE_MAX}
            value={score}
            onChange={(e) => setScore(e.target.value)}
            disabled={isSubmitting || disabled}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-200"
            placeholder="1-45"
          />
        </div>

        {/* Date Input */}
        <div>
          <label htmlFor="playedAt" className="block text-sm font-medium text-gray-700">
            Date
          </label>
          <input
            id="playedAt"
            type="date"
            value={playedAt}
            onChange={(e) => setPlayedAt(e.target.value)}
            disabled={isSubmitting || disabled}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-200"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting || disabled}
        className="w-full rounded-lg bg-blue-600 py-2 font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
      >
        {isSubmitting ? 'Saving...' : 'Add Score'}
      </button>

      <p className="text-xs text-gray-500">
        Maximum 5 scores. Adding a 6th will replace the oldest.
      </p>
    </form>
  );
}
