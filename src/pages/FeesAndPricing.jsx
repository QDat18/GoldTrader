import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  ArrowUp,
  CandlestickChart,
  Clock,
  Database,
  FileText,
  Info,
  Landmark,
  Mail,
  QrCode,
  RefreshCw,
  Scale,
  ShieldCheck,
  Wallet,
} from 'lucide-react';

const effectiveDate = '11/07/2026';

const formatVnd = (value) => new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
}).format(Number.isFinite(value) ? value : 0);

const formatNumber = (value, digits = 4) => (
  Number.isFinite(value) ? value.toLocaleString('vi-VN', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }) : '0'
);

const TooltipTerm = ({ label, tip }) => (
  <span className="privacy-term" tabIndex="0" aria-label={`${label}: ${tip}`}>
    {label}
    <Info size={13} />
    <span className="privacy-tooltip">{tip}</span>
  </span>
);

const highlights = [
  {
    icon: Scale,
    title: 'Khác với bảng giá vàng',
    text: 'Trang này công bố phí dịch vụ, công thức tính và điều kiện miễn/thu phí; bảng giá vàng realtime vẫn nằm ở trang Giá vàng.',
  },
  {
    icon: Wallet,
    title: 'Tách giá, spread và phí',
    text: 'Giá mua/bán vàng thay đổi theo thị trường. Phí nền tảng, phí rút vật chất, phí lưu ký và phí ngân hàng được công bố riêng để khách dễ đối soát.',
  },
  {
    icon: ShieldCheck,
    title: 'Minh bạch trước khi xác nhận',
    text: 'Mọi khoản phí, điều kiện miễn phí, phí bên thứ ba và thuế nếu có phải hiển thị trước khi khách xác nhận lệnh hoặc yêu cầu dịch vụ.',
  },
  {
    icon: FileText,
    title: 'Có căn cứ chứng từ',
    text: 'Phí phát sinh cần đi kèm mã giao dịch, hóa đơn/chứng từ, lịch sử ví và kênh khiếu nại để bảo vệ quyền lợi khách hàng.',
  },
];

const glossary = [
  {
    label: 'Bảng giá vàng',
    tip: 'Dữ liệu mua vào/bán ra của từng mã vàng, cập nhật theo thị trường và dùng làm tham chiếu đặt lệnh.',
  },
  {
    label: 'Biểu phí',
    tip: 'Danh sách phí dịch vụ, điều kiện miễn phí, công thức tính, phí bên thứ ba và ngày hiệu lực.',
  },
  {
    label: 'Spread',
    tip: 'Chênh lệch giữa giá hệ thống bán ra cho khách và giá hệ thống mua vào từ khách tại cùng thời điểm.',
  },
  {
    label: 'Phí nền tảng',
    tip: 'Khoản GoldChain thu cho việc xử lý giao dịch, vận hành hệ thống, đối soát, chứng từ hoặc dịch vụ gia tăng nếu được công bố.',
  },
  {
    label: 'Phí bên thứ ba',
    tip: 'Khoản do ngân hàng, cổng thanh toán, đơn vị vận chuyển, kiểm định, bảo hiểm hoặc đối tác thu theo chính sách riêng.',
  },
  {
    label: 'Phí lưu ký',
    tip: 'Khoản phí giữ hộ, bảo quản, kiểm kê và quản trị vàng vật chất trong kho khi dịch vụ lưu ký được kích hoạt.',
  },
  {
    label: 'VAT',
    tip: 'Thuế giá trị gia tăng nếu pháp luật yêu cầu áp dụng cho một loại hàng hóa hoặc dịch vụ cụ thể.',
  },
  {
    label: 'Hạn mức',
    tip: 'Giới hạn tối thiểu/tối đa theo giao dịch, ngày, tháng hoặc trạng thái KYC nhằm quản trị rủi ro.',
  },
  {
    label: 'T+0/T+1',
    tip: 'Mốc xử lý trong ngày hoặc ngày làm việc kế tiếp, phụ thuộc ngân hàng, đối tác và trạng thái đối soát.',
  },
  {
    label: 'Miễn phí demo',
    tip: 'Trạng thái chưa thu phí trong bản demo sản phẩm; khi vận hành thương mại phải công bố biểu phí và ngày hiệu lực trước.',
  },
];

const legalBases = [
  {
    title: 'Luật Giá 2023 và quy định liên quan',
    tag: 'Niêm yết giá',
    text: 'Định hướng nguyên tắc công khai, minh bạch giá, phí, phụ thu và điều kiện áp dụng trước khi khách hàng quyết định giao dịch.',
  },
  {
    title: 'Luật Bảo vệ quyền lợi người tiêu dùng 2023',
    tag: 'Minh bạch chi phí',
    text: 'Yêu cầu cung cấp đầy đủ thông tin về giá, phí, điều kiện giao dịch chung, hoàn tiền, khiếu nại và trách nhiệm của tổ chức kinh doanh.',
  },
  {
    title: 'Luật Giao dịch điện tử 2023',
    tag: 'Xác nhận điện tử',
    text: 'Làm cơ sở cho thao tác xác nhận phí, thông báo điện tử, hợp đồng/chứng từ điện tử và nhật ký giao dịch khi khách dùng kênh online.',
  },
  {
    title: 'Nghị định 24/2012/NĐ-CP về quản lý hoạt động kinh doanh vàng',
    tag: 'Kinh doanh vàng',
    text: 'Hoạt động giao nhận, mua bán, lưu ký hoặc dịch vụ liên quan vàng vật chất cần bám phạm vi được phép và điều kiện đối tác thực tế.',
  },
  {
    title: 'Pháp luật thuế, kế toán, hóa đơn',
    tag: 'Hóa đơn',
    text: 'Phí dịch vụ, hoàn tiền, bù trừ, hóa đơn điện tử, chứng từ kế toán và nghĩa vụ thuế phải được ghi nhận đủ để đối soát.',
  },
  {
    title: 'Luật Phòng, chống rửa tiền 2022',
    tag: 'Hạn mức/KYC',
    text: 'Hạn mức giao dịch, kiểm tra chính chủ, nguồn tiền và tạm dừng xử lý có thể áp dụng khi có dấu hiệu bất thường.',
  },
];

const feeRows = [
  {
    group: 'Ví VND',
    service: 'Nạp tiền vào ví',
    current: '0đ phí nền tảng trong bản demo',
    commercial: 'Có thể miễn phí hoặc thu theo cổng thanh toán/ngân hàng; phải hiển thị trước khi xác nhận.',
    formula: 'Số tiền ghi có = Số tiền nạp - phí bên thứ ba nếu có',
    note: 'Tiền cần đến từ tài khoản chính chủ; giao dịch sai nguồn có thể bị treo đối soát hoặc hoàn trả.',
  },
  {
    group: 'Ví VND',
    service: 'Rút tiền về ngân hàng',
    current: 'Chưa mở chính thức trong UI hiện tại',
    commercial: 'Dự kiến công bố theo hạn mức, ngân hàng nhận và thời gian xử lý T+0/T+1.',
    formula: 'Số tiền nhận = Số tiền rút - phí chuyển khoản - phí xử lý nếu có',
    note: 'Chỉ chuyển về tài khoản chính chủ đã KYC hoặc hồ sơ ủy quyền hợp lệ.',
  },
  {
    group: 'Giao dịch vàng',
    service: 'Mua vàng online',
    current: '0đ phí nền tảng; khách trả theo giá bán ra đang khóa',
    commercial: 'Có thể thu phí xử lý lệnh hoặc phí chứng từ nếu được công bố.',
    formula: 'Tổng thanh toán = Số chỉ x Giá bán ra + Phí nền tảng + Thuế/phí khác nếu có',
    note: 'Spread đã nằm trong chênh lệch mua vào/bán ra, không phải một dòng phí tách riêng.',
  },
  {
    group: 'Giao dịch vàng',
    service: 'Bán vàng online',
    current: '0đ phí nền tảng; khách nhận theo giá mua vào',
    commercial: 'Có thể thu phí xử lý, thuế hoặc phí tất toán nếu luật/đối tác yêu cầu.',
    formula: 'Tiền nhận về ví = Số chỉ x Giá mua vào - Phí nền tảng - Thuế/phí khác nếu có',
    note: 'Khi FIFO hoàn thiện, lãi/lỗ và giá vốn cần tính theo lô vàng thực tế.',
  },
  {
    group: 'O2O',
    service: 'Rút vàng vật chất tại quầy',
    current: '0đ phí dịch vụ rút trong UI demo',
    commercial: 'Có thể áp dụng phí đóng gói, kiểm định, bảo hiểm, giao nhận hoặc phí quá hạn nhận.',
    formula: 'Phí rút = Phí dịch vụ + Phí đóng gói/kiểm định + Phí giao nhận nếu có',
    note: 'Bắt buộc KYC verified, QR động hợp lệ, CCCD trùng hồ sơ và tồn kho đủ quy cách.',
  },
  {
    group: 'Lưu ký',
    service: 'Gửi giữ hộ vàng',
    current: 'Chưa tự động thu trong bản demo',
    commercial: 'Có thể tính theo % trị giá lưu ký/tháng, mức tối thiểu hoặc gói miễn phí theo khối lượng.',
    formula: 'Phí lưu ký tháng = Trị giá vàng lưu ký x Tỷ lệ tháng, tối thiểu theo biểu phí nếu có',
    note: 'Cần hợp đồng lưu ký, kỳ tính phí, phương thức trừ phí và thông báo trước ngày thu.',
  },
  {
    group: 'DCA',
    service: 'Tạo, tạm dừng, hủy kế hoạch DCA',
    current: '0đ trong bản demo',
    commercial: 'Có thể miễn phí; mỗi lần chạy DCA áp dụng như một lệnh mua vàng online.',
    formula: 'Chi phí mỗi kỳ = Số tiền DCA + phí mua nếu có',
    note: 'Số tiền tối thiểu hiện theo schema là 100.000đ/kỳ; engine chạy tự động vẫn là task mở.',
  },
  {
    group: 'Chứng từ',
    service: 'Hợp đồng, hóa đơn, hash chứng từ',
    current: '0đ cấp tự động qua email/demo',
    commercial: 'Cấp bản điện tử nên miễn phí; bản sao đặc biệt/bản giấy có thể thu theo chi phí thực tế.',
    formula: 'Phí chứng từ = 0đ bản điện tử; bản giấy theo biểu phí nếu công bố',
    note: 'Chứng từ phải đi kèm mã giao dịch, thời gian, trạng thái và dữ liệu đối soát.',
  },
  {
    group: 'Hỗ trợ',
    service: 'Khiếu nại, tra soát giao dịch',
    current: '0đ tiếp nhận và xử lý khiếu nại',
    commercial: 'Không thu phí khiếu nại hợp lệ; phí phát sinh bên thứ ba phải thông báo trước.',
    formula: 'Phí hỗ trợ = 0đ, trừ chi phí đặc biệt đã được khách đồng ý',
    note: 'Khách cần cung cấp mã giao dịch, chứng từ chuyển tiền, ảnh màn hình và mô tả sự việc.',
  },
];

const limitRows = [
  {
    item: 'Giá trị tích lũy DCA tối thiểu',
    value: '100.000đ/kỳ',
    basis: 'Đang khớp schema `dca_plans.amount_vnd_per_cycle`.',
  },
  {
    item: 'Khóa giá giao dịch vàng',
    value: '60 giây',
    basis: 'Bám workflow và UI Trade hiện tại; hết thời gian cần làm mới giá/tồn kho.',
  },
  {
    item: 'Nạp ví VND demo',
    value: 'Từ 1.000.000đ theo nút gợi ý; ô nhập cho phép số khác > 0',
    basis: 'Navbar deposit modal hiện tại.',
  },
  {
    item: 'Rút vàng vật chất',
    value: 'Yêu cầu KYC verified và có đủ số dư vàng',
    basis: 'Bám workflow QR động O2O và kiểm soát chính chủ.',
  },
  {
    item: 'Phí dịch vụ rút trong UI hiện tại',
    value: '0đ',
    basis: 'Trade.jsx đang hiển thị miễn phí rút; trang phí công bố rõ đây là trạng thái hiện tại/demo.',
  },
  {
    item: 'Hạn mức thương mại',
    value: 'Công bố theo giấy phép, đối tác thanh toán và KYC',
    basis: 'Không hardcode khi chưa có quyết định vận hành thật.',
  },
];

const examples = [
  {
    title: 'Mua vàng online',
    rows: [
      ['Số tiền khách muốn mua', '10.000.000đ'],
      ['Giá bán ra giả định', '9.500.000đ/chỉ'],
      ['Phí nền tảng hiện tại', '0đ'],
      ['Số vàng nhận', '10.000.000 / 9.500.000 = 1,0526 chỉ'],
      ['Tổng thanh toán', '10.000.000đ'],
    ],
  },
  {
    title: 'Bán vàng online',
    rows: [
      ['Số vàng bán', '2 chỉ'],
      ['Giá mua vào giả định', '9.420.000đ/chỉ'],
      ['Phí nền tảng hiện tại', '0đ'],
      ['Tiền nhận về ví', '2 x 9.420.000 = 18.840.000đ'],
      ['Lưu ý', 'Lãi/lỗ cần tính theo FIFO khi hoàn thiện Task 26'],
    ],
  },
  {
    title: 'Rút vàng vật chất',
    rows: [
      ['Số vàng rút', '10 chỉ (1 lượng)'],
      ['Phí dịch vụ rút hiện tại', '0đ'],
      ['Điều kiện bắt buộc', 'KYC verified + QR động + CCCD trùng hồ sơ'],
      ['Phí có thể phát sinh', 'Đóng gói, kiểm định, bảo hiểm, giao nhận nếu công bố'],
      ['Tổng phí demo', '0đ'],
    ],
  },
  {
    title: 'Tích lũy DCA',
    rows: [
      ['Số tiền mỗi kỳ', '1.000.000đ'],
      ['Số kỳ', '12 tháng'],
      ['Phí tạo/tạm dừng/hủy', '0đ'],
      ['Tổng tiền dự kiến', '12.000.000đ'],
      ['Lưu ý', 'Mỗi kỳ chạy cần kiểm tra ví VND, giá khóa và trạng thái KYC'],
    ],
  },
];

const policySections = [
  {
    id: 'principles',
    icon: Scale,
    title: 'Nguyên tắc công bố phí',
    items: [
      <>Phí phải được hiển thị bằng VNĐ, có ngày hiệu lực, phạm vi áp dụng, điều kiện miễn/thu và công thức tính trước khi khách xác nhận giao dịch.</>,
      <>GoldChain cần tách rõ <TooltipTerm label="bảng giá vàng" tip="Giá thị trường mua vào/bán ra biến động theo thời gian." /> và <TooltipTerm label="biểu phí" tip="Phí dịch vụ, phí bên thứ ba và điều kiện áp dụng." /> để tránh khách nhầm phí với giá vàng.</>,
      <>Mọi thay đổi làm tăng phí, thêm phí hoặc thay đổi cách tính bất lợi cho khách phải được công bố trước bằng banner, email, thông báo trong app hoặc trang pháp lý.</>,
      <>Phí đã thu cần có lịch sử giao dịch, mã tham chiếu, chứng từ/hóa đơn nếu thuộc diện xuất hóa đơn và kênh khiếu nại.</>,
      <>Trường hợp hệ thống đang demo hoặc mô phỏng, trang phí phải ghi rõ trạng thái miễn phí/chưa thu để không tạo hiểu nhầm về vận hành thương mại.</>,
    ],
  },
  {
    id: 'price-vs-fee',
    icon: CandlestickChart,
    title: 'Phân biệt Bảng giá vàng và Phí & biểu giá',
    items: [
      <>Trang <strong>Giá vàng</strong> dùng để xem giá mua vào/bán ra theo từng mã vàng, lịch sử snapshot, xu hướng và biểu đồ nến.</>,
      <>Trang <strong>Phí & biểu giá</strong> dùng để xem các khoản phí nền tảng, phí ví, phí rút vàng vật chất, phí lưu ký, phí DCA, phí chứng từ, phí bên thứ ba và ví dụ tính phí.</>,
      <>Giá vàng có thể thay đổi liên tục theo thị trường; biểu phí thường ổn định theo kỳ hiệu lực và chỉ thay đổi sau khi công bố.</>,
      <>Khi khách đặt lệnh mua, tổng thanh toán chịu tác động của giá bán ra, phí nền tảng nếu có, thuế/phí khác nếu có. Khi khách bán, tiền nhận chịu tác động của giá mua vào và phí nếu có.</>,
      <>Spread mua/bán không phải là một dòng phí thu thêm sau giao dịch; đó là chênh lệch nằm trong giá niêm yết hai chiều.</>,
    ],
  },
  {
    id: 'wallet-fees',
    icon: Wallet,
    title: 'Phí ví VND và thanh toán',
    items: [
      <>Nạp ví trong bản demo đang miễn phí nền tảng và cộng ngay vào ví. Khi vận hành thật, tiền cần được đối soát với ngân hàng/cổng thanh toán trước khi ghi có hoàn tất.</>,
      <>Phí ngân hàng, phí chuyển khoản nhanh, phí hoàn tiền hoặc phí cổng thanh toán nếu có là phí bên thứ ba và phải hiển thị trước khi khách xác nhận.</>,
      <>Giao dịch nạp từ tài khoản không chính chủ, sai nội dung, chuyển thiếu/thừa hoặc có dấu hiệu bất thường có thể bị tạm treo để xác minh nguồn tiền.</>,
      <>Rút tiền về ngân hàng chưa là luồng chính thức trong UI hiện tại; khi mở, GoldChain cần công bố hạn mức, thời gian xử lý, phí chuyển khoản, tài khoản nhận chính chủ và điều kiện từ chối.</>,
      <>Ví VND không phải tiền gửi sinh lãi. Số dư ví chỉ dùng trong phạm vi thanh toán/đối soát dịch vụ GoldChain theo điều khoản công bố.</>,
    ],
  },
  {
    id: 'trade-fees',
    icon: RefreshCw,
    title: 'Phí mua bán vàng online',
    items: [
      <>Lệnh mua đang tính theo giá bán ra và phí nền tảng 0đ trong demo. Lệnh bán đang tính theo giá mua vào và phí nền tảng 0đ trong demo.</>,
      <>Nếu sau này thu phí xử lý lệnh, phí phải được đưa vào màn hình xác nhận cùng loại vàng, số lượng, đơn giá, tổng tiền, thời gian khóa giá và trạng thái KYC.</>,
      <>Phí không được làm thay đổi giá đã khóa sau khi khách xác nhận hợp lệ, trừ trường hợp lỗi hệ thống rõ ràng, gian lận, yêu cầu pháp lý hoặc thỏa thuận hoàn/hủy.</>,
      <>Thuế, hóa đơn, phí tất toán hoặc phí chứng từ nếu pháp luật/đối tác yêu cầu cần được công bố theo từng loại giao dịch.</>,
      <>Khi FIFO hoàn thiện, hệ thống cần thể hiện giá vốn, lãi/lỗ thực tế và phần phí phân bổ vào từng lô vàng nếu có.</>,
    ],
  },
  {
    id: 'withdraw-fees',
    icon: QrCode,
    title: 'Phí rút vàng vật chất O2O',
    items: [
      <>UI giao dịch hiện hiển thị phí dịch vụ rút là 0đ. Trang này giữ đúng trạng thái hiện tại để khách biết rút vàng trong demo không bị cộng phí dịch vụ.</>,
      <>Khi vận hành thương mại, phí có thể phát sinh từ đóng gói, kiểm định, bảo hiểm, giao nhận, đổi chi nhánh, giữ quá hạn hoặc xử lý yêu cầu đặc biệt.</>,
      <>Mọi phí phát sinh tại quầy phải được nhân viên thông báo, đối chiếu với biểu phí đang hiệu lực và ghi nhận trên chứng từ/bàn giao.</>,
      <>Rút vàng yêu cầu KYC verified, QR động hợp lệ, CCCD/VNeID trùng hồ sơ, đơn chưa hoàn tất/hủy và tồn kho đủ quy cách.</>,
      <>Nếu không đủ tồn kho hoặc khách không đáp ứng điều kiện nhận vàng, hệ thống cần cho biết phương án chờ nhận, đổi quy cách, hủy/hoàn hoặc xử lý theo thỏa thuận.</>,
    ],
  },
  {
    id: 'custody',
    icon: ShieldCheck,
    title: 'Phí lưu ký, gửi giữ hộ và bảo quản',
    items: [
      <>Dịch vụ lưu ký/gửi giữ hộ cần hợp đồng hoặc điều khoản riêng, ghi rõ loại vàng, khối lượng, thời hạn, tỷ lệ phí, kỳ thu, cách thanh toán và quyền chấm dứt.</>,
      <>Trong bản demo, phí lưu ký chưa được tự động trừ. Cơ sở dữ liệu đã có bảng <code>storage_contracts</code> với trường <code>monthly_fee_rate</code> để phục vụ triển khai sau.</>,
      <>Khi kích hoạt, phí lưu ký có thể tính theo phần trăm trị giá vàng/tháng, mức tối thiểu, hoặc gói miễn phí cho khối lượng nhỏ trong thời gian khuyến mại.</>,
      <>Nếu khách rút toàn bộ vàng, phí lưu ký cần được chốt đến ngày kết thúc hợp đồng hoặc theo kỳ tính phí đã công bố.</>,
      <>GoldChain cần công khai cách kiểm kê kho, bảo hiểm, đối soát serial, trách nhiệm mất mát/hư hỏng và phạm vi bồi thường nếu có.</>,
    ],
  },
  {
    id: 'dca-fees',
    icon: Clock,
    title: 'Phí DCA và kế hoạch định kỳ',
    items: [
      <>Tạo, tạm dừng, kích hoạt lại hoặc hủy kế hoạch DCA đang miễn phí trong bản demo.</>,
      <>Mỗi lần DCA chạy thành công về bản chất là một lệnh mua vàng online, nên áp dụng giá bán ra, phí mua nếu có, hạn mức và điều kiện KYC tại thời điểm chạy.</>,
      <>Nếu ví VND không đủ, tài khoản bị hạn chế, giá không tải được hoặc KYC chưa đạt, kỳ DCA có thể bị bỏ qua, thất bại hoặc chờ retry tùy cấu hình.</>,
      <>Task DCA Execution Engine vẫn đang mở, nên trang phí ghi rõ DCA hiện là phần quản lý kế hoạch/demo, chưa phải cam kết tự động thu tiền thật.</>,
      <>Khi engine hoàn thiện, mỗi kỳ chạy cần tạo thông báo, lịch sử, chứng từ và tổng hợp phí rõ ràng cho khách.</>,
    ],
  },
  {
    id: 'refunds',
    icon: RefreshCw,
    title: 'Hoàn phí, điều chỉnh và khiếu nại',
    items: [
      <>Phí thu sai do lỗi hệ thống, thu trùng, lệnh thất bại, giá/fee hiển thị sai hoặc giao dịch bị hủy hợp lệ cần được hoàn hoặc điều chỉnh sau khi đối soát.</>,
      <>Phí bên thứ ba có thể không hoàn nếu ngân hàng/cổng thanh toán/đơn vị vận chuyển đã thực hiện dịch vụ, trừ khi chính sách của bên đó cho phép hoàn.</>,
      <>Khách cần gửi mã giao dịch, ảnh màn hình, chứng từ thanh toán và mô tả sự việc qua kênh hỗ trợ để tra soát.</>,
      <>GoldChain cần xác nhận tiếp nhận khiếu nại trong thời gian hợp lý, ưu tiên trường hợp liên quan mất tài khoản, trừ phí sai hoặc rút vàng không chính chủ.</>,
      <>Kết quả hoàn phí cần được ghi nhận trong lịch sử ví, thông báo cho khách và lưu chứng từ kế toán nếu cần.</>,
    ],
  },
  {
    id: 'changes',
    icon: FileText,
    title: 'Cập nhật biểu phí và hiệu lực',
    items: [
      <>Biểu phí có hiệu lực từ ngày ghi trên trang này hoặc thông báo mới nhất của GoldChain.</>,
      <>GoldChain có thể cập nhật biểu phí khi thay đổi pháp luật, giấy phép, đối tác thanh toán, đối tác vàng, thuế, chi phí kho vận hoặc mô hình sản phẩm.</>,
      <>Thay đổi bất lợi cho khách nên có thời gian thông báo trước, trừ trường hợp pháp luật, đối tác hoặc rủi ro bảo mật yêu cầu áp dụng ngay.</>,
      <>Nếu khách tiếp tục sử dụng dịch vụ sau ngày hiệu lực, khách được xem là đã biết biểu phí mới trong phạm vi pháp luật cho phép.</>,
      <>Bản thương mại chính thức cần được pháp chế/luật sư và kế toán thuế rà soát trước khi công bố để bảo đảm đúng giấy phép và mô hình vận hành thực tế.</>,
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
    label: 'Cổng thông tin điện tử Bộ Công Thương',
    href: 'https://moit.gov.vn/',
  },
  {
    label: 'Điều khoản giao dịch GoldChain',
    href: '/terms',
  },
  {
    label: 'Chính sách bảo mật GoldChain',
    href: '/privacy',
  },
  {
    label: 'Bảng giá vàng realtime',
    href: '/prices',
  },
];

function FeeCalculator() {
  const [mode, setMode] = useState('buy');
  const [amount, setAmount] = useState('10000000');
  const [price, setPrice] = useState('9500000');
  const [quantity, setQuantity] = useState('2');
  const [cycles, setCycles] = useState('12');

  const result = useMemo(() => {
    const amountValue = Number(amount) || 0;
    const priceValue = Number(price) || 0;
    const quantityValue = Number(quantity) || 0;
    const cycleValue = Number(cycles) || 0;

    if (mode === 'buy') {
      const goldQty = priceValue > 0 ? amountValue / priceValue : 0;
      return {
        title: 'Ước tính lệnh mua',
        lines: [
          ['Số tiền mua', formatVnd(amountValue)],
          ['Giá bán ra giả định', `${formatVnd(priceValue)} / chỉ`],
          ['Phí nền tảng hiện tại', formatVnd(0)],
          ['Số vàng nhận dự kiến', `${formatNumber(goldQty)} chỉ`],
          ['Tổng thanh toán', formatVnd(amountValue)],
        ],
      };
    }

    if (mode === 'sell') {
      const gross = quantityValue * priceValue;
      return {
        title: 'Ước tính lệnh bán',
        lines: [
          ['Số vàng bán', `${formatNumber(quantityValue)} chỉ`],
          ['Giá mua vào giả định', `${formatVnd(priceValue)} / chỉ`],
          ['Phí nền tảng hiện tại', formatVnd(0)],
          ['Tiền nhận về ví', formatVnd(gross)],
          ['Ghi chú', 'Chưa bao gồm FIFO/thuế nếu phát sinh'],
        ],
      };
    }

    if (mode === 'withdraw') {
      return {
        title: 'Ước tính rút vàng vật chất',
        lines: [
          ['Số vàng rút', `${formatNumber(quantityValue)} chỉ`],
          ['Quy đổi gram', `${formatNumber(quantityValue * 3.75)}g`],
          ['Phí dịch vụ rút hiện tại', formatVnd(0)],
          ['Điều kiện', 'KYC verified + QR động + CCCD trùng hồ sơ'],
          ['Tổng phí demo', formatVnd(0)],
        ],
      };
    }

    const totalDca = amountValue * cycleValue;
    return {
      title: 'Ước tính kế hoạch DCA',
      lines: [
        ['Số tiền mỗi kỳ', formatVnd(amountValue)],
        ['Số kỳ', `${cycleValue} kỳ`],
        ['Phí tạo/tạm dừng/hủy', formatVnd(0)],
        ['Tổng tiền dự kiến', formatVnd(totalDca)],
        ['Ghi chú', 'Mỗi kỳ chạy áp dụng như lệnh mua khi engine hoàn thiện'],
      ],
    };
  }, [mode, amount, price, quantity, cycles]);

  return (
    <div className="fees-calculator">
      <div className="fees-segmented" role="tablist" aria-label="Chọn loại ước tính phí">
        {[
          ['buy', 'Mua'],
          ['sell', 'Bán'],
          ['withdraw', 'Rút vàng'],
          ['dca', 'DCA'],
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            className={mode === key ? 'active' : ''}
            onClick={() => setMode(key)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="fees-form-grid">
        {(mode === 'buy' || mode === 'dca') && (
          <label>
            <span>{mode === 'dca' ? 'Số tiền mỗi kỳ' : 'Số tiền mua'}</span>
            <input
              className="fees-input"
              type="number"
              min="0"
              step="100000"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
            />
          </label>
        )}

        {(mode === 'buy' || mode === 'sell') && (
          <label>
            <span>{mode === 'buy' ? 'Giá bán ra giả định / chỉ' : 'Giá mua vào giả định / chỉ'}</span>
            <input
              className="fees-input"
              type="number"
              min="0"
              step="10000"
              value={price}
              onChange={(event) => setPrice(event.target.value)}
            />
          </label>
        )}

        {(mode === 'sell' || mode === 'withdraw') && (
          <label>
            <span>Số lượng vàng (chỉ)</span>
            <input
              className="fees-input"
              type="number"
              min="0"
              step="0.1"
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
            />
          </label>
        )}

        {mode === 'dca' && (
          <label>
            <span>Số kỳ dự kiến</span>
            <input
              className="fees-input"
              type="number"
              min="1"
              step="1"
              value={cycles}
              onChange={(event) => setCycles(event.target.value)}
            />
          </label>
        )}
      </div>

      <div className="fees-result-card">
        <h3>{result.title}</h3>
        {result.lines.map(([label, value]) => (
          <div key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function FeesAndPricing() {
  const tocItems = useMemo(() => ([
    { id: 'overview', title: 'Tổng quan biểu phí', label: '00' },
    { id: 'fee-table', title: 'Bảng phí chi tiết', label: '01' },
    { id: 'calculator', title: 'Ước tính phí', label: '02' },
    { id: 'examples', title: 'Ví dụ tính phí', label: '03' },
    { id: 'limits', title: 'Hạn mức và điều kiện', label: '04' },
    { id: 'legal-bases', title: 'Cơ sở pháp lý', label: '05' },
    ...policySections.map((section, index) => ({
      id: section.id,
      title: section.title,
      label: String(index + 6).padStart(2, '0'),
    })),
  ]), []);

  const [activeSection, setActiveSection] = useState('overview');
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
    <div className="terms-page fees-page">
      <div className="terms-reading-progress" aria-hidden="true">
        <span style={{ width: `${readingProgress}%` }} />
      </div>

      <section className="terms-hero fees-hero">
        <div className="terms-hero-copy">
          <div className="tag">PHÍ & BIỂU GIÁ</div>
          <h1>Phí và biểu giá GoldChain</h1>
          <p>
            Trang công bố phí dịch vụ, công thức tính, hạn mức, ví dụ đối soát và điều kiện áp dụng cho ví VND,
            mua bán vàng online, rút vàng vật chất O2O, lưu ký, DCA, chứng từ và hỗ trợ khách hàng.
          </p>
          <div className="terms-hero-actions">
            <a href="#fee-table" className="btn btn-gold">
              <FileText size={16} />
              Xem bảng phí
            </a>
            <a href="#calculator" className="btn btn-outline">
              <Wallet size={16} />
              Ước tính phí
            </a>
            <Link to="/prices" className="btn btn-outline">
              <CandlestickChart size={16} />
              Bảng giá vàng
            </Link>
          </div>
        </div>

        <div className="terms-effective-card fees-effective-card">
          <div className="terms-effective-icon">
            <Scale size={28} />
          </div>
          <div>
            <span>Ngày hiệu lực</span>
            <strong>{effectiveDate}</strong>
          </div>
          <p>
            Bản hiện tại phản ánh trạng thái demo: nhiều phí nền tảng đang 0đ. Mọi khoản phí thương mại
            phải được công bố trước khi thu và hiển thị lại ở màn hình xác nhận giao dịch.
          </p>
        </div>
      </section>

      <section className="terms-highlight-grid" aria-label="Điểm chính của phí và biểu giá">
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

      <section className="privacy-glossary-panel fees-glossary-panel">
        <div>
          <span>Tooltip thuật ngữ</span>
          <h2>Đọc nhanh các khái niệm phí</h2>
        </div>
        <div className="privacy-glossary-list">
          {glossary.map((item) => (
            <TooltipTerm key={item.label} label={item.label} tip={item.tip} />
          ))}
        </div>
      </section>

      <div className="terms-mobile-jump">
        <label htmlFor="fees-section-jump">Chuyển nhanh tới mục</label>
        <select
          id="fees-section-jump"
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
        <aside className="terms-sidebar" aria-label="Mục lục phí và biểu giá">
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

          <section className="terms-panel" id="overview">
            <div className="terms-section-heading">
              <Info size={22} />
              <div>
                <span>Tổng quan</span>
                <h2>Trang này dùng để đọc phí, không phải giá vàng realtime</h2>
              </div>
            </div>
            <div className="fees-overview-grid">
              <article>
                <CandlestickChart size={20} />
                <h3>Bảng giá vàng</h3>
                <p>Cho biết giá mua vào/bán ra, xu hướng và lịch sử giá. Giá biến động theo thị trường và dùng cho lệnh mua/bán.</p>
                <Link to="/prices">Mở trang Giá vàng</Link>
              </article>
              <article>
                <Scale size={20} />
                <h3>Phí & biểu giá</h3>
                <p>Cho biết phí dịch vụ, phí ví, phí rút vàng, lưu ký, DCA, chứng từ, hạn mức, công thức và ví dụ tính phí.</p>
                <a href="#fee-table">Xem bảng phí</a>
              </article>
            </div>
          </section>

          <section className="terms-panel" id="fee-table">
            <div className="terms-section-heading">
              <FileText size={22} />
              <div>
                <span>Bảng phí chi tiết</span>
                <h2>Phí hiện tại và khung thương mại cần công bố</h2>
              </div>
            </div>
            <div className="fees-table-wrap">
              <table className="fees-table">
                <thead>
                  <tr>
                    <th>Nhóm</th>
                    <th>Dịch vụ</th>
                    <th>Hiện tại/demo</th>
                    <th>Khi thương mại</th>
                    <th>Công thức</th>
                    <th>Lưu ý</th>
                  </tr>
                </thead>
                <tbody>
                  {feeRows.map((row) => (
                    <tr key={`${row.group}-${row.service}`}>
                      <td><span>{row.group}</span></td>
                      <td><strong>{row.service}</strong></td>
                      <td>{row.current}</td>
                      <td>{row.commercial}</td>
                      <td>{row.formula}</td>
                      <td>{row.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="terms-panel" id="calculator">
            <div className="terms-section-heading">
              <Wallet size={22} />
              <div>
                <span>Công cụ tiện ích</span>
                <h2>Ước tính nhanh theo biểu phí hiện tại</h2>
              </div>
            </div>
            <FeeCalculator />
          </section>

          <section className="terms-panel" id="examples">
            <div className="terms-section-heading">
              <Database size={22} />
              <div>
                <span>Ví dụ đối soát</span>
                <h2>Cách đọc tổng chi phí trong các luồng thường gặp</h2>
              </div>
            </div>
            <div className="fees-example-grid">
              {examples.map((example) => (
                <article className="fees-example-card" key={example.title}>
                  <h3>{example.title}</h3>
                  {example.rows.map(([label, value]) => (
                    <div key={label}>
                      <span>{label}</span>
                      <strong>{value}</strong>
                    </div>
                  ))}
                </article>
              ))}
            </div>
          </section>

          <section className="terms-panel" id="limits">
            <div className="terms-section-heading">
              <Clock size={22} />
              <div>
                <span>Hạn mức và điều kiện</span>
                <h2>Các mốc đang cần khách chú ý</h2>
              </div>
            </div>
            <div className="fees-limit-list">
              {limitRows.map((row) => (
                <article key={row.item}>
                  <div>
                    <span>{row.item}</span>
                    <strong>{row.value}</strong>
                  </div>
                  <p>{row.basis}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="terms-panel" id="legal-bases">
            <div className="terms-section-heading">
              <Landmark size={22} />
              <div>
                <span>Cơ sở tham chiếu</span>
                <h2>Khung pháp lý cho công bố phí</h2>
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
              <strong>Lưu ý triển khai</strong>
              <p>
                Trang này là khung biểu phí sản phẩm. Trước khi thu phí thật, cần rà soát giấy phép kinh doanh vàng,
                đối tác thanh toán, đối tác giao nhận, hóa đơn/thuế, quy trình hoàn phí và điều khoản với pháp chế/kế toán.
              </p>
            </div>
          </section>

          {policySections.map((section, index) => {
            const Icon = section.icon;
            return (
              <section className="terms-section fees-section" id={section.id} key={section.id}>
                <div className="terms-section-number">{String(index + 6).padStart(2, '0')}</div>
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

          <section className="privacy-contact-strip fees-support-strip">
            <div>
              <Mail size={20} />
              <strong>Cần tra soát phí?</strong>
              <span>Gửi mã giao dịch, ảnh màn hình phí hiển thị và chứng từ thanh toán để GoldChain đối soát.</span>
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
