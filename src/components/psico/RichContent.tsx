import { useEffect, useMemo, useState } from "react";
import Lottie from "lottie-react";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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
          <Lottie animationData={data} loop={false} autoplay />
        ) : (
          <div className="aspect-square animate-pulse rounded-2xl bg-[#101927]/5" />
        )}
      </div>
    </div>
  );
}

const proseClass =
  "prose prose-slate max-w-none prose-headings:font-display prose-headings:text-[#101927] prose-p:text-[#101927]/85 prose-strong:text-[#101927] prose-a:text-[#0f766e] prose-li:text-[#101927]/85";

// Shared "Más ⌄" pill — used by RichContent and by PracticeView between blocks.
export function MoreButton({
  onClick,
  label = "Más",
}: {
  onClick: () => void;
  label?: string;
}) {
  return (
    <div className="my-5 flex justify-center">
      <button
        type="button"
        onClick={onClick}
        className="inline-flex items-center gap-1.5 rounded-full border border-[#7cc2c8]/40 bg-[#7cc2c8]/10 px-4 py-1.5 text-xs font-semibold text-[#0f766e] transition hover:bg-[#7cc2c8]/20 active:scale-[0.98]"
      >
        {label} <ChevronDown size={13} />
      </button>
    </div>
  );
}

// Persist a reveal count in localStorage under `psico:reveal:{key}`.
export function usePersistedReveal(key: string | undefined, total: number) {
  const storageKey = key ? `psico:reveal:${key}` : null;
  const [revealed, setRevealed] = useState<number>(() => {
    if (!storageKey || typeof window === "undefined") return 1;
    const raw = window.localStorage.getItem(storageKey);
    const n = raw ? parseInt(raw, 10) : 1;
    if (!Number.isFinite(n) || n < 1) return 1;
    return Math.min(Math.max(1, n), Math.max(1, total));
  });

  useEffect(() => {
    if (!storageKey) return;
    try {
      window.localStorage.setItem(storageKey, String(revealed));
    } catch {
      /* quota / private mode */
    }
  }, [storageKey, revealed]);

  return [revealed, setRevealed] as const;
}

export function RichContent({
  html,
  size = "base",
  storageKey,
}: {
  html: string;
  size?: "base" | "sm";
  storageKey?: string;
}) {
  const sections = useMemo(() => parse(html), [html]);
  const [revealed, setRevealed] = usePersistedReveal(storageKey, sections.length);

  if (sections.length === 0) return null;

  const cls = size === "sm" ? `${proseClass} prose-sm` : proseClass;
  const hasMore = revealed < sections.length;

  return (
    <div>
      {/* first section always visible */}
      <div>
        {sections[0].map((p, i) =>
          p.type === "html" ? (
            <div key={i} className={cls} dangerouslySetInnerHTML={{ __html: p.data }} />
          ) : (
            <LottieFromSource key={i} source={p.source} align={p.align} />
          )
        )}
      </div>

      {sections.slice(1).map((parts, idx) => {
        const isRevealed = idx + 1 < revealed;
        return (
          <AnimatePresence key={idx} initial={false}>
            {isRevealed && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                style={{ overflow: "hidden" }}
              >
                <div className="mt-4">
                  {parts.map((p, i) =>
                    p.type === "html" ? (
                      <div key={i} className={cls} dangerouslySetInnerHTML={{ __html: p.data }} />
                    ) : (
                      <LottieFromSource key={i} source={p.source} align={p.align} />
                    )
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        );
      })}

      {hasMore && <MoreButton onClick={() => setRevealed((r) => r + 1)} />}
    </div>
  );
}
