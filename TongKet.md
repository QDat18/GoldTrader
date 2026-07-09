# TỔNG KẾT TOÀN DIỆN DỰ ÁN GOLDCHAIN
> **Nền tảng giao dịch và tích lũy vàng thông minh O2O (Online-to-Offline) kết hợp Fintech & Blockchain**

Tài liệu này tổng hợp toàn bộ thông tin chi tiết về cấu trúc mã nguồn, logic nghiệp vụ, kiến trúc tài chính, đặc tả thiết kế và lộ trình phát triển của dự án GoldChain dựa trên việc phân tích các tệp tin trong toàn bộ thư mục dự án.

---

## 1. TỔNG QUAN DỰ ÁN & MÔ HÌNH KINH DOANH

**GoldChain** là một giải pháp Fintech đột phá nhằm số hóa thị trường giao dịch vàng truyền thống thông qua mô hình O2O (Online-to-Offline). 

*   **Online (Trực tuyến):** Người dùng có thể theo dõi biểu đồ biến động giá vàng thời gian thực (SJC, PNJ, DOJI), mua/bán tích lũy vàng lẻ chỉ với số vốn từ **100.000 VNĐ** (vi đầu tư - Micro-investing), và thiết lập các kế hoạch tích lũy định kỳ tự động (**DCA**).
*   **Offline (Trực tiếp):** Tài sản số của khách hàng được bảo chứng vật lý 1:1 bằng vàng thật trong kho ký gửi. Khách hàng có thể xuất trình **Mã QR động (TOTP)** trên ứng dụng để nhận lại vàng vật lý trực tiếp tại hệ thống quầy giao dịch đối tác trên toàn quốc một cách bảo mật và tức thời.

### Khối Mô Hình Kinh Doanh (Business Model Canvas)
*   **Giải pháp giá trị (Value Propositions):** Tích lũy vàng vốn nhỏ; tối ưu giá mua nhờ DCA; sở hữu bằng chứng số minh bạch chống giả mạo trên Blockchain; quy trình rút vàng vật lý nhanh gọn tại quầy.
*   **Phân khúc khách hàng (Customer Segments):** Nhà đầu tư cá nhân nhỏ lẻ, giới trẻ văn phòng có nhu cầu tích lũy tài sản đều đặn từ thu nhập cố định, khách hàng cần ký gửi giữ hộ vàng an toàn.
*   **Cấu trúc chi phí (Cost Structure):** Tối ưu hóa chi phí mặt bằng và nhân sự nhờ chuyển dịch luồng giao dịch lên không gian số. Chi phí tập trung vào hạ tầng server WebSocket bảo mật và kiểm toán kho vàng.
*   **Dòng doanh thu (Revenue Streams):** Phí chênh lệch giá Mua - Bán (Bid-Ask Spread), phí giữ hộ đối với số lượng tích lũy lớn, doanh thu từ mô hình tài chính chuỗi cung ứng phối hợp với nhà sản xuất sỉ.

---

## 2. BẢN ĐỒ CHI TIẾT KIẾN TRÚC MÃ NGUỒN (PROJECT STRUCTURE)

Dự án đã **hoàn tất** quá trình chuyển dịch công nghệ (Refactoring) từ kiến trúc Web truyền thống chạy mã nguồn Vanilla JS sang ứng dụng trang đơn **React Single Page Application (SPA)** hoàn chỉnh sử dụng công cụ build **Vite** và cơ sở dữ liệu **Supabase**.

```
GoldTrader-master/
├── .env                       # Chứa khóa cấu hình bảo mật môi trường (Supabase Keys)
├── .gitignore                 # Các thư mục và tệp tin bỏ qua khi commit lên Git
├── index.html                 # Điểm khởi đầu HTML của ứng dụng (nạp /src/main.jsx)
├── package.json               # Quản lý thư viện phụ thuộc (React, Supabase, Zustand, Lucide-React)
├── vite.config.js             # Cấu hình tối ưu hóa các module Vite & React
├── ThietKe/
│   └── DESIGN.md              # Tài liệu phân tích và đặc tả hệ thống thiết kế (Apple Design System)
├── document (1).docx          # Báo cáo nghiên cứu khoa học lý thuyết và nghiệp vụ của dự án
├── css/
│   └── style.css              # Hệ thống CSS toàn cục với các biến giao diện màu vàng tối (Dark Gold)
├── js/                        # [MÃ NGUỒN CŨ - VANILLA JS] Chứa đầy đủ logic nghiệp vụ chạy ổn định
│   ├── app.js                 # Điểm khởi chạy định tuyến và render view của ứng dụng vanilla
│   ├── store.js               # Quản lý trạng thái tập trung (State Store) theo mẫu Pub/Sub
│   ├── layouts/               # Định nghĩa các khung layout động (UserLayout, AdminLayout, BlankLayout)
│   ├── components/            # Các thành phần giao diện (Navbar, Footer, Ticker chạy giá vàng)
│   └── pages/                 # Logic giao diện của 11 trang nghiệp vụ (Trade, DCA, Inventory, Admin...)
└── src/                       # [MÃ NGUỒN MỚI - REACT SPA] Thư mục đang được refactor dở dang
    ├── main.jsx               # Điểm gắn kết React App vào phần tử root (#app) trong index.html
    ├── App.jsx                # Cấu hình định tuyến React Router và phân phối layout/page
    ├── supabaseClient.js      # Khởi tạo kết nối Supabase Client phục vụ Auth và Database
    ├── store/
    │   └── useStore.js        # State Store quản lý trạng thái chia sẻ sử dụng thư viện Zustand
    ├── layouts/
    │   ├── BlankLayout.jsx    # Layout đơn giản dành cho các trang Auth (Login/Register)
    │   └── UserLayout.jsx     # Layout chính cho người dùng bao gồm Navbar, Ticker và Footer
    ├── components/
    │   ├── Footer.jsx         # Footer điều hướng thông tin pháp lý và hỗ trợ khách hàng
    │   ├── Navbar.jsx         # Navbar động có khả năng chuyển đổi vai trò Guest/User/Admin và nạp tiền ví
    │   └── Ticker.jsx         # Thanh trượt giá vàng thời gian thực tự động chạy ngang màn hình (marquee)
    └── pages/
        ├── Home.jsx           # Trang chủ giới thiệu, quy trình 4 bước và báo giá trực tiếp
        ├── Dashboard.jsx      # Trang quản lý tài sản cá nhân hiển thị số dư vàng, ví tiền và trạng thái eKYC
        ├── Trade.jsx          # Trang giao dịch 3 tab (Mua tích lũy, Bán trực tuyến, Rút vật chất) thanh toán qua ví
        ├── Dca.jsx            # Trang thiết lập và quản lý các gói đầu tư tích lũy định kỳ tự động
        ├── Admin.jsx          # Phân hệ quản trị viên duyệt rút vàng, nạp tiền và quản lý người dùng
        ├── History.jsx        # Lịch sử giao dịch và biến động số dư chi tiết
        ├── Notifications.jsx  # Hệ thống thông báo toàn cục về biến động số dư và trạng thái đơn hàng
        ├── Login.jsx          # Trang đăng nhập tích hợp Supabase Auth và cơ chế bypass Admin
        └── Register.jsx       # Trang đăng ký 3 bước tích hợp gửi & xác thực mã OTP email

```

---

## 3. CÁC CƠ CHẾ NGHIỆP VỤ & KIẾN TRÚC TÀI CHÍNH CỐT LÕI

Các cơ chế nghiệp vụ cốt lõi của GoldChain được đặc tả kỹ lưỡng trong tài liệu nghiên cứu `document (1).docx` và đã được hiện thực hóa đầy đủ trong mã nguồn cũ `/js/store.js` cùng các trang nghiệp vụ `/js/pages/`.

### 3.1. Giao dịch mua/bán và Khóa giá thời gian thực (Real-time Price Lock)
*   **Cơ chế khóa giá 60 giây:** Giá vàng biến động liên tục theo thị trường. Hệ thống sử dụng kết nối mạng để cập nhật giá. Khi người dùng thực hiện giao dịch, mức giá hiện tại sẽ được **khóa lại trong 60 giây** thông qua bộ đếm thời gian ngược (`Timer`). Nếu quá 60 giây mà người dùng chưa xác nhận lệnh, hệ thống sẽ tự động cập nhật mức giá mới nhằm bảo vệ cả khách hàng và doanh nghiệp.
*   **Vi đầu tư phân đoạn (Fractional Ownership):** Cho phép người dùng mua vàng bằng số tiền nhỏ. Số lượng vàng sở hữu được tính chính xác đến 4 chữ số thập phân:
    $$\text{Vàng sở hữu (G)} = \frac{\text{Số tiền nạp (X)}}{\text{Giá bán ra tại thời điểm đó } (P_{\text{sell}})}$$

### 3.2. Quản trị rủi ro biến động giá của Doanh nghiệp (Back-to-Back Hedging)
Để loại bỏ rủi ro biến động giá vàng thị trường sau khi khách hàng đặt mua trực tuyến, hệ thống Core của GoldChain áp dụng kỹ thuật **Back-to-Back Hedging**:
*   Ngay khi lệnh mua online của khách hàng khớp ở mức giá $P_{\text{sell}}$, hệ thống sẽ tự động kích hoạt một lệnh mua đối ứng tương đương từ nhà cung cấp sỉ hoặc thị trường phái sinh tại đúng thời điểm đó.
*   Hành động này giúp khóa biên độ lợi nhuận dịch vụ ổn định cho doanh nghiệp (từ chênh lệch Mua - Bán) và chuyển giao toàn bộ rủi ro trượt giá sang nhà cung cấp sỉ.

### 3.3. Phương pháp Hạch toán FIFO & Quy chuẩn ACID
*   **Bộ quy chuẩn ACID:** Đảm bảo giao dịch tài chính diễn ra nhất quán ở cấp độ cô lập cao nhất (`Serializable`). Hành động trừ số dư ví tiền tệ (VND) và cộng số dư vàng vật lý phải thành công đồng thời, tránh hiện tượng lỗi gây lệch dữ liệu ví.
*   **Hạch toán FIFO (First In, First Out):** Khi khách hàng thực hiện lệnh bán lại vàng online để chốt lời/rút tiền, hệ thống sẽ ưu tiên khấu trừ khối lượng dựa trên mức giá của các lệnh mua đầu tiên trong lịch sử giao dịch. Điều này giúp tính toán chính xác tuyệt đối tỷ lệ Lãi/Lỗ (PnL) thực tế của khách hàng.

### 3.4. Xác thực eKYC & Rút vàng O2O bằng Dynamic QR Code
*   **Quy trình eKYC:** Người dùng mới phải tải ảnh CCCD 2 mặt và thực hiện xác thực khuôn mặt (selfie). Tài khoản sẽ được chuyển sang trạng thái chờ duyệt (`pending`). Chỉ khi được Admin phê duyệt chuyển sang `verified`, người dùng mới có quyền thực hiện rút vàng vật lý.
*   **Mã QR động bảo mật (TOTP):** Khi khách hàng yêu cầu rút vàng tại quầy vật lý, ứng dụng tạo ra một mã QR động áp dụng thuật toán mật mã thời gian (thay đổi sau mỗi 30 giây). Nhân viên tại tiệm quét mã này để đối chiếu thông tin gốc từ database với giấy tờ CCCD cầm trên tay của khách hàng, xác nhận bàn giao vàng và chuyển trạng thái đơn hàng thành `completed` để tránh rủi ro chi tiêu lặp (Double-spending).

### 3.5. Ứng dụng Blockchain để bảo chứng (Proof of Custody)
*   **Smart Contract:** Dùng để tự động phát hành (Mint) token tài sản kỹ thuật số chứng nhận quyền sở hữu vàng vật lý tương ứng 1:1 trong kho bảo mật của các ngân hàng đối tác (như Vietcombank, Techcombank).
*   **Chữ ký số chống giả mạo:** Chuỗi mã hóa SHA-256 từ file hóa đơn điện tử (chứa đầy đủ thông tin giao dịch, tên và CCCD khách hàng) được ghi nhận trực tiếp lên sổ cái Blockchain phi tập trung. Khi khách hàng xuất trình hóa đơn tại quầy, hệ thống quét mã và đối chiếu chuỗi mã băm này với Blockchain để phát hiện ngay lập tức nếu file hóa đơn bị chỉnh sửa bằng phần mềm đồ họa.

---

## 4. THIẾT KẾ GIAO DIỆN (DESIGN SYSTEM ANALYSIS)

Giao diện của dự án được định hướng thiết kế theo phong cách tối giản, cao cấp của **Apple Web Design System** phối hợp với bộ nhận diện sắc vàng quý phái của thương hiệu vàng bạc.

### 4.1. Hệ thống màu sắc (Color Tokens)
*   **Nền tối chủ đạo:** Sử dụng tông màu xám tro siêu tối (`--bg-main: #121212`) kết hợp các thẻ bo góc màu đá phiến (`--bg-card: #1E1E1E`) để tạo cảm giác sâu, tập trung thị giác vào hình ảnh sản phẩm.
*   **Màu vàng điểm nhấn (Gold Accents):** Sử dụng dải màu gradient vàng hoàng kim sang trọng (`--gold-gradient: linear-gradient(...)` phối từ `#BF953F`, `#FCF6BA`, `#B38728`) cho các nút hành động chính, logo mark và các đề mục quan trọng.
*   **Màu tương tác phụ:** Xanh lục ngọc bảo (`--emerald: #10B981`) biểu thị chiều tăng giá/lệnh mua/KYC thành công; đỏ hồng ngọc (`--ruby: #EF4444`) biểu thị chiều giảm giá/lệnh bán/KYC bị từ chối.

### 4.2. Kiểu chữ & Spacing (Typography & Grid)
*   **Font chữ cao cấp:** Sử dụng font **Outfit** và bộ font hệ thống của Apple (**SF Pro Display** cho tiêu đề lớn, **SF Pro Text** cho phần thân bài viết và giao diện).
*   **Đặc điểm Typography:** Áp dụng khoảng cách chữ âm (`letter-spacing: -0.28px` đến `-0.374px`) ở các tiêu đề display cỡ lớn để tái tạo phong cách "Apple tight" chuyên nghiệp và gọn gàng.
*   **Radius Scale:** Sử dụng bo góc nhẹ (`8px`) cho các nút bấm tiện ích và hình ảnh nội bộ; bo góc lớn (`18px`) cho các thẻ tiện ích tổng quan; và bo góc tròn dạng viên thuốc (`9999px`) cho các thanh tìm kiếm, nút hành động chính và bộ chọn cấu hình.

---

## 5. THIẾT KẾ CƠ SỞ DỮ LIỆU CORE (DATABASE SCHEMA)

Dưới đây là cấu trúc hai bảng dữ liệu quan trọng nhất được định nghĩa trong tài liệu thiết kế hệ thống của dự án:

### Bảng người dùng (`users`)
Bảng này quản lý thông tin định danh cơ bản của khách hàng tham gia hệ thống:
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    id_card_number VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(15) NOT NULL,
    password_hash VARCHAR(255) NOT NULL
);
```

### Bảng đơn hàng (`orders`)
Bảng quản lý thông tin các lệnh đặt mua/rút vàng trực tuyến phục vụ đối chiếu O2O tại quầy vật lý:
```sql
CREATE TABLE orders (
    id VARCHAR(50) PRIMARY KEY,
    user_id INT REFERENCES users(id),
    gold_type VARCHAR(50) NOT NULL,
    quantity DECIMAL(15,4) NOT NULL,
    unit_price DECIMAL(15,4) NOT NULL,
    total_amount DECIMAL(15,4) NOT NULL,
    payment_status VARCHAR(20) DEFAULT 'PENDING',
    order_status VARCHAR(20) DEFAULT 'WAITING_PICKUP',
    secure_token VARCHAR(255) UNIQUE NOT NULL, -- Token tạo mã QR động TOTP
    pdf_hash VARCHAR(64) NOT NULL,              -- Mã băm SHA-256 hóa đơn lưu trên Blockchain
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 6. ĐÁNH GIÁ TRẠNG THÁI HIỆN TẠI & KẾT QUẢ ĐẠT ĐƯỢC

### 6.1. Trạng thái hiện tại (Current Status)
Dự án đã **hoàn tất thành công** quá trình chuyển dịch công nghệ (Refactoring) sang kiến trúc **React SPA**. Toàn bộ các chức năng nghiệp vụ trọng yếu đã được lập trình hoàn thiện và đưa vào hoạt động thực tế, không còn sử dụng component tạm (Placeholder) như giai đoạn trước:

*   **Hệ thống Giao dịch (Trade):** Đã hoàn thiện luồng giao dịch 3 Tab: "Mua tích lũy", "Bán trực tuyến" và "Rút vật chất". Việc thanh toán được thực hiện 100% thông qua hệ thống **Ví nội bộ** (Ví tiền VNĐ và Ví Vàng). Khách hàng mua/bán sẽ được trừ/cộng ngay lập tức vào số dư ví, đảm bảo trải nghiệm mượt mà. Lệnh "Rút vật chất" sẽ sinh ra đơn hàng chờ duyệt để khách ra quầy nhận vàng.
*   **Hệ thống Email & SMTP:** Triển khai cơ chế SMTP Dev Middleware tích hợp trực tiếp vào Vite Dev Server và thư viện `nodemailer`, thay thế email mặc định của Supabase để phục vụ demo không bị giới hạn. Thiết lập thư mục `TemplateMail` với các mẫu thiết kế HTML cao cấp (`welcome`, `ForgotPass`, `HopDongMua`, `HopDongBan`) đồng bộ tự động gửi khi Đăng ký thành công, Yêu cầu đổi mật khẩu hoặc Khớp lệnh mua/bán vàng trên trang Trade.
*   **Hệ thống Thông báo (Notifications):** Đã triển khai toàn diện. Mọi biến động số dư (nạp tiền, mua/bán vàng) và thay đổi trạng thái đơn hàng (duyệt rút vàng) đều bắn thông báo thời gian thực về tài khoản khách hàng.
*   **Hệ thống Quản trị (Admin):** Đã xây dựng hoàn chỉnh trang quản trị cho phép Admin duyệt các lệnh rút vàng vật lý, cộng tiền vào ví người dùng và quản lý toàn diện hệ thống.
*   **Data API (Giá vàng):** Đã gỡ bỏ kiến trúc cào dữ liệu tự động (Puppeteer) kém ổn định do các nguồn web thường xuyên chặn bot (404/Timeout). Máy chủ Node.js hiện tại đã được nâng cấp thành một **REST API độc lập chuẩn vnappmob**. Quản trị viên có thể dùng API `POST` để chủ động đẩy giá thực tế vào cơ sở dữ liệu Supabase, đảm bảo dữ liệu luôn chính xác, an toàn tuyệt đối khi demo đồ án (đã khắc phục triệt để lỗi giới hạn ký tự `VARCHAR(20)` khi đẩy giá vàng SJC).

### 6.2. Hướng phát triển tiếp theo (Future Enhancements)
*   **Tích hợp Web3/Smart Contract:** Tích hợp sâu hơn công nghệ Blockchain trên mạng Testnet để tự động phát hành (Mint) token chứng nhận sở hữu thay vì chỉ lưu mã băm hóa đơn.
*   **Phân tích dữ liệu (AI/ML):** Nghiên cứu áp dụng thuật toán Machine Learning để phân tích dữ liệu lịch sử `gold_price_snapshots`, dự đoán xu hướng giá vàng ngắn hạn và đưa ra gợi ý giao dịch.
*   **Tối ưu hóa hiệu năng:** Nâng cấp biểu đồ nến chuyên nghiệp (như TradingView/Lightweight Charts) để hiển thị mượt mà khi dữ liệu lịch sử giá vàng phình to.
