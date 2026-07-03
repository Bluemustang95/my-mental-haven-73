// Sanitizes rich-text HTML coming from the admin editor for dark-theme surfaces.
// Removes default-black `color: ...` declarations from inline styles so that
// prose-invert's light text color takes effect. Keeps any explicit non-black
// color the admin picked (violet, orange, green, red, teal, pastels, etc.).

const BLACK_COLOR_RE =
  /color\s*:\s*(?:#000(?:000)?|black|rgb\(\s*0\s*,\s*0\s*,\s*0\s*\)|rgba\(\s*0\s*,\s*0\s*,\s*0\s*,\s*[\d.]+\s*\))\s*;?/gi;

export function stripDefaultBlackColor(html: string): string {
  if (!html) return html;
  return html.replace(/style="([^"]*)"/gi, (_m, styles: string) => {
    const cleaned = styles.replace(BLACK_COLOR_RE, "").replace(/;\s*;/g, ";").trim();
    return cleaned ? `style="${cleaned}"` : "";
  });
}
