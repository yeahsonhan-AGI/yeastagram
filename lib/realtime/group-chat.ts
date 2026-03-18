import { createBrowserClient } from '@supabase/ssr'
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import type { GroupMessage } from '@/types'

export type GroupMessageCallback = (payload: RealtimePostgresChangesPayload<GroupMessage>) => void

/**
 * Subscribe to group messages in real-time
 */
export function subscribeToGroupMessages(
  groupId: string,
  callback: GroupMessageCallback
): RealtimeChannel {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const channel = supabase
    .channel(`group_messages:${groupId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'group_messages',
        filter: `group_id=eq.${groupId}`,
      },
      callback
    )
    .subscribe()

  return channel
}

/**
 * Unsubscribe from group messages
 */
export function unsubscribeFromGroupMessages(channel: RealtimeChannel): void {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  supabase.removeChannel(channel)
}

/**
 * Subscribe to group member count changes
 */
export function subscribeToGroupMemberCount(
  groupId: string,
  callback: () => void
): RealtimeChannel {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const channel = supabase
    .channel(`group_members_count:${groupId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'group_members',
        filter: `group_id=eq.${groupId}`,
      },
      callback
    )
    .subscribe()

  return channel
}
