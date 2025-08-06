-- Add discount fields to venues table
ALTER TABLE public.venues 
ADD COLUMN default_discount_percentage numeric DEFAULT 0 CHECK (default_discount_percentage >= 0 AND default_discount_percentage <= 100);

-- Create venue_discounts table for complex discount rules
CREATE TABLE public.venue_discounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  venue_id UUID NOT NULL,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'bulk_deal', 'time_based')),
  discount_value NUMERIC NOT NULL CHECK (discount_value >= 0),
  
  -- For bulk deals like "buy 2 get 1 free"
  buy_quantity INTEGER,
  get_quantity INTEGER,
  
  -- For time-based discounts
  valid_days TEXT[], -- ['monday', 'tuesday', etc]
  valid_start_time TIME,
  valid_end_time TIME,
  
  -- General fields
  title TEXT NOT NULL,
  description TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on venue_discounts
ALTER TABLE public.venue_discounts ENABLE ROW LEVEL SECURITY;

-- Create policies for venue_discounts
CREATE POLICY "Anyone can view active discounts" 
ON public.venue_discounts 
FOR SELECT 
USING (active = true);

CREATE POLICY "Partners can manage discounts for their venues" 
ON public.venue_discounts 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 
    FROM venues v 
    JOIN profiles p ON v.partner_id = p.id 
    WHERE v.id = venue_discounts.venue_id 
    AND p.id = auth.uid() 
    AND p.role = 'partner'::user_role
  )
);

-- Create function to update discount timestamps
CREATE OR REPLACE FUNCTION public.update_discount_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_venue_discounts_updated_at
BEFORE UPDATE ON public.venue_discounts
FOR EACH ROW
EXECUTE FUNCTION public.update_discount_updated_at();