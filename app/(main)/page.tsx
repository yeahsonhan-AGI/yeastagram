import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getFeedPosts } from '@/lib/db/queries'
import { PostCard } from '@/components/feed/PostCard'
import { FloatingCreateButton } from '@/components/feed/FloatingCreateButton'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/signin')
  }

  const posts = await getFeedPosts(user.id)

  return (
    <>
      <FloatingCreateButton />

      <div className="max-w-lg mx-auto space-y-4">
        {posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">No posts yet</p>
            <p className="text-muted-foreground text-sm mt-2">
              Follow some users or create your first post to get started!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post, index) => (
              <PostCard
                key={post.id}
                post={post}
                currentUserId={user.id}
                priority={index === 0}
              />
            ))}
          </div>
        )}
      </div>
    </>
  )
}
