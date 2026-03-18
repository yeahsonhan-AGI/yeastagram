import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getNotifications, getUnreadNotificationCount, markAllNotificationsAsRead } from '@/lib/db/queries'
import { NotificationList } from '@/components/notifications/NotificationList'

export default async function NotificationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/signin')
  }

  // Mark all notifications as read when visiting the page
  await markAllNotificationsAsRead(user.id)

  const notifications = await getNotifications(user.id)
  const unreadCount = await getUnreadNotificationCount(user.id)

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Notifications</h1>
        {unreadCount > 0 && (
          <span className="text-sm text-muted-foreground">
            {unreadCount} unread
          </span>
        )}
      </div>

      <NotificationList notifications={notifications} currentUserId={user.id} />
    </div>
  )
}
