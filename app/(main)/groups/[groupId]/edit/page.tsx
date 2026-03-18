import { createClient } from '@/lib/supabase/server'
import { getGroupById } from '@/lib/db/queries'
import { EditGroupForm } from '@/components/groups/EditGroupForm'
import { notFound } from 'next/navigation'

export default async function EditGroupPage({
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
    <div className="max-w-2xl mx-auto py-6">
      <EditGroupForm group={group} />
    </div>
  )
}
