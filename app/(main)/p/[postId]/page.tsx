import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getPostById } from '@/lib/db/queries'
import { PostDetail } from '@/components/feed/PostDetail'

interface PostPageProps {
  params: {
    postId: string
  }
}

export default async function PostPage({ params }: PostPageProps) {
  const { postId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const post = await getPostById(postId, user?.id)

  if (!post) {
    notFound()
  }

  return <PostDetail post={post} currentUserId={user?.id} />
}
