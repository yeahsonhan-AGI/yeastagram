import { createClient } from '@/lib/supabase/server'
import { getGroups, getUserGroups } from '@/lib/db/queries'
import { GroupsPageClient } from '@/components/groups/GroupsPageClient'

export default async function GroupsPage({
  searchParams,
}: {
  searchParams: { tab?: string; q?: string }
}) {
  // Await the searchParams Promise (Next.js 15+)
  const awaitedParams = await searchParams
  const currentTab = awaitedParams.tab || 'discover'
  const searchQuery = awaitedParams.q || ''

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Get all groups (will filter by search query on client for simplicity)
  const allGroups = await getGroups(50, 0, user?.id, false)

  // Get user's groups
  const userGroups = user ? await getUserGroups(user.id) : []

  return (
    <GroupsPageClient
      currentTab={currentTab}
      searchQuery={searchQuery}
      allGroups={allGroups}
      userGroups={userGroups}
      user={user}
    />
  )
}
