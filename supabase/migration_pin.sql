-- 1. Add the PIN column to the table
ALTER TABLE public.gifts 
ADD COLUMN IF NOT EXISTS reservation_pin text;

-- 2. Function to Reserve a Gift
-- Atomic check to prevent race conditions and double booking
CREATE OR REPLACE FUNCTION reserve_gift(
  p_gift_id uuid, 
  p_guest_name text, 
  p_pin text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_gift_id uuid;
BEGIN
  -- Try to update only if currently available (reserved_by is null)
  UPDATE public.gifts
  SET 
    reserved_by = p_guest_name,
    reservation_pin = p_pin
  WHERE id = p_gift_id AND reserved_by IS NULL
  RETURNING id INTO v_gift_id;

  -- If an ID was returned, the update was successful
  RETURN v_gift_id IS NOT NULL;
END;
$$;

-- 3. Function to Cancel a Reservation
-- Checks if the PIN matches OR if it's the Master PIN
CREATE OR REPLACE FUNCTION cancel_reservation(
  p_gift_id uuid, 
  p_pin text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_pin text;
  v_gift_id uuid;
  -- CHANGE THIS VALUE TO YOUR PREFERRED MASTER PIN
  v_master_pin text := '1234'; 
BEGIN
  -- Get the current PIN for the gift
  SELECT reservation_pin INTO v_current_pin
  FROM public.gifts
  WHERE id = p_gift_id;

  -- Check if PIN matches or is Master PIN
  IF v_current_pin = p_pin OR p_pin = v_master_pin THEN
    -- Perform the cancellation
    UPDATE public.gifts
    SET 
      reserved_by = NULL,
      reservation_pin = NULL
    WHERE id = p_gift_id
    RETURNING id INTO v_gift_id;
    
    RETURN v_gift_id IS NOT NULL;
  ELSE
    -- PIN does not match
    RETURN false;
  END IF;
END;
$$;
