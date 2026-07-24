-- Lệnh tạo Bảng cho Hệ thống Tích Lũy Vàng Định Kỳ (DCA)

DROP TABLE IF EXISTS public.dca_executions CASCADE;
DROP TABLE IF EXISTS public.dca_plans CASCADE;

-- 1. Bảng quản lý Kế Hoạch DCA
CREATE TABLE public.dca_plans (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.user_profiles(id) NOT NULL,
  gold_type text NOT NULL,
  amount_vnd numeric NOT NULL,
  frequency text NOT NULL,
  execution_day text NOT NULL,
  status text DEFAULT 'running' NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- 2. Bảng quản lý Lịch sử các lần đã thực thi (Executions)
CREATE TABLE public.dca_executions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id uuid REFERENCES public.dca_plans(id) NOT NULL,
  user_id uuid REFERENCES public.user_profiles(id) NOT NULL,
  executed_at timestamptz DEFAULT now() NOT NULL,
  amount_vnd numeric NOT NULL,
  gold_price numeric NOT NULL,
  quantity_purchased numeric NOT NULL,
  status text NOT NULL
);

-- Cấp quyền (RLS có thể tuỳ chỉnh, tạm thời để public hoặc allow all cho nhanh)
ALTER TABLE public.dca_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dca_executions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all read dca_plans" ON public.dca_plans FOR SELECT USING (true);
CREATE POLICY "Allow insert own dca_plans" ON public.dca_plans FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update own dca_plans" ON public.dca_plans FOR UPDATE USING (true);
CREATE POLICY "Allow delete own dca_plans" ON public.dca_plans FOR DELETE USING (true);

CREATE POLICY "Allow all read dca_executions" ON public.dca_executions FOR SELECT USING (true);
CREATE POLICY "Allow insert own dca_executions" ON public.dca_executions FOR INSERT WITH CHECK (true);
