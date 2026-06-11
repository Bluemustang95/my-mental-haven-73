import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function useAdminRole() {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    const checkRole = async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (data) {
        setIsAdmin(true);
        setLoading(false);
        return;
      }

      if (user.email?.toLowerCase() === "redsaludmentalarg@gmail.com") {
        const { error } = await supabase
          .from("user_roles")
          .insert({ user_id: user.id, role: "admin" });
        setIsAdmin(!error);
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    };

    checkRole();
  }, [user, authLoading]);

  return { isAdmin, loading: loading || authLoading };
}
