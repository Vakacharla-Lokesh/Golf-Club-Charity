import { GolfScore } from '@/lib/types';

interface ScoresListProps {
  scores: GolfScore[];
  isLoading?: boolean;
}

export function ScoresList({ scores, isLoading = false }: ScoresListProps) {
  if (isLoading) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
        <div className="animate-pulse space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 rounded-lg bg-gray-200" />
          ))}
        </div>
      </div>
    );
  }

  if (scores.length === 0) {
    return (
      <div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center">
        <p className="text-gray-600">No scores yet. Add your first score above!</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Your Scores</h3>
        <span className="inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800">
          {scores.length}/5
        </span>
      </div>

      <div className="space-y-2">
        {scores.map((score) => (
          <div
            key={score.id}
            className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
          >
            <div>
              <div className="text-lg font-semibold text-gray-900">
                {score.score}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">
                {new Date(score.played_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
