-- Fix the update_trip_stats function with SECURITY DEFINER
DROP TRIGGER IF EXISTS daily_logs_stats_trigger ON public.daily_logs;
DROP FUNCTION IF EXISTS update_trip_stats() CASCADE;

CREATE OR REPLACE FUNCTION update_trip_stats()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Add new daily log stats to trip
    UPDATE public.trips
    SET
      total_distance_km = total_distance_km + COALESCE(NEW.distance_km, 0),
      total_elevation_gain_m = total_elevation_gain_m + COALESCE(NEW.elevation_gain_m, 0)
    WHERE id = NEW.trip_id;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Recalculate by subtracting old and adding new
    UPDATE public.trips
    SET
      total_distance_km = total_distance_km - COALESCE(OLD.distance_km, 0) + COALESCE(NEW.distance_km, 0),
      total_elevation_gain_m = total_elevation_gain_m - COALESCE(OLD.elevation_gain_m, 0) + COALESCE(NEW.elevation_gain_m, 0)
    WHERE id = NEW.trip_id;
  ELSIF TG_OP = 'DELETE' THEN
    -- Subtract deleted daily log stats from trip
    UPDATE public.trips
    SET
      total_distance_km = total_distance_km - COALESCE(OLD.distance_km, 0),
      total_elevation_gain_m = total_elevation_gain_m - COALESCE(OLD.elevation_gain_m, 0)
    WHERE id = OLD.trip_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER daily_logs_stats_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.daily_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_trip_stats();

-- Verification
SELECT 'Trigger fixed successfully' as status;
