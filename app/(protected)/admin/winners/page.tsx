"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/db";

interface DrawResult {
  id: string;
  draw_id: string;
  user_id: string;
  match_type: 3 | 4 | 5;
  prize_amount: number;
  payment_status: "pending" | "paid";
  proof_url: string | null;
  created_at: string;
  user?: {
    full_name: string;
    auth_user?: {
      email: string;
    };
  };
}

interface ModalState {
  isOpen: boolean;
  result: DrawResult | null;
  proofUrl: string;
  isApproving: boolean;
}

interface Draw {
  id: string;
  status: string;
  draw_date: string;
}

export default function AdminWinnersPage() {
  const [results, setResults] = useState<DrawResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [tierFilter, setTierFilter] = useState<string>("all");
  const [drawFilter, setDrawFilter] = useState<string>("all");
  const [draws, setDraws] = useState<Draw[]>([]);
  const [modal, setModal] = useState<ModalState>({
    isOpen: false,
    result: null,
    proofUrl: "",
    isApproving: false,
  });

  // Fetch draws for filter dropdown
  useEffect(() => {
    const fetchDraws = async () => {
      const { data } = await supabase
        .from("draws")
        .select("id, status, draw_date")
        .order("draw_date", { ascending: false });
      setDraws(data || []);
    };
    fetchDraws();
  }, []);

  // Fetch results
  useEffect(() => {
    const fetchResults = async () => {
      try {
        setIsLoading(true);
        let query = supabase
          .from("draw_results")
          .select(
            `
            id,
            draw_id,
            user_id,
            match_type,
            prize_amount,
            payment_status,
            proof_url,
            created_at,
            profiles (
              full_name,
              auth_user_id
            )
          `,
          )
          .order("created_at", { ascending: false });

        if (statusFilter !== "all") {
          query = query.eq("payment_status", statusFilter);
        }

        if (tierFilter !== "all") {
          query = query.eq("match_type", parseInt(tierFilter));
        }

        if (drawFilter !== "all") {
          query = query.eq("draw_id", drawFilter);
        }

        const { data, error } = await query;

        if (error) throw error;

        // Enrich with user email
        if (data) {
          const enriched = await Promise.all(
            data.map(async (result: DrawResult) => {
              if (result.user?.auth_user?.email) {
                return result; // Already has email
              }
              // If we don't have user data yet, try to fetch it
              return result;
            }),
          );
          setResults(enriched);
        }
      } catch (error) {
        console.error("Error fetching results:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchResults();
  }, [statusFilter, tierFilter, drawFilter]);

  const getTierColor = (tier: number) => {
    switch (tier) {
      case 5:
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case 4:
        return "bg-blue-100 text-blue-800 border-blue-300";
      case 3:
        return "bg-green-100 text-green-800 border-green-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "paid":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleApprove = async () => {
    if (!modal.result) return;

    setModal({ ...modal, isApproving: true });

    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;

      const response = await fetch("/api/admin/results/approve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          resultId: modal.result.id,
          proofUrl: modal.proofUrl,
        }),
      });

      if (!response.ok) throw new Error("Failed to approve");

      // Update local state
      setResults(
        results.map((r) =>
          r.id === modal.result!.id
            ? { ...r, payment_status: "paid", proof_url: modal.proofUrl }
            : r,
        ),
      );

      setModal({
        isOpen: false,
        result: null,
        proofUrl: "",
        isApproving: false,
      });
      toast.success("Winner approved and marked as paid!");
    } catch (error) {
      console.error("Error approving:", error);
      toast.error("Failed to approve winner");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="h-12 w-48 animate-pulse rounded-lg bg-gray-300" />
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-lg bg-gray-300"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Winners & Payouts</h1>
        <p className="mt-2 text-gray-600">
          Manage and approve payout requests from draw winners.
        </p>
      </div>

      {/* Filters */}
      <div className="grid gap-4 grid-cols-3 md:grid-cols-1">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Draw
          </label>
          <select
            value={drawFilter}
            onChange={(e) => setDrawFilter(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2"
          >
            <option value="all">All Draws</option>
            {draws.map((d) => (
              <option
                key={d.id}
                value={d.id}
              >
                {new Date(d.draw_date).toLocaleDateString()} - {d.status}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tier
          </label>
          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2"
          >
            <option value="all">All Tiers</option>
            <option value="5">Tier 5 (5 matches)</option>
            <option value="4">Tier 4 (4 matches)</option>
            <option value="3">Tier 3 (3 matches)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending Payout</option>
            <option value="paid">Paid</option>
          </select>
        </div>
      </div>

      {/* Results List */}
      <div className="space-y-4">
        {results.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-12 text-center">
            <p className="text-gray-600">No winners found</p>
          </div>
        ) : (
          results.map((result) => (
            <div
              key={result.id}
              className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
            >
              <div className="flex items-center justify-between gap-4">
                {/* Info */}
                <div className="flex-1">
                  <a
                    onClick={() => setModal({ ...modal, isOpen: true, result })}
                    className="font-semibold text-gray-900 cursor-pointer hover:underline"
                  >
                    {result.user?.full_name || "Unknown User"}
                  </a>
                  <p className="text-sm text-gray-600">
                    {result.user?.auth_user?.email}
                  </p>

                  <div className="mt-2 flex gap-2">
                    <span
                      className={`inline-block rounded-full px-3 py-1 text-xs font-semibold border ${getTierColor(result.match_type)}`}
                    >
                      Tier {result.match_type}
                    </span>
                    <span
                      className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${getStatusColor(result.payment_status)}`}
                    >
                      {result.payment_status === "pending"
                        ? "Pending Payout"
                        : "Paid"}
                    </span>
                  </div>
                </div>

                {/* Amount */}
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900">
                    ₹{result.prize_amount?.toLocaleString("en-IN") || "0"}
                  </p>
                  <p className="text-sm text-gray-600">
                    {result.match_type} matches
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  {result.payment_status === "pending" && (
                    <>
                      <button
                        onClick={() =>
                          setModal({
                            ...modal,
                            isOpen: true,
                            result,
                            proofUrl: result.proof_url || "",
                          })
                        }
                        className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
                      >
                        Approve
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Approval Modal */}
      {modal.isOpen && modal.result && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="rounded-lg bg-white p-8 shadow-lg max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Approve Winner
            </h2>

            <div className="space-y-4 mb-6">
              <div>
                <p className="text-sm text-gray-600">User</p>
                <p className="font-semibold text-gray-900">
                  {modal.result.user?.full_name}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-600">Prize Amount</p>
                <p className="text-2xl font-bold text-gray-900">
                  ₹{modal.result.prize_amount?.toLocaleString("en-IN") || "0"}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Proof URL (receipt/transaction ID)
                </label>
                <input
                  type="url"
                  value={modal.proofUrl}
                  onChange={(e) =>
                    setModal({ ...modal, proofUrl: e.target.value })
                  }
                  placeholder="https://..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() =>
                  setModal({
                    isOpen: false,
                    result: null,
                    proofUrl: "",
                    isApproving: false,
                  })
                }
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleApprove}
                disabled={modal.isApproving || !modal.proofUrl}
                className="flex-1 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {modal.isApproving ? "Approving..." : "Approve"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
