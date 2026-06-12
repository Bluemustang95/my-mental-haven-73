import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BAContent, DEFAULT_BA_CONTENT } from "@/lib/baTypes";

export function useBAContent() {
  const [content, setContent] = useState<BAContent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("ba_content" as any)
        .select("*")
        .limit(1)
        .maybeSingle();
      if (data) setContent({ ...DEFAULT_BA_CONTENT, ...(data as any) });
      setLoading(false);
    })();
  }, []);

  return { content, loading };
}
