'use client';

import Link from 'next/link';
import { CharityImage } from '@/components/charities/CharityImage';
import type { Charity } from '@/lib/types';

interface CharityCardProps {
  charity: Charity;
}

export function CharityCard({ charity }: CharityCardProps) {
  return (
    <Link href={`/charities/${charity.id}`} className="group h-full">
      <article className="flex h-full flex-col overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-[0_20px_60px_-40px_rgba(15,23,42,0.45)] transition duration-200 hover:-translate-y-1 hover:border-teal-300 hover:shadow-[0_24px_70px_-36px_rgba(15,118,110,0.35)]">
        <div className="relative h-52 overflow-hidden bg-slate-900">
          <CharityImage alt={charity.name} imageUrl={charity.image_url} />
          {charity.is_featured && (
            <span className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-teal-800">
              Featured
            </span>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-4 p-6">
          <div className="space-y-3">
            <h2 className="text-xl font-semibold text-slate-950 transition group-hover:text-teal-700">
              {charity.name}
            </h2>
            <p className="line-clamp-3 text-sm leading-6 text-slate-600">
              {charity.description || 'This charity is currently listed without a public description.'}
            </p>
          </div>

          <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-4">
            <span className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
              Learn more
            </span>
            <span className="rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white transition group-hover:bg-teal-700">
              View details
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
