"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { supabase } from "@/lib/db";

interface Draw {
  id: string;
  draw_date: string;
  status: "draft" | "simulated" | "published";
  winning_numbers: number[] | null;
  draw_type: string;
}

interface SimulationResult {
  success: boolean;
  winningNumbers: number[];
  totalSubscribers: number;
  matchesByTier: SimulationMatchesByTier;
  summary: SimulationSummary;
}

interface SimulationMatch {
  fullName: string;
  matchCount: number;
  prizeTier: number;
  scores: number[];
  userEmail: string;
  userId: string;
}

interface SimulationMatchesByTier {
  tier5: SimulationMatch[];
  tier4: SimulationMatch[];
  tier3: SimulationMatch[];
  tier0: SimulationMatch[];
}

interface SimulationSummary {
  tier5Count: number;
  tier4Count: number;
  tier3Count: number;
  totalWinners: number;
}

export default function DrawSimulatePage() {
  const params = useParams();
  const router = useRouter();
  const drawId = params.id as string;

  const [draw, setDraw] = useState<Draw | null>(null);
  const [simulation, setSimulation] = useState<SimulationResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchDraw = async () => {
      try {
        const { data, error } = await supabase
          .from("draws")
          .select("*")
          .eq("id", drawId)
          .single();

        if (error || !data) {
          toast.error("Draw not found");
          router.push("/admin/draws");
          return;
        }

        setDraw(data);
      } catch (error) {
        console.error("Error fetching draw:", error);
        toast.error("Failed to load draw");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDraw();
  }, [drawId, router]);

  const handleSimulate = async () => {
    try {
      setIsSimulating(true);

      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;

      if (!token) {
        toast.error("Not authenticated");
        return;
      }

      const response = await fetch("/api/draws/simulate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          drawId,
          drawType: "random",
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Simulation failed");
      }

      const result: SimulationResult = await response.json();
      setSimulation(result);
      toast.success("Draw simulated successfully");
    } catch (error) {
      console.error("Error simulating:", error);
      toast.error(
        `Simulation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    } finally {
      setIsSimulating(false);
    }
  };

  const handleSaveSimulation = async () => {
    if (!simulation) return;

    try {
      setIsSaving(true);

      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;

      if (!token) {
        toast.error("Not authenticated");
        return;
      }

      const response = await fetch("/api/draws/save-simulation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          drawId,
          winningNumbers: simulation.winningNumbers,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Save failed");
      }

      toast.success("Simulation saved! Proceeding to publish...");
      router.push(`/admin/draws/${drawId}/publish`);
    } catch (error) {
      console.error("Error saving:", error);
      toast.error(
        `Failed to save: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    } finally {
      setIsSaving(false);
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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Simulate Draw</h1>
          <p className="mt-2 text-gray-600">
            Draw Date: {new Date(draw.draw_date).toLocaleDateString()}
          </p>
        </div>
        <Link href="/admin/draws">
          <button className="rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-900 hover:bg-gray-50">
            Back
          </button>
        </Link>
      </div>

      {!simulation ? (
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-6">
          <h3 className="font-semibold text-blue-900">Ready to Simulate</h3>
          <p className="mt-2 text-blue-800">
            Click below to run a draw simulation. This will generate winning
            numbers and show potential winners without making any permanent
            changes.
          </p>
          <button
            onClick={handleSimulate}
            disabled={isSimulating}
            className="mt-4 rounded-lg bg-blue-600 px-6 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {isSimulating ? "Simulating..." : "Start Simulation"}
          </button>
        </div>
      ) : (
        <div className="rounded-lg bg-green-50 border border-green-200 p-6">
          <h3 className="font-semibold text-green-900">Simulation Results</h3>
          <p className="mt-2 text-green-800">
            Winning Numbers:{" "}
            <span className="font-mono font-bold text-lg">
              {simulation.winningNumbers.join(", ")}
            </span>
          </p>

          <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-1">
            <div>
              <p className="text-sm text-green-700">Active Subscribers</p>
              <p className="text-2xl font-bold text-green-900">
                {simulation.totalSubscribers}
              </p>
            </div>
            <div>
              <p className="text-sm text-green-700">Total Winners</p>
              <p className="text-2xl font-bold text-green-900">
                {simulation.summary.totalWinners}
              </p>
            </div>
            <div>
              <p className="text-sm text-green-700">
                Tier 5 Winners (5 matches)
              </p>
              <p className="text-2xl font-bold text-yellow-600">
                {simulation.summary.tier5Count}
              </p>
            </div>
            <div>
              <p className="text-sm text-green-700">
                Tier 4 Winners (4 matches)
              </p>
              <p className="text-2xl font-bold text-blue-600">
                {simulation.summary.tier4Count}
              </p>
            </div>
            <div>
              <p className="text-sm text-green-700">
                Tier 3 Winners (3 matches)
              </p>
              <p className="text-2xl font-bold text-green-600">
                {simulation.summary.tier3Count}
              </p>
            </div>
          </div>

          <div className="mt-6 flex gap-2">
            <button
              onClick={handleSaveSimulation}
              disabled={isSaving}
              className="rounded-lg bg-green-600 px-6 py-2 font-medium text-white hover:bg-green-700 disabled:opacity-50"
            >
              {isSaving ? "Saving..." : "Save & Continue to Publish"}
            </button>
            <button
              onClick={() => setSimulation(null)}
              disabled={isSimulating}
              className="rounded-lg border border-green-600 px-6 py-2 font-medium text-green-600 hover:bg-green-50 disabled:opacity-50"
            >
              {isSimulating ? "Running..." : "Run New Simulation"}
            </button>
          </div>
        </div>
      )}

      {/* Match Results */}
      {simulation && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Match Results
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-4 py-2 text-left font-semibold text-gray-700">
                    Name
                  </th>
                  <th className="px-4 py-2 text-left font-semibold text-gray-700">
                    Email
                  </th>
                  <th className="px-4 py-2 text-center font-semibold text-gray-700">
                    Scores
                  </th>
                  <th className="px-4 py-2 text-center font-semibold text-gray-700">
                    Matches
                  </th>
                  <th className="px-4 py-2 text-center font-semibold text-gray-700">
                    Prize Tier
                  </th>
                </tr>
              </thead>
              <tbody>
                {(
                  [
                    ...simulation.matchesByTier.tier5,
                    ...simulation.matchesByTier.tier4,
                    ...simulation.matchesByTier.tier3,
                  ] as SimulationMatch[]
                )
                  .sort((a, b) => b.matchCount - a.matchCount)
                  .map((result) => (
                    <tr
                      key={result.userId}
                      className="border-b border-gray-100"
                    >
                      <td className="px-4 py-2 font-medium text-gray-900">
                        {result.fullName}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-600">
                        {result.userEmail}
                      </td>
                      <td className="px-4 py-2 text-center text-sm text-gray-600">
                        {result.scores.join(", ")}
                      </td>
                      <td className="px-4 py-2 text-center font-semibold text-gray-900">
                        {result.matchCount}
                      </td>
                      <td className="px-4 py-2 text-center">
                        <span className="inline-block rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-800">
                          Tier {result.prizeTier}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 p-4 rounded-lg bg-gray-50">
            <p className="text-sm text-gray-600">
              Total Winners:{" "}
              <span className="font-semibold">
                {simulation.summary.totalWinners}
              </span>
            </p>
            <p className="text-sm text-gray-600 mt-1">
              5-Match Winners:{" "}
              <span className="font-semibold">
                {simulation.summary.tier5Count}
              </span>
            </p>
            <p className="text-sm text-gray-600 mt-1">
              4-Match Winners:{" "}
              <span className="font-semibold">
                {simulation.summary.tier4Count}
              </span>
            </p>
            <p className="text-sm text-gray-600 mt-1">
              3-Match Winners:{" "}
              <span className="font-semibold">
                {simulation.summary.tier3Count}
              </span>
            </p>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      {simulation && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Draw Summary
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600">Winning Numbers</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">
                {simulation.winningNumbers.join(", ")}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Subscribers</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">
                {simulation.totalSubscribers}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Winners</p>
              <p className="mt-1 text-2xl font-bold text-blue-600">
                {simulation.summary.totalWinners}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Winner Percentage</p>
              <p className="mt-1 text-2xl font-bold text-blue-600">
                {simulation.totalSubscribers > 0
                  ? (
                      (simulation.summary.totalWinners /
                        simulation.totalSubscribers) *
                      100
                    ).toFixed(1)
                  : 0}
                %
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
