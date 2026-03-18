import { createClient } from '@/lib/supabase/server'
import type { Post, Profile, Like, Comment, Follow, Trip, DailyLog, GearCategory, GearItem, TripStats, TripInput, DailyLogInput, GearCategoryInput, GearItemInput, TripComment, TripFilters, Group, GroupInput, GroupMember, GroupSharedItinerary, GroupItineraryDay, GroupItineraryDayInput, GroupExpense, GroupExpenseInput, GroupExpenseSplit, GroupMessage, GroupMessageInput, GroupJoinRequest, ExpenseSettlement, GroupLocationUpdate, GroupInvite } from '@/types'

// Lazy load admin client to avoid issues during module initialization
function getAdminClient() {
  try {
    const { createAdminClient } = require('@/lib/supabase/admin')
    return createAdminClient()
  } catch {
    return null
  }
}

// Profile Queries
export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) return null
  return data
}

export async function getProfileByUsername(username: string): Promise<Profile | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .single()

  if (error) return null
  return data
}

export async function updateProfile(userId: string, updates: Partial<Profile>) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single()

  return { data, error }
}

// Post Queries
export async function getPosts(limit = 20, offset = 0): Promise<Post[]> {
  const supabase = await createClient()

  // First get posts
  const { data: posts, error: postsError } = await supabase
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (postsError || !posts || posts.length === 0) return []

  // Get post IDs
  const postIds = posts.map(p => p.id)

  // Fetch likes for these posts
  const { data: likes } = await supabase
    .from('likes')
    .select('post_id')
    .in('post_id', postIds)

  // Fetch comments count
  const { data: comments } = await supabase
    .from('comments')
    .select('post_id')
    .in('post_id', postIds)

  // Get unique user_ids from posts
  const userIds = [...new Set(posts.map(p => p.user_id))]

  // Fetch profiles for these users
  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .in('id', userIds)

  const profileMap = new Map(profiles?.map((p: any) => [p.id, p]) || [])

  // Count likes per post
  const likeCounts = new Map<string, number>()
  likes?.forEach(like => {
    likeCounts.set(like.post_id, (likeCounts.get(like.post_id) || 0) + 1)
  })

  // Count comments per post
  const commentCounts = new Map<string, number>()
  comments?.forEach(comment => {
    commentCounts.set(comment.post_id, (commentCounts.get(comment.post_id) || 0) + 1)
  })

  // Attach all data to posts
  return posts.map(post => ({
    ...post,
    profiles: profileMap.get(post.user_id) || null,
    likes_count: likeCounts.get(post.id) || 0,
    comments_count: commentCounts.get(post.id) || 0,
  }))
}

export async function getFeedPosts(userId: string, limit = 20, offset = 0): Promise<Post[]> {
  const supabase = await createClient()

  // First get followed users
  const { data: following } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', userId)

  const followingIds = following?.map(f => f.following_id) || []
  const allUserIds = [userId, ...followingIds]

  // Get posts from followed users and own posts
  const { data: posts, error: postsError } = await supabase
    .from('posts')
    .select('*')
    .in('user_id', allUserIds)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (postsError || !posts || posts.length === 0) return []

  // Get post IDs
  const postIds = posts.map(p => p.id)

  // Fetch likes for these posts
  const { data: likes } = await supabase
    .from('likes')
    .select('post_id, user_id')
    .in('post_id', postIds)

  // Fetch comments count
  const { data: comments } = await supabase
    .from('comments')
    .select('post_id')
    .in('post_id', postIds)

  // Get unique user_ids from posts
  const userIds = [...new Set(posts.map(p => p.user_id))]

  // Fetch profiles for these users
  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .in('id', userIds)

  const profileMap = new Map(profiles?.map((p: any) => [p.id, p]) || [])

  // Count likes per post
  const likeCounts = new Map<string, number>()
  const userLikes = new Set<string>()
  likes?.forEach(like => {
    likeCounts.set(like.post_id, (likeCounts.get(like.post_id) || 0) + 1)
    if (like.user_id === userId) {
      userLikes.add(like.post_id)
    }
  })

  // Count comments per post
  const commentCounts = new Map<string, number>()
  comments?.forEach(comment => {
    commentCounts.set(comment.post_id, (commentCounts.get(comment.post_id) || 0) + 1)
  })

  // Attach all data to posts
  return posts.map(post => ({
    ...post,
    profiles: profileMap.get(post.user_id) || null,
    likes_count: likeCounts.get(post.id) || 0,
    comments_count: commentCounts.get(post.id) || 0,
    is_liked: userLikes.has(post.id),
  }))
}

export async function getUserPosts(userId: string, currentUserId?: string, limit = 20, offset = 0): Promise<Post[]> {
  const supabase = await createClient()

  const { data: posts, error: postsError } = await supabase
    .from('posts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (postsError || !posts || posts.length === 0) return []

  // Get post IDs
  const postIds = posts.map(p => p.id)

  // Fetch likes for these posts
  const { data: likes } = await supabase
    .from('likes')
    .select('post_id, user_id')
    .in('post_id', postIds)

  // Fetch comments count
  const { data: comments } = await supabase
    .from('comments')
    .select('post_id')
    .in('post_id', postIds)

  // Fetch profile for this user
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  // Count likes per post and track user likes
  const likeCounts = new Map<string, number>()
  const userLikes = new Set<string>()
  likes?.forEach(like => {
    likeCounts.set(like.post_id, (likeCounts.get(like.post_id) || 0) + 1)
    if (currentUserId && like.user_id === currentUserId) {
      userLikes.add(like.post_id)
    }
  })

  // Count comments per post
  const commentCounts = new Map<string, number>()
  comments?.forEach(comment => {
    commentCounts.set(comment.post_id, (commentCounts.get(comment.post_id) || 0) + 1)
  })

  // Attach all data to posts
  return posts.map(post => ({
    ...post,
    profiles: profile || null,
    likes_count: likeCounts.get(post.id) || 0,
    comments_count: commentCounts.get(post.id) || 0,
    is_liked: userLikes.has(post.id),
  }))
}

export async function getPostById(postId: string, currentUserId?: string): Promise<Post | null> {
  try {
    console.log('[getPostById] Fetching post:', postId)
    const supabase = await createClient()

    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('*')
      .eq('id', postId)
      .maybeSingle()

    if (postError) {
      console.error('[getPostById] Error fetching post:', postError)
      return null
    }

    if (!post) {
      console.log('[getPostById] Post not found:', postId)
      return null
    }

    console.log('[getPostById] Post found, user_id:', post.user_id)

    // Fetch profile for post author
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', post.user_id)
      .maybeSingle()

    if (profileError) {
      console.error('[getPostById] Error fetching profile:', profileError)
    }

    // Fetch likes for this post
    const { data: likes, error: likesError } = await supabase
      .from('likes')
      .select('user_id')
      .eq('post_id', postId)

    if (likesError) {
      console.error('[getPostById] Error fetching likes:', likesError)
    }

    // Fetch comments for this post
    const { data: comments, error: commentsError } = await supabase
      .from('comments')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: true })

    if (commentsError) {
      console.error('[getPostById] Error fetching comments:', commentsError)
    }

    // Get all unique user IDs from comments
    const commentUserIds = [...new Set(comments?.map(c => c.user_id) || [])]
    console.log('[getPostById] Comment user IDs:', commentUserIds)

    // Fetch all profiles at once
    let commentProfiles: any[] | null = null
    let profileError2: any = null

    if (commentUserIds.length > 0) {
      const result = await supabase
        .from('profiles')
        .select('*')
        .in('id', commentUserIds)

      commentProfiles = result.data
      profileError2 = result.error
    }

    if (profileError2) {
      console.error('[getPostById] Error fetching comment profiles:', profileError2)
    }

    const profileMap = new Map(commentProfiles?.map(p => [p.id, p]) || [])

    // Attach profiles to comments
    const commentsWithProfiles = (comments || []).map((comment) => ({
      ...comment,
      profiles: profileMap.get(comment.user_id) || null,
    }))

    // Check if current user liked this post
    const isLiked = currentUserId && likes?.some(like => like.user_id === currentUserId)

    const result = {
      ...post,
      profiles: profile || null,
      likes_count: likes?.length || 0,
      comments_count: comments?.length || 0,
      is_liked: isLiked || false,
      comments: commentsWithProfiles,
    }

    console.log('[getPostById] Returning post with', commentsWithProfiles.length, 'comments')

    return result
  } catch (error) {
    console.error('[getPostById] Unexpected error:', error)
    return null
  }
}

export async function createPost(userId: string, imageUrl: string, caption?: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('posts')
    .insert({ user_id: userId, image_url: imageUrl, caption })
    .select()
    .single()

  return { data, error }
}

export async function deletePost(postId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('posts')
    .delete()
    .eq('id', postId)

  return { error }
}

// Like Queries
export async function likePost(userId: string, postId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('likes')
    .insert({ user_id: userId, post_id: postId })
    .select()
    .single()

  return { data, error }
}

export async function unlikePost(userId: string, postId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('likes')
    .delete()
    .eq('user_id', userId)
    .eq('post_id', postId)

  return { error }
}

export async function isPostLiked(userId: string, postId: string): Promise<boolean> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('likes')
    .select('id')
    .eq('user_id', userId)
    .eq('post_id', postId)
    .single()

  return !error && !!data
}

// Comment Queries
export async function getComments(postId: string): Promise<Comment[]> {
  const supabase = await createClient()
  const { data: comments, error: commentsError } = await supabase
    .from('comments')
    .select('*')
    .eq('post_id', postId)
    .order('created_at', { ascending: true })

  if (commentsError || !comments || comments.length === 0) return []

  // Get unique user_ids from comments
  const userIds = [...new Set(comments.map(c => c.user_id))]

  // Fetch profiles for these users
  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .in('id', userIds)

  const profileMap = new Map(profiles?.map((p: any) => [p.id, p]) || [])

  // Attach profiles to comments
  return comments.map(comment => ({
    ...comment,
    profiles: profileMap.get(comment.user_id) || null,
  }))
}

export async function createComment(userId: string, postId: string, content: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('comments')
    .insert({ user_id: userId, post_id: postId, content })
    .select('*')
    .single()

  if (error) return { data: null, error }

  // Fetch profile for the new comment
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  return { data: { ...data, profiles: profile }, error: null }
}

export async function deleteComment(commentId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('comments')
    .delete()
    .eq('id', commentId)

  return { error }
}

// Follow Queries
export async function followUser(followerId: string, followingId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('follows')
    .insert({ follower_id: followerId, following_id: followingId })
    .select()
    .single()

  return { data, error }
}

export async function unfollowUser(followerId: string, followingId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('follows')
    .delete()
    .eq('follower_id', followerId)
    .eq('following_id', followingId)

  return { error }
}

export async function isFollowing(followerId: string, followingId: string): Promise<boolean> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('follows')
    .select('id')
    .eq('follower_id', followerId)
    .eq('following_id', followingId)
    .single()

  return !error && !!data
}

export async function getFollowers(userId: string): Promise<Profile[]> {
  const supabase = await createClient()
  const { data: follows, error } = await supabase
    .from('follows')
    .select('follower_id')
    .eq('following_id', userId)

  if (error || !follows) return []

  const followerIds = follows.map(f => f.follower_id)

  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .in('id', followerIds)

  return profiles || []
}

export async function getFollowing(userId: string): Promise<Profile[]> {
  const supabase = await createClient()
  const { data: follows, error } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', userId)

  if (error || !follows) return []

  const followingIds = follows.map(f => f.following_id)

  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .in('id', followingIds)

  return profiles || []
}

// Search Queries
export async function searchUsers(query: string): Promise<Profile[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
    .limit(20)

  if (error) return []
  return data || []
}

export async function searchPosts(query: string): Promise<Post[]> {
  const supabase = await createClient()
  const { data: posts, error: postsError } = await supabase
    .from('posts')
    .select('*')
    .ilike('caption', `%${query}%`)
    .order('created_at', { ascending: false })
    .limit(50)

  if (postsError || !posts || posts.length === 0) return []

  // Get unique user_ids from posts
  const userIds = [...new Set(posts.map(p => p.user_id))]

  // Fetch profiles for these users
  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .in('id', userIds)

  const profileMap = new Map(profiles?.map((p: any) => [p.id, p]) || [])

  // Attach profiles to posts
  return posts.map(post => ({
    ...post,
    profiles: profileMap.get(post.user_id) || null,
  }))
}

// Notification Queries
export async function getNotifications(userId: string) {
  const supabase = await createClient()

  const { data: notifications, error } = await supabase
    .from('notifications')
    .select('id, user_id, actor_id, type, post_id, comment_id, read, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error || !notifications) return []

  // Get unique actor_ids from notifications
  const actorIds = [...new Set(notifications.map(n => n.actor_id))]

  // Fetch profiles for these actors
  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .in('id', actorIds)

  const profileMap = new Map(profiles?.map((p: any) => [p.id, p]) || [])

  // Get post IDs for notifications that have posts
  const postIds = notifications.map(n => n.post_id).filter(Boolean) as string[]

  // Fetch posts for notifications
  let postMap = new Map()
  if (postIds.length > 0) {
    const { data: posts } = await supabase
      .from('posts')
      .select('id, image_url')
      .in('id', postIds)
    postMap = new Map(posts?.map(p => [p.id, p]) || [])
  }

  // Attach profiles and posts to notifications
  return notifications.map(notification => ({
    ...notification,
    actor_profile: profileMap.get(notification.actor_id) || null,
    post: notification.post_id ? postMap.get(notification.post_id) || null : null,
    group: null, // Will be fetched separately once migration is run
  }))
}

export async function markNotificationAsRead(notificationId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', notificationId)

  return { error }
}

export async function markAllNotificationsAsRead(userId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', userId)
    .eq('read', false)

  return { error }
}

export async function getUnreadNotificationCount(userId: string): Promise<number> {
  const supabase = await createClient()
  const { count } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('read', false)

  return count || 0
}

// ============================================
// Trip & Daily Log Queries
// ============================================

// Trip Queries
export async function getTrips(
  limit = 20,
  offset = 0,
  filters?: TripFilters,
  currentUserId?: string
): Promise<Trip[]> {
  const supabase = await createClient()

  let query = supabase
    .from('trips')
    .select('*')
    .order('created_at', { ascending: false })

  // Apply filters
  if (filters?.activity_type) {
    query = query.eq('activity_type', filters.activity_type)
  }
  if (filters?.user_id) {
    query = query.eq('user_id', filters.user_id)
  }
  if (filters?.date_from) {
    query = query.gte('start_date', filters.date_from)
  }
  if (filters?.date_to) {
    query = query.lte('start_date', filters.date_to)
  }

  // Only show public trips unless owned by current user
  if (currentUserId) {
    query = query.or(`is_public.eq.true,user_id.eq.${currentUserId}`)
  } else {
    query = query.eq('is_public', true)
  }

  const { data: trips, error } = await query.range(offset, offset + limit - 1)

  if (error || !trips || trips.length === 0) return []

  // Get user IDs for profile fetching
  const userIds = [...new Set(trips.map(t => t.user_id))]

  // Fetch profiles
  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .in('id', userIds)

  const profileMap = new Map(profiles?.map((p: any) => [p.id, p]) || [])

  // Check if current user liked these trips
  let likedTripIds: string[] = []
  if (currentUserId) {
    const { data: likes } = await supabase
      .from('trip_likes')
      .select('trip_id')
      .eq('user_id', currentUserId)
      .in('trip_id', trips.map(t => t.id))

    likedTripIds = likes?.map(l => l.trip_id) || []
  }

  // Attach profiles and like status
  return trips.map(trip => ({
    ...trip,
    profiles: profileMap.get(trip.user_id) || null,
    is_liked: likedTripIds.includes(trip.id),
  }))
}

export async function getTripById(tripId: string, currentUserId?: string): Promise<Trip | null> {
  const supabase = await createClient()

  const { data: trip, error } = await supabase
    .from('trips')
    .select('*')
    .eq('id', tripId)
    .single()

  if (error || !trip) return null

  // Check access permission
  if (!trip.is_public && trip.user_id !== currentUserId) {
    return null
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', trip.user_id)
    .single()

  // Get daily logs for this trip
  const { data: dailyLogs } = await supabase
    .from('daily_logs')
    .select('*')
    .eq('trip_id', tripId)
    .order('day_number', { ascending: true })

  // Get gear categories with items
  const { data: gearCategories } = await supabase
    .from('gear_categories')
    .select('*, gear_items(*)')
    .eq('trip_id', tripId)
    .order('display_order', { ascending: true })

  // Check if current user liked this trip
  let isLiked = false
  if (currentUserId) {
    const { data: like } = await supabase
      .from('trip_likes')
      .select('id')
      .eq('user_id', currentUserId)
      .eq('trip_id', tripId)
      .single()

    isLiked = !!like
  }

  return {
    ...trip,
    profiles: profile || null,
    daily_logs: dailyLogs || [],
    gear_categories: gearCategories || [],
    is_liked: isLiked,
  }
}

export async function createTrip(userId: string, tripData: TripInput): Promise<{ data: Trip | null, error: any }> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('trips')
    .insert({
      user_id: userId,
      ...tripData,
    })
    .select()
    .single()

  return { data, error }
}

export async function updateTrip(
  tripId: string,
  userId: string,
  tripData: Partial<TripInput>
): Promise<{ data: Trip | null, error: any }> {
  const supabase = await createClient()

  // Verify ownership
  const { data: existing } = await supabase
    .from('trips')
    .select('user_id')
    .eq('id', tripId)
    .single()

  if (!existing || existing.user_id !== userId) {
    return { data: null, error: { message: 'Unauthorized or trip not found' } }
  }

  const { data, error } = await supabase
    .from('trips')
    .update(tripData)
    .eq('id', tripId)
    .select()
    .single()

  return { data: data as Trip, error }
}

export async function deleteTrip(tripId: string, userId: string): Promise<{ error: any }> {
  const supabase = await createClient()

  // Verify ownership
  const { data: existing } = await supabase
    .from('trips')
    .select('user_id')
    .eq('id', tripId)
    .single()

  if (!existing || existing.user_id !== userId) {
    return { error: { message: 'Unauthorized or trip not found' } }
  }

  const { error } = await supabase
    .from('trips')
    .delete()
    .eq('id', tripId)

  return { error }
}

export async function getUserTrips(userId: string, currentUserId?: string): Promise<Trip[]> {
  return getTrips(100, 0, { user_id: userId }, currentUserId)
}

export async function getUserTripStats(userId: string): Promise<TripStats> {
  const supabase = await createClient()

  const { data: trips } = await supabase
    .from('trips')
    .select('*')
    .eq('user_id', userId)

  if (!trips || trips.length === 0) {
    return {
      total_trips: 0,
      total_distance_km: 0,
      total_elevation_gain_m: 0,
      total_days: 0,
      by_type: { hiking: 0, climbing: 0 },
      by_year: {},
    }
  }

  const totalDistance = trips.reduce((sum, t) => sum + (t.total_distance_km || 0), 0)
  const totalElevation = trips.reduce((sum, t) => sum + (t.total_elevation_gain_m || 0), 0)

  // Count total days from daily logs
  const { data: dailyLogs } = await supabase
    .from('daily_logs')
    .select('trip_id')
    .in('trip_id', trips.map(t => t.id))

  const totalDays = new Set(dailyLogs?.map(dl => dl.trip_id)).size

  const byType: Record<string, number> = { hiking: 0, climbing: 0 }
  const byYear: Record<number, number> = {}

  trips.forEach(trip => {
    byType[trip.activity_type] = (byType[trip.activity_type] || 0) + 1

    const year = new Date(trip.start_date).getFullYear()
    byYear[year] = (byYear[year] || 0) + 1
  })

  return {
    total_trips: trips.length,
    total_distance_km: totalDistance,
    total_elevation_gain_m: totalElevation,
    total_days: totalDays,
    by_type: byType,
    by_year: byYear,
  }
}

// Daily Log Queries
export async function getDailyLogs(tripId: string): Promise<DailyLog[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('daily_logs')
    .select('*')
    .eq('trip_id', tripId)
    .order('day_number', { ascending: true })

  if (error || !data) return []
  return data
}

export async function getDailyLogById(dailyLogId: string): Promise<DailyLog | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('daily_logs')
    .select('*')
    .eq('id', dailyLogId)
    .single()

  if (error || !data) return null
  return data
}

export async function createDailyLog(
  tripId: string,
  dailyLogData: DailyLogInput
): Promise<{ data: DailyLog | null, error: any }> {
  const supabase = await createClient()

  // Verify trip ownership
  const { data: trip } = await supabase
    .from('trips')
    .select('user_id')
    .eq('id', tripId)
    .single()

  if (!trip) {
    return { data: null, error: { message: 'Trip not found' } }
  }

  const { data, error } = await supabase
    .from('daily_logs')
    .insert({
      trip_id: tripId,
      ...dailyLogData,
    })
    .select()
    .single()

  return { data, error }
}

export async function updateDailyLog(
  dailyLogId: string,
  dailyLogData: Partial<DailyLogInput>
): Promise<{ data: DailyLog | null, error: any }> {
  const supabase = await createClient()

  // Verify ownership via trip
  const { data: dailyLog } = await supabase
    .from('daily_logs')
    .select('trip_id, trips!inner(user_id)')
    .eq('id', dailyLogId)
    .single()

  if (!dailyLog) {
    return { data: null, error: { message: 'Daily log not found' } }
  }

  // The join result structure might be different, let's do it properly
  const { data: existing } = await supabase
    .from('daily_logs')
    .select('trip_id')
    .eq('id', dailyLogId)
    .single()

  if (!existing) {
    return { data: null, error: { message: 'Daily log not found' } }
  }

  const { data: trip } = await supabase
    .from('trips')
    .select('user_id')
    .eq('id', existing.trip_id)
    .single()

  if (!trip) {
    return { data: null, error: { message: 'Trip not found' } }
  }

  const { data, error } = await supabase
    .from('daily_logs')
    .update(dailyLogData)
    .eq('id', dailyLogId)
    .select()
    .single()

  return { data, error }
}

export async function deleteDailyLog(dailyLogId: string): Promise<{ error: any }> {
  const supabase = await createClient()

  // Ownership will be checked by RLS
  const { error } = await supabase
    .from('daily_logs')
    .delete()
    .eq('id', dailyLogId)

  return { error }
}

// Gear Queries
export async function getGearCategories(tripId: string): Promise<GearCategory[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('gear_categories')
    .select('*, gear_items(*)')
    .eq('trip_id', tripId)
    .order('display_order', { ascending: true })

  if (error || !data) return []
  return data
}

export async function createGearCategory(
  tripId: string,
  categoryData: GearCategoryInput
): Promise<{ data: GearCategory | null, error: any }> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('gear_categories')
    .insert({
      trip_id: tripId,
      ...categoryData,
    })
    .select()
    .single()

  return { data, error }
}

export async function deleteGearCategory(categoryId: string): Promise<{ error: any }> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('gear_categories')
    .delete()
    .eq('id', categoryId)

  return { error }
}

export async function createGearItem(
  categoryId: string,
  itemData: GearItemInput
): Promise<{ data: GearItem | null, error: any }> {
  const supabase = await createClient()

  // Extract categoryId from itemData if present (frontend might send it)
  const { categoryId: _, ...cleanItemData } = itemData as any

  const { data, error } = await supabase
    .from('gear_items')
    .insert({
      category_id: categoryId,
      ...cleanItemData,
    })
    .select()
    .single()

  return { data, error }
}

export async function updateGearItem(
  itemId: string,
  itemData: Partial<GearItemInput>
): Promise<{ data: GearItem | null, error: any }> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('gear_items')
    .update(itemData)
    .eq('id', itemId)
    .select()
    .single()

  return { data, error }
}

export async function deleteGearItem(itemId: string): Promise<{ error: any }> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('gear_items')
    .delete()
    .eq('id', itemId)

  return { error }
}

export async function calculateTripPackWeight(tripId: string): Promise<number> {
  const categories = await getGearCategories(tripId)

  return categories.reduce((total, category) => {
    return total + (category.gear_items?.reduce((sum, item) => {
      return sum + (item.is_packed ? item.weight_g : 0)
    }, 0) || 0)
  }, 0)
}

// Social Queries
export async function likeTrip(tripId: string, userId: string): Promise<{ error: any }> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('trip_likes')
    .insert({
      user_id: userId,
      trip_id: tripId,
    })

  return { error }
}

export async function unlikeTrip(tripId: string, userId: string): Promise<{ error: any }> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('trip_likes')
    .delete()
    .eq('user_id', userId)
    .eq('trip_id', tripId)

  return { error }
}

export async function getTripComments(tripId: string): Promise<TripComment[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('trip_comments')
    .select('*, profiles(*)')
    .eq('trip_id', tripId)
    .order('created_at', { ascending: true })

  if (error || !data) return []
  return data
}

export async function createTripComment(
  tripId: string,
  userId: string,
  content: string
): Promise<{ data: TripComment | null, error: any }> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('trip_comments')
    .insert({
      user_id: userId,
      trip_id: tripId,
      content,
    })
    .select()
    .single()

  return { data, error }
}

export async function deleteTripComment(commentId: string, userId: string): Promise<{ error: any }> {
  const supabase = await createClient()

  // Verify ownership
  const { data: existing } = await supabase
    .from('trip_comments')
    .select('user_id')
    .eq('id', commentId)
    .single()

  if (!existing || existing.user_id !== userId) {
    return { error: { message: 'Unauthorized or comment not found' } }
  }

  const { error } = await supabase
    .from('trip_comments')
    .delete()
    .eq('id', commentId)

  return { error }
}

// ============================================
// Group Queries
// ============================================

// Group CRUD
export async function getGroups(
  limit = 20,
  offset = 0,
  currentUserId?: string,
  includeJoined = false
): Promise<Group[]> {
  const supabase = await createClient()

  let query = supabase
    .from('groups')
    .select('*')
    .order('created_at', { ascending: false })

  if (includeJoined && currentUserId) {
    // Get groups user is a member of or public groups
    const { data: memberGroupIds } = await supabase
      .from('group_members')
      .select('group_id')
      .eq('user_id', currentUserId)

    const groupIds = memberGroupIds?.map(m => m.group_id) || []

    if (groupIds.length > 0) {
      query = query.or(`is_public.eq.true,id.in.(${groupIds.join(',')})`)
    } else {
      query = query.eq('is_public', true)
    }
  } else {
    // Only show public groups
    query = query.eq('is_public', true)
  }

  const { data: groups, error } = await query.range(offset, offset + limit - 1)

  if (error || !groups || groups.length === 0) return []

  // Get leader IDs for profile fetching
  const leaderIds = [...new Set(groups.map(g => g.leader_id))]

  // Fetch profiles
  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .in('id', leaderIds)

  const profileMap = new Map(profiles?.map((p: any) => [p.id, p]) || [])

  // Check if current user is a member
  let memberGroupIds: string[] = []
  if (currentUserId) {
    const { data: memberships } = await supabase
      .from('group_members')
      .select('group_id')
      .eq('user_id', currentUserId)
      .in('group_id', groups.map(g => g.id))

    memberGroupIds = memberships?.map(m => m.group_id) || []
  }

  return groups.map(group => ({
    ...group,
    leader: profileMap.get(group.leader_id) || null,
    is_member: memberGroupIds.includes(group.id),
  })) as Group[]
}

export async function getGroupById(
  groupId: string,
  currentUserId?: string
): Promise<Group | null> {
  const supabase = await createClient()

  const { data: group, error } = await supabase
    .from('groups')
    .select('*')
    .eq('id', groupId)
    .single()

  if (error || !group) return null

  // Check access permission
  const { data: membership } = await supabase
    .from('group_members')
    .select('role')
    .eq('group_id', groupId)
    .eq('user_id', currentUserId || '')
    .maybeSingle()

  if (!group.is_public && !membership) {
    return null
  }

  // Get leader profile
  const { data: leaderProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', group.leader_id)
    .maybeSingle()

  // Get all members (without profiles for now)
  const { data: members } = await supabase
    .from('group_members')
    .select('*')
    .eq('group_id', groupId)
    .order('joined_at', { ascending: true })

  // Fetch profiles for all members separately using admin client to bypass RLS
  let membersWithProfiles: GroupMember[] = []
  if (members && members.length > 0) {
    const userIds = members.map(m => m.user_id)

    // Try admin client first, fall back to regular client
    const adminSupabase = getAdminClient()
    const clientToUse = adminSupabase || supabase

    const { data: memberProfiles } = await clientToUse
      .from('profiles')
      .select('*')
      .in('id', userIds)

    console.log('getGroupById - members:', members.length, 'profiles:', memberProfiles?.length || 0)

    const profileMap = new Map(memberProfiles?.map((p: { id: string }) => [p.id, p]) || [])

    membersWithProfiles = members.map(member => {
      const profile = profileMap.get(member.user_id) || null
      return {
        ...member,
        user: profile,
      }
    })
  }

  // Get shared itinerary if exists
  const { data: sharedItinerary } = await supabase
    .from('group_shared_itinerary')
    .select('*')
    .eq('group_id', groupId)
    .maybeSingle()

  // Fetch itinerary days if itinerary exists
  let sharedItineraryWithDays = sharedItinerary
  if (sharedItinerary) {
    const { data: days } = await supabase
      .from('group_itinerary_days')
      .select('*')
      .eq('itinerary_id', sharedItinerary.id)
      .order('day_number', { ascending: true })
    sharedItineraryWithDays = {
      ...sharedItinerary,
      days: days || []
    }
  }

  // Get associated trip if exists
  let trip = null
  if (group.trip_id) {
    const { data: tripData } = await supabase
      .from('trips')
      .select('*')
      .eq('id', group.trip_id)
      .maybeSingle()

    if (tripData) {
      const { data: tripProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', tripData.user_id)
        .maybeSingle()

      trip = { ...tripData, profiles: tripProfile }
    }
  }

  return {
    ...group,
    members_count: membersWithProfiles.length, // Use actual member count
    leader: leaderProfile || null,
    members: membersWithProfiles,
    shared_itinerary: sharedItineraryWithDays || null,
    trip,
    is_member: !!membership,
    current_user_role: membership?.role,
  } as Group
}

export async function createGroup(
  userId: string,
  groupData: GroupInput
): Promise<{ data: Group | null, error: any }> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('groups')
    .insert({
      leader_id: userId,
      ...groupData,
    })
    .select()
    .single()

  if (error) return { data: null, error }

  // Manually add the leader as a member (bypass trigger RLS issues)
  const { error: memberError } = await supabase
    .from('group_members')
    .insert({
      group_id: data.id,
      user_id: userId,
      role: 'leader',
    })

  if (memberError) {
    console.error('Error adding leader as member:', memberError)
    // Don't fail the whole operation if member creation fails
  }

  // Get leader profile
  const { data: leaderProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  return {
    data: {
      ...data,
      leader: leaderProfile || null,
      members: [],
      is_member: true,
    } as Group,
    error: null,
  }
}

export async function updateGroup(
  groupId: string,
  userId: string,
  groupData: Partial<GroupInput>
): Promise<{ data: Group | null, error: any }> {
  const supabase = await createClient()

  // Verify leadership
  const { data: existing } = await supabase
    .from('groups')
    .select('leader_id')
    .eq('id', groupId)
    .single()

  if (!existing || existing.leader_id !== userId) {
    return { data: null, error: { message: 'Unauthorized - only group leader can update' } }
  }

  const { data, error } = await supabase
    .from('groups')
    .update(groupData)
    .eq('id', groupId)
    .select()
    .single()

  return { data: data as Group, error }
}

export async function deleteGroup(
  groupId: string,
  userId: string
): Promise<{ error: any }> {
  const supabase = await createClient()

  // Verify leadership
  const { data: existing } = await supabase
    .from('groups')
    .select('leader_id')
    .eq('id', groupId)
    .single()

  if (!existing || existing.leader_id !== userId) {
    return { error: { message: 'Unauthorized - only group leader can delete' } }
  }

  const { error } = await supabase
    .from('groups')
    .delete()
    .eq('id', groupId)

  return { error }
}

// Group Membership
export async function joinGroup(
  groupId: string,
  userId: string
): Promise<{ data: GroupMember | null, error: any }> {
  const supabase = await createClient()

  // Check if group exists and join type
  const { data: group } = await supabase
    .from('groups')
    .select('join_type, max_members, members_count')
    .eq('id', groupId)
    .single()

  if (!group) {
    return { data: null, error: { message: 'Group not found' } }
  }

  if (group.members_count >= group.max_members) {
    return { data: null, error: { message: 'Group is full' } }
  }

  // Handle different join types
  if (group.join_type === 'open') {
    // Direct join
    const { data, error } = await supabase
      .from('group_members')
      .insert({
        group_id: groupId,
        user_id: userId,
        role: 'member',
      })
      .select('*, profiles(*)')
      .single()

    if (error) return { data: null, error }

    // Create system message
    await createGroupSystemMessage(groupId, `A new member has joined the group`)

    return { data, error: null }
  } else if (group.join_type === 'request') {
    // Create join request
    return { data: null, error: { message: 'Please request to join this group', needsRequest: true } }
  } else {
    // invite_only
    return { data: null, error: { message: 'This group is invite only', needsInvite: true } }
  }
}

export async function leaveGroup(
  groupId: string,
  userId: string
): Promise<{ error: any }> {
  const supabase = await createClient()

  // Verify not the leader
  const { data: group } = await supabase
    .from('groups')
    .select('leader_id')
    .eq('id', groupId)
    .single()

  if (!group) {
    return { error: { message: 'Group not found' } }
  }

  if (group.leader_id === userId) {
    return { error: { message: 'Group leader cannot leave. Please transfer leadership or delete the group.' } }
  }

  const { error } = await supabase
    .from('group_members')
    .delete()
    .eq('group_id', groupId)
    .eq('user_id', userId)

  if (!error) {
    await createGroupSystemMessage(groupId, `A member has left the group`)
  }

  return { error }
}

export async function removeGroupMember(
  groupId: string,
  memberUserId: string,
  leaderUserId: string
): Promise<{ error: any }> {
  const supabase = await createClient()

  // Verify leadership
  const { data: group } = await supabase
    .from('groups')
    .select('leader_id')
    .eq('id', groupId)
    .single()

  if (!group || group.leader_id !== leaderUserId) {
    return { error: { message: 'Unauthorized - only group leader can remove members' } }
  }

  const { error } = await supabase
    .from('group_members')
    .delete()
    .eq('group_id', groupId)
    .eq('user_id', memberUserId)

  if (!error) {
    await createGroupSystemMessage(groupId, `A member has been removed from the group`)
  }

  return { error }
}

export async function updateGroupMemberRole(
  groupId: string,
  memberUserId: string,
  newRole: 'admin' | 'member',
  leaderUserId: string
): Promise<{ error: any }> {
  const supabase = await createClient()

  // Verify leadership
  const { data: group } = await supabase
    .from('groups')
    .select('leader_id')
    .eq('id', groupId)
    .single()

  if (!group || group.leader_id !== leaderUserId) {
    return { error: { message: 'Unauthorized - only group leader can update roles' } }
  }

  const { error } = await supabase
    .from('group_members')
    .update({ role: newRole })
    .eq('group_id', groupId)
    .eq('user_id', memberUserId)

  return { error }
}

export async function getGroupMembers(
  groupId: string,
  currentUserId?: string
): Promise<GroupMember[]> {
  const supabase = await createClient()

  const { data: members, error } = await supabase
    .from('group_members')
    .select('*, profiles(*)')
    .eq('group_id', groupId)
    .order('joined_at', { ascending: true })

  if (error || !members) return []

  return members
}

// Group Join Requests
export async function createGroupJoinRequest(
  groupId: string,
  userId: string,
  message?: string
): Promise<{ data: GroupJoinRequest | null, error: any }> {
  const supabase = await createClient()
  const adminSupabase = getAdminClient()

  // Check if group exists and get leader info
  const { data: group } = await supabase
    .from('groups')
    .select('leader_id, join_type')
    .eq('id', groupId)
    .single()

  if (!group) {
    return { data: null, error: { message: '队伍不存在' } }
  }

  // Check if user is already a member
  const { data: existingMember } = await supabase
    .from('group_members')
    .select('id')
    .eq('group_id', groupId)
    .eq('user_id', userId)
    .maybeSingle()

  if (existingMember) {
    return { data: null, error: { message: '你已经是队伍成员' } }
  }

  // Check if user already has a pending request
  const { data: existingRequest } = await supabase
    .from('group_join_requests')
    .select('id, status')
    .eq('group_id', groupId)
    .eq('user_id', userId)
    .maybeSingle()

  if (existingRequest) {
    if (existingRequest.status === 'pending') {
      return { data: null, error: { message: '你已经申请加入该队伍，请等待审核' } }
    } else if (existingRequest.status === 'approved') {
      return { data: null, error: { message: '你的申请已被批准' } }
    } else {
      return { data: null, error: { message: '你的申请已被拒绝，请联系队长' } }
    }
  }

  // Create the join request
  const { data, error } = await supabase
    .from('group_join_requests')
    .insert({
      group_id: groupId,
      user_id: userId,
      message,
    })
    .select('*')
    .single()

  if (error) {
    console.error('Error creating join request:', error)
    return { data: null, error: { message: error.message || '申请失败，请稍后重试' } }
  }

  // Fetch user profile for response
  let profileData = null
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    profileData = profile
  } catch (e) {
    // Profile fetch failed, but don't fail the request
  }

  const responseData = {
    ...data,
    user: profileData,
    profiles: profileData,
  }

  // Send notification to group leader (if admin client available)
  if (adminSupabase) {
    try {
      await adminSupabase
        .from('notifications')
        .insert({
          user_id: group.leader_id,
          actor_id: userId,
          type: 'group_request',
          group_id: groupId,
        })
    } catch (e) {
      // Log but don't fail if notification fails
      console.error('Failed to create notification:', e)
    }
  }

  return { data: responseData, error: null }
}

export async function getGroupJoinRequests(
  groupId: string,
  leaderUserId: string
): Promise<GroupJoinRequest[]> {
  const supabase = await createClient()

  // Verify leadership
  const { data: group } = await supabase
    .from('groups')
    .select('leader_id')
    .eq('id', groupId)
    .single()

  if (!group || group.leader_id !== leaderUserId) {
    return []
  }

  // Use admin client to bypass RLS for fetching requests with user profiles
  const adminSupabase = getAdminClient()
  if (!adminSupabase) {
    // Fallback: fetch requests and profiles separately
    const { data: requests, error } = await supabase
      .from('group_join_requests')
      .select('*')
      .eq('group_id', groupId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (error || !requests) return []

    // Fetch profiles separately
    const userIds = requests.map(r => r.user_id)
    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .in('id', userIds)

    const profileMap = new Map(profiles?.map((p: any) => [p.id, p]) || [])

    return requests.map((request: any) => ({
      ...request,
      user: profileMap.get(request.user_id) || null,
      profiles: profileMap.get(request.user_id) || null,
    }))
  }

  // Admin client: fetch requests with profiles in one query
  const { data: requests, error } = await adminSupabase
    .from('group_join_requests')
    .select('*, groups!inner(*)')
    .eq('group_id', groupId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  if (error || !requests) return []

  // Fetch profiles separately
  const userIds = requests.map((r: { user_id: string }) => r.user_id)
  const { data: profiles } = await adminSupabase
    .from('profiles')
    .select('*')
    .in('id', userIds)

  const profileMap = new Map(profiles?.map((p: any) => [p.id, p]) || [])

  return requests.map((request: any) => ({
    ...request,
    user: profileMap.get(request.user_id) || null,
    profiles: profileMap.get(request.user_id) || null,
    groups: request.groups,
  }))
}

export async function respondToGroupJoinRequest(
  requestId: string,
  leaderUserId: string,
  action: 'approve' | 'reject'
): Promise<{ error: any }> {
  const supabase = await createClient()
  const adminSupabase = getAdminClient()

  // Get request with group info
  const { data: request } = await supabase
    .from('group_join_requests')
    .select('*, groups(*)')
    .eq('id', requestId)
    .single()

  if (!request) {
    return { error: { message: 'Request not found' } }
  }

  // Verify leadership
  if (!request.groups || request.groups.leader_id !== leaderUserId) {
    return { error: { message: 'Unauthorized - only group leader can respond' } }
  }

  const status = action === 'approve' ? 'approved' : 'rejected'

  const { error } = await supabase
    .from('group_join_requests')
    .update({
      status,
      responded_at: new Date().toISOString(),
    })
    .eq('id', requestId)

  if (error) return { error }

  // Send notification to the requester (if admin client available)
  if (adminSupabase) {
    try {
      const notificationType = action === 'approve' ? 'group_request_approved' : 'group_request_rejected'
      await adminSupabase
        .from('notifications')
        .insert({
          user_id: request.user_id,
          actor_id: leaderUserId,
          type: notificationType,
          group_id: request.group_id,
        })
    } catch (e) {
      console.error('Failed to create notification:', e)
    }
  }

  // If approved, add member
  if (action === 'approve') {
    await supabase
      .from('group_members')
      .insert({
        group_id: request.group_id,
        user_id: request.user_id,
        role: 'member',
      })

    await createGroupSystemMessage(request.group_id, `A new member has joined the group`)
  }

  return { error: null }
}

export async function getUserGroupJoinRequests(
  userId: string
): Promise<GroupJoinRequest[]> {
  const supabase = await createClient()

  const { data: requests, error } = await supabase
    .from('group_join_requests')
    .select('*, groups(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error || !requests) return []

  return requests
}

// Group Shared Itinerary
export async function getGroupSharedItinerary(
  groupId: string
): Promise<GroupSharedItinerary | null> {
  const supabase = await createClient()

  const { data: itinerary, error } = await supabase
    .from('group_shared_itinerary')
    .select('*')
    .eq('group_id', groupId)
    .maybeSingle()

  if (error || !itinerary) return null

  // Fetch days separately
  const { data: days } = await supabase
    .from('group_itinerary_days')
    .select('*')
    .eq('itinerary_id', itinerary.id)
    .order('day_number', { ascending: true })

  return {
    ...itinerary,
    days: days || []
  } as GroupSharedItinerary
}

export async function createGroupSharedItinerary(
  groupId: string,
  name: string,
  notes?: string
): Promise<{ data: GroupSharedItinerary | null, error: any }> {
  const supabase = await createClient()

  // First check if an itinerary already exists for this group
  const { data: existing } = await supabase
    .from('group_shared_itinerary')
    .select('*')
    .eq('group_id', groupId)
    .maybeSingle()

  if (existing) {
    // Itinerary already exists, fetch its days and return
    const { data: days } = await supabase
      .from('group_itinerary_days')
      .select('*')
      .eq('itinerary_id', existing.id)
      .order('day_number')

    return { data: { ...existing, days: days || [] } as GroupSharedItinerary, error: null }
  }

  // Create new itinerary
  const { data, error } = await supabase
    .from('group_shared_itinerary')
    .insert({
      group_id: groupId,
      name,
      notes,
    })
    .select()
    .single()

  return { data: { ...data, days: [] } as GroupSharedItinerary, error }
}

export async function updateGroupSharedItinerary(
  itineraryId: string,
  name: string,
  notes?: string
): Promise<{ data: GroupSharedItinerary | null, error: any }> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('group_shared_itinerary')
    .update({ name, notes })
    .eq('id', itineraryId)
    .select()
    .single()

  return { data, error }
}

export async function getGroupItineraryDays(
  itineraryId: string
): Promise<GroupItineraryDay[]> {
  const supabase = await createClient()

  const { data: days, error } = await supabase
    .from('group_itinerary_days')
    .select('*')
    .eq('itinerary_id', itineraryId)
    .order('day_number', { ascending: true })

  if (error || !days) return []

  return days
}

export async function createGroupItineraryDay(
  itineraryId: string,
  userId: string,
  dayData: GroupItineraryDayInput
): Promise<{ data: GroupItineraryDay | null, error: any }> {
  const supabase = await createClient()

  // Exclude itineraryId from dayData as we set it explicitly
  const { itineraryId: _, ...cleanDayData } = dayData as any

  const { data, error } = await supabase
    .from('group_itinerary_days')
    .insert({
      itinerary_id: itineraryId,
      created_by: userId,
      ...cleanDayData,
    })
    .select()
    .single()

  return { data, error }
}

export async function updateGroupItineraryDay(
  dayId: string,
  dayData: Partial<GroupItineraryDayInput>
): Promise<{ data: GroupItineraryDay | null, error: any }> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('group_itinerary_days')
    .update(dayData)
    .eq('id', dayId)
    .select()
    .single()

  return { data, error }
}

export async function deleteGroupItineraryDay(
  dayId: string
): Promise<{ error: any }> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('group_itinerary_days')
    .delete()
    .eq('id', dayId)

  return { error }
}

// Group Expenses
export async function getGroupExpenses(
  groupId: string
): Promise<GroupExpense[]> {
  const supabase = await createClient()

  const { data: expenses, error } = await supabase
    .from('group_expenses')
    .select('*')
    .eq('group_id', groupId)
    .order('expense_date', { ascending: false })

  console.log('getGroupExpenses - groupId:', groupId)
  console.log('getGroupExpenses - expenses:', JSON.stringify(expenses, null, 2))
  console.log('getGroupExpenses - error:', JSON.stringify(error, null, 2))

  if (error) {
    console.error('getGroupExpenses error:', error)
    return []
  }

  if (!expenses || expenses.length === 0) {
    console.log('getGroupExpenses - no expenses found')
    return []
  }

  // Get unique payer IDs
  const payerIds = [...new Set(expenses.map(e => e.payer_id))]

  // Fetch all payer profiles in one query
  const { data: payerProfiles } = await supabase
    .from('profiles')
    .select('*')
    .in('id', payerIds)

  const payerMap = new Map(
    (payerProfiles || []).map(p => [p.id, p])
  )

  // Fetch splits for each expense
  const expensesWithSplits = await Promise.all(
    expenses.map(async (expense) => {
      const { data: splits } = await supabase
        .from('group_expense_splits')
        .select('*')
        .eq('expense_id', expense.id)

      return {
        ...expense,
        payer: payerMap.get(expense.payer_id) || null,
        splits: splits || []
      }
    })
  )

  console.log('getGroupExpenses - returning', expensesWithSplits.length, 'expenses')

  return expensesWithSplits as GroupExpense[]
}

export async function createGroupExpense(
  groupId: string,
  userId: string,
  expenseData: GroupExpenseInput
): Promise<{ data: GroupExpense | null, error: any }> {
  const supabase = await createClient()

  // Create expense with currency default
  const { data: expense, error: expenseError } = await supabase
    .from('group_expenses')
    .insert({
      group_id: groupId,
      payer_id: userId,
      name: expenseData.name,
      amount: expenseData.amount,
      currency: expenseData.currency || 'CNY',
      split_type: expenseData.split_type || 'equal',
      expense_date: expenseData.expense_date,
      notes: expenseData.notes || null,
    })
    .select()
    .single()

  if (expenseError) return { data: null, error: expenseError }

  // Fetch payer profile
  const { data: payerProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  // Get group members for splitting
  const { data: members } = await supabase
    .from('group_members')
    .select('user_id')
    .eq('group_id', groupId)

  console.log('Group members for splitting:', JSON.stringify(members, null, 2))

  if (!members || members.length === 0) {
    console.log('No members found, returning expense without splits')
    return { data: { ...expense, payer: payerProfile } as GroupExpense, error: null }
  }

  // Create splits
  const splits = expenseData.split_type === 'custom' && expenseData.custom_splits
    ? expenseData.custom_splits
    : members.map(m => ({
        user_id: m.user_id,
        amount: expenseData.amount / members.length,
      }))

  console.log('Creating splits:', JSON.stringify(splits, null, 2))

  // Insert splits
  const { error: splitsError } = await supabase
    .from('group_expense_splits')
    .insert(
      splits.map(s => ({
        expense_id: expense.id,
        user_id: s.user_id,
        amount: s.amount,
      }))
    )

  if (splitsError) {
    console.error('Error creating splits:', JSON.stringify(splitsError, null, 2))
  } else {
    console.log('Splits created successfully')
  }

  return { data: { ...expense, payer: payerProfile } as GroupExpense, error: splitsError }
}

export async function updateGroupExpense(
  expenseId: string,
  userId: string,
  expenseData: Partial<GroupExpenseInput>
): Promise<{ data: GroupExpense | null, error: any }> {
  const supabase = await createClient()

  // Verify ownership
  const { data: existing } = await supabase
    .from('group_expenses')
    .select('payer_id')
    .eq('id', expenseId)
    .single()

  if (!existing || existing.payer_id !== userId) {
    return { data: null, error: { message: 'Unauthorized' } }
  }

  const { data, error } = await supabase
    .from('group_expenses')
    .update(expenseData)
    .eq('id', expenseId)
    .select()
    .single()

  return { data, error }
}

export async function deleteGroupExpense(
  expenseId: string,
  userId: string
): Promise<{ error: any }> {
  const supabase = await createClient()

  // Verify ownership or leadership
  const { data: existing } = await supabase
    .from('group_expenses')
    .select('payer_id, group_id')
    .eq('id', expenseId)
    .single()

  if (!existing) {
    return { error: { message: 'Expense not found' } }
  }

  const { data: group } = await supabase
    .from('groups')
    .select('leader_id')
    .eq('id', existing.group_id)
    .single()

  const isLeader = group && group.leader_id === userId
  const isPayer = existing.payer_id === userId

  if (!isLeader && !isPayer) {
    return { error: { message: 'Unauthorized' } }
  }

  const { error } = await supabase
    .from('group_expenses')
    .delete()
    .eq('id', expenseId)

  return { error }
}

export async function calculateGroupExpenseSettlements(
  groupId: string
): Promise<ExpenseSettlement[]> {
  const supabase = await createClient()

  // Get all expenses with splits
  const { data: expenses } = await supabase
    .from('group_expenses')
    .select('*, splits(*)')
    .eq('group_id', groupId)

  if (!expenses || expenses.length === 0) return []

  // Get all members
  const { data: members } = await supabase
    .from('group_members')
    .select('user_id, profiles(*)')
    .eq('group_id', groupId)

  if (!members || members.length === 0) return []

  // Calculate settlements
  const userBalances = new Map<string, { paid: number; owed: number; profile: any }>()

  members.forEach(m => {
    userBalances.set(m.user_id, {
      paid: 0,
      owed: 0,
      profile: m.profiles,
    })
  })

  expenses.forEach(expense => {
    // Add to payer's paid amount
    const payerBalance = userBalances.get(expense.payer_id)
    if (payerBalance) {
      payerBalance.paid += Number(expense.amount)
    }

    // Add to each user's owed amount
    expense.splits?.forEach((split: any) => {
      const userBalance = userBalances.get(split.user_id)
      if (userBalance) {
        userBalance.owed += Number(split.amount)
      }
    })
  })

  // Calculate final settlements
  const settlements: ExpenseSettlement[] = []
  const positiveBalances: { userId: string; amount: number; profile: any }[] = []
  const negativeBalances: { userId: string; amount: number; profile: any }[] = []

  userBalances.forEach((balance, userId) => {
    const netBalance = balance.paid - balance.owed
    if (netBalance > 0.01) {
      positiveBalances.push({ userId, amount: netBalance, profile: balance.profile })
    } else if (netBalance < -0.01) {
      negativeBalances.push({ userId, amount: -netBalance, profile: balance.profile })
    }

    settlements.push({
      user_id: userId,
      user: balance.profile,
      total_paid: balance.paid,
      total_owed: balance.owed,
      balance: netBalance,
      settlements: [],
    })
  })

  // Calculate who needs to pay whom (simplified algorithm)
  positiveBalances.sort((a, b) => b.amount - a.amount)
  negativeBalances.sort((a, b) => b.amount - a.amount)

  let i = 0, j = 0
  while (i < positiveBalances.length && j < negativeBalances.length) {
    const receiver = positiveBalances[i]
    const payer = negativeBalances[j]
    const amount = Math.min(receiver.amount, payer.amount)

    const receiverSettlement = settlements.find(s => s.user_id === receiver.userId)
    const payerSettlement = settlements.find(s => s.user_id === payer.userId)

    if (receiverSettlement && payerSettlement) {
      receiverSettlement.settlements.push({
        with_user_id: payer.userId,
        with_user: payer.profile,
        amount,
      })
    }

    receiver.amount -= amount
    payer.amount -= amount

    if (receiver.amount < 0.01) i++
    if (payer.amount < 0.01) j++
  }

  return settlements.filter(s => s.settlements.length > 0 || Math.abs(s.balance) > 0.01)
}

export async function markExpenseSplitAsSettled(
  splitId: string,
  userId: string
): Promise<{ error: any }> {
  const supabase = await createClient()

  // Verify ownership
  const { data: existing } = await supabase
    .from('group_expense_splits')
    .select('user_id')
    .eq('id', splitId)
    .single()

  if (!existing || existing.user_id !== userId) {
    return { error: { message: 'Unauthorized' } }
  }

  const { error } = await supabase
    .from('group_expense_splits')
    .update({ is_settled: true })
    .eq('id', splitId)

  return { error }
}

// Group Messages
export async function getGroupMessages(
  groupId: string,
  limit = 50,
  before?: string
): Promise<GroupMessage[]> {
  const supabase = await createClient()

  let query = supabase
    .from('group_messages')
    .select('*, profiles(*)')
    .eq('group_id', groupId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (before) {
    query = query.lt('created_at', before)
  }

  const { data: messages, error } = await query

  if (error || !messages) return []

  // Reverse to get chronological order
  return messages.reverse()
}

export async function createGroupMessage(
  groupId: string,
  userId: string,
  messageData: GroupMessageInput
): Promise<{ data: GroupMessage | null, error: any }> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('group_messages')
    .insert({
      group_id: groupId,
      user_id: userId,
      ...messageData,
    })
    .select('*, profiles(*)')
    .single()

  return { data, error }
}

async function createGroupSystemMessage(
  groupId: string,
  content: string,
  metadata?: Record<string, any>
): Promise<void> {
  const supabase = await createClient()

  await supabase
    .from('group_messages')
    .insert({
      group_id: groupId,
      user_id: null, // System message
      content,
      message_type: 'system',
      metadata,
    })
}

// Group Location Sharing
export async function updateGroupMemberLocation(
  groupId: string,
  userId: string,
  location: GroupLocationUpdate
): Promise<{ error: any }> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('group_members')
    .update({
      last_location_lat: location.latitude,
      last_location_lng: location.longitude,
      last_location_updated: new Date().toISOString(),
    })
    .eq('group_id', groupId)
    .eq('user_id', userId)

  return { error }
}

export async function toggleLocationSharing(
  groupId: string,
  userId: string,
  enabled: boolean
): Promise<{ error: any }> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('group_members')
    .update({ location_sharing_enabled: enabled })
    .eq('group_id', groupId)
    .eq('user_id', userId)

  if (!error && enabled) {
    await createGroupSystemMessage(groupId, `A member has enabled location sharing`)
  }

  return { error }
}

export async function getGroupMemberLocations(
  groupId: string
): Promise<GroupMember[]> {
  const supabase = await createClient()

  console.log('getGroupMemberLocations called for groupId:', groupId)

  // Get all group members first (without profiles)
  const { data: members, error } = await supabase
    .from('group_members')
    .select('*')
    .eq('group_id', groupId)
    .order('joined_at', { ascending: true })

  if (error || !members || members.length === 0) {
    console.log('getGroupMemberLocations - no members found')
    return []
  }

  // Fetch profiles for all members separately
  const userIds = members.map(m => m.user_id)

  // Try admin client first (like getGroupById does)
  const adminSupabase = getAdminClient()
  const clientToUse = adminSupabase || supabase

  const { data: memberProfiles } = await clientToUse
    .from('profiles')
    .select('*')
    .in('id', userIds)

  console.log('getGroupMemberLocations - members:', members.length, 'profiles:', memberProfiles?.length || 0)

  const profileMap = new Map(memberProfiles?.map((p: any) => [p.id, p]) || [])

  const membersWithProfiles = members.map(member => {
    const profile = profileMap.get(member.user_id) || null
    return { ...member, user: profile } as GroupMember
  })

  console.log('getGroupMemberLocations result:', {
    membersCount: membersWithProfiles.length,
    members: membersWithProfiles.map(m => ({
      id: m.id,
      user_id: m.user_id,
      location_sharing_enabled: m.location_sharing_enabled,
      hasProfile: !!m.user,
      profileUsername: m.user?.username,
    }))
  })

  return membersWithProfiles
}

export async function getUserGroups(
  userId: string
): Promise<Group[]> {
  const supabase = await createClient()

  const { data: memberships } = await supabase
    .from('group_members')
    .select('group_id')
    .eq('user_id', userId)

  if (!memberships || memberships.length === 0) return []

  const groupIds = memberships.map(m => m.group_id)

  const { data: groups } = await supabase
    .from('groups')
    .select('*')
    .in('id', groupIds)
    .order('updated_at', { ascending: false })

  if (!groups) return []

  // Get leader IDs
  const leaderIds = [...new Set(groups.map(g => g.leader_id))]

  // Fetch profiles
  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .in('id', leaderIds)

  const profileMap = new Map(profiles?.map((p: any) => [p.id, p]) || [])

  return groups.map(group => ({
    ...group,
    leader: profileMap.get(group.leader_id) || null,
  })) as Group[]
}

// ============================================
// Group Invite Queries
// ============================================

// Helper function to generate a random invite code
function generateInviteCode(length = 8): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Removed similar looking chars
  let code = ''
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

export async function createGroupInvite(
  groupId: string,
  inviterId: string,
  maxUses = 10,
  expiresDays = 7
): Promise<{ data: GroupInvite | null, error: any }> {
  const supabase = await createClient()

  // Verify leadership
  const { data: group } = await supabase
    .from('groups')
    .select('leader_id')
    .eq('id', groupId)
    .single()

  if (!group || group.leader_id !== inviterId) {
    return { data: null, error: { message: 'Unauthorized - only group leader can create invites' } }
  }

  // Calculate expiration date
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + expiresDays)

  // Generate unique code
  let code = generateInviteCode()
  let attempts = 0
  while (attempts < 10) {
    const { data: existing } = await supabase
      .from('group_invites')
      .select('code')
      .eq('code', code)
      .maybeSingle()

    if (!existing) break
    code = generateInviteCode()
    attempts++
  }

  // Create invite
  const { data, error } = await supabase
    .from('group_invites')
    .insert({
      group_id: groupId,
      code,
      inviter_id: inviterId,
      max_uses: maxUses,
      expires_at: expiresAt.toISOString(),
    })
    .select()
    .single()

  if (error) return { data: null, error }

  // Get inviter profile
  const { data: inviterProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', inviterId)
    .maybeSingle()

  return {
    data: {
      ...data,
      inviter: inviterProfile || null,
    } as GroupInvite,
    error: null,
  }
}

export async function getGroupInvites(groupId: string): Promise<GroupInvite[]> {
  const supabase = await createClient()

  const { data: invites, error } = await supabase
    .from('group_invites')
    .select('*, profiles(*)')
    .eq('group_id', groupId)
    .order('created_at', { ascending: false })

  if (error || !invites) return []

  return invites.map(invite => ({
    ...invite,
    inviter: invite.profiles,
    profiles: undefined,
  })) as GroupInvite[]
}

export async function getInviteByCode(code: string): Promise<GroupInvite | null> {
  const supabase = await createClient()

  // First, cleanup expired invites
  await supabase.rpc('cleanup_expired_invites')

  const { data: invite, error } = await supabase
    .from('group_invites')
    .select('*')
    .eq('code', code)
    .eq('status', 'active')
    .single()

  if (error || !invite) return null

  // Check if expired
  if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
    return null
  }

  // Check if max uses reached
  if (invite.used_count >= invite.max_uses) {
    return null
  }

  return invite as GroupInvite
}

export async function useInvite(
  code: string,
  userId: string
): Promise<{ data: GroupMember | null, error: any }> {
  const supabase = await createClient()

  console.log('[useInvite] Starting invite process for code:', code, 'user:', userId)

  // Get invite
  const invite = await getInviteByCode(code)
  if (!invite) {
    console.error('[useInvite] Invalid or expired invite code:', code)
    return { data: null, error: { message: '邀请码无效或已过期' } }
  }

  console.log('[useInvite] Invite found:', invite.id, 'group:', invite.group_id)

  // Check if already a member
  const { data: existingMember } = await supabase
    .from('group_members')
    .select('*')
    .eq('group_id', invite.group_id)
    .eq('user_id', userId)
    .maybeSingle()

  if (existingMember) {
    console.log('[useInvite] User is already a member')
    return { data: null, error: { message: '你已经是这个队伍的成员了' } }
  }

  // Check group capacity
  const { data: group } = await supabase
    .from('groups')
    .select('max_members, members_count')
    .eq('id', invite.group_id)
    .single()

  if (group && group.members_count >= group.max_members) {
    console.log('[useInvite] Group is full')
    return { data: null, error: { message: '队伍已满员' } }
  }

  // Join group
  console.log('[useInvite] Attempting to insert member...')
  const { data: member, error: memberError } = await supabase
    .from('group_members')
    .insert({
      group_id: invite.group_id,
      user_id: userId,
      role: 'member',
    })
    .select('*, profiles(*)')
    .single()

  if (memberError) {
    console.error('[useInvite] Error inserting member:', memberError)
    return { data: null, error: { message: memberError.message || '加入队伍失败' } }
  }

  console.log('[useInvite] Member inserted successfully:', member?.id)

  // Increment used count
  const { error: updateError } = await supabase
    .from('group_invites')
    .update({ used_count: invite.used_count + 1 })
    .eq('id', invite.id)

  if (updateError) {
    console.error('[useInvite] Error updating invite used count:', updateError)
  }

  // Create system message
  await createGroupSystemMessage(invite.group_id, `A new member has joined the group via invite link`)

  return { data: member as GroupMember, error: null }
}

export async function revokeInvite(inviteId: string, userId: string): Promise<{ error: any }> {
  const supabase = await createClient()

  // Verify ownership (group leader)
  const { data: invite } = await supabase
    .from('group_invites')
    .select('group_id')
    .eq('id', inviteId)
    .single()

  if (!invite) {
    return { error: { message: 'Invite not found' } }
  }

  const { data: group } = await supabase
    .from('groups')
    .select('leader_id')
    .eq('id', invite.group_id)
    .single()

  if (!group || group.leader_id !== userId) {
    return { error: { message: 'Unauthorized - only group leader can revoke invites' } }
  }

  // Revoke invite
  const { error } = await supabase
    .from('group_invites')
    .update({ status: 'revoked' })
    .eq('id', inviteId)

  return { error }
}
