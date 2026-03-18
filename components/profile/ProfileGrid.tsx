'use client'

import Image from 'next/image'
import Link from 'next/link'
import type { Post } from '@/types'
import { Heart, MessageCircle } from 'lucide-react'

interface ProfileGridProps {
  posts: Post[]
}

export function ProfileGrid({ posts }: ProfileGridProps) {
  if (posts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No posts yet</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-3 gap-0.5">
      {posts.map((post) => (
        <Link
          key={post.id}
          href={`/p/${post.id}`}
          className="relative aspect-square group"
        >
          <Image
            src={post.image_url}
            alt={`Post by ${post.profiles?.username}`}
            fill
            className="object-cover"
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
        </Link>
      ))}
    </div>
  )
}
