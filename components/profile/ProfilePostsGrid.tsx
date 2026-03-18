'use client'

import Image from 'next/image'
import Link from 'next/link'
import type { Post } from '@/types'
import { Heart, MessageCircle, ImageOff } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ProfilePostsGridProps {
  posts: Post[]
}

export function ProfilePostsGrid({ posts }: ProfilePostsGridProps) {
  if (posts.length === 0) {
    return (
      <div className="text-center py-20 px-4 space-y-4">
        <div className="flex justify-center">
          <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center">
            <ImageOff className="h-10 w-10 text-muted-foreground" />
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-lg font-semibold">No posts yet</p>
          <p className="text-sm text-muted-foreground">Share your adventures with the community</p>
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-3 gap-0.5 sm:gap-1">
      {posts.map((post) => (
        <Link
          key={post.id}
          href={`/p/${post.id}`}
          className="relative aspect-square overflow-hidden group touch-manipulation"
        >
          <Image
            src={post.image_url}
            alt={`Post by ${post.profiles?.username}`}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 33vw, (max-width: 1200px) 25vw, 20vw"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-4 sm:gap-6 text-white">
            <div className="flex items-center gap-1">
              <Heart className="h-4 w-4 sm:h-5 sm:w-5 fill-white" />
              <span className="font-semibold text-sm">{post.likes_count || 0}</span>
            </div>
            <div className="flex items-center gap-1">
              <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5 fill-white" />
              <span className="font-semibold text-sm">{post.comments_count || 0}</span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}
