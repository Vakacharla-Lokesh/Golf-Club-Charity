"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/db";
import { Charity } from "@/lib/types";

export default function AdminCharitiesPage() {
  const [charities, setCharities] = useState<Charity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newCharityName, setNewCharityName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    const fetchCharities = async () => {
      try {
        const { data } = await supabase.from("charities").select("*");
        setCharities(data || []);
      } catch (error) {
        console.error("Error fetching charities:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCharities();
  }, []);

  const handleCreateCharity = async () => {
    if (!newCharityName.trim()) {
      toast.error("Please enter a charity name");
      return;
    }

    try {
      setIsCreating(true);

      const { data, error } = await supabase
        .from("charities")
        .insert({
          name: newCharityName,
          description: "New charity",
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;

      setCharities([...charities, data]);
      setNewCharityName("");
      toast.success("Charity created successfully!");
    } catch (error) {
      console.error("Error creating charity:", error);
      toast.error("Failed to create charity");
    } finally {
      setIsCreating(false);
    }
  };

  const handleToggleFeatured = async (
    charityId: string,
    isFeatured: boolean,
  ) => {
    try {
      const { error } = await supabase
        .from("charities")
        .update({ is_featured: !isFeatured })
        .eq("id", charityId);

      if (error) throw error;

      setCharities(
        charities.map((c) =>
          c.id === charityId ? { ...c, is_featured: !isFeatured } : c,
        ),
      );
      toast.success("Charity updated");
    } catch (error) {
      console.error("Error updating charity:", error);
      toast.error("Failed to update charity");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="h-12 w-48 animate-pulse rounded-lg bg-gray-300" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Manage Charities</h1>
        <p className="mt-2 text-gray-600">
          Add and manage charities supported on the platform.
        </p>
      </div>

      {/* Create New Charity */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Add New Charity
        </h3>
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Charity name"
            value={newCharityName}
            onChange={(e) => setNewCharityName(e.target.value)}
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button
            onClick={handleCreateCharity}
            disabled={isCreating}
            className="rounded-lg bg-blue-600 px-6 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {isCreating ? "Creating..." : "Create"}
          </button>
        </div>
      </div>

      {/* Charities List */}
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                Name
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                Status
              </th>
              <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">
                Featured
              </th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {charities.map((charity) => (
              <tr
                key={charity.id}
                className="border-b border-gray-100 hover:bg-gray-50"
              >
                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                  {charity.name}
                </td>
                <td className="px-6 py-4 text-sm">
                  <span
                    className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                      charity.is_active
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {charity.is_active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  <button
                    onClick={() =>
                      handleToggleFeatured(
                        charity.id,
                        charity.is_featured || false,
                      )
                    }
                    className={`text-2xl ${charity.is_featured ? "⭐" : "☆"}`}
                  />
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
