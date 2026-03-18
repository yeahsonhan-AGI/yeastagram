'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'
import type { Post, Comment } from '@/types'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/hooks/use-toast'

interface PostCardProps {
  post: Post
  currentUserId: string
  priority?: boolean
}

export function PostCard({ post, currentUserId, priority = false }: PostCardProps) {
  const supabase = createClient()
  const [liked, setLiked] = useState(post.is_liked || false)
  const [likesCount, setLikesCount] = useState(post.likes_count || 0)
  const [saved, setSaved] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [comment, setComment] = useState('')
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(false)

  const handleLike = async () => {
    try {
      if (liked) {
        await supabase.from('likes').delete().match({
          user_id: currentUserId,
          post_id: post.id,
        })
        setLiked(false)
        setLikesCount((prev) => Math.max(0, prev - 1))
      } else {
        await supabase.from('likes').insert({
          user_id: currentUserId,
          post_id: post.id,
        })
        setLiked(true)
        setLikesCount((prev) => prev + 1)
      }
    } catch (error) {
      console.error('Error liking post:', error)
      toast({
        title: 'Error',
        description: 'Failed to update like',
        variant: 'destructive',
      })
    }
  }

  const handleSave = () => {
    setSaved(!saved)
    toast({
      title: saved ? 'Removed from saved' : 'Saved to collection',
    })
  }

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this post?')) {
      try {
        const { error } = await supabase
          .from('posts')
          .delete()
          .eq('id', post.id)

        if (error) throw error

        toast({
          title: 'Post deleted',
          description: 'Your post has been deleted successfully',
        })

        // Refresh the page to remove the deleted post
        window.location.reload()
      } catch (error) {
        console.error('Error deleting post:', error)
        toast({
          title: 'Error',
          description: 'Failed to delete post',
          variant: 'destructive',
        })
      }
    }
  }

  const loadComments = async () => {
    if (showComments) {
      setShowComments(false)
      return
    }

    setLoading(true)
    try {
      const { data: comments, error } = await supabase
        .from('comments')
        .select('*')
        .eq('post_id', post.id)
        .order('created_at', { ascending: true })

      if (error) throw error

      // Get unique user_ids from comments
      const userIds = [...new Set(comments?.map(c => c.user_id) || [])]

      // Fetch profiles for these users
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .in('id', userIds)

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || [])

      // Attach profiles to comments
      const commentsWithProfiles = (comments || []).map(comment => ({
        ...comment,
        profiles: profileMap.get(comment.user_id) || null,
      }))

      setComments(commentsWithProfiles)
      setShowComments(true)
    } catch (error) {
      console.error('Error loading comments:', error)
      toast({
        title: 'Error',
        description: 'Failed to load comments',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!comment.trim()) return

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
    } catch (error) {
      console.error('Error posting comment:', error)
      toast({
        title: 'Error',
        description: 'Failed to post comment',
        variant: 'destructive',
      })
    }
  }

  const handleShare = () => {
    navigator.clipboard.writeText(`${window.location.origin}/p/${post.id}`)
    toast({
      title: 'Link copied',
      description: 'Post link copied to clipboard',
    })
  }

  const isOwner = post.user_id === currentUserId

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4">
        <div className="flex items-center space-x-3">
          <Link href={`/${post.profiles?.username || 'profile'}`}>
            <Avatar className="h-8 w-8 cursor-pointer">
              <AvatarImage src={post.profiles?.avatar_url || undefined} alt={post.profiles?.username || 'User'} />
              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                {post.profiles?.username?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
          </Link>
          <div>
            <Link
              href={`/${post.profiles?.username || 'profile'}`}
              className="font-semibold text-sm hover:underline"
            >
              {post.profiles?.username || 'User'}
            </Link>
            <p className="text-xs text-muted-foreground" suppressHydrationWarning>
              {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
            </p>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger className="h-8 w-8 p-0 hover:bg-accent rounded-md flex items-center justify-center">
            <MoreHorizontal className="h-4 w-4 pointer-events-none" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleShare}>Share</DropdownMenuItem>
            <DropdownMenuItem onClick={handleSave}>
              {saved ? 'Remove from saved' : 'Save post'}
            </DropdownMenuItem>
            {isOwner && (
              <>
                <DropdownMenuItem onClick={() => window.location.href = `/edit/${post.id}`}>
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                  Delete
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>

      <CardContent className="p-0">
        <div className="relative aspect-square bg-muted">
          <Image
            src={post.image_url}
            alt={`Post by ${post.profiles?.username}`}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            priority={priority}
          />
        </div>
      </CardContent>

      <CardFooter className="flex flex-col space-y-3 p-4">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                'h-9 w-9',
                liked && 'text-red-500 hover:text-red-600'
              )}
              onClick={handleLike}
            >
              <Heart className={cn('h-6 w-6', liked && 'fill-current')} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={loadComments}
              disabled={loading}
            >
              <MessageCircle className="h-6 w-6" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={handleShare}
            >
              <Send className="h-6 w-6" />
            </Button>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              'h-9 w-9',
              saved && 'text-accent'
            )}
            onClick={handleSave}
          >
            <Bookmark className={cn('h-6 w-6', saved && 'fill-current')} />
          </Button>
        </div>

        {likesCount > 0 && (
          <p className="text-sm font-semibold">{likesCount} likes</p>
        )}

        {post.caption && (
          <p className="text-sm">
            <Link
              href={`/${post.profiles?.username || 'profile'}`}
              className="font-semibold hover:underline"
            >
              {post.profiles?.username}
            </Link>
            {' '}{post.caption}
          </p>
        )}

        {(post.comments_count || comments.length) > 0 && (
          <button
            onClick={loadComments}
            className="text-sm text-muted-foreground hover:underline"
          >
            View all {post.comments_count || comments.length} comments
          </button>
        )}

        {showComments && (
          <div className="space-y-3 w-full">
            <Separator />
            {comments.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No comments yet. Be the first to comment!
              </p>
            ) : (
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex items-start space-x-2 text-sm">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={comment.profiles?.avatar_url || undefined} />
                      <AvatarFallback className="text-xs">
                        {comment.profiles?.username?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <Link
                        href={`/${comment.profiles?.username || 'profile'}`}
                        className="font-semibold hover:underline"
                      >
                        {comment.profiles?.username}
                      </Link>
                      <span className="ml-1">{comment.content}</span>
                      <p className="text-xs text-muted-foreground mt-1" suppressHydrationWarning>
                        {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

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
                className="font-semibold text-primary hover:text-primary/90"
              >
                Post
              </Button>
            </form>
          </div>
        )}
      </CardFooter>
    </Card>
  )
}
