import { useEffect, useMemo, useState } from "react";
import Lottie from "lottie-react";
import { ChevronDown } from "lucide-react";
import { stripDefaultBlackColor } from "@/lib/richTextSanitize";
import { supabase } from "@/integrations/supabase/client";

type Part =
  | { type: "html"; data: string }
  | { type: "lottie"; source: string; align: "left" | "center" | "right" };

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

const lottieCache = new Map<string, any>();

function parse(html: string): Part[][] {
  let s = stripDefaultBlackColor(html || "");
  s = s.replace(/<p>\s*(\[\[more\]\])\s*<\/p>/g, "$1");
  s = s.replace(/<p>\s*(\[\[lottie:[^\]]+\]\])\s*<\/p>/g, "$1");

  const sections = s.split(/\[\[more\]\]/);
  // token: [[lottie:<source>:<align>]] where <source> may contain ':' (URLs)
  const lottieRe = /\[\[lottie:(.+?):(left|center|right)\]\]/g;

  return sections.map((sec) => {
    const parts: Part[] = [];
    let last = 0;
    let m: RegExpExecArray | null;
    lottieRe.lastIndex = 0;
    while ((m = lottieRe.exec(sec)) !== null) {
      if (m.index > last) parts.push({ type: "html", data: sec.slice(last, m.index) });
      parts.push({ type: "lottie", source: m[1], align: m[2] as any });
      last = lottieRe.lastIndex;
    }
    if (last < sec.length) parts.push({ type: "html", data: sec.slice(last) });
    return parts;
  });
}

function LottieFromSource({
  source,
  align,
}: {
  source: string;
  align: "left" | "center" | "right";
}) {
  const [data, setData] = useState<any>(() => lottieCache.get(source) ?? null);

  useEffect(() => {
    if (data) return;
    let cancelled = false;
    (async () => {
      try {
        let json: any = null;
        if (source.startsWith("storage://")) {
          const path = source.slice("storage://".length);
          const { data: blob, error } = await supabase.storage
            .from("lottie-animations")
            .download(path);
          if (error || !blob) return;
          json = JSON.parse(await blob.text());
        } else if (source.startsWith("http://") || source.startsWith("https://")) {
          const res = await fetch(source);
          json = await res.json();
        } else {
          // legacy: base64-encoded JSON inline
          const text = decodeBase64Utf8(source);
          json = text ? JSON.parse(text) : null;
        }
        if (!cancelled && json) {
          lottieCache.set(source, json);
          setData(json);
        }
      } catch {
        /* silent */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [source, data]);

  const justify =
    align === "left" ? "justify-start" : align === "right" ? "justify-end" : "justify-center";

  return (
    <div className={`my-4 flex ${justify}`}>
      <div className="w-full max-w-[280px]">
        {data ? (
          <Lottie animationData={data} loop autoplay />
        ) : (
          <div className="aspect-square animate-pulse rounded-2xl bg-[#101927]/5" />
        )}
      </div>
    </div>
  );
}

const proseClass =
  "prose prose-slate max-w-none prose-headings:font-display prose-headings:text-[#101927] prose-p:text-[#101927]/85 prose-strong:text-[#101927] prose-a:text-[#0f766e] prose-li:text-[#101927]/85";

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
              <LottieFromSource key={i} source={p.source} align={p.align} />
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
