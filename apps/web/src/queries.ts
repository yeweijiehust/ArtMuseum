import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./api.js";

export function useMe() {
  return useQuery({
    queryKey: ["me"],
    queryFn: api.getMe,
    retry: false,
    staleTime: 60_000
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.logout,
    onSuccess: async () => {
      await queryClient.invalidateQueries();
      queryClient.setQueryData(["me"], null);
    }
  });
}
