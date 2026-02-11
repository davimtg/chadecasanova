-- Drop the old function signature to avoid ambiguity
DROP FUNCTION IF EXISTS reserve_gift(uuid, text, text);

-- Re-assert the new function (just in case)
CREATE OR REPLACE FUNCTION reserve_gift(
  p_gift_id uuid,
  p_guest_name text,
  p_pin text,
  p_delivery_method text DEFAULT 'hand' -- 'hand' or 'ship'
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_gift public.gifts%ROWTYPE;
  v_new_reservation jsonb;
BEGIN
  -- Lock the row for update
  SELECT * INTO v_gift FROM public.gifts WHERE id = p_gift_id FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;

  v_new_reservation := jsonb_build_object(
    'name', p_guest_name,
    'method', p_delivery_method,
    'date', now()
  );

  -- Logic for multiple items
  IF v_gift.max_quantity > 1 THEN
    IF v_gift.current_quantity >= v_gift.max_quantity THEN
      RETURN false;
    END IF;

    UPDATE public.gifts
    SET 
      current_quantity = COALESCE(current_quantity, 0) + 1,
      reserved_by = CASE 
                      WHEN reserved_by IS NULL OR reserved_by = '' THEN p_guest_name 
                      ELSE reserved_by || ', ' || p_guest_name 
                    END,
      reservations = COALESCE(reservations, '[]'::jsonb) || v_new_reservation,
      updated_at = now()
    WHERE id = p_gift_id;
    
    RETURN true;

  ELSE
    -- Logic for single item
    IF v_gift.reserved_by IS NOT NULL AND v_gift.reserved_by != '' THEN
      RETURN false; -- Already reserved
    END IF;

    UPDATE public.gifts
    SET 
      reserved_by = p_guest_name,
      current_quantity = 1,
      reservations = jsonb_build_array(v_new_reservation),
      updated_at = now()
    WHERE id = p_gift_id;
    
    RETURN true;
  END IF;
END;
$$;
