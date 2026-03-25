'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/db';
import { PRIZE_SPLIT } from '@/lib/constants';

interface Draw {
  id: string;
  draw_date: string;
  status: 'draft' | 'simulated' | 'published';
  winning_numbers: number[] | null;
}

interface DrawResult {
  id: string;
  draw_id: string;
  user_id: string;
  match_type: number;
  prize_amount: number;
}

interface PrizePool {
  id: string;
  draw_id: string;
  tier_5: number;
  tier_4: number;
  tier_3: number;
}

export default function DrawPublishPage() {
  const params = useParams();
  const router = useRouter();
  const drawId = params.id as string;

  const [draw, setDraw] = useState<Draw | null>(null);
  const [results, setResults] = useState<DrawResult[]>([]);
  const [prizePool, setPrizePool] = useState<PrizePool | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch draw
        const { data: drawData, error: drawError } = await supabase
          .from('draws')
          .select('*')
          .eq('id', drawId)
          .single();

        if (drawError || !drawData) {
          alert('Draw not found');
          router.push('/admin/draws');
          return;
        }

        setDraw(drawData);

        // Fetch results
        const { data: resultsData } = await supabase
          .from('draw_results')
          .select('*')
          .eq('draw_id', drawId);

        setResults(resultsData || []);

        // Fetch prize pool
        const { data: poolData } = await supabase
          .from('prize_pools')
          .select('*')
          .eq('draw_id', drawId)
          .single();

        if (poolData) {
          setPrizePool(poolData);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [drawId, router]);

  const handlePublish = async () => {
    try {
      setIsPublishing(true);

      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;

      if (!token) {
        alert('Not authenticated');
        return;
      }

      // 1. Publish draw (creates entries and results)
      const publishResponse = await fetch('/api/draws/publish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ drawId }),
      });

      if (!publishResponse.ok) {
        const error = await publishResponse.json();
        throw new Error(error.error || 'Publish failed');
      }

      const publishData = await publishResponse.json();

      // 2. Calculate prize pools
      const prizeResponse = await fetch('/api/draws/prize-calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ drawId }),
      });

      if (!prizeResponse.ok) {
        const error = await prizeResponse.json();
        throw new Error(error.error || 'Prize calculation failed');
      }

      alert(
        `Draw published successfully!\n\nWinners by tier:\n` +
        `Tier 5 (5 matches): ${publishData.winnersByTier.tier5}\n` +
        `Tier 4 (4 matches): ${publishData.winnersByTier.tier4}\n` +
        `Tier 3 (3 matches): ${publishData.winnersByTier.tier3}`
      );

      setTimeout(() => router.push(`/admin/winners?drawId=${drawId}`), 2000);
    } catch (error) {
      console.error('Error publishing draw:', error);
      alert(`Failed to publish draw: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsPublishing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="h-12 w-48 animate-pulse rounded-lg bg-gray-300" />
      </div>
    );
  }

  if (!draw) {
    return <div>Draw not found</div>;
  }

  const tier5Winners = results.filter((r) => r.match_type === 5).length;
  const tier4Winners = results.filter((r) => r.match_type === 4).length;
  const tier3Winners = results.filter((r) => r.match_type === 3).length;

  const totalPrizePool = (prizePool?.tier_5 || 0) + (prizePool?.tier_4 || 0) + (prizePool?.tier_3 || 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Publish Draw</h1>
          <p className="mt-2 text-gray-600">
            Final Review - {new Date(draw.draw_date).toLocaleDateString()}
          </p>
        </div>
        <Link href="/admin/draws">
          <button className="rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-900 hover:bg-gray-50">
            ← Back
          </button>
        </Link>
      </div>

      {/* Draw Info */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Draw Information</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-sm text-gray-600">Draw Date</p>
            <p className="mt-1 text-lg font-semibold text-gray-900">
              {new Date(draw.draw_date).toLocaleDateString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Winning Numbers</p>
            <p className="mt-1 text-lg font-semibold text-gray-900 font-mono">
              {draw.winning_numbers?.join(', ') || 'Not generated'}
            </p>
          </div>
        </div>
      </div>

      {/* Prize Pool Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-600">Total Prize Pool</p>
          <p className="mt-1 text-2xl font-bold text-green-600">₹{totalPrizePool.toFixed(2)}</p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-600">5-Match Winners</p>
          <p className="mt-1 text-2xl font-bold text-blue-600">{tier5Winners}</p>
          <p className="text-xs text-gray-500 mt-1">₹{(prizePool?.tier_5 || 0).toFixed(2)} (40%)</p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-600">4-Match Winners</p>
          <p className="mt-1 text-2xl font-bold text-purple-600">{tier4Winners}</p>
          <p className="text-xs text-gray-500 mt-1">₹{(prizePool?.tier_4 || 0).toFixed(2)} (35%)</p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-600">3-Match Winners</p>
          <p className="mt-1 text-2xl font-bold text-orange-600">{tier3Winners}</p>
          <p className="text-xs text-gray-500 mt-1">₹{(prizePool?.tier_3 || 0).toFixed(2)} (25%)</p>
        </div>
      </div>

      {/* Winners Table */}
      {results.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Winners</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-4 py-2 text-left font-semibold text-gray-700">User ID</th>
                  <th className="px-4 py-2 text-center font-semibold text-gray-700">Match Type</th>
                  <th className="px-4 py-2 text-right font-semibold text-gray-700">Prize Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                {results
                  .sort((a, b) => b.match_type - a.match_type)
                  .map((result) => (
                    <tr key={result.id} className="border-b border-gray-100">
                      <td className="px-4 py-2 font-mono text-gray-600">
                        {result.user_id.slice(0, 12)}...
                      </td>
                      <td className="px-4 py-2 text-center">
                        <span className="inline-block rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-800">
                          {result.match_type}-Match
                        </span>
                      </td>
                      <td className="px-4 py-2 text-right font-semibold text-green-600">
                        ₹{result.prize_amount.toFixed(2)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {draw.status === 'simulated' && (
        <div className="flex gap-4">
          <button
            onClick={handlePublish}
            disabled={isPublishing}
            className="flex-1 rounded-lg bg-green-600 px-6 py-3 font-semibold text-white hover:bg-green-700 disabled:opacity-50"
          >
            {isPublishing ? 'Publishing...' : 'Publish Draw Now'}
          </button>
          <Link href={`/admin/draws/${draw.id}/simulate`}>
            <button className="rounded-lg border border-gray-300 px-6 py-3 font-semibold text-gray-900 hover:bg-gray-50">
              Re-simulate
            </button>
          </Link>
        </div>
      )}

      {draw.status === 'published' && (
        <div className="rounded-lg bg-green-50 border border-green-200 p-6">
          <h3 className="font-semibold text-green-900">✓ Draw Published</h3>
          <p className="mt-2 text-green-800">
            This draw is now live and visible to all participants.
          </p>
        </div>
      )}
    </div>
  );
}
