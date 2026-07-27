import isotipoAsset from "@/assets/resma-isotipo.png.asset.json";

/**
 * Isótopo oficial RESMA, teñido con el color del proyecto vía CSS mask.
 */
export function ResmaIsotipoMark({
  size = 140,
  color = "#7cc2c8",
  className,
}: {
  size?: number;
  color?: string;
  className?: string;
}) {
  return (
    <div
      role="img"
      aria-label="RESMA"
      className={className}
      style={{
        width: size,
        height: size,
        background: color,
        WebkitMaskImage: `url(${isotipoAsset.url})`,
        maskImage: `url(${isotipoAsset.url})`,
        WebkitMaskSize: "contain",
        maskSize: "contain",
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        maskPosition: "center",
      }}
    />
  );
}
