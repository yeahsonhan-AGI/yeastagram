'use client'

import { useState } from 'react'
import { ArrowLeft, Heart, MessageCircle, Send, Bookmark } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'
import type { Post, Comment } from '@/types'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/hooks/use-toast'
import { createLikeNotification, createCommentNotification } from '@/lib/notifications'
import Image from 'next/image'
import Link from 'next/link'

interface PostDetailProps {
  post: Post
  currentUserId?: string
}

export function PostDetail({ post, currentUserId }: PostDetailProps) {
  const router = useRouter()
  const supabase = createClient()
  const [liked, setLiked] = useState(post.is_liked || false)
  const [likesCount, setLikesCount] = useState(post.likes_count || 0)
  const [saved, setSaved] = useState(false)
  const [comment, setComment] = useState('')
  const [comments, setComments] = useState<Comment[]>(post.comments || [])
  const [loading, setLoading] = useState(false)

  const handleBack = () => {
    router.back()
  }

  const handleLike = async () => {
    if (!currentUserId) {
      console.log('No current user, skipping like')
      return
    }

    console.log('handleLike called:', { liked, currentUserId, postUserId: post.user_id, postId: post.id })

    try {
      if (liked) {
        await supabase.from('likes').delete().match({
          user_id: currentUserId,
          post_id: post.id,
        })
        setLiked(false)
        setLikesCount((prev) => Math.max(0, prev - 1))
        console.log('Like removed')
      } else {
        await supabase.from('likes').insert({
          user_id: currentUserId,
          post_id: post.id,
        })
        setLiked(true)
        setLikesCount((prev) => prev + 1)
        console.log('Like added')

        // Create notification for post owner (if not liking own post)
        if (post.user_id !== currentUserId) {
          console.log('Creating notification for post owner:', post.user_id)
          const result = await createLikeNotification(post.user_id, currentUserId, post.id)
          console.log('Notification result:', result)
        } else {
          console.log('Skipping notification - liking own post')
        }
      }
    } catch (error) {
      console.error('Error liking post:', error)
    }
  }

  const handleSave = () => {
    setSaved(!saved)
    toast({
      title: saved ? 'Removed from saved' : 'Saved to collection',
    })
  }

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!comment.trim() || !currentUserId) return

    try {
      const { data: newComment, error: insertError } = await supabase
        .from('comments')
        .insert({
          user_id: currentUserId,
          post_id: post.id,
          content: comment.trim(),
        })
        .select('*')
        .single()

      if (insertError) throw insertError

      // Fetch profile for the new comment
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUserId)
        .single()

      const commentWithProfile = {
        ...newComment,
        profiles: profile || null,
      }

      setComments((prev) => [...prev, commentWithProfile])
      setComment('')

      // Create notification for post owner (if not commenting on own post)
      if (post.user_id !== currentUserId && newComment) {
        await createCommentNotification(post.user_id, currentUserId, post.id, newComment.id)
      }
    } catch (error) {
      console.error('Error posting comment:', error)
      toast({
        title: 'Error',
        description: 'Failed to post comment',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardContent className="p-0">
          <div className="grid md:grid-cols-2">
            {/* Image */}
            <div className="relative aspect-square bg-muted">
              <Image
                src={post.image_url}
                alt={`Post by ${post.profiles?.username}`}
                fill
                className="object-cover"
                priority
              />
            </div>

            {/* Details */}
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center space-x-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={handleBack}
                    aria-label="Go back"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={post.profiles?.avatar_url || undefined} />
                    <AvatarFallback className="bg-[#2D4A3E] text-[#FAF8F5] text-xs">
                      {post.profiles?.username?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <Link
                    href={`/${post.profiles?.username || 'profile'}`}
                    className="font-semibold text-sm hover:underline"
                  >
                    {post.profiles?.username}
                  </Link>
                </div>
                <span className="text-xs text-muted-foreground" suppressHydrationWarning>
                  {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                </span>
              </div>

              {/* Comments */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-96">
                {post.caption && (
                  <div className="flex items-start space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={post.profiles?.avatar_url || undefined} />
                      <AvatarFallback className="bg-[#2D4A3E] text-[#FAF8F5] text-xs">
                        {post.profiles?.username?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <Link
                        href={`/${post.profiles?.username || 'profile'}`}
                        className="font-semibold text-sm hover:underline"
                      >
                        {post.profiles?.username}
                      </Link>
                      <span className="ml-1 text-sm">{post.caption}</span>
                    </div>
                  </div>
                )}

                {comments.map((comment) => (
                  <div key={comment.id} className="flex items-start space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={comment.profiles?.avatar_url || undefined} />
                      <AvatarFallback className="text-xs">
                        {comment.profiles?.username?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <Link
                        href={`/${comment.profiles?.username || 'profile'}`}
                        className="font-semibold text-sm hover:underline"
                      >
                        {comment.profiles?.username}
                      </Link>
                      <span className="ml-1 text-sm">{comment.content}</span>
                      <p className="text-xs text-muted-foreground mt-1" suppressHydrationWarning>
                        {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))}

                {comments.length === 0 && (
                  <p className="text-center text-muted-foreground text-sm py-8">
                    No comments yet. Be the first to comment!
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="border-t p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn('h-9 w-9', liked && 'text-red-500 hover:text-red-600')}
                      onClick={handleLike}
                    >
                      <Heart className={cn('h-6 w-6', liked && 'fill-current')} />
                    </Button>
                    <span className="text-sm font-medium">{likesCount} likes</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn('h-9 w-9', saved && 'text-[#D4723A]')}
                    onClick={handleSave}
                  >
                    <Bookmark className={cn('h-6 w-6', saved && 'fill-current')} />
                  </Button>
                </div>

                <form onSubmit={handleSubmitComment} className="flex items-center space-x-2">
                  <Textarea
                    placeholder="Add a comment..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="flex-1 min-h-0 h-9 resize-none"
                    rows={1}
                  />
                  <Button
                    type="submit"
                    variant="ghost"
                    size="sm"
                    disabled={!comment.trim()}
                    className="font-semibold text-[#2D4A3E] hover:text-[#1F3A2E]"
                  >
                    Post
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
