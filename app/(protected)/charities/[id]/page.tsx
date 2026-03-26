"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { CharityImage } from "@/components/charities/CharityImage";
import { supabase } from "@/lib/db";
import { Charity } from "@/lib/types";

export default function CharityDetailPage() {
  const params = useParams();
  const charityId = params.id as string;

  const [charity, setCharity] = useState<Charity | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCharity = async () => {
      if (!charityId) return;

      try {
        const { data, error: fetchError } = await supabase
          .from("charities")
          .select("*")
          .eq("id", charityId)
          .eq("is_active", true)
          .single();

        if (fetchError || !data) {
          setError("Charity not found");
          return;
        }

        setCharity(data);
      } catch (fetchError) {
        console.error("Error fetching charity:", fetchError);
        setError("Failed to load charity details");
      } finally {
        setIsLoading(false);
      }
    };

    void fetchCharity();
  }, [charityId]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-64 animate-pulse rounded-[1.5rem] bg-gray-300" />
        <div className="h-12 w-48 animate-pulse rounded-lg bg-gray-300" />
        <div className="space-y-2">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-4 animate-pulse rounded-lg bg-gray-300"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error || !charity) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6">
        <h2 className="font-semibold text-red-900">
          {error || "Charity not found"}
        </h2>
        <p className="mt-2 text-red-700">
          The charity you are looking for does not exist or is no longer
          available.
        </p>
        <Link
          href="/charities"
          className="mt-4 inline-flex rounded-lg bg-red-600 px-4 py-2 font-medium text-white hover:bg-red-700"
        >
          Back to Charities
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Link
        href="/charities"
        className="inline-flex items-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-teal-400 hover:text-teal-700"
      >
        Back to Charities
      </Link>

      <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_24px_80px_-60px_rgba(15,23,42,0.55)]">
        <div className="relative h-72 overflow-hidden bg-slate-900">
          <CharityImage
            alt={charity.name}
            imageUrl={charity.image_url}
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/45 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-8">
            {charity.is_featured && (
              <span className="inline-flex rounded-full bg-white/95 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-teal-800">
                Featured charity
              </span>
            )}
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              {charity.name}
            </h1>
          </div>
        </div>

        <div className="p-8">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
              Mission overview
            </p>
            <p className="mt-4 text-base leading-7 text-slate-700">
              {charity.description || "No description available."}
            </p>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/dashboard"
              className="inline-flex flex-1 items-center justify-center rounded-xl bg-slate-950 px-6 py-3 font-medium text-white transition hover:bg-teal-700"
            >
              Support This Charity
            </Link>
            <a
              href="https://example.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex flex-1 items-center justify-center rounded-xl border border-slate-300 px-6 py-3 font-medium text-slate-900 transition hover:border-teal-400 hover:bg-teal-50"
            >
              Learn More
            </a>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_-55px_rgba(15,23,42,0.65)]">
          <div className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">
            Total supporters
          </div>
          <div className="mt-2 text-3xl font-semibold text-teal-700">0</div>
          <p className="mt-1 text-sm text-slate-500">
            Members currently supporting this charity
          </p>
        </div>

        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_-55px_rgba(15,23,42,0.65)]">
          <div className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">
            Amount raised
          </div>
          <div className="mt-2 text-3xl font-semibold text-slate-950">
            Rs 0.00
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Tracked from subscription contributions
          </p>
        </div>

        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_-55px_rgba(15,23,42,0.65)]">
          <div className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">
            Participation
          </div>
          <div className="mt-2 text-3xl font-semibold text-sky-700">0%</div>
          <p className="mt-1 text-sm text-slate-500">
            Share of the platform support base
          </p>
        </div>
      </div>

      <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-[0_20px_70px_-60px_rgba(15,23,42,0.55)]">
        <h3 className="mb-6 text-xl font-semibold text-slate-950">
          Frequently Asked Questions
        </h3>
        <div className="space-y-6">
          <div>
            <h4 className="font-semibold text-slate-950">
              How are charities selected?
            </h4>
            <p className="mt-2 text-slate-600">
              Charities are carefully vetted and selected based on their
              transparency, impact, and alignment with our platform values.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-slate-950">
              How much of my subscription goes to the charity?
            </h4>
            <p className="mt-2 text-slate-600">
              You control the percentage. You can set anywhere from 10% to 100%
              of your subscription amount to go to your selected charity.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-slate-950">
              Can I change my charity selection?
            </h4>
            <p className="mt-2 text-slate-600">
              Yes. You can change your charity selection anytime from your
              dashboard. The change takes effect on your next billing cycle.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
