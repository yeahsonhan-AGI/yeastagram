-- ============================================
-- Drop existing policies first (if they exist)
-- ============================================

DROP POLICY IF EXISTS "Public trips are viewable by everyone" ON public.trips;
DROP POLICY IF EXISTS "Users can insert own trips" ON public.trips;
DROP POLICY IF EXISTS "Users can update own trips" ON public.trips;
DROP POLICY IF EXISTS "Users can delete own trips" ON public.trips;

DROP POLICY IF EXISTS "Users can view daily logs of accessible trips" ON public.daily_logs;
DROP POLICY IF EXISTS "Users can manage daily logs for own trips" ON public.daily_logs;

DROP POLICY IF EXISTS "Users can manage gear for own trips" ON public.gear_categories;
DROP POLICY IF EXISTS "Users can manage gear items for own trips" ON public.gear_items;

DROP POLICY IF EXISTS "Users can manage own likes" ON public.trip_likes;

DROP POLICY IF EXISTS "Everyone can view comments on public trips" ON public.trip_comments;
DROP POLICY IF EXISTS "Users can insert comments on public trips" ON public.trip_comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON public.trip_comments;

-- ============================================
-- Now create the policies
-- ============================================

-- Trips RLS Policies
CREATE POLICY "Public trips are viewable by everyone"
  ON public.trips FOR SELECT
  USING (is_public = true OR auth.uid() = user_id);

CREATE POLICY "Users can insert own trips"
  ON public.trips FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own trips"
  ON public.trips FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own trips"
  ON public.trips FOR DELETE
  USING (auth.uid() = user_id);

-- Daily Logs RLS Policies
CREATE POLICY "Users can view daily logs of accessible trips"
  ON public.daily_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.trips
      WHERE trips.id = daily_logs.trip_id
      AND (trips.is_public = true OR trips.user_id = auth.uid())
    )
  );

CREATE POLICY "Users can manage daily logs for own trips"
  ON public.daily_logs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.trips
      WHERE trips.id = daily_logs.trip_id
      AND trips.user_id = auth.uid()
    )
  );

-- Gear RLS Policies
CREATE POLICY "Users can manage gear for own trips"
  ON public.gear_categories FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.trips
      WHERE trips.id = gear_categories.trip_id
      AND trips.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage gear items for own trips"
  ON public.gear_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.gear_categories
      JOIN public.trips ON trips.id = gear_categories.trip_id
      WHERE gear_categories.id = gear_items.category_id
      AND trips.user_id = auth.uid()
    )
  );

-- Trip Likes RLS
CREATE POLICY "Users can manage own likes"
  ON public.trip_likes FOR ALL
  USING (auth.uid() = user_id);

-- Trip Comments RLS
CREATE POLICY "Everyone can view comments on public trips"
  ON public.trip_comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.trips
      WHERE trips.id = trip_comments.trip_id
      AND trips.is_public = true
    )
  );

CREATE POLICY "Users can insert comments on public trips"
  ON public.trip_comments FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.trips
      WHERE trips.id = trip_id
      AND trips.is_public = true
    )
  );

CREATE POLICY "Users can delete own comments"
  ON public.trip_comments FOR DELETE
  USING (auth.uid() = user_id);

-- Verification
SELECT 'Policies created successfully' as status;
