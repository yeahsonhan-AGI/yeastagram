import { createBrowserClient } from '@supabase/ssr'
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import type { GroupMember } from '@/types'

export type GroupLocationCallback = (payload: RealtimePostgresChangesPayload<GroupMember>) => void

/**
 * Subscribe to group member location updates in real-time
 */
export function subscribeToGroupLocations(
  groupId: string,
  callback: GroupLocationCallback
): RealtimeChannel {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const channel = supabase
    .channel(`group_locations:${groupId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'group_members',
        filter: `group_id=eq.${groupId}`,
      },
      callback
    )
    .subscribe()

  return channel
}

/**
 * Unsubscribe from group location updates
 */
export function unsubscribeFromGroupLocations(channel: RealtimeChannel): void {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  supabase.removeChannel(channel)
}

/**
 * Watch member positions (periodic polling fallback for locations)
 */
export class LocationWatcher {
  private groupId: string
  private intervalMs: number
  private intervalId: NodeJS.Timeout | null = null
  private callback: (members: GroupMember[]) => void

  constructor(groupId: string, callback: (members: GroupMember[]) => void, intervalMs = 30000) {
    this.groupId = groupId
    this.callback = callback
    this.intervalMs = intervalMs
  }

  async fetchLocations(): Promise<void> {
    try {
      const response = await fetch(`/api/groups/${this.groupId}/members/location`)
      if (!response.ok) return
      const data = await response.json()
      this.callback(data.members)
    } catch (error) {
      console.error('Error fetching locations:', error)
    }
  }

  start(): void {
    this.fetchLocations()
    this.intervalId = setInterval(() => {
      this.fetchLocations()
    }, this.intervalMs)
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
  }
}
