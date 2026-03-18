import { createClient } from '@/lib/supabase/client'

/**
 * Create a notification for a user using API route
 */
export async function createNotification({
  userId,
  actorId,
  type,
  postId,
  commentId,
}: {
  userId: string
  actorId: string
  type: 'like' | 'comment' | 'follow'
  postId?: string
  commentId?: string
}) {
  // Don't create notification for yourself
  if (userId === actorId) return

  try {
    const response = await fetch('/api/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        actorId,
        type,
        postId,
        commentId,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('Error creating notification:', errorData)
      return { error: errorData }
    }

    const data = await response.json()
    console.log('Notification created:', data)
    return { data, error: null }
  } catch (error) {
    console.error('Error creating notification:', error)
    return { error }
  }
}

/**
 * Create a like notification
 */
export async function createLikeNotification(postOwnerId: string, actorId: string, postId: string) {
  console.log('Creating like notification:', { postOwnerId, actorId, postId })
  return await createNotification({
    userId: postOwnerId,
    actorId,
    type: 'like',
    postId,
  })
}

/**
 * Create a comment notification
 */
export async function createCommentNotification(postOwnerId: string, actorId: string, postId: string, commentId: string) {
  console.log('Creating comment notification:', { postOwnerId, actorId, postId, commentId })
  return await createNotification({
    userId: postOwnerId,
    actorId,
    type: 'comment',
    postId,
    commentId,
  })
}

/**
 * Create a follow notification
 */
export async function createFollowNotification(userId: string, actorId: string) {
  console.log('Creating follow notification:', { userId, actorId })
  return await createNotification({
    userId,
    actorId,
    type: 'follow',
  })
}
