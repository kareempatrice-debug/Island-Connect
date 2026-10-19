import { SUPABASE_URL } from "./supabase/env";

export const MEDIA_BUCKET = "business-media";
export const MAX_GALLERY = 10;

/** Public URL for a stored business photo path, or a full https link as given. */
export function mediaUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (/^https:\/\//.test(path)) return path;
  if (!SUPABASE_URL || !/^[0-9a-f-]{36}\/[A-Za-z0-9._-]{1,80}$/.test(path)) return null;
  return `${SUPABASE_URL.replace(/\/$/, "")}/storage/v1/object/public/${MEDIA_BUCKET}/${path}`;
}

/** A path is only accepted if it sits in this business's own folder. */
export function pathBelongsTo(businessId: string, path: string) {
  return path.startsWith(`${businessId}/`) && /^[0-9a-f-]{36}\/[A-Za-z0-9._-]{1,80}$/.test(path);
}
