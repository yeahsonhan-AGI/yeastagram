import { createClient } from '@/lib/supabase/server'
import { getGroupById } from '@/lib/db/queries'
import { GroupDetail } from '@/components/groups/GroupDetail'
import { notFound } from 'next/navigation'

export default async function GroupPage({
  params,
}: {
  params: Promise<{ groupId: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { groupId } = await params
  const group = await getGroupById(groupId, user?.id)

  if (!group) {
    notFound()
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <GroupDetail group={group} currentUserId={user?.id} />
    </div>
  )
}
