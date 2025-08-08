import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Returns a unique, sorted list of all available service names across venues
export const useAllServices = () => {
  return useQuery<string[]>({
    queryKey: ["all-services-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("venue_services")
        .select("name")
        .order("name", { ascending: true });

      if (error) throw error;

      const names = (data || [])
        .map((s) => (s as { name?: string }).name?.trim())
        .filter((n): n is string => Boolean(n && n.length > 0));

      // Deduplicate by case-insensitive name, keep first occurrence
      const seen = new Set<string>();
      const unique = names.filter((n) => {
        const key = n.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      return unique;
    },
  });
};

