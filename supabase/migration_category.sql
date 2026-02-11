-- Add category column if it doesn't exist
ALTER TABLE public.gifts 
ADD COLUMN IF NOT EXISTS category text;

-- Drop old function to avoid signature conflicts
DROP FUNCTION IF EXISTS admin_upsert_gift;

-- Recreate with new category parameter
CREATE OR REPLACE FUNCTION admin_upsert_gift(
  p_id uuid, -- NULL for new item
  p_name text,
  p_description text,
  p_price numeric,
  p_image_url text,
  p_product_link text,
  p_warning_title text,
  p_warning_message text,
  p_category text, -- New parameter
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
    INSERT INTO public.gifts (
      name, description, price, image_url, product_link, 
      warning_title, warning_message, category
    )
    VALUES (
      p_name, p_description, p_price, p_image_url, p_product_link,
      p_warning_title, p_warning_message, p_category
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
      category = p_category
    WHERE id = p_id;
  END IF;

  RETURN true;
END;
$$;
