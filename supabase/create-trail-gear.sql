-- ============================================
-- Trail Gear Items and Trail Log Gear Tables
-- Run this in Supabase SQL Editor
-- ============================================

-- Create trail_gear_items table (Gear Library)
CREATE TABLE IF NOT EXISTS public.trail_gear_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(200) NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    'shelter',      -- 帐篷、防潮垫
    'sleeping',     -- 睡袋、枕头
    'clothing',     -- 衣物
    'footwear',     -- 鞋子
    'backpack',     -- 背包
    'cooking',      -- 炊具
    'water',        -- 水具
    'food',         -- 食物
    'navigation',   -- 导航
    'safety',       -- 安全装备
    'hygiene',      -- 卫生用品
    'electronics',  -- 电子设备
    'other'         -- 其他
  )),
  weight_g INTEGER NOT NULL,  -- Weight in grams
  brand TEXT,
  model TEXT,
  notes TEXT,
  is_default BOOLEAN DEFAULT false,  -- For quick add templates
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for gear items
CREATE INDEX IF NOT EXISTS idx_trail_gear_items_user_id ON public.trail_gear_items(user_id);
CREATE INDEX IF NOT EXISTS idx_trail_gear_items_category ON public.trail_gear_items(category);
CREATE INDEX IF NOT EXISTS idx_trail_gear_items_is_default ON public.trail_gear_items(is_default);

-- Enable RLS for gear items
ALTER TABLE public.trail_gear_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own gear items"
  ON public.trail_gear_items FOR ALL
  USING (auth.uid() = user_id);

-- Create trail_log_gear table (Junction table)
CREATE TABLE IF NOT EXISTS public.trail_log_gear (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  trail_log_id UUID REFERENCES public.trail_logs(id) ON DELETE CASCADE NOT NULL,
  gear_item_id UUID REFERENCES public.trail_gear_items(id) ON DELETE CASCADE NOT NULL,
  quantity INTEGER DEFAULT 1,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(trail_log_id, gear_item_id)
);

-- Create indexes for trail_log_gear
CREATE INDEX IF NOT EXISTS idx_trail_log_gear_trail_log_id ON public.trail_log_gear(trail_log_id);
CREATE INDEX IF NOT EXISTS idx_trail_log_gear_gear_item_id ON public.trail_log_gear(gear_item_id);

-- Enable RLS for trail_log_gear
ALTER TABLE public.trail_log_gear ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage gear for own trail logs"
  ON public.trail_log_gear FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.trail_logs
      WHERE trail_logs.id = trail_log_gear.trail_log_id
      AND trail_logs.user_id = auth.uid()
    )
  );

-- Verification query
SELECT
  'trail_gear_items and trail_log_gear tables created successfully' as status,
  (SELECT COUNT(*) FROM public.trail_gear_items) as gear_items_count,
  (SELECT COUNT(*) FROM public.trail_log_gear) as trail_log_gear_count;
