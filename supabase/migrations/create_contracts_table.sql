-- =============================================================================
-- GOLDCHAIN: SQL Schema cho bảng Contracts
-- Chạy lệnh này trong Supabase > SQL Editor
-- =============================================================================

-- Tạo bảng contracts
CREATE TABLE IF NOT EXISTS public.contracts (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_number   VARCHAR(50) UNIQUE NOT NULL,
  order_id          VARCHAR(100),
  txn_id            VARCHAR(100),
  buyer_id          UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  buyer_name        VARCHAR(200),
  buyer_email       VARCHAR(200),
  buyer_phone       VARCHAR(30),
  buyer_cccd        VARCHAR(30),
  seller_name       VARCHAR(200) DEFAULT 'GOLDCHAIN VÀNG VIỆT NAM',
  seller_address    VARCHAR(500) DEFAULT '123 Đường Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh',
  gold_type         VARCHAR(100),
  gold_name         VARCHAR(200),
  quantity_chi      DECIMAL(12, 4),
  quantity_grams    DECIMAL(12, 4),
  unit_price_vnd    BIGINT,
  total_amount_vnd  BIGINT,
  transaction_type  VARCHAR(20) CHECK (transaction_type IN ('BUY', 'SELL', 'WITHDRAW')),
  contract_date     TIMESTAMPTZ DEFAULT NOW(),
  pdf_url           TEXT,
  email_sent        BOOLEAN DEFAULT FALSE,
  email_sent_at     TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- Index để tìm kiếm nhanh
CREATE INDEX IF NOT EXISTS idx_contracts_buyer_id ON public.contracts(buyer_id);
CREATE INDEX IF NOT EXISTS idx_contracts_contract_date ON public.contracts(contract_date DESC);
CREATE INDEX IF NOT EXISTS idx_contracts_transaction_type ON public.contracts(transaction_type);
CREATE INDEX IF NOT EXISTS idx_contracts_contract_number ON public.contracts(contract_number);

-- RLS (Row Level Security) - Mỗi user chỉ xem được hợp đồng của mình
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

-- Policy: User xem hợp đồng của chính mình
CREATE POLICY "Users can view own contracts"
  ON public.contracts
  FOR SELECT
  USING (
    buyer_id IN (
      SELECT id FROM public.user_profiles
      WHERE auth_user_id = auth.uid()
    )
  );

-- Policy: System có thể insert hợp đồng (từ Edge Function hoặc client)
CREATE POLICY "Authenticated users can insert contracts"
  ON public.contracts
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy: Admin xem tất cả hợp đồng
CREATE POLICY "Admin can view all contracts"
  ON public.contracts
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email = 'admin@goldchain.vn'
    )
  );

-- View: Danh sách hợp đồng có thông tin bổ sung
CREATE OR REPLACE VIEW public.contracts_summary AS
SELECT
  c.*,
  up.full_name as profile_name,
  up.kyc_status
FROM public.contracts c
LEFT JOIN public.user_profiles up ON c.buyer_id = up.id;

-- Trigger: Tự động cập nhật updated_at
CREATE OR REPLACE FUNCTION public.update_contracts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER contracts_updated_at
  BEFORE UPDATE ON public.contracts
  FOR EACH ROW EXECUTE FUNCTION public.update_contracts_updated_at();

-- =============================================================================
-- KIỂM TRA: Xem bảng vừa tạo
-- =============================================================================
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'contracts'
ORDER BY ordinal_position;
