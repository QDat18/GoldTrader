-- Dọn dẹp cột bị dư thừa (Thương hiệu đúc bị trùng lặp vì Đã có Loại Vàng)
ALTER TABLE public.vault_inventory DROP COLUMN IF EXISTS bar_brand;

-- Thêm các cột còn thiếu vào bảng vault_inventory (nếu chưa có)
ALTER TABLE public.vault_inventory
  ADD COLUMN IF NOT EXISTS import_source TEXT,
  ADD COLUMN IF NOT EXISTS cost_price_vnd NUMERIC,
  ADD COLUMN IF NOT EXISTS receipt_id TEXT;

-- Bắt buộc Supabase API phải xoá cache và làm mới cấu trúc Schema (Rất quan trọng!)
NOTIFY pgrst, 'reload schema';
