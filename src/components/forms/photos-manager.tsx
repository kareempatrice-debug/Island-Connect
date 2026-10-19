"use client";

import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { removePhotoAction, savePhotoAction } from "@/app/[country]/dashboard/[slug]/actions";
import { MAX_GALLERY, MEDIA_BUCKET, mediaUrl } from "@/lib/media";
import { supabaseBrowser } from "@/lib/supabase/browser";

type Kind = "logo" | "cover" | "gallery";
const LONGEST_SIDE: Record<Kind, number> = { logo: 512, cover: 1920, gallery: 1600 };
const MAX_BYTES = 5 * 1024 * 1024;

/*
 * Photos are resized on the phone before upload, so a 10 MB camera photo becomes a
 * few hundred kilobytes: quicker on island mobile data, and kinder to storage.
 */
async function prepare(file: File, kind: Kind): Promise<{ blob: Blob; ext: string }> {
  if (!/^image\/(jpeg|png|webp|heic|heif)$/i.test(file.type)) throw new Error("Choose a photo (JPEG, PNG or WebP).");
  const bitmap = await createImageBitmap(file).catch(() => {
    throw new Error("That photo couldn’t be read. Try a JPEG or PNG.");
  });
  const scale = Math.min(1, LONGEST_SIDE[kind] / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const encode = (type: string, q: number) => new Promise<Blob | null>((res) => canvas.toBlob(res, type, q));
  let blob = await encode("image/webp", 0.82);
  let ext = "webp";
  if (!blob || blob.type !== "image/webp") {
    blob = await encode("image/jpeg", 0.85);
    ext = "jpg";
  }
  if (!blob) throw new Error("That photo couldn’t be processed.");
  if (blob.size > MAX_BYTES) throw new Error("That photo is too large, even after resizing.");
  return { blob, ext };
}

interface Props {
  country: string;
  slug: string;
  businessId: string;
  logoPath: string | null;
  coverPath: string | null;
  gallery: string[];
}

export function PhotosManager({ country, slug, businessId, logoPath, coverPath, gallery: initialGallery }: Props) {
  const [logo, setLogo] = useState(logoPath);
  const [cover, setCover] = useState(coverPath);
  const [gallery, setGallery] = useState(initialGallery);
  const [busy, setBusy] = useState<Kind | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const inputs = { logo: useRef<HTMLInputElement>(null), cover: useRef<HTMLInputElement>(null), gallery: useRef<HTMLInputElement>(null) };

  async function upload(kind: Kind, files: FileList | null) {
    if (!files?.length) return;
    setError(null);
    setNotice(null);
    setBusy(kind);
    try {
      const list = kind === "gallery" ? Array.from(files).slice(0, MAX_GALLERY - gallery.length) : [files[0]];
      if (!list.length) throw new Error(`You already have ${MAX_GALLERY} gallery photos. Remove one first.`);
      for (const file of list) {
        const { blob, ext } = await prepare(file, kind);
        const path = `${businessId}/${kind}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;
        const { error: upErr } = await supabaseBrowser().storage.from(MEDIA_BUCKET).upload(path, blob, { contentType: blob.type, cacheControl: "31536000", upsert: false });
        if (upErr) throw new Error("The upload didn’t go through. Check your connection and try again.");
        const res = await savePhotoAction({ businessId, country, slug, kind, path });
        if (res.error) throw new Error(res.error);
        if (kind === "logo") setLogo(path);
        else if (kind === "cover") setCover(path);
        else setGallery((g) => [...g, path]);
      }
      setNotice(kind === "gallery" ? "Photos added to your listing." : `${kind === "logo" ? "Logo" : "Cover photo"} updated on your listing.`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
      const input = inputs[kind].current;
      if (input) input.value = "";
    }
  }

  async function remove(kind: Kind, path: string) {
    setError(null);
    setNotice(null);
    const res = await removePhotoAction({ businessId, country, slug, kind, path });
    if (res.error) return setError(res.error);
    if (kind === "logo") setLogo(null);
    else if (kind === "cover") setCover(null);
    else setGallery((g) => g.filter((p) => p !== path));
  }

  const card = "rounded-2xl bg-raised p-5 ring-1 ring-line/60";
  const btn = "inline-flex h-11 items-center gap-2 rounded-full bg-primary px-5 font-semibold text-primary-ink disabled:opacity-60";
  const ghost = "inline-flex h-10 items-center gap-1.5 rounded-full border border-line px-4 text-sm font-semibold text-ink";
  const picker = (kind: Kind, label: string, multiple = false) => (
    <>
      <input ref={inputs[kind]} type="file" accept="image/*" multiple={multiple} className="sr-only" id={`pick-${kind}`} onChange={(e) => upload(kind, e.target.files)} />
      <label htmlFor={`pick-${kind}`} className={`${btn} cursor-pointer ${busy ? "pointer-events-none opacity-60" : ""}`}>
        {busy === kind ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : <ImagePlus className="h-5 w-5" aria-hidden="true" />}
        {busy === kind ? "Uploading…" : label}
      </label>
    </>
  );

  return (
    <div className="space-y-6">
      <p>Real photos of your work, premises or team help customers choose you. Photos are resized automatically; any phone photo is fine.</p>
      {error && <p role="alert" className="rounded-xl bg-danger/10 px-4 py-3 text-sm font-medium text-danger">{error}</p>}
      {notice && <p role="status" className="rounded-xl bg-success/10 px-4 py-3 text-sm font-medium text-success">{notice}</p>}

      <section className={card} aria-labelledby="cover-h">
        <h2 id="cover-h" className="text-lg font-semibold">Cover photo</h2>
        <p className="mt-1 text-sm">The wide image at the top of your listing and on your card. Landscape photos work best.</p>
        {cover && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={mediaUrl(cover)!} alt="Your current cover photo" className="mt-4 aspect-[16/9] w-full rounded-xl object-cover" />
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          {picker("cover", cover ? "Replace cover photo" : "Add cover photo")}
          {cover && <button type="button" onClick={() => remove("cover", cover)} className={ghost}><Trash2 className="h-4 w-4" aria-hidden="true" />Remove</button>}
        </div>
      </section>

      <section className={card} aria-labelledby="logo-h">
        <h2 id="logo-h" className="text-lg font-semibold">Logo</h2>
        <p className="mt-1 text-sm">Shown in the small square on your card. A square image works best.</p>
        {logo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={mediaUrl(logo)!} alt="Your current logo" className="mt-4 h-24 w-24 rounded-2xl bg-white object-contain p-1 ring-1 ring-line" />
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          {picker("logo", logo ? "Replace logo" : "Add logo")}
          {logo && <button type="button" onClick={() => remove("logo", logo)} className={ghost}><Trash2 className="h-4 w-4" aria-hidden="true" />Remove</button>}
        </div>
      </section>

      <section className={card} aria-labelledby="gallery-h">
        <h2 id="gallery-h" className="text-lg font-semibold">Gallery <span className="text-base font-normal text-muted">({gallery.length} of {MAX_GALLERY})</span></h2>
        <p className="mt-1 text-sm">Your work, products, rooms or vehicles. You can pick several at once.</p>
        {gallery.length > 0 && (
          <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {gallery.map((p, i) => (
              <li key={p} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={mediaUrl(p)!} alt={`Gallery photo ${i + 1}`} className="aspect-square w-full rounded-xl object-cover" />
                <button type="button" onClick={() => remove("gallery", p)} aria-label={`Remove gallery photo ${i + 1}`}
                  className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white">
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-4">{gallery.length < MAX_GALLERY && picker("gallery", "Add photos", true)}</div>
      </section>

      <p className="text-sm">Only add photos you took yourself or have permission to use. Don’t include customers’ faces or details without their agreement.</p>
    </div>
  );
}
