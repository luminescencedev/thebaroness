import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  compareGroup,
  createGroup,
  deleteGroup,
  getGroup,
  listGroups,
  updateGroup,
  type ComparePeriod,
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

export const useGroupCompare = (id: string, period: ComparePeriod) =>
  useQuery({
    queryKey: [...key, "compare", id, period],
    queryFn: ({ signal }) => compareGroup(id, period, signal),
    placeholderData: keepPreviousData,
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
