'use server'

import { createClient } from '@/lib/supabase/server'

export async function getUnreadNotificationCountAction() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return 0
  }

  const { count } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('read', false)

  return count || 0
}
