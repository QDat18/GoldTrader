-- Chạy kịch bản này trong SQL Editor của Supabase để làm sạch hoàn toàn cơ sở dữ liệu.
-- BẢO ĐẢM XOÁ THEO ĐÚNG THỨ TỰ (từ bảng con chứa khóa ngoại đến bảng cha)

-- 1. Xóa toàn bộ dữ liệu giao dịch tài chính (Financial Ledgers)
DELETE FROM financial_ledgers.hedge_positions;
DELETE FROM financial_ledgers.lot_consumptions;
DELETE FROM financial_ledgers.gold_lots;
DELETE FROM financial_ledgers.gold_transactions;
DELETE FROM financial_ledgers.dca_executions;
DELETE FROM financial_ledgers.orders;
DELETE FROM financial_ledgers.blockchain_proofs;

-- 2. Xóa toàn bộ dữ liệu công khai và ví tiền (Public)
DELETE FROM public.storage_contracts;
DELETE FROM public.dca_plans;
DELETE FROM public.gold_wallets;
DELETE FROM public.vault_inventory;
DELETE FROM public.notifications;
DELETE FROM public.user_profiles;

-- 3. Xóa các phiên xác thực và bảng người dùng gốc (Auth Schema)
DELETE FROM auth.identities;
DELETE FROM auth.sessions;
DELETE FROM auth.mfa_amr_claims;
DELETE FROM auth.mfa_challenges;
DELETE FROM auth.mfa_factors;
DELETE FROM auth.users;
