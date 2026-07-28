# GoldChain (GoldTrader) - Nền tảng Công nghệ Vàng Số Toàn Diện

GoldChain là một siêu ứng dụng Web (SPA - Single Page Application) tiên phong trong lĩnh vực giao dịch và tích lũy vàng số tại Việt Nam. Nền tảng kết hợp kiến trúc Fintech chuyên nghiệp với công nghệ Web3, cung cấp hệ sinh thái từ Trading, Tích lũy tự động (DCA) cho đến Quản lý Vận hành và Hedging khối lượng lớn.

## 🚀 Công nghệ sử dụng
- **Frontend Core:** React.js (Vite), React Router DOM (v6)
- **Styling:** Vanilla CSS (Dark Theme, Neumorphism, Apple Typography - SF Pro)
- **Backend & DB:** Supabase (PostgreSQL, Supabase Auth)
- **State Management:** Zustand (quản lý trạng thái Global, Cache cơ chế Stale-While-Revalidate)
- **Background Worker:** Node.js (node-cron) xử lý tiến trình tự động (DCA)
- **Security & Web3:** Ethers.js, Solidity Smart Contract, sha256 (Mã hóa và định danh Blockchain)
- **Document Gen:** PDFKit (Phát hành E-Contract tự động)

## ✨ Các tính năng nổi bật (Hệ Sinh Thái Khách Hàng)

### 1. Hệ thống Xác thực Bảo mật Cấp cao (Auth & eKYC)
- **Xác thực Đa tầng:** Đăng ký bằng biến số xác thực OTP qua Email (Sử dụng Supabase `signInWithOtp`).
- **KYC Chuẩn Tài chính:** Chấm điểm eKYC qua 3 bước (Thông tin cơ bản -> CMND/CCCD -> Xác thực Liveness ảnh mặt). Đóng băng các luồng Rút Vàng Vật Chất nếu chưa qua ải KYC.

### 2. Sàn Giao Dịch Vàng Kỹ Thuật Số (Trading App)
- **Live Market Ticker:** Bảng điện báo giá thời gian thực SJC, PNJ, DOJI nhúng thẳng lên Top Nav.
- **Micro-transaction Protection:** Khóa tự động các lệnh giao dịch dưới 50,000 VNĐ.
- **Cổng Nạp Tiền Định Danh (O2O Fiat):** Tự động phát sinh mã VietQR với Note chuẩn xác mức giá (Min 10k - Max 10 Tỷ VND) chặn giao dịch rác ngay từ client.

### 3. Tích Lũy Bằng Máy (DCA Automation)
- **Lên Lịch Thông Minh:** Auto-buy Vàng bằng dòng tiền trích từ Ví dựa theo chu kỳ (Hàng ngày, Hàng tuần, Chọn ngày cụ thể trong Tháng).
- **Phát Hành Hợp Đồng Tự Động:** Cron worker chạy ngầm bằng Node.js tự động quét lệnh, khớp giá hằng ngày, tự sinh Hợp đồng PDF (E-Contract) chứa chữ ký điện tử gửi mail báo cáo cho khách.

## 👑 Hệ Thống Dành Cho Quản Trị Hệ Thống (LMS Admin)

Sở hữu màn hình lưới kiểm soát (Dashboard) chuyên quyền tuyệt đối:
- **Admin Dashboard:** Phân tích Dòng tiền, Chiết xuất lợi nhuận (PnL), Tổng quan tồn kho vật lý và Bảng giá theo thời gian thực (Today, Week, Month).
- **Order Management:** Khớp lệnh mua bán, theo dõi dòng luân chuyển tài sản, tích hợp view các lệnh chạy ngầm DCA.
- **Vault Inventory:** Kiểm kê quỹ vàng vật chất (từng serial của SJC, PNJ) kết nối logic với số liệu ảo.
- **O2O Withdrawals (Online-to-Offline):** Trải nghiệm xuất vàng bằng OTP và Secure Token tại Quầy Lễ Tân (Có xác thực băm mật mã và cấp Mint Ticket Web3 làm Token ERC-721/Bằng chứng chủ quyền).
- **Hedging Management:** Quản lý Vị thế cân bằng rủi ro (Back-to-Back Hedging) với các đại lý bán buôn để khóa giá Spread từ dòng tiền của User.

## 📦 Hướng dẫn cài đặt (Local Development)

### Yêu cầu hệ thống:
- Node.js (v16 trở lên)
- NPM hoặc Yarn

### Các bước cài đặt:

1. **Clone dự án:**
   ```bash
   git clone https://github.com/QDat18/GoldTrader.git
   cd GoldTrader
   ```

2. **Cài đặt thư viện (Dependencies):**
   ```bash
   npm install
   ```

3. **Cấu hình Biến môi trường (.env):**
   Tại thư mục dự án, tạo file `.env` chứa chìa khoá Cloud:
   ```env
   VITE_SUPABASE_URL=https://[ID_CỦA_BẠN].supabase.co
   VITE_SUPABASE_ANON_KEY=[KEY_CỦA_BẠN]
   SMTP_HOST=smtp.ethereal.email
   SMTP_PORT=587
   SMTP_USER=...
   SMTP_PASS=...
   ```

4. **Kích hoạt Web, Background Worker & Blockchain Server:**
   ```bash
   # Mở Tab 1 (Chạy Giao diện người dùng web)
   npm run dev

   # Mở Tab 2 (Chạy Cỗ máy Cron Worker xử lý ngầm DCA & E-Contract)
   node vang-today-worker/dca_cron.js

   # Mở Tab 3 (Chạy Máy chủ trung chuyển Blockchain sinh chữ ký số định danh Web3 O2O)
   node server.js
   ```

## 🛡️ Bản quyền
© 2024 - 2026 GoldChain JSC. Ứng dụng mô phỏng giải pháp Công Nghệ Tài Chính Thế Hệ Mới. Mọi quyền được bảo lưu.
