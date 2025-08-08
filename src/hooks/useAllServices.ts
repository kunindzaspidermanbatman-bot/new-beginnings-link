import { useQuery } from "@tanstack/react-query";
import { SERVICE_CATALOG } from "@/constants/services";

// Returns a unique, sorted list of all available service names across venues
export const useAllServices = () => {
  return useQuery<string[]>({
    queryKey: ["all-services-list"],
    queryFn: async () => {
      return [...SERVICE_CATALOG];
    },
  });
};

