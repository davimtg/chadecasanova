-- Function to allow admin to manually update status strings and quantity
-- This is used for "Granular Cancellation" where we might remove just one name from a list
CREATE OR REPLACE FUNCTION admin_update_gift_status(
  p_id uuid,
  p_reserved_by text,
  p_current_quantity integer,
  p_secret_key text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_admin_secret text := 'admin123'; 
BEGIN
  IF p_secret_key != v_admin_secret THEN
    RETURN false;
  END IF;

  UPDATE public.gifts
  SET 
    reserved_by = p_reserved_by,
    current_quantity = p_current_quantity,
    updated_at = now()
  WHERE id = p_id;

  RETURN true;
END;
$$;
