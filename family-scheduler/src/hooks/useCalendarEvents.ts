import { useQuery } from "@tanstack/react-query"
import { supabase } from "../lib/supabase"

export interface CalendarEvent {
  id: string
  title: string
  start_at: string
  end_at: string
  location: string | null
  description: string | null
}

export function useCalendarEvents(memberId: string | undefined) {
  return useQuery<CalendarEvent[]>({
    queryKey: ["calendarEvents", memberId],
    enabled: !!memberId,
    queryFn: async () => {
      const { data: connections, error: connErr } = await supabase
        .from("calendar_connections")
        .select("id")
        .eq("family_member_id", memberId!)

      if (connErr) throw connErr

      const ids = (connections ?? []).map((c: { id: string }) => c.id)
      if (!ids.length) return []

      const now = new Date()
      const fourWeeksOut = new Date(now.getTime() + 28 * 24 * 60 * 60 * 1000)

      const { data: events, error: evErr } = await supabase
        .from("events")
        .select("id, title, start_at, end_at, location, description")
        .in("calendar_connection_id", ids)
        .gte("start_at", now.toISOString())
        .lte("start_at", fourWeeksOut.toISOString())
        .order("start_at", { ascending: true })

      if (evErr) throw evErr

      return (events ?? []) as CalendarEvent[]
    },
  })
}
