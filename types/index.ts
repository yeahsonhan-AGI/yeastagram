export interface User {
  id: string
  email?: string
  full_name?: string | null
  avatar_url?: string | null
  username?: string | null
  bio?: string | null
  website?: string | null
  followers_count?: number
  following_count?: number
  posts_count?: number
}

export interface Profile extends User {
  created_at: string
  updated_at: string
}

export interface Post {
  id: string
  user_id: string
  image_url: string
  caption?: string | null
  created_at: string
  profiles?: Profile
  likes?: Like[]
  comments?: Comment[]
  likes_count?: number
  comments_count?: number
  is_liked?: boolean
}

export interface Like {
  id: string
  user_id: string
  post_id: string
  created_at: string
  profiles?: Profile
}

export interface Comment {
  id: string
  user_id: string
  post_id: string
  content: string
  created_at: string
  profiles?: Profile
}

export interface Follow {
  id: string
  follower_id: string
  following_id: string
  created_at: string
  follower_profile?: Profile
  following_profile?: Profile
}

export interface Notification {
  id: string
  user_id: string
  actor_id: string
  type: 'like' | 'comment' | 'follow' | 'group_request' | 'group_request_approved' | 'group_request_rejected'
  post_id?: string
  comment_id?: string
  group_id?: string
  created_at: string
  read: boolean
  actor_profile?: Profile | null
  post?: Post | null
  group?: Group | null
}

// ============================================
// Trip & Daily Log Types
// ============================================

export type ActivityType = 'hiking' | 'climbing'
export type TripDuration = 'single' | 'multi'
export type WeatherCondition = 'sunny' | 'cloudy' | 'rain' | 'snow' | 'wind' | 'hail'

// Trip (main itinerary)
export interface Trip {
  id: string
  user_id: string
  name: string
  activity_type: ActivityType
  duration_type: TripDuration
  start_date: string
  end_date: string | null
  cover_photo_url: string | null
  is_public: boolean
  total_distance_km: number
  total_elevation_gain_m: number
  likes_count: number
  comments_count: number
  created_at: string
  updated_at: string
  // Relations
  profiles?: Profile
  daily_logs?: DailyLog[]
  gear_categories?: GearCategory[]
  is_liked?: boolean
}

export interface TripInput {
  name: string
  activity_type: ActivityType
  duration_type: TripDuration
  start_date: string
  end_date?: string
  cover_photo_url?: string
  is_public?: boolean
}

// Daily Log (per-day records)
export interface DailyLog {
  id: string
  trip_id: string
  day_number: number
  log_date: string
  start_location: string | null
  end_location: string | null
  distance_km: number | null
  elevation_gain_m: number | null
  elevation_loss_m: number | null
  min_temperature_c: number | null
  max_temperature_c: number | null
  weather_conditions: WeatherCondition[]
  notes: string | null
  photos: string[] | null
  created_at: string
  updated_at: string
}

export interface DailyLogInput {
  day_number: number
  log_date: string
  start_location?: string
  end_location?: string
  distance_km?: number
  elevation_gain_m?: number
  elevation_loss_m?: number
  min_temperature_c?: number
  max_temperature_c?: number
  weather_conditions?: WeatherCondition[]
  notes?: string
  photos?: string[]
}

// Gear Category
export interface GearCategory {
  id: string
  trip_id: string
  name: string
  display_order: number
  created_at: string
  gear_items?: GearItem[]
}

export interface GearCategoryInput {
  name: string
  display_order?: number
}

// Gear Item
export interface GearItem {
  id: string
  category_id: string
  name: string
  weight_g: number
  is_packed: boolean
  created_at: string
}

export interface GearItemInput {
  name: string
  weight_g: number
  is_packed?: boolean
}

// Trip Social
export interface TripLike {
  id: string
  user_id: string
  trip_id: string
  created_at: string
  profiles?: Profile
}

export interface TripComment {
  id: string
  user_id: string
  trip_id: string
  content: string
  created_at: string
  profiles?: Profile
}

// Trip Stats
export interface TripStats {
  total_trips: number
  total_distance_km: number
  total_elevation_gain_m: number
  total_days: number
  by_type: Record<ActivityType, number>
  by_year: Record<number, number>
}

export interface TripFilters {
  activity_type?: ActivityType
  date_from?: string
  date_to?: string
  user_id?: string
  following?: boolean  // Show only from following users
}

// ============================================
// Group Types
// ============================================

export type GroupJoinType = 'open' | 'request' | 'invite_only'
export type GroupMemberRole = 'leader' | 'admin' | 'member'
export type GroupMessageType = 'text' | 'image' | 'location' | 'system'
export type SplitType = 'equal' | 'custom'
export type Currency = 'CNY' | 'USD' | 'IDR' | 'JPY' | 'KRW' | 'GBP' | 'EUR'

export interface Group {
  id: string
  leader_id: string
  name: string
  description: string | null
  activity_type: 'hiking' | 'climbing'
  start_date: string
  end_date: string | null
  cover_photo_url: string | null
  is_public: boolean
  join_type: GroupJoinType
  max_members: number
  trip_id: string | null
  members_count: number
  expenses_count: number
  messages_count: number
  created_at: string
  updated_at: string

  // Relations
  leader?: Profile
  members?: GroupMember[]
  shared_itinerary?: GroupSharedItinerary
  trip?: Trip

  // Computed properties (not in DB)
  is_member?: boolean
  current_user_role?: GroupMemberRole
}

export interface GroupInput {
  name: string
  description?: string
  activity_type: 'hiking' | 'climbing'
  start_date: string
  end_date?: string
  cover_photo_url?: string
  is_public?: boolean
  join_type?: GroupJoinType
  max_members?: number
  trip_id?: string
}

export interface GroupMember {
  id: string
  group_id: string
  user_id: string
  role: GroupMemberRole
  location_sharing_enabled: boolean
  last_location_lat: number | null
  last_location_lng: number | null
  last_location_updated: string | null
  joined_at: string

  // Relations
  user?: Profile
}

export interface GroupSharedItinerary {
  id: string
  group_id: string
  name: string
  notes: string | null
  created_at: string
  updated_at: string

  // Relations
  days?: GroupItineraryDay[]
}

export interface GroupItineraryDay {
  id: string
  itinerary_id: string
  day_number: number
  log_date: string
  start_location: string | null
  end_location: string | null
  distance_km: number | null
  elevation_gain_m: number | null
  elevation_loss_m: number | null
  weather_conditions: string[] | null
  gear_suggestions: string | null
  notes: string | null
  created_by: string
  created_at: string
  updated_at: string
}

export interface GroupItineraryDayInput {
  day_number: number
  log_date: string
  start_location?: string
  end_location?: string
  distance_km?: number
  elevation_gain_m?: number
  elevation_loss_m?: number
  weather_conditions?: string[]
  gear_suggestions?: string
  notes?: string
}

export interface GroupExpense {
  id: string
  group_id: string
  name: string
  payer_id: string
  amount: number
  currency: Currency
  split_type: SplitType
  expense_date: string
  notes: string | null
  created_at: string

  // Relations
  payer?: Profile
  splits?: GroupExpenseSplit[]
}

export interface GroupExpenseInput {
  name: string
  amount: number
  currency?: Currency
  split_type?: SplitType
  expense_date: string
  notes?: string
  custom_splits?: { user_id: string; amount: number }[]
}

export interface GroupExpenseSplit {
  id: string
  expense_id: string
  user_id: string
  amount: number
  is_settled: boolean

  // Relations
  user?: Profile
}

export interface GroupMessage {
  id: string
  group_id: string
  user_id: string
  content: string | null
  message_type: GroupMessageType
  location_lat: number | null
  location_lng: number | null
  location_name: string | null
  metadata: Record<string, any> | null
  created_at: string

  // Relations
  user?: Profile
}

export interface GroupMessageInput {
  content?: string
  message_type?: GroupMessageType
  location_lat?: number
  location_lng?: number
  location_name?: string
  metadata?: Record<string, any>
}

export interface GroupJoinRequest {
  id: string
  group_id: string
  user_id: string
  status: 'pending' | 'approved' | 'rejected'
  message: string | null
  created_at: string
  responded_at: string | null

  // Relations
  user?: Profile
  group?: Group
}

// Expense settlement calculation result
export interface ExpenseSettlement {
  user_id: string
  user: Profile
  total_paid: number
  total_owed: number
  balance: number  // positive = should receive, negative = should pay
  settlements: {
    with_user_id: string
    with_user: Profile
    amount: number
  }[]
}

export interface GroupLocationUpdate {
  latitude: number
  longitude: number
}

export interface GroupInvite {
  id: string
  group_id: string
  code: string
  inviter_id: string
  status: 'active' | 'expired' | 'revoked'
  max_uses: number
  used_count: number
  expires_at: string | null
  created_at: string

  // Relations
  inviter?: Profile
  group?: Group
}

// ============================================
// Expense UI Types
// ============================================

export interface ExpenseGroup {
  payer: Profile
  expenses: GroupExpense[]
  totalAmount: number
}

export interface UserExpenseStats {
  userId: string
  profile: Profile
  totalPaid: number
  expenseCount: number
  percentage: number
}
