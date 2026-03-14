import { useQuery } from "@tanstack/react-query"
import { supabase } from "../lib/supabase"

export interface FamilyMember {
  id: string
  name: string
  role: string
  color: string
}

export function useCurrentMember(userId: string | undefined) {
  return useQuery<FamilyMember>({
    queryKey: ["currentMember", userId],
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data: family, error: famErr } = await supabase
        .from("families")
        .select("id")
        .eq("created_by", userId!)
        .limit(1)
        .single()

      if (famErr || !family) throw new Error("Family not found")

      const { data: member, error: memErr } = await supabase
        .from("family_members")
        .select("id, name, role, color")
        .eq("family_id", family.id)
        .limit(1)
        .single()

      if (memErr || !member) throw new Error("Family member not found")

      return member as FamilyMember
    },
  })
}
