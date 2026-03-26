"use client";

import { useEffect, useState } from "react";
import { CharityCard } from "@/components/charities/CharityCard";
import { CharitiesPageHeader } from "@/components/charities/CharitiesPageHeader";
import { fetchActiveCharities } from "@/lib/charities";
import type { Charity } from "@/lib/types";

export default function CharitiesPage() {
  const [charities, setCharities] = useState<Charity[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCharities = async () => {
      try {
        const data = await fetchActiveCharities(searchQuery);
        setCharities(data);
      } catch (error) {
        console.error("Error fetching charities:", error);
      } finally {
        setIsLoading(false);
      }
    };

    const debounce = setTimeout(() => {
      void fetchCharities();
    }, 300);

    return () => clearTimeout(debounce);
  }, [searchQuery]);

  return (
    <div className="space-y-8">
      <CharitiesPageHeader charityCount={charities.length} />

      <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-[0_18px_60px_-48px_rgba(15,23,42,0.55)]">
        <label
          htmlFor="charity-search"
          className="mb-3 block text-sm font-semibold uppercase tracking-[0.18em] text-slate-500"
        >
          Search charities
        </label>
        <input
          id="charity-search"
          type="text"
          placeholder="Search charities..."
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-950 placeholder:text-slate-400 focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-100"
        />
      </section>

      {isLoading && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <div
              key={item}
              className="h-64 animate-pulse rounded-[1.5rem] bg-gray-300"
            />
          ))}
        </div>
      )}

      {!isLoading && charities.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {charities.map((charity) => (
            <CharityCard
              key={charity.id}
              charity={charity}
            />
          ))}
        </div>
      )}

      {!isLoading && charities.length === 0 && (
        <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 p-12 text-center">
          <p className="text-lg font-semibold text-slate-800">
            {searchQuery
              ? "No charities match your search"
              : "No charities available"}
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Try a different search term or check back after more organizations
            are added.
          </p>
        </div>
      )}
    </div>
  );
}
