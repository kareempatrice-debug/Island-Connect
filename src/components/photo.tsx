import Image from "next/image";
import Link from "next/link";
import { photos } from "@/data/photos";

/** A licensed destination photo that fills its parent. The parent must be positioned. */
export function PlacePhoto({
  photoKey,
  sizes,
  priority,
  className = "",
  credit,
}: {
  photoKey: string;
  sizes: string;
  priority?: boolean;
  className?: string;
  credit?: boolean | "top";
}) {
  const p = photos[photoKey];
  if (!p) return null;
  return (
    <>
      <Image
        src={p.src}
        alt={p.alt}
        fill
        sizes={sizes}
        priority={priority}
        className={`object-cover ${className}`}
        style={{ objectPosition: p.focus ?? "50% 50%" }}
      />
      {credit && (
        <Link
          href="/credits"
          className={`absolute right-3 z-10 text-[0.7rem] text-white/75 hover:text-white ${credit === "top" ? "top-2" : "bottom-2"}`}
          title={`${p.place}. Photo: ${p.author}, ${p.license}`}
        >
          {p.place} · Photo: {p.author}
        </Link>
      )}
    </>
  );
}
