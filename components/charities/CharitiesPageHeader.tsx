interface CharitiesPageHeaderProps {
  charityCount: number;
}

export function CharitiesPageHeader({ charityCount }: CharitiesPageHeaderProps) {
  return (
    <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-[linear-gradient(135deg,_#ecfeff,_#ffffff_40%,_#f8fafc)] p-8 shadow-[0_20px_70px_-50px_rgba(15,23,42,0.45)]">
      <div className="max-w-3xl space-y-4">
        <span className="inline-flex rounded-full bg-teal-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-teal-800">
          Supported charities
        </span>
        <h1 className="text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
          Pick a cause that deserves a share of every round you play.
        </h1>
        <p className="max-w-2xl text-base leading-7 text-slate-600">
          Browse the organizations available on the platform, compare their missions, and then choose the one you want your subscription to support.
        </p>
        <div className="inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700">
          {charityCount} active charities available
        </div>
      </div>
    </section>
  );
}
