# ⚜️ Hướng Dẫn Cấu Hình Smart Contract & Hệ Thống GoldChain

Tài liệu này hướng dẫn ngắn gọn các bước lập trình, cấu hình và triển khai blockchain (Solidity) kết hợp với hệ thống gửi email tự động (Resend API + Supabase).

---

## 🔗 PHẦN 1: Blockchain & Smart Contracts (Solidity)

Mã nguồn hợp đồng thông minh nằm tại thư mục [contracts/GoldChain.sol](file:///d:/GitHub/GoldTrader/contracts/GoldChain.sol).

### 1. Chi Tiết Các Hợp Đồng
*   **GoldChainToken (GCT) - Tiêu chuẩn ERC-20:** Đại diện cho số lượng vàng tích lũy online của khách hàng (`1 GCT = 1 Chỉ`). Hỗ trợ mua bán nhỏ lẻ đến `0.0001 chỉ` (`decimals = 4`). Admin có quyền `mint` khi khách hàng nạp/mua và `burn` khi khách hàng rút vàng vật chất.
*   **GoldChainCustody (Proof of Custody):** Lưu trữ mã băm SHA-256 của các tệp PDF hợp đồng điện tử lên blockchain, giúp kiểm chứng tính toàn vẹn và chống chỉnh sửa tài liệu pháp lý giao dịch.

### 2. Triển Khai & Kiểm Thử (Remix IDE)
1. Truy cập **[remix.ethereum.org](https://remix.ethereum.org)**.
2. Tạo file mới `GoldChain.sol` và dán mã nguồn vào.
3. Tab **Solidity Compiler** -> Chọn bản `0.8.20` -> Nhấn **Compile GoldChain.sol**.
4. Tab **Deploy & Run Transactions** -> Chọn **Injected Provider - MetaMask** (hoặc Remix VM) -> Nhấn **Deploy** 2 contract.
5. Lưu lại địa chỉ ví Contract sau khi deploy thành công để kết nối ứng dụng.

---

## ⚡ PHẦN 2: Triển Khai Edge Functions & Secrets (Supabase)

Ứng dụng sử dụng Edge Functions để gọi tự động gửi email đính kèm PDF thông qua **Resend API**.

### 1. Cấu Hình CLI & Secrets Lên Cloud
Mở PowerShell/Terminal tại thư mục dự án `d:\GitHub\GoldTrader` và chạy các lệnh:

**Bước A: Cài đặt CLI & Liên kết dự án:**
```powershell
npm install -g supabase
supabase login
supabase link --project-ref cyrfvvvdipykkqhvpsvl
```

**Bước B: Đưa Key Resend và cấu hình gửi mail lên Cloud Secrets:**
```powershell
supabase secrets set RESEND_API_KEY=re_9GnwJ5n1_AJRUSHbuaet5m21GAWgJbpWx
supabase secrets set EMAIL_FROM_NAME="GoldChain"
supabase secrets set EMAIL_FROM_ADDRESS="onboarding@resend.dev"
```

**Bước C: Triển khai Edge Functions:**
```powershell
supabase functions deploy send-otp-email
supabase functions deploy send-contract-email
```

---

## 🗄️ PHẦN 3: Cấu Hình Database & Storage trên Supabase

1.  **SQL Schema:** Mã nguồn cấu trúc bảng SQL chi tiết đã có sẵn tại file [database.txt](file:///d:/GitHub/GoldTrader/database.txt). Bạn chỉ cần copy toàn bộ nội dung trong file đó, dán vào **SQL Editor** trên Supabase dashboard và nhấn **Run** để khởi tạo các bảng.
2.  **Tạo Storage Bucket:** 
    *   Vào **Storage** -> Click **New Bucket** -> Đặt tên `kyc-documents`.
    *   Bật tùy chọn **Public Bucket** -> Nhấn **Save**.
3.  **Cấu hình OTP Auth:**
    *   Vào **Authentication** -> **Providers** -> **Email**.
    *   Bật `Enable Email provider`, bật `Confirm email` và bật **`Use OTP instead of magic links`**.
    *   Nhấn **Save**.

---

## 🏃 PHẦN 4: Hướng Dẫn Chạy & Kiểm Thử Toàn Diện

1.  **Khởi động Web Local:**
    ```bash
    npm install
    npm run dev
    ```
    Mở trình duyệt: **http://localhost:5173**

2.  **Luồng kiểm thử (e2e Flow):**
    *   **Đăng ký:** Nhập email -> Bấm nhận mã. OTP 6 số sẽ tự động gửi về Gmail của bạn với đồng hồ đếm ngược 60s. Nhập sai mã hệ thống sẽ tự động báo lỗi đỏ và xóa trắng ô nhập.
    *   **eKYC:** Tải lên 2 mặt CCCD và quét khuôn mặt giả lập để hoàn tất KYC.
    *   **Duyệt KYC Admin:** Đăng nhập tài khoản Admin mặc định (`admin@goldchain.vn` / `admin123`) -> Duyệt KYC thành viên -> Cộng tiền VND vào ví.
    *   **Mua vàng:** Trở lại tài khoản khách hàng -> Vào **Trade** -> Click **Mua vàng**. 
    *   **Xem & Gửi Hợp đồng:** Sau khi thanh toán thành công, hệ thống tự động sinh PDF đính kèm gửi ngầm về Gmail. Nút "Xem hợp đồng" sáng vàng lên để mở bản hợp đồng điện tử.
    *   **Xem lại trên Web:** Người dùng có thể vào mục **Lịch sử** -> Nhấn **Xem** để xem lại trực tiếp bản hợp đồng giao dịch bất cứ lúc nào.
