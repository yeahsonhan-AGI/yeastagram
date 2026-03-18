'use client'

import Image from 'next/image'
import Link from 'next/link'
import type { Post } from '@/types'
import { Heart, MessageCircle } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface ExploreGridProps {
  posts: Post[]
}

export function ExploreGrid({ posts }: ExploreGridProps) {
  if (posts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No posts yet</p>
      </div>
    )
  }

  // Create 3 columns for masonry-style layout
  const column1 = posts.filter((_, i) => i % 3 === 0)
  const column2 = posts.filter((_, i) => i % 3 === 1)
  const column3 = posts.filter((_, i) => i % 3 === 2)

  const PostItem = ({ post }: { post: Post }) => (
    <Link href={`/p/${post.id}`} className="block group">
      <div className="relative mb-1 overflow-hidden rounded-lg bg-muted">
        <div className="relative aspect-square">
          <Image
            src={post.image_url}
            alt={`Post by ${post.profiles?.username}`}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 33vw, (max-width: 1200px) 25vw, 20vw"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-6 text-white">
            <div className="flex items-center gap-1">
              <Heart className="h-5 w-5 fill-white" />
              <span className="font-semibold text-sm">{post.likes_count || 0}</span>
            </div>
            <div className="flex items-center gap-1">
              <MessageCircle className="h-5 w-5 fill-white" />
              <span className="font-semibold text-sm">{post.comments_count || 0}</span>
            </div>
          </div>
        </div>
      </div>
      {post.profiles?.username && (
        <div className="flex items-center gap-2 px-1 py-2">
          <Avatar className="h-5 w-5">
            <AvatarImage src={post.profiles.avatar_url || undefined} alt={post.profiles.username} />
            <AvatarFallback className="text-[10px] bg-primary text-primary-foreground">
              {post.profiles.username.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="text-xs text-foreground font-medium truncate">
            {post.profiles.username}
          </span>
        </div>
      )}
    </Link>
  )

  return (
    <div className="grid grid-cols-3 gap-1">
      <div className="flex flex-col">
        {column1.map((post) => (
          <PostItem key={post.id} post={post} />
        ))}
      </div>
      <div className="flex flex-col">
        {column2.map((post) => (
          <PostItem key={post.id} post={post} />
        ))}
      </div>
      <div className="flex flex-col">
        {column3.map((post) => (
          <PostItem key={post.id} post={post} />
        ))}
      </div>
    </div>
  )
}
