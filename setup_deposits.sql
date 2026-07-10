CREATE TABLE financial_ledgers.fiat_deposits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.user_profiles(id),
  amount_vnd numeric NOT NULL CHECK (amount_vnd > 0),
  status character varying NOT NULL DEFAULT 'COMPLETED',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS and setup policies so users can view their own deposits
ALTER TABLE financial_ledgers.fiat_deposits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own deposits"
ON financial_ledgers.fiat_deposits
FOR SELECT
TO authenticated
USING (user_id = (SELECT id FROM public.user_profiles WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can insert their own deposits"
ON financial_ledgers.fiat_deposits
FOR INSERT
TO authenticated
WITH CHECK (user_id = (SELECT id FROM public.user_profiles WHERE auth_user_id = auth.uid()));
