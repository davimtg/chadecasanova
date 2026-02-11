-- Update Password to 'davilarimo' for all Admin RPCs

-- 1. admin_upsert_gift
CREATE OR REPLACE FUNCTION admin_upsert_gift(
  p_id uuid,
  p_name text,
  p_description text,
  p_price numeric,
  p_image_url text,
  p_product_link text,
  p_warning_title text,
  p_warning_message text,
  p_category text,
  p_max_quantity integer,
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

  IF p_id IS NULL THEN
    -- INSERT
    INSERT INTO public.gifts (
      name, description, price, image_url, product_link, 
      warning_title, warning_message, category, max_quantity, current_quantity
    )
    VALUES (
      p_name, p_description, p_price, p_image_url, p_product_link,
      p_warning_title, p_warning_message, p_category, COALESCE(p_max_quantity, 1), 0
    );
  ELSE
    -- UPDATE
    UPDATE public.gifts
    SET 
      name = p_name,
      description = p_description,
      price = p_price,
      image_url = p_image_url,
      product_link = p_product_link,
      warning_title = p_warning_title,
      warning_message = p_warning_message,
      category = p_category,
      max_quantity = COALESCE(p_max_quantity, 1)
    WHERE id = p_id;
  END IF;

  RETURN true;
END;
$$;

-- 2. admin_delete_gift
CREATE OR REPLACE FUNCTION admin_delete_gift(
  p_id uuid,
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

  DELETE FROM public.gifts WHERE id = p_id;
  RETURN true;
END;
$$;

-- 3. admin_update_gift_status
CREATE OR REPLACE FUNCTION admin_update_gift_status(
  p_id uuid,
  p_reserved_by text,
  p_current_quantity integer,
  p_reservations jsonb,
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

  UPDATE public.gifts
  SET 
    reserved_by = p_reserved_by,
    current_quantity = p_current_quantity,
    reservations = p_reservations,
    updated_at = now()
  WHERE id = p_id;

  RETURN true;
END;
$$;

-- 4. admin_clear_reservation
CREATE OR REPLACE FUNCTION admin_clear_reservation(
  p_id uuid,
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

  UPDATE public.gifts
  SET 
    reserved_by = NULL,
    reservation_pin = NULL,
    current_quantity = 0,
    reservations = '[]'::jsonb,
    updated_at = now()
  WHERE id = p_id;

  RETURN true;
END;
$$;
