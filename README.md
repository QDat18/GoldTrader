# GoldChain - Nền tảng Tích lũy Vàng Số Thông Minh

GoldChain là một ứng dụng Web (SPA - Single Page Application) tiên phong trong lĩnh vực giao dịch và tích lũy vàng kỹ thuật số tại Việt Nam. Nền tảng mang đến trải nghiệm đầu tư hiện đại, an toàn và trực quan thông qua giao diện "Apple Design" kết hợp Dark Theme & Neumorphism.

## 🚀 Công nghệ sử dụng
- **Frontend Framework:** React.js (Vite)
- **Styling:** Vanilla CSS (Dark Theme, Neumorphism, Apple Typography - SF Pro)
- **Backend & Auth:** Supabase (Authentication, PostgreSQL, Edge Functions)
- **Icons:** Lucide-React
- **State Management:** Zustand (quản lý trạng thái Global)
- **Routing:** React Router DOM (v6)

## ✨ Các tính năng nổi bật

### 1. Landing Page Chuyên Nghiệp (High-conversion)
- **Live Market Ticker:** Dải băng báo giá chạy ngang theo thời gian thực (SJC, PNJ, DOJI, XAU/USD).
- **Interactive Mini-Charts:** Biểu đồ SVG mô phỏng biến động giá bằng CSS Animation siêu mượt.
- **Value Proposition:** Hiển thị 4 bước tham gia đơn giản và minh bạch.

### 2. Hệ thống Xác thực Bảo mật Cấp cao (Auth & eKYC)
Luồng đăng ký 3 bước chuẩn Fintech:
- **Bước 1 (Thông tin & OTP):** Đăng ký tài khoản với tính năng xác thực Email thực tế bằng **6 số OTP** từ hệ thống Supabase `signInWithOtp`. Kiểm tra mật khẩu (Real-time Match Validation).
- **Bước 2 (Xác minh Giấy tờ):** Upload thẻ Căn cước công dân (CCCD) hoặc Hộ chiếu (Front & Back).
- **Bước 3 (Xác thực Liveness):** Quét khuôn mặt AI bằng hiệu ứng Camera giả lập, sau đó hoàn tất đăng ký và lưu trữ Metadata lên hệ thống.

### 3. Phân quyền (Role-Based Access Control)
- **Guest:** Chỉ truy cập được Landing Page, xem giá, và vào trang Login/Register.
- **User:** Truy cập Dashboard, Trade, DCA, và Lịch sử giao dịch.
- **Admin:** (Đang phát triển) Bảng điều khiển riêng biệt quản lý hàng hóa, phê duyệt KYC.

## 📦 Hướng dẫn cài đặt (Local Development)

### Yêu cầu hệ thống:
- Node.js (v16 trở lên)
- NPM hoặc Yarn

### Các bước cài đặt:

1. **Clone dự án:**
   ```bash
   git clone https://github.com/QDat18/GoldTrader.git
   cd "Gold Trade"
   ```

2. **Cài đặt thư viện (Dependencies):**
   ```bash
   npm install
   ```

3. **Cấu hình Biến môi trường:**
   Tạo file `.env` ở thư mục gốc của dự án và thêm thông tin kết nối Supabase của bạn:
   ```env
   VITE_SUPABASE_URL=https://[ID_CỦA_BẠN].supabase.co
   VITE_SUPABASE_ANON_KEY=[KEY_CỦA_BẠN]
   ```

4. **Khởi chạy máy chủ phát triển:**
   ```bash
   npm run dev
   ```
   *Ứng dụng sẽ chạy tại địa chỉ `http://localhost:5173`.*

## 🔒 Cấu hình Supabase (Dành cho Developer)
Để luồng Đăng ký (Gửi OTP) hoạt động, bạn cần cấu hình Supabase như sau:
1. Vào **Authentication** -> **Providers** -> **Email**.
2. Bật tùy chọn: `Enable Email provider`.
3. Bật tùy chọn: `Confirm email`.
4. Quan trọng: Bật tùy chọn `Use OTP instead of magic links` (Sử dụng OTP thay vì link ma thuật).

## 🎨 Design System & Typography
Dự án được xây dựng dựa trên tài liệu `ThietKe/DESIGN.md`:
- **Font chữ:** `SF Pro Display` cho tiêu đề (letter-spacing âm) và `SF Pro Text` cho văn bản nội dung. (Tích hợp thông qua thẻ `-apple-system`).
- **Màu sắc chủ đạo:** Deep Charcoal (`#121212`), Brushed Gold (`#D4AF37`), Emerald Green (`#10B981`), và Ruby Red (`#EF4444`).
- **Hiệu ứng:** Đổ bóng Neumorphism sắc nét bằng `box-shadow`.

## 🛡️ Bản quyền
© 2024 - 2026 GoldChain JSC. Mọi quyền được bảo lưu.
