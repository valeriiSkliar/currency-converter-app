import { useMutation } from "@tanstack/react-query";
import { client } from "@/lib/api";

/**
 * Submit user feedback option to the backend.
 */
export function useSubmitFeedback() {
  return useMutation<void, Error, { option_id: string }>({
    mutationFn: async (payload) => {
      await client.post("/feedback", payload);
    },
  });
}
