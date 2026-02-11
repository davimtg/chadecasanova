-- Function to Create or fully Update a gift
DROP FUNCTION IF EXISTS admin_manage_gift;

CREATE OR REPLACE FUNCTION admin_upsert_gift(
  p_id uuid, -- NULL for new item
  p_name text,
  p_description text,
  p_price numeric,
  p_image_url text,
  p_product_link text,
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

  IF p_id IS NULL THEN
    -- INSERT
    INSERT INTO public.gifts (name, description, price, image_url, product_link)
    VALUES (p_name, p_description, p_price, p_image_url, p_product_link);
  ELSE
    -- UPDATE
    UPDATE public.gifts
    SET 
      name = p_name,
      description = p_description,
      price = p_price,
      image_url = p_image_url,
      product_link = p_product_link
    WHERE id = p_id;
  END IF;

  RETURN true;
END;
$$;

-- Function to specifically clear reservation (separate for clarity)
CREATE OR REPLACE FUNCTION admin_clear_reservation(
  p_id uuid,
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
    reserved_by = NULL,
    reservation_pin = NULL,
    current_quantity = 0,
    updated_at = now()
  WHERE id = p_id;

  RETURN true;
END;
$$;
