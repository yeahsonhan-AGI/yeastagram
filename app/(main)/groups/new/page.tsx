import { CreateGroupForm } from '@/components/groups/CreateGroupForm'

export default async function NewGroupPage({
  searchParams,
}: {
  searchParams: Promise<{ trip_id?: string }>
}) {
  const awaitedParams = await searchParams

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <CreateGroupForm tripId={awaitedParams.trip_id} />
    </div>
  )
}
