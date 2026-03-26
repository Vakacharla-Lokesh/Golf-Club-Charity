"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/db";

interface Draw {
  id: string;
  draw_date: string;
  status: "draft" | "simulated" | "published";
  winning_numbers: number[] | null;
  draw_type: string;
  created_at: string;
}

export default function AdminDrawsPage() {
  const [draws, setDraws] = useState<Draw[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    const fetchDraws = async () => {
      try {
        let query = supabase
          .from("draws")
          .select("*")
          .order("draw_date", { ascending: false });

        if (statusFilter !== "all") {
          query = query.eq("status", statusFilter);
        }

        const { data, error } = await query;

        if (error) throw error;
        setDraws(data || []);
      } catch (error) {
        console.error("Error fetching draws:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDraws();
  }, [statusFilter]);

  const getStatusBadge = (status: string) => {
    const badges = {
      draft: "bg-gray-100 text-gray-800",
      simulated: "bg-yellow-100 text-yellow-800",
      published: "bg-green-100 text-green-800",
    };
    return badges[status as keyof typeof badges] || badges.draft;
  };

  const handleCreateDraw = async () => {
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const { data, error } = await supabase
        .from("draws")
        .insert({
          draw_date: tomorrow.toISOString().split("T")[0],
          status: "draft",
        })
        .select()
        .single();

      if (error) throw error;

      setDraws([data, ...draws]);
      alert("Draw created successfully!");
    } catch (error) {
      console.error("Error creating draw:", error);
      alert("Failed to create draw");
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manage Draws</h1>
          <p className="mt-2 text-gray-600">
            Create, simulate, and publish lottery draws.
          </p>
        </div>
        <button
          onClick={handleCreateDraw}
          className="rounded-lg bg-blue-600 px-6 py-2 font-medium text-white hover:bg-blue-700"
        >
          + Create Draw
        </button>
      </div>

      {/* Status Filter */}
      <div className="flex gap-2">
        {["all", "draft", "simulated", "published"].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`rounded-lg px-4 py-2 font-medium transition-colors ${
              statusFilter === status
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-900 hover:bg-gray-300"
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Draws List */}
      <div className="space-y-4">
        {draws.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-12 text-center">
            <p className="text-gray-600">No draws found</p>
          </div>
        ) : (
          draws.map((draw) => (
            <div
              key={draw.id}
              className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
            >
              <div className="flex-1">
                <div className="flex items-center gap-4">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      Draw — {new Date(draw.draw_date).toLocaleDateString()}
                    </h3>
                    <p className="mt-1 text-sm text-gray-600">
                      Created {new Date(draw.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadge(
                      draw.status,
                    )}`}
                  >
                    {draw.status.charAt(0).toUpperCase() + draw.status.slice(1)}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                {draw.status === "draft" && (
                  <Link href={`/admin/draws/${draw.id}/simulate`}>
                    <button className="rounded-lg bg-yellow-600 px-4 py-2 text-sm font-medium text-white hover:bg-yellow-700">
                      Simulate
                    </button>
                  </Link>
                )}

                {draw.status === "simulated" && (
                  <Link href={`/admin/draws/${draw.id}/publish`}>
                    <button className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700">
                      Publish
                    </button>
                  </Link>
                )}

                {(draw.status === "simulated" ||
                  draw.status === "published") && (
                  <Link href={`/admin/draws/${draw.id}`}>
                    <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
                      View
                    </button>
                  </Link>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
