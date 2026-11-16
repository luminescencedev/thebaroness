import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createTrackedPlayer,
  deleteTrackedPlayer,
  getTrackedPlayer,
  listTrackedPlayers,
  updateTrackedPlayer,
  type UpdateTrackedPlayerInput,
} from "@/api";
import { useSession } from "@/features/auth/useSession";

export const trackedKeys = {
  all: ["tracked-players"] as const,
  detail: (id: string) => ["tracked-players", id] as const,
};

export function useTrackedList() {
  const session = useSession();
  return useQuery({
    queryKey: [...trackedKeys.all, session?.user.id ?? "anon"],
    queryFn: ({ signal }) => listTrackedPlayers(signal),
    enabled: session !== null,
  });
}

export function useTracked(id: string) {
  return useQuery({
    queryKey: trackedKeys.detail(id),
    queryFn: ({ signal }) => getTrackedPlayer(id, signal),
  });
}

export function useCreateTracked() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createTrackedPlayer,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: trackedKeys.all });
    },
  });
}

export function useUpdateTracked(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateTrackedPlayerInput) => updateTrackedPlayer(id, input),
    onSuccess: (updated) => {
      qc.setQueryData(trackedKeys.detail(id), updated);
      void qc.invalidateQueries({ queryKey: trackedKeys.all });
      toast.success("Suivi enregistré");
    },
  });
}

export function useDeleteTracked(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => deleteTrackedPlayer(id),
    onSuccess: () => {
      qc.removeQueries({ queryKey: trackedKeys.detail(id) });
      void qc.invalidateQueries({ queryKey: trackedKeys.all });
      toast.success("Vous ne suivez plus ce joueur");
    },
  });
}
