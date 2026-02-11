-- Function to Update Pix Donation Status
CREATE OR REPLACE FUNCTION admin_update_pix_status(
  p_id uuid,
  p_status text,
  p_secret_key text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_admin_secret text := 'davilarimo'; 
BEGIN
  IF p_secret_key != v_admin_secret THEN
    RETURN false;
  END IF;

  UPDATE public.pix_donations
  SET status = p_status
  WHERE id = p_id;

  RETURN true;
END;
$$;
