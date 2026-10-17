import { BadgeCheck, CircleDashed, FlaskConical, Megaphone } from "lucide-react";
import type { Business } from "@/lib/types";

/*
 * Trust labels. They only ever reflect database state:
 *  - "Verified" needs verification_status = verified and is never shown on demo listings.
 *  - "Featured" is a promoted placement and always labelled as such.
 *  - Demo listings are labelled everywhere they appear.
 */
const pill = "inline-flex items-center gap-1 rounded-full font-semibold";

export function ListingBadges({
  business,
  size = "sm",
  onImage = false,
}: {
  business: Business;
  size?: "sm" | "md";
  onImage?: boolean;
}) {
  const s = size === "md" ? "text-[0.8rem] px-2.5 py-1" : "text-[0.72rem] px-2 py-0.5";
  const neutral = onImage ? "bg-white/90 text-[#1E2933] backdrop-blur" : "bg-sunken text-ink";
  return (
    <span className="inline-flex flex-wrap gap-1.5">
      {business.isDemo && (
        <span className={`${pill} ${s} ${neutral}`}>
          <FlaskConical className="h-3.5 w-3.5" aria-hidden="true" />
          Demo listing
        </span>
      )}
      {!business.isDemo && business.verificationStatus === "verified" && (
        <span className={`${pill} ${s} ${onImage ? "bg-white/90 text-[#167A4D]" : "bg-success/10 text-success"}`}>
          <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
          Verified
        </span>
      )}
      {business.isFeatured && (
        <span className={`${pill} ${s} bg-gold text-[#1E2933]`}>
          <Megaphone className="h-3.5 w-3.5" aria-hidden="true" />
          Featured
        </span>
      )}
    </span>
  );
}

/** Plain-English explanation of what a listing's status does and doesn't mean. */
export function TrustNote({ business }: { business: Business }) {
  if (business.isDemo) {
    return (
      <p className="flex gap-3 text-sm">
        <FlaskConical className="mt-0.5 h-5 w-5 shrink-0 text-muted" aria-hidden="true" />
        <span>This is an invented listing used to demonstrate Island Connect. It is not a real business and has not been checked.</span>
      </p>
    );
  }
  if (business.verificationStatus === "verified") {
    return (
      <p className="flex gap-3 text-sm">
        <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0 text-success" aria-hidden="true" />
        <span>
          Island Connect has checked this business’s identity and the documents it supplied. Verification is not a guarantee of
          the quality of its work, so agree prices and terms before work starts.
        </span>
      </p>
    );
  }
  if (business.claimStatus === "unclaimed") {
    return (
      <p className="flex gap-3 text-sm">
        <CircleDashed className="mt-0.5 h-5 w-5 shrink-0 text-muted" aria-hidden="true" />
        <span>Island Connect added this listing from public information. The business hasn’t claimed it yet, so check details with them directly.</span>
      </p>
    );
  }
  return (
    <p className="flex gap-3 text-sm">
      <CircleDashed className="mt-0.5 h-5 w-5 shrink-0 text-muted" aria-hidden="true" />
      <span>This business has not been verified yet. The details shown were supplied by the business.</span>
    </p>
  );
}
