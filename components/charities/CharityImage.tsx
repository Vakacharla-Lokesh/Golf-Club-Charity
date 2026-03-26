import Image from 'next/image';

interface CharityImageProps {
  alt: string;
  imageUrl: string | null;
  priority?: boolean;
}

export function CharityImage({ alt, imageUrl, priority = false }: CharityImageProps) {
  if (imageUrl) {
    return (
      <Image
        src={imageUrl}
        alt={alt}
        fill
        priority={priority}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        className="object-cover"
      />
    );
  }

  return (
    <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.25),_transparent_45%),linear-gradient(135deg,_#0f766e,_#0f172a)]">
      <div className="rounded-full border border-white/25 bg-white/10 px-5 py-3 text-sm font-semibold uppercase tracking-[0.35em] text-white">
        Charity
      </div>
    </div>
  );
}
