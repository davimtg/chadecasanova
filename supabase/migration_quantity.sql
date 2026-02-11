-- Add quantity columns
ALTER TABLE public.gifts 
ADD COLUMN IF NOT EXISTS max_quantity integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS current_quantity integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- Drop old functions to avoid signature conflicts if necessary, 
-- though CREATE OR REPLACE handles mostly matching signatures. 
-- Changing signature requires DROP usually if types don't match or arg count changes.
DROP FUNCTION IF EXISTS admin_upsert_gift;

-- Update admin_upsert_gift to include max_quantity
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
  p_max_quantity integer, -- NEW
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

-- Update reserve_gift logic
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
  v_gift public.gifts%ROWTYPE;
BEGIN
  -- Lock the row for update to prevent race conditions
  SELECT * INTO v_gift FROM public.gifts WHERE id = p_gift_id FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Logic for multiple items
  IF v_gift.max_quantity > 1 THEN
    -- Check if full
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
      updated_at = now()
    WHERE id = p_gift_id;
    
    RETURN true;

  ELSE
    -- Logic for single item (Legacy/Standard)
    IF v_gift.reserved_by IS NOT NULL AND v_gift.reserved_by != '' THEN
      RETURN false; -- Already reserved
    END IF;

    UPDATE public.gifts
    SET 
      reserved_by = p_guest_name,
      current_quantity = 1,
      updated_at = now()
    WHERE id = p_gift_id;
    
    RETURN true;
  END IF;
END;
$$;
