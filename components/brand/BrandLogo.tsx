import Image from "next/image";
import { brandAssets, brandImageClass, type BrandVariant } from "./brand-assets";

// Rendered CSS width of each fixed-height size (height x 1397/458), so the optimizer serves a logo-sized
// file instead of the 1920w/3840w candidates it picks for a 1397px intrinsic width.
const brandImageSizes = { sm: "74px", md: "98px", lg: "135px", xl: "196px" } as const satisfies Record<keyof typeof brandImageClass, string>;

export function BrandLogo({
  variant = "auto",
  size = "md",
  className = "",
  priority = false,
}: {
  readonly variant?: BrandVariant;
  readonly size?: keyof typeof brandImageClass;
  readonly className?: string;
  readonly priority?: boolean;
}) {
  const imageClass = `${brandImageClass[size]} max-w-full object-contain ${className}`;
  const sizes = brandImageSizes[size];
  if (variant !== "auto") {
    return <Image src={brandAssets[variant]} alt="VAYON" width={1397} height={458} sizes={sizes} className={imageClass} priority={priority} />;
  }
  // Theme pair: keep both lazy so only the visible (CSS-selected) one is fetched; preloading would fetch
  // both. fetchPriority still prioritizes the visible logo (next/image theme-image guidance).
  const fetchPriority = priority ? "high" : undefined;
  return (
    <span className="inline-flex shrink-0 items-center" aria-label="VAYON">
      <Image src={brandAssets.dark} alt="" width={1397} height={458} sizes={sizes} className={`vayon-brand-for-dark ${imageClass}`} fetchPriority={fetchPriority} />
      <Image src={brandAssets.light} alt="" width={1397} height={458} sizes={sizes} className={`vayon-brand-for-light ${imageClass}`} fetchPriority={fetchPriority} />
    </span>
  );
}
