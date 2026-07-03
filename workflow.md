# QUY TRÌNH LÀM VIỆC CỦA ĐỒNG ĐỘI AI (WORKFLOW)
> **Quy trình bắt buộc tuân thủ ở đầu mỗi phiên làm việc (Coding Turn) cho dự án GoldChain**

Để đảm bảo các trợ lý AI (như Antigravity hoặc các AI coding assistant khác) thực hiện chính xác các tác vụ code tiếp theo mà không làm sai lệch nghiệp vụ hoặc cấu trúc dự án, AI **bắt buộc** phải tuân theo quy trình đọc tệp và thực thi dưới đây ở mỗi lượt bắt đầu:

---

## 1. QUY TRÌNH KHỞI ĐẦU BẮT BUỘC (INITIAL READ PROCESS)

Trước khi thực hiện bất kỳ chỉnh sửa mã nguồn hoặc đề xuất lệnh chạy nào, AI phải thực hiện đọc lần lượt 3 tệp tin cấu hình sau:

### 📑 Bước 1: Đọc tệp [TongKet.md](file:///d:/Mon%20Hoc/GoldTrader-master/TongKet.md)
*   **Mục đích:** Hiểu toàn bộ bối cảnh dự án, kiến trúc chuyển đổi từ Vanilla JS sang React SPA, các thư mục cốt lõi (`/src` và `/js`), triết lý thiết kế Apple-inspired, và các tính năng nghiệp vụ tài chính cốt lõi (Hedging, DCA, FIFO, QR động TOTP).
*   **Hành động của AI:** Sử dụng công cụ đọc tệp để cập nhật bức tranh toàn cảnh về mã nguồn.

### 📋 Bước 2: Đọc tệp [task.txt](file:///d:/Mon%20Hoc/GoldTrader-master/task.txt) (hoặc `task.md` nếu có)
*   **Mục đích:** Xác định chính xác nhiệm vụ hiện tại mà người dùng yêu cầu, danh sách việc cần làm (Todo list), và trạng thái tiến độ hiện tại của các task.
*   **Hành động của AI:** Phân tích yêu cầu lập trình được mô tả trong tệp này để lập kế hoạch triển khai cụ thể, không làm lệch khỏi phạm vi nhiệm vụ được giao.

### 🗄️ Bước 3: Đọc tệp [database.txt](file:///d:/Mon%20Hoc/GoldTrader-master/database.txt)
*   **Mục đích:** Tra cứu cấu trúc bảng cơ sở dữ liệu Supabase, các trường dữ liệu, kiểu dữ liệu, các quan hệ khóa ngoại (Foreign Keys) và hướng dẫn kết nối để tích hợp dữ liệu chính xác vào các component React.
*   **Hành động của AI:** Đảm bảo viết câu lệnh truy vấn (qua Supabase Client) khớp hoàn toàn với cấu trúc bảng được định nghĩa trong tệp này.

---

## 2. NGUYÊN TẮC THỰC THI (CODING & ARCHITECTURE RULES)

Khi viết hoặc chỉnh sửa code, AI phải tuân thủ nghiêm ngặt các tiêu chuẩn sau:

1.  **Refactoring Chuẩn React:** Chuyển đổi giao diện từ mã nguồn Vanilla JS trong thư mục `/js` sang React SPA trong `/src`. Sử dụng **Zustand** để quản lý trạng thái (`src/store/useStore.js`) và **React Router** để định tuyến.
2.  **Đồng bộ thiết kế:** Tuân thủ hệ màu tối chủ đạo, dải màu gradient vàng hoàng kim (`--gold-gradient`), chữ tiêu đề display viết sát (`letter-spacing` âm) và thiết kế nút bo góc tròn dạng viên thuốc quy định trong [DESIGN.md](file:///d:/Mon%20Hoc/GoldTrader-master/ThietKe/DESIGN.md) và [style.css](file:///d:/Mon%20Hoc/GoldTrader-master/css/style.css).
3.  **An toàn Giao dịch:** Đảm bảo giữ đúng logic khóa giá 60 giây khi giao dịch vàng, hạch toán giá vốn theo cơ chế FIFO, và bắt buộc xác thực KYC (`currentUser.kycStatus === 'verified'`) mới được xuất QR Code động rút vàng vật lý.

---

## 3. QUY TRÌNH KẾT THÚC PHIÊN LÀM VIỆC (TURN END PROCESS)

Sau khi hoàn thành công việc chỉnh sửa code hoặc kiểm thử, AI phải thực hiện:

1.  **Cập nhật tiến độ:** Đánh dấu hoàn thành các đầu việc đã xong và cập nhật trạng thái các việc đang làm trong tệp [task.txt](file:///d:/Mon%20Hoc/GoldTrader-master/task.txt).
2.  **Cập nhật cấu trúc DB (nếu có):** Nếu có tạo bảng mới hoặc thay đổi các cột trong cơ sở dữ liệu Supabase, hãy ghi nhận lại thay đổi đó vào tệp [database.txt](file:///d:/Mon%20Hoc/GoldTrader-master/database.txt).
3.  **Cập nhật tài liệu tổng kết:** Nếu có các thay đổi lớn về mặt kiến trúc phần mềm, hãy cập nhật thông tin tương ứng vào tệp [TongKet.md](file:///d:/Mon%20Hoc/GoldTrader-master/TongKet.md).
4.  **Báo cáo ngắn gọn:** Gửi phản hồi ngắn gọn cho người dùng về những phần đã thực hiện, những tệp tin đã chỉnh sửa kèm liên kết chi tiết.
