import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { errorMessage } from "@/lib/messages";
import {
  compareGroup,
  createGroup,
  deleteGroup,
  getGroup,
  refreshGroup,
  listGroups,
  updateGroup,
  type CompareScope,
  type GroupInput,
} from "@/api";
import { useSession } from "@/features/auth/useSession";

const key = ["groups"] as const;

export function useGroups() {
  const session = useSession();
  return useQuery({
    queryKey: [...key, session?.user.id ?? "anon"],
    queryFn: ({ signal }) => listGroups(signal),
    enabled: session !== null,
  });
}

export const useGroup = (id: string) =>
  useQuery({ queryKey: [...key, "one", id], queryFn: ({ signal }) => getGroup(id, signal) });

/** Clé de comparaison : période ET modes (un nouveau filtre ne réutilise jamais les chiffres d'un autre). */
const compareKey = (id: string, s: CompareScope) =>
  [...key, "compare", id, s.period, s.gameMode, s.matchMode] as const;

export const useGroupCompare = (id: string, scope: CompareScope) =>
  useQuery({
    queryKey: compareKey(id, scope),
    queryFn: ({ signal }) => compareGroup(id, scope, signal),
    placeholderData: keepPreviousData,
    refetchInterval: 180_000,
    refetchOnWindowFocus: true,
  });

export function useCreateGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: GroupInput) => createGroup(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: key });
      toast.success("Groupe créé.");
    },
  });
}

export function useUpdateGroup(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<GroupInput>) => updateGroup(id, input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: key });
      toast.success("Groupe mis à jour.");
    },
  });
}

export function useDeleteGroup(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => deleteGroup(id),
    onSuccess: () => {
      qc.removeQueries({ queryKey: [...key, "one", id] });
      void qc.invalidateQueries({ queryKey: key });
      toast.success("Groupe supprimé.");
    },
  });
}

/** Actualisation forcée de tous les membres : remplace la comparaison affichée. */
export function useRefreshGroup(id: string, scope: CompareScope) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => refreshGroup(id, scope),
    onSuccess: (data) => {
      qc.setQueryData(compareKey(id, scope), data);
      toast.success("Comparaison actualisée");
    },
    // Sans message, une actualisation refusée (60 s entre deux relectures, quota) paraîtrait ignorée.
    onError: (error) => toast.error(errorMessage(error)),
  });
}
