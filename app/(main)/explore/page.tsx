import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getPosts } from '@/lib/db/queries'
import { ExploreGrid } from '@/components/explore/ExploreGrid'

export default async function ExplorePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/signin')
  }

  const posts = await getPosts(100)

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Explore</h1>
      <ExploreGrid posts={posts} />
    </div>
  )
}
