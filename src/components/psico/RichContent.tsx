import { useMemo, useState } from "react";
import Lottie from "lottie-react";
import { ChevronDown } from "lucide-react";
import { stripDefaultBlackColor } from "@/lib/richTextSanitize";

type Part =
  | { type: "html"; data: string }
  | { type: "lottie"; data: any; align: "left" | "center" | "right" };

function decodeBase64Utf8(b64: string): string {
  try {
    return decodeURIComponent(escape(atob(b64)));
  } catch {
    try {
      return atob(b64);
    } catch {
      return "";
    }
  }
}

function parse(html: string): Part[][] {
  let s = stripDefaultBlackColor(html || "");
  // Unwrap <p>token</p>
  s = s.replace(/<p>\s*(\[\[more\]\])\s*<\/p>/g, "$1");
  s = s.replace(/<p>\s*(\[\[lottie:[^\]]+\]\])\s*<\/p>/g, "$1");

  const sections = s.split(/\[\[more\]\]/);
  const lottieRe = /\[\[lottie:([A-Za-z0-9+/=]+):(left|center|right)\]\]/g;

  return sections.map((sec) => {
    const parts: Part[] = [];
    let last = 0;
    let m: RegExpExecArray | null;
    lottieRe.lastIndex = 0;
    while ((m = lottieRe.exec(sec)) !== null) {
      if (m.index > last) parts.push({ type: "html", data: sec.slice(last, m.index) });
      const json = decodeBase64Utf8(m[1]);
      let data: any = null;
      try {
        data = JSON.parse(json);
      } catch {
        data = null;
      }
      if (data) parts.push({ type: "lottie", data, align: m[2] as any });
      last = lottieRe.lastIndex;
    }
    if (last < sec.length) parts.push({ type: "html", data: sec.slice(last) });
    return parts;
  });
}

const proseClass =
  "prose prose-slate max-w-none prose-headings:font-display prose-headings:text-[#101927] prose-p:text-[#101927]/85 prose-strong:text-[#101927] prose-a:text-[#0f766e] prose-li:text-[#101927]/85";

function alignWrap(align: "left" | "center" | "right") {
  if (align === "left") return "flex justify-start";
  if (align === "right") return "flex justify-end";
  return "flex justify-center";
}

export function RichContent({
  html,
  size = "base",
}: {
  html: string;
  size?: "base" | "sm";
}) {
  const sections = useMemo(() => parse(html), [html]);
  const [revealed, setRevealed] = useState(1);

  if (sections.length === 0) return null;

  const cls = size === "sm" ? `${proseClass} prose-sm` : proseClass;
  const visible = sections.slice(0, revealed);
  const hasMore = revealed < sections.length;

  return (
    <div>
      {visible.map((parts, si) => (
        <div key={si} className={si > 0 ? "mt-4" : ""}>
          {parts.map((p, i) =>
            p.type === "html" ? (
              <div key={i} className={cls} dangerouslySetInnerHTML={{ __html: p.data }} />
            ) : (
              <div key={i} className={`my-4 ${alignWrap(p.align)}`}>
                <div className="w-full max-w-[280px]">
                  <Lottie animationData={p.data} loop autoplay />
                </div>
              </div>
            )
          )}
        </div>
      ))}

      {hasMore && (
        <button
          type="button"
          onClick={() => setRevealed((r) => r + 1)}
          className="mt-5 inline-flex items-center gap-1.5 rounded-full border border-[#7cc2c8]/40 bg-[#7cc2c8]/10 px-4 py-1.5 text-xs font-semibold text-[#0f766e] transition hover:bg-[#7cc2c8]/20 active:scale-[0.98]"
        >
          Más <ChevronDown size={13} />
        </button>
      )}
    </div>
  );
}
