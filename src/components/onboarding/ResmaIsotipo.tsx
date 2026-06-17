/**
 * RESMA isotipo: orbit ring + central planet dot.
 * Light glass card container with the planet/orbit mark in teal + gold.
 */
export function ResmaIsotipo({ size = 96 }: { size?: number }) {
  const inner = Math.round(size * 0.6);
  return (
    <div
      className="flex items-center justify-center rounded-[28px] border border-[#101927]/5 bg-white shadow-[0_18px_48px_-18px_rgba(16,25,39,0.18)]"
      style={{ width: size, height: size }}
    >
      <svg
        width={inner}
        height={inner}
        viewBox="0 0 60 60"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* vertical axis */}
        <line x1="30" y1="6" x2="30" y2="54" stroke="#7cc2c8" strokeWidth="1.5" strokeLinecap="round" />
        {/* orbit ellipse */}
        <ellipse cx="30" cy="30" rx="22" ry="7" stroke="#7cc2c8" strokeWidth="1.5" />
        {/* planet */}
        <circle cx="30" cy="30" r="5" fill="#facb60" />
      </svg>
    </div>
  );
}
