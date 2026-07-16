import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  ArrowUp,
  Bell,
  CandlestickChart,
  CheckCircle2,
  Clock,
  Database,
  Eye,
  FileText,
  History,
  Info,
  Landmark,
  LayoutDashboard,
  LockKeyhole,
  Mail,
  MapPin,
  PlusCircle,
  QrCode,
  RefreshCw,
  Scale,
  Settings,
  ShieldCheck,
  UserCheck,
  Wallet,
} from 'lucide-react';

const effectiveDate = '11/07/2026';

const TooltipTerm = ({ label, tip }) => (
  <span className="privacy-term" tabIndex="0" aria-label={`${label}: ${tip}`}>
    {label}
    <Info size={13} />
    <span className="privacy-tooltip">{tip}</span>
  </span>
);

const highlights = [
  {
    icon: LayoutDashboard,
    title: 'Đi theo đúng vai trò',
    text: 'Khách chưa đăng nhập xem thông tin công khai; guest đã đăng ký hoàn tất hồ sơ; user đã KYC mới dùng đủ giao dịch; admin chỉ vào bàn vận hành.',
  },
  {
    icon: ShieldCheck,
    title: 'KYC trước thao tác nhạy cảm',
    text: 'Mua, bán, rút vàng vật chất, QR tại quầy và các giao dịch có rủi ro đều gắn với định danh chính chủ, nhật ký thao tác và kiểm soát AML.',
  },
  {
    icon: Clock,
    title: 'Giao dịch theo giá khóa',
    text: 'Giá vàng được tải từ dữ liệu thị trường, hiển thị mua vào/bán ra và khóa ngắn hạn trên màn hình đặt lệnh để khách kiểm tra trước khi xác nhận.',
  },
  {
    icon: Bell,
    title: 'Có lịch sử và thông báo',
    text: 'Mỗi giao dịch, nạp ví, trạng thái KYC, trạng thái đơn rút và yêu cầu hỗ trợ đều cần có dấu vết để đối soát, khiếu nại và chăm sóc khách hàng.',
  },
];

const glossary = [
  {
    label: 'Guest',
    tip: 'Vai trò mặc định sau đăng ký. Guest có tài khoản nhưng chưa được duyệt KYC đầy đủ nên bị giới hạn giao dịch nhạy cảm.',
  },
  {
    label: 'User',
    tip: 'Tài khoản khách hàng đã được admin duyệt KYC. User được phép sử dụng đầy đủ các luồng mua, bán, tích lũy và yêu cầu rút vàng theo hạn mức.',
  },
  {
    label: 'Admin',
    tip: 'Vai trò vận hành nội bộ. Admin duyệt KYC, quản lý đơn, đối soát QR O2O, tồn kho và vị thế phòng hộ; không thao tác như khách hàng.',
  },
  {
    label: 'KYC',
    tip: 'Know Your Customer - xác minh danh tính bằng thông tin cá nhân, số CCCD, ảnh giấy tờ và đối chiếu hồ sơ trước khi mở quyền giao dịch.',
  },
  {
    label: 'AML',
    tip: 'Anti-Money Laundering - kiểm soát phòng chống rửa tiền, theo dõi giao dịch bất thường, chứng minh nguồn tiền và phối hợp theo yêu cầu pháp luật.',
  },
  {
    label: 'Ví VND',
    tip: 'Số dư tiền nội bộ dùng để thanh toán lệnh mua vàng hoặc nhận tiền sau khi bán vàng. Ví cần đối soát với hồ sơ và lịch sử nạp.',
  },
  {
    label: 'Ví vàng',
    tip: 'Số dư vàng theo từng mã sản phẩm, quy đổi chỉ/gram, dùng cho bán online hoặc tạo yêu cầu rút vàng vật chất tại quầy.',
  },
  {
    label: 'QR động',
    tip: 'Mã xác thực có thời hạn phục vụ nhận vàng vật chất tại quầy, cần đối chiếu cùng CCCD và đơn hàng trong hệ thống.',
  },
  {
    label: 'DCA',
    tip: 'Dollar-Cost Averaging - kế hoạch tích lũy định kỳ theo số tiền cố định để giảm rủi ro mua một lần tại vùng giá không thuận lợi.',
  },
  {
    label: 'FIFO',
    tip: 'First In, First Out - nguyên tắc hạch toán lô vàng mua trước được bán trước để tính giá vốn và lãi/lỗ thực tế.',
  },
];

const quickPaths = [
  {
    icon: Eye,
    audience: 'Khách chưa đăng nhập',
    actions: [
      'Xem Trang chủ, Giá vàng, Điều khoản, Chính sách bảo mật và Hướng dẫn sử dụng.',
      'Có thể mở trang Giao dịch để xem cấu trúc, nhưng khi đặt lệnh sẽ được yêu cầu đăng nhập.',
      'Nên đọc trước điều kiện KYC, rủi ro giá vàng và quy trình rút tại quầy trước khi tạo tài khoản.',
    ],
  },
  {
    icon: UserCheck,
    audience: 'Guest đã đăng ký',
    actions: [
      'Đăng nhập, kiểm tra dropdown tài khoản ở navbar, xem số dư ví, hồ sơ và trạng thái KYC.',
      'Bổ sung/kiểm tra CCCD, số điện thoại, email và chờ admin duyệt hồ sơ.',
      'Có thể chuẩn bị nạp ví hoặc xem giá, nhưng không nên được mở toàn bộ quyền rút vàng nếu KYC chưa verified.',
    ],
  },
  {
    icon: Wallet,
    audience: 'User đã KYC',
    actions: [
      'Nạp ví VND, mua vàng online, bán vàng online, tạo DCA và xem lịch sử giao dịch.',
      'Khi có số dư vàng, có thể tạo yêu cầu rút vàng vật chất, chọn chi nhánh và dùng QR động tại quầy.',
      'Theo dõi thông báo realtime, hóa đơn/hợp đồng điện tử và trạng thái đơn để đối soát.',
    ],
  },
  {
    icon: ShieldCheck,
    audience: 'Admin vận hành',
    actions: [
      'Vào Trung tâm Quản trị thay vì các route khách hàng như /trade, /prices, /dashboard.',
      'Duyệt/từ chối KYC kèm lý do, kiểm tra đơn rút, quét QR O2O, quản lý kho và vị thế hedging.',
      'Mọi quyết định ảnh hưởng khách hàng cần có căn cứ, log và thông báo rõ ràng.',
    ],
  },
];

const roleRows = [
  {
    role: 'Khách chưa đăng nhập',
    allowed: 'Trang chủ, Giá vàng, Điều khoản, Chính sách bảo mật, Hướng dẫn sử dụng, Đăng nhập, Đăng ký.',
    limited: 'Không có dashboard cá nhân, không có ví, không đặt được lệnh thật, không nhận QR rút vàng.',
    next: 'Đăng ký tài khoản và hoàn tất thông tin định danh ban đầu.',
  },
  {
    role: 'Guest đã đăng ký',
    allowed: 'Đăng nhập, xem hồ sơ, trạng thái KYC, thông tin tài khoản, thông báo, các trang công khai và luồng chuẩn bị giao dịch.',
    limited: 'Các thao tác mua/bán/rút có thể bị chặn hoặc cần xác minh thêm nếu KYC chưa verified.',
    next: 'Chờ admin duyệt KYC hoặc cập nhật lại hồ sơ khi bị từ chối.',
  },
  {
    role: 'User đã KYC verified',
    allowed: 'Dashboard, Trade, DCA, History, Profile, Notifications, nạp ví, mua/bán/rút theo điều kiện tồn kho và hạn mức.',
    limited: 'Không truy cập trang admin, không sửa dữ liệu hệ thống, không bỏ qua bước đối chiếu tại quầy.',
    next: 'Theo dõi lịch sử, bảo mật tài khoản, lưu chứng từ và phản hồi hỗ trợ khi có sai lệch.',
  },
  {
    role: 'Admin',
    allowed: 'Trung tâm Quản trị, duyệt KYC, quản lý đơn, đối soát QR O2O, kho vàng, hedging, thông báo và hồ sơ admin.',
    limited: 'Không vào các đầu mục khách hàng như giao dịch cá nhân, DCA, dashboard khách hoặc bảng giá dành cho khách.',
    next: 'Xử lý hồ sơ/đơn theo quy trình nội bộ, lưu lý do, log và bằng chứng đối soát.',
  },
];

const featureGroups = [
  {
    icon: UserCheck,
    title: 'Tài khoản và eKYC',
    items: ['Đăng ký', 'Đăng nhập', 'Khôi phục phiên', 'Hồ sơ cá nhân', 'Duyệt/từ chối KYC', 'Phân quyền Guest/User/Admin'],
  },
  {
    icon: CandlestickChart,
    title: 'Thị trường và bảng giá',
    items: ['Ticker giá', 'Bảng giá vàng', 'Lịch sử snapshot', 'Biểu đồ nến SVG', 'Khung 1H/1D/1W/1M', 'Zoom chart'],
  },
  {
    icon: Wallet,
    title: 'Ví và giao dịch',
    items: ['Ví VND', 'Ví vàng', 'Nạp tiền', 'Mua online', 'Bán online', 'Rút vàng vật chất', 'Hóa đơn điện tử'],
  },
  {
    icon: RefreshCw,
    title: 'Tích lũy DCA',
    items: ['Tạo kế hoạch', 'Số tiền tối thiểu', 'Tần suất tuần/tháng', 'Tạm dừng', 'Kích hoạt lại', 'Hủy kế hoạch'],
  },
  {
    icon: History,
    title: 'Theo dõi và đối soát',
    items: ['Lịch sử giao dịch', 'Chi tiết hóa đơn', 'Thông báo realtime', 'Trạng thái đơn', 'Mã giao dịch', 'Dữ liệu khiếu nại'],
  },
  {
    icon: Settings,
    title: 'Quản trị hệ thống',
    items: ['KYC admin', 'Đơn rút vàng', 'QR O2O', 'Kho vàng', 'Hedging', 'Hồ sơ nhân sự admin'],
  },
];

const legalBases = [
  {
    title: 'Luật Giao dịch điện tử 2023',
    tag: 'Xác nhận online',
    text: 'Là nền tảng tham chiếu cho thao tác xác nhận lệnh, chứng từ điện tử, thông báo điện tử và nhật ký hệ thống.',
  },
  {
    title: 'Luật Bảo vệ quyền lợi người tiêu dùng 2023',
    tag: 'Minh bạch',
    text: 'Định hướng công khai giá, phí, rủi ro, điều kiện giao dịch, kênh khiếu nại và bảo vệ thông tin khách hàng.',
  },
  {
    title: 'Nghị định 13/2023/NĐ-CP',
    tag: 'Dữ liệu cá nhân',
    text: 'Áp dụng cho dữ liệu tài khoản, CCCD, ảnh KYC, dữ liệu ví, giao dịch, thiết bị, thông báo và yêu cầu quyền riêng tư.',
  },
  {
    title: 'Luật Phòng, chống rửa tiền 2022',
    tag: 'KYC/AML',
    text: 'Định hướng nhận biết khách hàng, theo dõi giao dịch bất thường, lưu hồ sơ, yêu cầu bổ sung thông tin và kiểm soát rủi ro.',
  },
  {
    title: 'Khung quản lý kinh doanh vàng',
    tag: 'Vàng vật chất',
    text: 'Luồng rút vàng tại quầy cần bám điều kiện kinh doanh vàng, tồn kho, chứng từ, đối tác giao nhận và phạm vi giấy phép thực tế.',
  },
  {
    title: 'Pháp luật thuế, kế toán, hóa đơn',
    tag: 'Chứng từ',
    text: 'Các lệnh, hóa đơn, hợp đồng, log ví và dữ liệu đối soát phải được lưu đủ để giải trình, hoàn tiền, khiếu nại và kiểm toán.',
  },
];

const guideSections = [
  {
    id: 'account',
    icon: UserCheck,
    title: 'Đăng ký, đăng nhập và phiên tài khoản',
    items: [
      <>Từ navbar, khách chọn <strong>Đăng ký</strong> để tạo tài khoản mới. Hồ sơ tối thiểu gồm họ tên, email, số điện thoại, mật khẩu, số CCCD và thông tin phục vụ eKYC.</>,
      <>Sau khi tạo tài khoản, hệ thống gán vai trò mặc định là <TooltipTerm label="Guest" tip="Tài khoản có đăng nhập nhưng chưa được admin duyệt KYC đầy đủ." />. Vai trò này giúp khách vào được khu vực hồ sơ nhưng chưa nên mở toàn bộ quyền giao dịch nhạy cảm.</>,
      <>Trang <strong>Đăng nhập</strong> dùng Supabase Auth, đồng bộ hồ sơ từ bảng <code>user_profiles</code> và khôi phục phiên khi F5 hoặc mở lại trình duyệt.</>,
      <>Nếu email đăng nhập tồn tại nhưng hồ sơ chưa kịp tạo, hệ thống có fallback thông tin cơ bản. Khách cần hoàn tất hồ sơ trước khi giao dịch thật.</>,
      <>Dropdown tài khoản ở navbar hiển thị tên khách, email, số dư ví VND, trạng thái KYC, điện thoại, CCCD đã che một phần và các công cụ nhanh như Tổng quan, Giao dịch, DCA, Lịch sử, Thông báo, Nạp tiền, Hồ sơ.</>,
      <>Khi đăng xuất, token phiên Supabase và cache cục bộ liên quan ví, thông báo, giao dịch sẽ được dọn để tránh người khác dùng cùng thiết bị xem dữ liệu.</>,
    ],
  },
  {
    id: 'kyc',
    icon: ShieldCheck,
    title: 'Xác thực eKYC và trạng thái hồ sơ',
    items: [
      <>GoldChain sử dụng eKYC để xác minh khách hàng chính chủ, giảm gian lận, đáp ứng kiểm soát <TooltipTerm label="AML" tip="Kiểm soát phòng chống rửa tiền, tài trợ khủng bố và giao dịch bất thường." /> và bảo vệ giao dịch vàng vật chất.</>,
      <>Khách cần cung cấp số CCCD, ảnh mặt trước/mặt sau giấy tờ và thông tin liên hệ trùng khớp. Ảnh phải rõ, không cắt góc, không lóa, không dùng bản photocopy mờ.</>,
      <>Trạng thái <strong>pending</strong> nghĩa là hồ sơ đang chờ admin kiểm tra. Dashboard hiển thị banner nhắc khách chờ duyệt trong khung thời gian vận hành.</>,
      <>Trạng thái <strong>rejected</strong> nghĩa là hồ sơ bị từ chối. Admin phải ghi lý do; khách cần cập nhật lại đúng nội dung bị thiếu hoặc sai.</>,
      <>Trạng thái <strong>verified</strong> chuyển khách lên vai trò <TooltipTerm label="User" tip="Khách hàng đã được duyệt KYC và được mở quyền giao dịch theo điều kiện hệ thống." />, đủ điều kiện dùng đầy đủ luồng mua, bán, DCA và yêu cầu rút vàng theo hạn mức.</>,
      <>Hệ thống có thể yêu cầu xác minh lại nếu đổi thiết bị, đổi số điện thoại, phát hiện giao dịch bất thường, dữ liệu KYC mâu thuẫn hoặc có yêu cầu từ đối tác/cơ quan có thẩm quyền.</>,
    ],
  },
  {
    id: 'dashboard',
    icon: LayoutDashboard,
    title: 'Trang Tổng quan tài sản',
    items: [
      <>Trang <strong>Tổng quan</strong> là màn hình chính sau đăng nhập của khách không phải admin. Đây là nơi xem tổng giá trị quy đổi hiện tại gồm ví VND và ví vàng.</>,
      <>Khối tổng tài sản lấy số dư ví VND từ <code>wallet_balance_vnd</code> và quy đổi số dư vàng theo giá mua vào trung bình hiện tại để khách nắm giá trị tham khảo.</>,
      <>Các thẻ vàng đang sở hữu chỉ hiển thị khi khách có số dư lớn hơn 0, gồm tên sản phẩm, số chỉ, số gram tương đương và trị giá tham khảo.</>,
      <>Khối hướng dẫn nhận vàng vật chất giải thích luồng O2O: mua/tích lũy online, tạo hợp đồng/chứng từ, tạo QR động, đến quầy xuất trình QR và CCCD.</>,
      <>Bảng giao dịch gần đây hiển thị 3 giao dịch mới nhất để khách kiểm tra nhanh; nút <strong>Xem toàn bộ lịch sử</strong> dẫn sang trang History.</>,
      <>Nếu KYC đang chờ duyệt, banner đầu trang nhắc rõ hồ sơ đang được kiểm tra. Khách không nên hiểu số dư hoặc giao dịch mô phỏng là quyền rút vàng thật khi chưa verified.</>,
    ],
  },
  {
    id: 'prices',
    icon: CandlestickChart,
    title: 'Trang Giá vàng và biểu đồ thị trường',
    items: [
      <>Trang <strong>Giá vàng</strong> hiển thị danh sách mã sản phẩm từ dữ liệu <code>gold_price_snapshots</code>, gồm giá mua vào, bán ra, xu hướng, chênh lệch và thời điểm cập nhật.</>,
      <>Dữ liệu giá được worker/API đưa vào Supabase theo chu kỳ, còn frontend tự gọi cập nhật định kỳ. Khi nguồn giá chưa đủ lịch sử, chart có fallback mô phỏng để demo giao diện.</>,
      <>Khách bấm một dòng sản phẩm để mở chi tiết. Tab <strong>Detail</strong> hiển thị snapshot theo ngày, có thể bung/thu từng ngày để xem mốc thời gian cập nhật.</>,
      <>Tab <strong>Chart</strong> hiển thị nến SVG theo khung 1H, 1D, 1W, 1M; có đường trung bình động, volume mô phỏng và công cụ zoom/reset.</>,
      <>Giá mua vào là giá hệ thống mua lại từ khách; giá bán ra là giá khách dùng để mua. Spread mua/bán và phí nếu có cần được khách đọc trước khi xác nhận lệnh.</>,
      <>Giá hiển thị là dữ liệu tham chiếu cho đến khi khách xác nhận trong khung khóa giá trên trang giao dịch. Biến động mạnh, lỗi nguồn giá hoặc sai lệch kỹ thuật có thể khiến lệnh cần làm mới.</>,
    ],
  },
  {
    id: 'deposit',
    icon: PlusCircle,
    title: 'Nạp tiền vào ví VND',
    items: [
      <>Khách đã đăng nhập mở dropdown tài khoản ở navbar và chọn <strong>Nạp tiền vào ví</strong>. Modal hiển thị số dư hiện tại, các mức nạp gợi ý và ô nhập số tiền tùy chỉnh.</>,
      <>Sau khi xác nhận, hệ thống cộng số dư ví VND vào Zustand/local cache và cập nhật <code>wallet_balance_vnd</code> trong hồ sơ người dùng.</>,
      <>Lịch sử nạp được ghi vào bảng <code>financial_ledgers.fiat_deposits</code> với trạng thái mặc định completed để trang History có thể hiển thị giao dịch nạp.</>,
      <>Trong bản demo, nạp ví đang xử lý ngay lập tức. Khi vận hành thật, bước này cần tích hợp ngân hàng/cổng thanh toán, tài khoản nguồn chính chủ, nội dung chuyển khoản, đối soát và hoàn tiền nếu sai thông tin.</>,
      <>Khách cần tránh dùng tài khoản ngân hàng của người khác. Giao dịch không chính chủ hoặc bất thường có thể bị treo để xác minh nguồn tiền.</>,
      <>Số dư ví VND không phải lời cam kết lãi, không phải sản phẩm tiền gửi và chỉ dùng trong phạm vi dịch vụ GoldChain theo điều khoản công bố.</>,
    ],
  },
  {
    id: 'buy',
    icon: Wallet,
    title: 'Mua vàng online',
    items: [
      <>Vào <strong>Giao dịch</strong>, chọn tab mua, chọn mã vàng, nhập số chỉ hoặc số tiền. Hệ thống tự quy đổi theo giá bán ra hiện tại.</>,
      <>Màn hình hiển thị tồn kho cửa hàng, số dư ví khả dụng, giá chốt, tổng thanh toán và đồng hồ khóa giá 60 giây. Hết thời gian, giá và tồn kho được làm mới.</>,
      <>Trước khi khớp lệnh, hệ thống kiểm tra đăng nhập, hồ sơ người dùng, số dư ví VND, tồn kho khả dụng và số lượng hợp lệ.</>,
      <>Khi mua thành công, ví VND bị trừ, ví vàng được cộng theo gram/chỉ, tồn kho vật lý được reserve hoặc giảm tương ứng và đơn <code>BUY_ONLINE</code> được ghi vào ledger.</>,
      <>Hệ thống sinh mã đơn, mã giao dịch, hash SHA-256 cho chứng từ/hợp đồng, thông báo giao dịch và gửi email hợp đồng mua nếu SMTP dev server đang bật.</>,
      <>Khách phải kiểm tra loại vàng, số lượng, giá, tổng tiền, phí, thuế nếu có và trạng thái KYC trước khi xác nhận. Lệnh đã khớp hợp lệ không tự điều chỉnh theo giá sau đó.</>,
    ],
  },
  {
    id: 'sell',
    icon: RefreshCw,
    title: 'Bán vàng online',
    items: [
      <>Tab bán chỉ có ý nghĩa khi khách có số dư vàng trong ví. Hệ thống lọc danh sách sản phẩm theo những mã khách đang sở hữu.</>,
      <>Khách nhập số chỉ hoặc chọn nhanh 25%, 50%, 75%, 100% số dư. Tổng tiền dự kiến được tính theo giá mua vào hiện tại của hệ thống.</>,
      <>Trước khi bán, khách cần kiểm tra số lượng trong ví, giá mua vào, tổng tiền nhận về, phí nếu có và tác động của spread mua/bán.</>,
      <>Khi bán thành công, ví vàng bị trừ, ví VND được cộng và lịch sử giao dịch/thông báo được tạo. Task FIFO chi tiết vẫn đang là hạng mục cần hoàn thiện theo task list hiện tại.</>,
      <>Với vận hành thật, giá vốn và lãi/lỗ cần dựa trên lô vàng mua trước bán trước theo <TooltipTerm label="FIFO" tip="Nguyên tắc lô mua trước được dùng trước khi tính giá vốn cho lệnh bán." />, kèm hóa đơn, thuế và hồ sơ kế toán.</>,
      <>Nếu số dư vàng không đủ, dữ liệu giá lỗi hoặc tài khoản có cảnh báo rủi ro, hệ thống cần từ chối hoặc yêu cầu xác minh thêm trước khi ghi nhận lệnh.</>,
    ],
  },
  {
    id: 'withdraw',
    icon: QrCode,
    title: 'Rút vàng vật chất tại quầy O2O',
    items: [
      <>Luồng rút vàng chỉ nên mở cho khách đã <strong>KYC verified</strong>, có số dư vàng đủ, có sản phẩm/tồn kho đáp ứng quy cách rút và chọn chi nhánh giao nhận hợp lệ.</>,
      <>Khách vào tab rút, chọn mã vàng, nhập số chỉ muốn rút, chọn chi nhánh nhận vàng và tạo yêu cầu rút. Đơn được ghi nhận dạng <code>WITHDRAW_PHYSICAL</code> hoặc trạng thái chờ xử lý tương ứng.</>,
      <>Hệ thống sinh secure token/QR động phục vụ đối chiếu. QR không được gửi cho người khác, không thay thế CCCD và có thể hết hạn theo cấu hình bảo mật.</>,
      <>Tại quầy, nhân viên kiểm tra CCCD/VNeID trùng hồ sơ, quét QR, đối chiếu mã đơn, số lượng, serial, tình trạng bao bì, biên bản bàn giao và trạng thái đơn.</>,
      <>Admin dùng trang O2O để xác thực QR, cập nhật đơn từ chờ nhận sang hoàn tất hoặc từ chối nếu token sai, hết hạn, khách không chính chủ hoặc tồn kho không khớp.</>,
      <>Sau khi bàn giao, khách cần kiểm tra sản phẩm, giữ hóa đơn/biên bản và xác nhận ngay nếu có sai lệch về trọng lượng, serial, loại vàng hoặc trạng thái đơn.</>,
    ],
  },
  {
    id: 'dca',
    icon: RefreshCw,
    title: 'Tích lũy DCA định kỳ',
    items: [
      <>Trang <strong>Tích lũy DCA</strong> giúp khách tạo kế hoạch mua vàng định kỳ theo số tiền cố định thay vì tự canh giá từng lần.</>,
      <>Khách chọn loại vàng, số tiền mỗi kỳ, tần suất hàng tuần/hàng tháng và ngày chạy. Số tiền tối thiểu hiện tại là 100.000 VNĐ/kỳ.</>,
      <>Danh sách kế hoạch hiển thị loại vàng, số tiền/kỳ, tần suất, ngày chạy, số lần đã thực hiện, giá vốn trung bình và trạng thái đang chạy/tạm dừng.</>,
      <>Khách có thể tạm dừng, kích hoạt lại hoặc hủy kế hoạch. Khi hủy, kế hoạch bị loại khỏi danh sách hiện tại và không chạy các kỳ sau.</>,
      <>Theo task list, DCA Execution Engine tự động chạy định kỳ vẫn đang là Task 30 chưa hoàn thiện; trang hiện chủ yếu phục vụ tạo/quản lý kế hoạch và demo lịch sử thực hiện.</>,
      <>Khi triển khai thật, DCA phải kiểm tra ví VND, giá khóa, hạn mức, KYC, trạng thái tài khoản, phí, chứng từ và thông báo từng lần chạy.</>,
    ],
  },
  {
    id: 'history',
    icon: History,
    title: 'Lịch sử giao dịch và hóa đơn',
    items: [
      <>Trang <strong>Lịch sử</strong> gom giao dịch mua, bán, rút, DCA và nạp tiền để khách đối soát theo mã, loại, sản phẩm, số lượng, đơn giá, tổng tiền, thời gian và trạng thái.</>,
      <>Bộ lọc cho phép xem theo loại giao dịch và loại vàng. Khách nên dùng mã giao dịch khi liên hệ hỗ trợ để tránh nhầm lệnh.</>,
      <>Dữ liệu đơn được tải từ <code>financial_ledgers.orders</code>; lịch sử nạp tiền được tải từ <code>financial_ledgers.fiat_deposits</code>.</>,
      <>Chi tiết hóa đơn hiển thị thông tin hợp đồng, sản phẩm, số lượng, đơn giá, tổng tiền và hash/chứng từ nếu có. Đây là căn cứ quan trọng khi khiếu nại hoặc đối soát.</>,
      <>Nếu giao dịch chưa xuất hiện ngay, khách nên làm mới sau vài giây vì dữ liệu có thể đang đồng bộ giữa auth, hồ sơ, ledger và notification.</>,
      <>Khi phát hiện lệnh lạ, sai số tiền, sai loại vàng hoặc trạng thái không đúng, khách cần khóa rủi ro qua hỗ trợ và không tiếp tục thao tác cùng thiết bị nếu nghi bị chiếm quyền.</>,
    ],
  },
  {
    id: 'notifications',
    icon: Bell,
    title: 'Thông báo realtime',
    items: [
      <>Biểu tượng chuông trên navbar hiển thị số thông báo chưa đọc. Khách bấm vào để xem thông báo giao dịch, hệ thống, KYC và trạng thái đơn.</>,
      <>Thông báo được lưu ở bảng <code>notifications</code> và app lắng nghe realtime để thêm thông báo mới đúng user đang đăng nhập.</>,
      <>Khách có thể đánh dấu đã đọc, xóa từng thông báo hoặc xóa toàn bộ tùy chức năng trang Notifications.</>,
      <>Thông báo quan trọng gồm nạp ví, mua/bán thành công, KYC được duyệt/từ chối, đơn rút chuyển trạng thái, cảnh báo bảo mật và cập nhật điều khoản.</>,
      <>Nếu thông báo không đến, hãy kiểm tra kết nối mạng, đăng nhập lại, mở trang Lịch sử để đối chiếu và liên hệ hỗ trợ với mốc thời gian thao tác.</>,
      <>Thông báo trong app không thay thế chứng từ/hợp đồng; khách vẫn cần lưu hóa đơn, mã giao dịch và email liên quan.</>,
    ],
  },
  {
    id: 'profile-security',
    icon: LockKeyhole,
    title: 'Hồ sơ cá nhân và bảo mật tài khoản',
    items: [
      <>Trang <strong>Thông tin cá nhân</strong> hiển thị và cho cập nhật các thông tin hồ sơ được phép như họ tên, số điện thoại, CCCD hoặc dữ liệu liên hệ tùy trạng thái KYC.</>,
      <>Khi cập nhật hồ sơ, hệ thống đồng bộ lên <code>user_profiles</code> và có thể tạo thông báo hệ thống để khách biết thông tin đã thay đổi.</>,
      <>Khách cần dùng mật khẩu mạnh, bảo vệ email, không chia sẻ OTP, không gửi ảnh CCCD/QR động cho người lạ và đăng xuất khỏi thiết bị dùng chung.</>,
      <>Nếu mất điện thoại, mất email, nghi bị lộ mật khẩu, thấy giao dịch lạ hoặc nhận yêu cầu cung cấp OTP, khách cần báo ngay để khóa rủi ro.</>,
      <>Admin chỉ nên truy cập dữ liệu khách theo nhu cầu công việc; dữ liệu CCCD, KYC, ví và lịch sử giao dịch là dữ liệu nhạy cảm cần giới hạn quyền xem.</>,
      <>Các yêu cầu quyền riêng tư như xem dữ liệu, chỉnh sửa, rút lại đồng ý hoặc khiếu nại bảo mật được hướng dẫn chi tiết tại trang Chính sách bảo mật.</>,
    ],
  },
  {
    id: 'legal-pages',
    icon: Scale,
    title: 'Trang pháp lý và thông tin bắt buộc',
    items: [
      <>Trang <strong>Điều khoản giao dịch</strong> giải thích phạm vi dịch vụ, điều kiện tham gia, giá, khóa giá, thanh toán, rút vàng, khiếu nại, rủi ro và hiệu lực điều khoản.</>,
      <>Trang <strong>Chính sách bảo mật</strong> giải thích loại dữ liệu xử lý, mục đích, căn cứ pháp lý, chia sẻ dữ liệu, cookie, thời hạn lưu, quyền khách hàng và kênh yêu cầu.</>,
      <>Trang <strong>Hướng dẫn sử dụng</strong> này là bản vận hành cho khách và admin, giúp người dùng biết thao tác nào nằm ở đâu, cần điều kiện gì và khi lỗi thì xử lý thế nào.</>,
      <>Theo yêu cầu bảo vệ người tiêu dùng, các thông tin giá, phí, điều kiện giao dịch, rủi ro, hoàn tiền, khiếu nại và dữ liệu cá nhân cần được trình bày rõ trước khi khách xác nhận.</>,
      <>Theo yêu cầu giao dịch điện tử, thao tác xác nhận online, log hệ thống, chứng từ điện tử và thông báo cần đủ khả năng đối chiếu khi phát sinh tranh chấp.</>,
      <>Nội dung pháp lý trong app cần được pháp chế/luật sư rà soát trước khi vận hành thương mại thật, đặc biệt với giấy phép kinh doanh vàng, thanh toán và lưu ký.</>,
    ],
  },
  {
    id: 'admin',
    icon: Settings,
    title: 'Hướng dẫn nhanh cho Admin',
    items: [
      <>Admin đăng nhập sẽ được điều hướng về <strong>/admin</strong>. Route guard hiện chặn admin vào các đầu mục khách như <strong>/trade</strong>, <strong>/prices</strong>, <strong>/dashboard</strong>, <strong>/dca</strong> và <strong>/history</strong>.</>,
      <>Tab <strong>Duyệt eKYC</strong> hiển thị hồ sơ pending. Admin phải xem ảnh CCCD trước khi duyệt; nếu từ chối cần nhập lý do rõ để khách sửa đúng lỗi.</>,
      <>Khi duyệt KYC, hệ thống cập nhật <code>kyc_status = VERIFIED</code>, ghi thời điểm duyệt, nâng role khách lên <strong>user</strong> và gửi thông báo.</>,
      <>Tab <strong>Orders</strong> theo dõi đơn mua/bán/rút, khách liên quan, trạng thái thanh toán, trạng thái nhận vàng và dữ liệu tồn kho liên kết.</>,
      <>Tab <strong>O2O</strong> dùng để nhập/quét token QR, kiểm tra đơn rút vàng, xác nhận đúng khách, đúng CCCD, đúng số lượng và cập nhật trạng thái sau bàn giao.</>,
      <>Tab <strong>Inventory</strong> quản lý serial, loại vàng, trọng lượng, trạng thái available/reserved/dispatched, nguồn nhập, giá vốn và mã hóa đơn nhập.</>,
      <>Tab <strong>Hedging</strong> theo dõi vị thế phòng hộ đối ứng để giảm rủi ro biến động giá sau khi khách khớp lệnh online.</>,
    ],
  },
  {
    id: 'troubleshooting',
    icon: AlertCircle,
    title: 'Xử lý lỗi thường gặp',
    items: [
      <>Không đăng nhập được: kiểm tra email/mật khẩu, mạng, trạng thái xác thực email và thử đăng nhập lại. Nếu token phiên lỗi, đăng xuất hoàn toàn rồi đăng nhập mới.</>,
      <>KYC bị từ chối: mở hồ sơ hoặc thông báo để đọc lý do; chụp lại CCCD rõ nét, đúng người, đúng số, không che góc và gửi lại.</>,
      <>Không mua được vàng: kiểm tra ví VND, số lượng nhập, tồn kho cửa hàng, trạng thái KYC, giá khóa còn hiệu lực và thông báo lỗi trên màn hình.</>,
      <>Không bán được vàng: kiểm tra ví vàng có đúng mã sản phẩm và số lượng đủ. Nếu không thấy sản phẩm, có thể số dư bằng 0 hoặc chưa đồng bộ từ database.</>,
      <>Không tạo được yêu cầu rút: kiểm tra KYC verified, số dư vàng, chi nhánh đã chọn, quy cách rút và trạng thái tài khoản không bị hạn chế.</>,
      <>QR tại quầy không hợp lệ: token có thể hết hạn, bị nhập sai, đơn đã hoàn tất/hủy hoặc khách không trùng hồ sơ. Admin cần đối chiếu lại mã đơn và CCCD.</>,
      <>DCA không chạy: hiện engine chạy định kỳ tự động vẫn là task cần hoàn thiện; trong bản demo, kế hoạch chủ yếu được tạo và quản lý trạng thái.</>,
      <>Thông báo/lịch sử chậm cập nhật: đợi vài giây, làm mới trang, kiểm tra kết nối hoặc đăng nhập lại để tải lại dữ liệu từ Supabase.</>,
    ],
  },
  {
    id: 'faq-support',
    icon: Mail,
    title: 'FAQ và hỗ trợ khách hàng',
    items: [
      <>GoldChain có tư vấn đầu tư không? Không. Nội dung giá, chart, DCA và dashboard chỉ là công cụ thông tin; khách tự chịu trách nhiệm quyết định mua/bán.</>,
      <>Giá trên app có giống tại quầy không? Giá cần căn cứ thời điểm, loại vàng, nguồn giá, chi nhánh, phí và trạng thái hệ thống. Lệnh chỉ có hiệu lực theo giá khách xác nhận trong app.</>,
      <>Có thể dùng tài khoản người thân để nạp/rút không? Không nên. Tiền, tài khoản ngân hàng, CCCD và người nhận vàng cần chính chủ hoặc có hồ sơ ủy quyền hợp lệ được chấp thuận.</>,
      <>Có thể rút một phần vàng không? Có thể nếu số dư, quy cách sản phẩm, tồn kho và điều kiện chi nhánh đáp ứng. Vàng lẻ có thể cần quy đổi hoặc gom đủ quy cách.</>,
      <>Khiếu nại cần gửi gì? Cần mã giao dịch/mã đơn, thời gian, ảnh chụp màn hình, chứng từ chuyển tiền, email/hóa đơn và mô tả ngắn vấn đề.</>,
      <>Kênh hỗ trợ: hotline 1800-6789, email <a href="mailto:cs@goldchain.vn">cs@goldchain.vn</a> cho dịch vụ khách hàng và <a href="mailto:privacy@goldchain.vn">privacy@goldchain.vn</a> cho yêu cầu dữ liệu cá nhân.</>,
    ],
  },
];

const sources = [
  {
    label: 'Cổng văn bản Chính phủ',
    href: 'https://vanban.chinhphu.vn/',
  },
  {
    label: 'Cơ sở dữ liệu Quốc gia về văn bản pháp luật',
    href: 'https://vbpl.vn/',
  },
  {
    label: 'Cổng thông tin điện tử Bộ Công an',
    href: 'https://www.mps.gov.vn/',
  },
  {
    label: 'Cổng thông tin điện tử Bộ Khoa học và Công nghệ',
    href: 'https://mst.gov.vn/',
  },
  {
    label: 'Điều khoản giao dịch GoldChain',
    href: '/terms',
  },
  {
    label: 'Chính sách bảo mật GoldChain',
    href: '/privacy',
  },
];

export default function UsageGuide() {
  const tocItems = useMemo(() => ([
    { id: 'quick-start', title: 'Lộ trình sử dụng', label: '00' },
    { id: 'role-map', title: 'Quyền theo vai trò', label: '01' },
    { id: 'feature-map', title: 'Bản đồ tính năng', label: '02' },
    { id: 'legal-bases', title: 'Cơ sở pháp lý', label: '03' },
    ...guideSections.map((section, index) => ({
      id: section.id,
      title: section.title,
      label: String(index + 4).padStart(2, '0'),
    })),
  ]), []);

  const [activeSection, setActiveSection] = useState('quick-start');
  const [readingProgress, setReadingProgress] = useState(0);
  const [showBackTop, setShowBackTop] = useState(false);

  const activeItem = tocItems.find((item) => item.id === activeSection) || tocItems[0];

  useEffect(() => {
    const updateReadingState = () => {
      const doc = document.documentElement;
      const scrollTop = window.scrollY || doc.scrollTop || 0;
      const scrollable = Math.max(doc.scrollHeight - doc.clientHeight, 1);

      setReadingProgress(Math.min(100, Math.max(0, (scrollTop / scrollable) * 100)));
      setShowBackTop(scrollTop > 520);
    };

    updateReadingState();
    window.addEventListener('scroll', updateReadingState, { passive: true });

    return () => window.removeEventListener('scroll', updateReadingState);
  }, []);

  useEffect(() => {
    const nodes = tocItems
      .map((item) => document.getElementById(item.id))
      .filter(Boolean);

    if (!nodes.length || typeof IntersectionObserver === 'undefined') return undefined;

    const observer = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

      if (visible?.target?.id) {
        setActiveSection(visible.target.id);
      }
    }, {
      rootMargin: '-18% 0px -66% 0px',
      threshold: [0.08, 0.16, 0.32, 0.5],
    });

    nodes.forEach((node) => observer.observe(node));

    return () => observer.disconnect();
  }, [tocItems]);

  const scrollToSection = (id) => {
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="terms-page guide-page">
      <div className="terms-reading-progress" aria-hidden="true">
        <span style={{ width: `${readingProgress}%` }} />
      </div>

      <section className="terms-hero guide-hero">
        <div className="terms-hero-copy">
          <div className="tag">HƯỚNG DẪN SỬ DỤNG</div>
          <h1>Hướng dẫn sử dụng GoldChain</h1>
          <p>
            Tài liệu thao tác đầy đủ cho khách hàng và admin: từ đăng ký, eKYC, xem giá, nạp ví,
            mua bán vàng, DCA, rút vàng vật chất O2O, lịch sử, thông báo đến xử lý lỗi và kênh hỗ trợ.
          </p>
          <div className="terms-hero-actions">
            <Link to="/register" className="btn btn-gold">
              <UserCheck size={16} />
              Tạo tài khoản
            </Link>
            <Link to="/prices" className="btn btn-outline">
              <CandlestickChart size={16} />
              Xem giá vàng
            </Link>
            <a href="#troubleshooting" className="btn btn-outline">
              <AlertCircle size={16} />
              Xử lý lỗi
            </a>
          </div>
        </div>

        <div className="terms-effective-card guide-effective-card">
          <div className="terms-effective-icon">
            <FileText size={28} />
          </div>
          <div>
            <span>Ngày cập nhật</span>
            <strong>{effectiveDate}</strong>
          </div>
          <p>
            Bản hướng dẫn này bám theo workflow Guest/User/Admin, khóa giá giao dịch 60 giây,
            yêu cầu KYC verified khi rút vàng vật chất và các trang pháp lý đã hoàn thiện.
          </p>
        </div>
      </section>

      <section className="terms-highlight-grid" aria-label="Điểm chính của hướng dẫn sử dụng">
        {highlights.map((item) => {
          const Icon = item.icon;
          return (
            <article className="terms-mini-card" key={item.title}>
              <Icon size={22} />
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          );
        })}
      </section>

      <section className="privacy-glossary-panel guide-glossary-panel">
        <div>
          <span>Tooltip thuật ngữ</span>
          <h2>Chạm hoặc rê chuột để đọc nhanh</h2>
        </div>
        <div className="privacy-glossary-list">
          {glossary.map((item) => (
            <TooltipTerm key={item.label} label={item.label} tip={item.tip} />
          ))}
        </div>
      </section>

      <div className="terms-mobile-jump">
        <label htmlFor="guide-section-jump">Chuyển nhanh tới mục</label>
        <select
          id="guide-section-jump"
          value={activeSection}
          onChange={(event) => scrollToSection(event.target.value)}
        >
          {tocItems.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label} - {item.title}
            </option>
          ))}
        </select>
      </div>

      <div className="terms-layout">
        <aside className="terms-sidebar" aria-label="Mục lục hướng dẫn sử dụng">
          <div className="terms-sidebar-title">Mục lục</div>
          <div className="terms-sidebar-meta">
            <span>{Math.round(readingProgress)}%</span>
            <small>tiến độ đọc</small>
          </div>
          <nav>
            {tocItems.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className={activeSection === section.id ? 'active' : ''}
                aria-current={activeSection === section.id ? 'true' : undefined}
                onClick={() => setActiveSection(section.id)}
              >
                <span>{section.label}</span>
                {section.title}
              </a>
            ))}
          </nav>
        </aside>

        <main className="terms-content">
          <div className="terms-reader-position" aria-live="polite">
            <span>Đang đọc</span>
            <strong>{activeItem.label} · {activeItem.title}</strong>
          </div>

          <section className="terms-panel" id="quick-start">
            <div className="terms-section-heading">
              <MapPin size={22} />
              <div>
                <span>Bắt đầu đúng vị trí</span>
                <h2>Lộ trình sử dụng theo từng nhóm người dùng</h2>
              </div>
            </div>
            <div className="guide-flow-grid">
              {quickPaths.map((item, index) => {
                const Icon = item.icon;
                return (
                  <article className="guide-flow-card" key={item.audience}>
                    <div className="guide-flow-card-head">
                      <div className="guide-flow-index">{String(index + 1).padStart(2, '0')}</div>
                      <Icon size={20} />
                    </div>
                    <h3>{item.audience}</h3>
                    <ul>
                      {item.actions.map((action) => (
                        <li key={action}>{action}</li>
                      ))}
                    </ul>
                  </article>
                );
              })}
            </div>
          </section>

          <section className="terms-panel" id="role-map">
            <div className="terms-section-heading">
              <ShieldCheck size={22} />
              <div>
                <span>Phân quyền workflow</span>
                <h2>Vai trò nào được dùng chức năng nào</h2>
              </div>
            </div>
            <div className="guide-role-table-wrap">
              <table className="guide-role-table">
                <thead>
                  <tr>
                    <th>Vai trò</th>
                    <th>Được dùng</th>
                    <th>Giới hạn</th>
                    <th>Bước tiếp theo</th>
                  </tr>
                </thead>
                <tbody>
                  {roleRows.map((row) => (
                    <tr key={row.role}>
                      <td><strong>{row.role}</strong></td>
                      <td>{row.allowed}</td>
                      <td>{row.limited}</td>
                      <td>{row.next}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="terms-panel" id="feature-map">
            <div className="terms-section-heading">
              <Database size={22} />
              <div>
                <span>Bản đồ chức năng</span>
                <h2>Toàn bộ tính năng đang có trên GoldChain</h2>
              </div>
            </div>
            <div className="guide-feature-grid">
              {featureGroups.map((group) => {
                const Icon = group.icon;
                return (
                  <article className="guide-feature-card" key={group.title}>
                    <div>
                      <Icon size={20} />
                      <h3>{group.title}</h3>
                    </div>
                    <ul>
                      {group.items.map((item) => (
                        <li key={item}>
                          <CheckCircle2 size={14} />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </article>
                );
              })}
            </div>
          </section>

          <section className="terms-panel" id="legal-bases">
            <div className="terms-section-heading">
              <Landmark size={22} />
              <div>
                <span>Cơ sở tham chiếu</span>
                <h2>Khung pháp lý cần nhớ khi sử dụng</h2>
              </div>
            </div>
            <div className="terms-law-grid">
              {legalBases.map((item) => (
                <article className="terms-law-item" key={item.title}>
                  <span>{item.tag}</span>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="terms-warning">
            <AlertCircle size={20} />
            <div>
              <strong>Lưu ý cho bản demo và vận hành thật</strong>
              <p>
                Một số phần hiện là mô phỏng phục vụ demo hoặc còn nằm trong task mở, như engine tự chạy DCA,
                hạch toán FIFO đầy đủ và một số đối soát thương mại. Khi vận hành thật cần rà soát giấy phép,
                đối tác thanh toán, đối tác vàng, quy trình thuế/hóa đơn và hồ sơ pháp lý trước khi công bố.
              </p>
            </div>
          </section>

          {guideSections.map((section, index) => {
            const Icon = section.icon;
            return (
              <section className="terms-section guide-section" id={section.id} key={section.id}>
                <div className="terms-section-number">{String(index + 4).padStart(2, '0')}</div>
                <div>
                  <div className="guide-section-title">
                    <Icon size={20} />
                    <h2>{section.title}</h2>
                  </div>
                  <ul>
                    {section.items.map((item, itemIndex) => (
                      <li key={`${section.id}-${itemIndex}`}>{item}</li>
                    ))}
                  </ul>
                </div>
              </section>
            );
          })}

          <section className="terms-panel">
            <div className="terms-section-heading">
              <Scale size={22} />
              <div>
                <span>Nguồn tham khảo</span>
                <h2>Văn bản, cổng thông tin và trang liên quan đã đối chiếu</h2>
              </div>
            </div>
            <div className="terms-source-list">
              {sources.map((source) => (
                source.href.startsWith('/') ? (
                  <Link key={source.href} to={source.href}>
                    {source.label}
                  </Link>
                ) : (
                  <a key={source.href} href={source.href} target="_blank" rel="noreferrer">
                    {source.label}
                  </a>
                )
              ))}
            </div>
          </section>

          <section className="privacy-contact-strip guide-support-strip">
            <div>
              <Mail size={20} />
              <strong>Cần hỗ trợ thêm?</strong>
              <span>Gửi mã giao dịch, ảnh chụp màn hình và mô tả vấn đề để bộ phận hỗ trợ đối soát nhanh hơn.</span>
            </div>
            <a className="btn btn-gold" href="mailto:cs@goldchain.vn">
              <Mail size={16} />
              cs@goldchain.vn
            </a>
          </section>
        </main>
      </div>

      <button
        type="button"
        className={`terms-back-top ${showBackTop ? 'visible' : ''}`}
        onClick={scrollToTop}
        aria-label="Trở về đầu trang"
      >
        <ArrowUp size={17} />
        <span>Đầu trang</span>
      </button>
    </div>
  );
}
