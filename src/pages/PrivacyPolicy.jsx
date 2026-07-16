import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  ArrowUp,
  CheckCircle2,
  Clock,
  Cookie,
  Database,
  Eye,
  FileText,
  Info,
  Landmark,
  LockKeyhole,
  Mail,
  RefreshCw,
  Scale,
  Server,
  Settings,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';

const effectiveDate = '11/07/2026';

const TooltipTerm = ({ label, tip }) => (
  <span className="privacy-term" tabIndex="0" aria-label={`${label}: ${tip}`}>
    {label}
    <Info size={13} />
    <span className="privacy-tooltip">{tip}</span>
  </span>
);

const legalBases = [
  {
    title: 'Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân',
    tag: 'Dữ liệu cá nhân',
    text: 'Khung chính về thông báo xử lý, đồng ý, quyền của chủ thể dữ liệu, dữ liệu nhạy cảm, đánh giá tác động, chuyển dữ liệu ra nước ngoài và thông báo vi phạm dữ liệu.',
  },
  {
    title: 'Luật An toàn thông tin mạng 2015',
    tag: 'An toàn thông tin',
    text: 'Định hướng bảo đảm an toàn thông tin cá nhân trên mạng, thu thập đúng mục đích, bảo mật, phòng chống truy cập trái phép và xử lý sự cố an toàn thông tin.',
  },
  {
    title: 'Luật An ninh mạng 2018',
    tag: 'An ninh mạng',
    text: 'Liên quan đến bảo vệ hệ thống thông tin, lưu trữ, cung cấp dữ liệu theo yêu cầu hợp pháp và phòng chống hành vi xâm phạm an ninh mạng.',
  },
  {
    title: 'Luật Giao dịch điện tử 2023',
    tag: 'Chứng từ điện tử',
    text: 'Cơ sở cho thông điệp dữ liệu, xác nhận điện tử, nhật ký thao tác, hợp đồng điện tử và giá trị chứng cứ của dữ liệu giao dịch.',
  },
  {
    title: 'Luật Bảo vệ quyền lợi người tiêu dùng 2023',
    tag: 'Khách hàng',
    text: 'Yêu cầu minh bạch thông tin, bảo vệ thông tin người tiêu dùng, cơ chế tiếp nhận yêu cầu/khiếu nại và trách nhiệm của tổ chức kinh doanh.',
  },
  {
    title: 'Luật Phòng, chống rửa tiền 2022',
    tag: 'KYC/AML',
    text: 'Cơ sở cho nhận biết khách hàng, xác minh danh tính, theo dõi giao dịch bất thường, lưu trữ hồ sơ và báo cáo theo quy định.',
  },
  {
    title: 'Pháp luật thuế, kế toán, hóa đơn và thương mại điện tử',
    tag: 'Lưu trữ',
    text: 'Điều chỉnh thời hạn lưu chứng từ, hóa đơn, sổ cái, dữ liệu giao dịch, nghĩa vụ giải trình và đối soát với ngân hàng/đối tác.',
  },
];

const highlights = [
  {
    icon: ShieldCheck,
    title: 'Minh bạch trước khi xử lý',
    text: 'GoldChain công bố loại dữ liệu, mục đích, bên nhận, thời hạn lưu, quyền của khách hàng và kênh yêu cầu ngay trong chính sách này.',
  },
  {
    icon: UserCheck,
    title: 'KYC phục vụ an toàn giao dịch',
    text: 'Dữ liệu CCCD, ảnh định danh, tài khoản ngân hàng và giao dịch được dùng để xác minh chính chủ, chống gian lận và phòng chống rửa tiền.',
  },
  {
    icon: LockKeyhole,
    title: 'Bảo mật theo lớp',
    text: 'Áp dụng mã hóa đường truyền, phân quyền nội bộ, nhật ký truy cập, che/masking dữ liệu nhạy cảm và kiểm soát thao tác admin.',
  },
  {
    icon: Settings,
    title: 'Khách hàng có quyền kiểm soát',
    text: 'Khách hàng có thể yêu cầu truy cập, chỉnh sửa, rút lại đồng ý, hạn chế xử lý, xóa dữ liệu hoặc khiếu nại theo phạm vi pháp luật cho phép.',
  },
];

const glossary = [
  {
    label: 'Dữ liệu cá nhân',
    tip: 'Thông tin dưới dạng ký hiệu, chữ viết, số, hình ảnh, âm thanh hoặc dạng tương tự gắn với một người cụ thể hoặc giúp xác định một người cụ thể.',
  },
  {
    label: 'Dữ liệu nhạy cảm',
    tip: 'Nhóm dữ liệu có mức độ riêng tư cao như định danh, tài chính, tài khoản ngân hàng, vị trí, sinh trắc học hoặc thông tin có thể ảnh hưởng trực tiếp đến quyền lợi của khách hàng.',
  },
  {
    label: 'KYC',
    tip: 'Know Your Customer - quy trình xác minh khách hàng bằng giấy tờ, thông tin liên hệ, tài khoản ngân hàng và dữ liệu đối chiếu để phòng gian lận.',
  },
  {
    label: 'AML',
    tip: 'Anti-Money Laundering - kiểm soát phòng chống rửa tiền, bao gồm theo dõi giao dịch bất thường, chứng minh nguồn tiền và báo cáo khi pháp luật yêu cầu.',
  },
  {
    label: 'Cookie',
    tip: 'Tệp nhỏ lưu trên trình duyệt để giữ phiên đăng nhập, bảo mật, ghi nhớ lựa chọn và đo hiệu năng dịch vụ.',
  },
  {
    label: 'Mã hóa',
    tip: 'Biện pháp chuyển dữ liệu sang dạng khó đọc khi truyền hoặc lưu trữ, giúp giảm rủi ro khi dữ liệu bị truy cập trái phép.',
  },
  {
    label: 'Ẩn danh hóa',
    tip: 'Quá trình loại bỏ hoặc biến đổi thông tin để dữ liệu không còn nhận diện được một cá nhân cụ thể trong điều kiện hợp lý.',
  },
  {
    label: 'Bên xử lý dữ liệu',
    tip: 'Tổ chức/cá nhân xử lý dữ liệu thay cho GoldChain theo hợp đồng hoặc chỉ dẫn, ví dụ hạ tầng cloud, email, SMS, KYC hoặc phân tích bảo mật.',
  },
];

const dataMap = [
  {
    title: 'Thông tin tài khoản',
    icon: UserCheck,
    examples: 'Họ tên, email, số điện thoại, vai trò, trạng thái KYC, ngày tạo tài khoản.',
    purpose: 'Mở tài khoản, đăng nhập, quản lý phiên, hỗ trợ khách hàng và phân quyền.',
    retention: 'Trong thời gian tài khoản hoạt động và thêm thời hạn cần thiết để xử lý tranh chấp, kế toán, thuế hoặc yêu cầu pháp luật.',
  },
  {
    title: 'Dữ liệu định danh/eKYC',
    icon: Eye,
    examples: 'Số CCCD/hộ chiếu, ảnh mặt trước/mặt sau giấy tờ, ảnh xác thực nếu có, lý do KYC bị từ chối.',
    purpose: 'Xác minh danh tính, chống giả mạo, đủ điều kiện mua bán/rút vàng vật chất, AML và xử lý khiếu nại.',
    retention: 'Theo thời hạn lưu trữ hồ sơ nhận biết khách hàng, phòng chống rửa tiền và yêu cầu của cơ quan có thẩm quyền.',
  },
  {
    title: 'Dữ liệu tài chính và giao dịch',
    icon: Database,
    examples: 'Số dư ví VND, ví vàng, lệnh mua/bán/rút, DCA, lịch sử nạp tiền, chứng từ, mã giao dịch, giá khớp.',
    purpose: 'Thực hiện hợp đồng, đối soát, chứng minh giao dịch, lập hóa đơn, tính phí, thuế, sổ cái và báo cáo quản trị.',
    retention: 'Theo thời hạn bắt buộc của pháp luật kế toán, thuế, phòng chống rửa tiền và thời hạn giải quyết tranh chấp.',
  },
  {
    title: 'Dữ liệu thiết bị và bảo mật',
    icon: Server,
    examples: 'IP, thiết bị, trình duyệt, thời gian đăng nhập, nhật ký thao tác, token phiên, cảnh báo bất thường.',
    purpose: 'Bảo vệ tài khoản, phát hiện gian lận, ngăn truy cập trái phép, điều tra sự cố và bảo vệ hệ thống.',
    retention: 'Trong thời hạn cần thiết cho an ninh hệ thống, điều tra sự cố, kiểm toán nội bộ và yêu cầu pháp luật.',
  },
  {
    title: 'Thông tin hỗ trợ và liên lạc',
    icon: Mail,
    examples: 'Nội dung email/chat/cuộc gọi, mã yêu cầu, tệp đính kèm, phản hồi khiếu nại.',
    purpose: 'Chăm sóc khách hàng, giải quyết tranh chấp, cải thiện dịch vụ và lưu bằng chứng xử lý.',
    retention: 'Trong thời hạn xử lý yêu cầu và lưu vết hợp lý để bảo vệ quyền lợi hai bên.',
  },
  {
    title: 'Cookie và dữ liệu sử dụng',
    icon: Cookie,
    examples: 'Cookie phiên, tùy chọn giao diện, hành vi xem trang, lỗi frontend, trạng thái đồng ý.',
    purpose: 'Duy trì đăng nhập, bảo mật phiên, tối ưu trải nghiệm, đo hiệu năng và ghi nhận lựa chọn riêng tư.',
    retention: 'Theo thời hạn cookie hoặc đến khi khách hàng xóa cookie/đổi lựa chọn trên trình duyệt.',
  },
];

const quickActions = [
  {
    title: 'Yêu cầu xem dữ liệu',
    text: 'Nhận bản tóm tắt dữ liệu tài khoản, KYC, ví và lịch sử giao dịch trong phạm vi pháp luật cho phép.',
  },
  {
    title: 'Yêu cầu chỉnh sửa',
    text: 'Cập nhật thông tin liên hệ hoặc hồ sơ KYC khi dữ liệu sai, thiếu hoặc đã thay đổi.',
  },
  {
    title: 'Rút lại đồng ý',
    text: 'Dừng các hoạt động xử lý dựa trên đồng ý, trừ phần GoldChain buộc phải lưu để thực hiện hợp đồng hoặc nghĩa vụ pháp lý.',
  },
  {
    title: 'Khiếu nại bảo mật',
    text: 'Báo sự cố lộ thông tin, nghi ngờ bị chiếm đoạt tài khoản hoặc yêu cầu khóa rủi ro khẩn cấp.',
  },
];

const policySections = [
  {
    id: 'scope',
    title: 'Phạm vi áp dụng',
    items: [
      <>Chính sách này áp dụng cho website, ứng dụng, tài khoản, ví VND, ví vàng, giao dịch online, DCA, rút vàng vật chất, hỗ trợ khách hàng và các dịch vụ liên quan của GoldChain.</>,
      <>Chính sách áp dụng cho khách chưa đăng nhập, khách đã đăng ký, khách đã KYC, người đại diện tổ chức, admin vận hành và người được ủy quyền hợp lệ khi tương tác với GoldChain.</>,
      <>Nếu một chức năng đang chạy demo hoặc mô phỏng, dữ liệu vẫn được bảo vệ theo cùng nguyên tắc tối thiểu, đúng mục đích, bảo mật và có quyền yêu cầu kiểm tra.</>,
    ],
  },
  {
    id: 'roles',
    title: 'Vai trò xử lý dữ liệu',
    items: [
      <>GoldChain có thể là <TooltipTerm label="bên kiểm soát dữ liệu" tip="Bên quyết định mục đích và phương tiện xử lý dữ liệu cá nhân." /> đối với dữ liệu tài khoản, KYC, ví, giao dịch và hỗ trợ khách hàng.</>,
      <>GoldChain có thể là <TooltipTerm label="bên kiểm soát và xử lý dữ liệu" tip="Bên vừa quyết định mục đích xử lý vừa trực tiếp thực hiện một hoặc nhiều hoạt động xử lý dữ liệu." /> khi tự lưu trữ, xác minh, phân tích rủi ro hoặc vận hành giao dịch.</>,
      <>Các nhà cung cấp hạ tầng, email, SMS, KYC, thanh toán, phân tích bảo mật hoặc đối tác giao nhận có thể là <TooltipTerm label="bên xử lý dữ liệu" tip="Bên xử lý dữ liệu theo hợp đồng, thỏa thuận bảo mật và chỉ dẫn hợp pháp của GoldChain." />.</>,
    ],
  },
  {
    id: 'collection',
    title: 'Dữ liệu chúng tôi thu thập',
    items: [
      <>Dữ liệu tài khoản gồm họ tên, email, số điện thoại, mật khẩu đã băm/mã hóa theo cơ chế xác thực, vai trò, trạng thái KYC và trạng thái phiên đăng nhập.</>,
      <>Dữ liệu định danh gồm số CCCD/hộ chiếu, ảnh giấy tờ, dữ liệu đối chiếu KYC, tài khoản ngân hàng chính chủ và thông tin xác minh bổ sung khi có dấu hiệu rủi ro.</>,
      <>Dữ liệu tài chính gồm số dư ví VND, số lượng vàng, loại vàng, lệnh mua/bán/rút, DCA, chứng từ, phí, thuế, giá khớp, trạng thái thanh toán và lịch sử nạp/rút.</>,
      <>Dữ liệu kỹ thuật gồm địa chỉ IP, thiết bị, hệ điều hành, trình duyệt, cookie, thời điểm truy cập, log thao tác và cảnh báo bảo mật.</>,
      <>Dữ liệu hỗ trợ gồm nội dung trao đổi qua email, hotline, biểu mẫu, thông báo trong app, tệp đính kèm và kết quả xử lý khiếu nại.</>,
    ],
  },
  {
    id: 'purpose',
    title: 'Mục đích xử lý',
    items: [
      <>Tạo và bảo vệ tài khoản, xác thực đăng nhập, duy trì phiên, phân quyền Guest/User/Admin và ngăn truy cập trái phép.</>,
      <>Thực hiện <TooltipTerm label="KYC" tip="Quy trình xác minh khách hàng để đảm bảo tài khoản chính chủ và đủ điều kiện giao dịch." />, phòng chống giả mạo, gian lận, rửa tiền, tài trợ khủng bố và giao dịch hộ trái phép.</>,
      <>Thực hiện giao dịch vàng, quản lý ví, đối soát thanh toán, phát hành chứng từ, lưu lịch sử, xử lý rút vàng vật chất và giải quyết tranh chấp.</>,
      <>Gửi thông báo giao dịch, cảnh báo bảo mật, email OTP/khôi phục mật khẩu, cập nhật điều khoản, biểu phí và thông tin bắt buộc theo luật.</>,
      <>Cải thiện sản phẩm, kiểm thử lỗi, đo hiệu năng, phát hiện bất thường, quản trị rủi ro và bảo vệ hệ thống GoldChain.</>,
    ],
  },
  {
    id: 'legal-basis',
    title: 'Căn cứ xử lý và sự đồng ý',
    items: [
      <>GoldChain xử lý dữ liệu trên cơ sở khách hàng đồng ý, cần thiết để thực hiện hợp đồng/dịch vụ, thực hiện nghĩa vụ pháp lý hoặc căn cứ hợp pháp khác theo pháp luật Việt Nam.</>,
      <>Đối với <TooltipTerm label="dữ liệu cá nhân nhạy cảm" tip="Dữ liệu có thể ảnh hưởng trực tiếp đến quyền riêng tư và quyền lợi của khách hàng, ví dụ định danh, tài chính, ngân hàng, sinh trắc học." />, GoldChain áp dụng thông báo rõ ràng hơn, giới hạn người truy cập và chỉ xử lý khi cần thiết cho mục đích đã công bố.</>,
      <>Khách hàng có thể rút lại sự đồng ý đối với hoạt động dựa trên đồng ý. Việc rút lại không làm ảnh hưởng tính hợp pháp của hoạt động xử lý đã thực hiện trước đó và có thể khiến một số dịch vụ bị tạm dừng.</>,
      <>GoldChain có thể tiếp tục lưu hoặc xử lý dữ liệu trong phạm vi cần thiết để hoàn tất giao dịch, bảo vệ quyền lợi hợp pháp, tuân thủ kế toán/thuế/AML hoặc yêu cầu của cơ quan có thẩm quyền.</>,
    ],
  },
  {
    id: 'sharing',
    title: 'Chia sẻ dữ liệu',
    items: [
      <>GoldChain không bán dữ liệu cá nhân của khách hàng. Việc chia sẻ chỉ thực hiện khi cần cho dịch vụ, bảo mật, pháp lý hoặc có sự đồng ý/căn cứ hợp pháp.</>,
      <>Dữ liệu có thể được chia sẻ với ngân hàng, cổng thanh toán, đối tác KYC, Supabase/cloud, dịch vụ email/SMS, đối tác giao nhận vàng, đơn vị kiểm toán, luật sư, tư vấn thuế hoặc nhà cung cấp bảo mật.</>,
      <>Khi nhận yêu cầu hợp pháp, GoldChain có thể cung cấp dữ liệu cho cơ quan nhà nước có thẩm quyền, ngân hàng, tổ chức phòng chống rửa tiền hoặc bên liên quan đến tranh chấp.</>,
      <>Đối tác nhận dữ liệu phải bị ràng buộc bởi nghĩa vụ bảo mật, xử lý đúng mục đích, giới hạn truy cập, lưu trữ an toàn và hỗ trợ xóa/hoàn trả dữ liệu khi hết mục đích.</>,
    ],
  },
  {
    id: 'cross-border',
    title: 'Chuyển dữ liệu ra nước ngoài',
    items: [
      <>Một số hạ tầng cloud, email, phân tích bảo mật hoặc sao lưu có thể đặt máy chủ ngoài Việt Nam. Khi đó, GoldChain áp dụng biện pháp bảo vệ và hồ sơ tuân thủ theo quy định về <TooltipTerm label="chuyển dữ liệu ra nước ngoài" tip="Hoạt động chuyển dữ liệu cá nhân của công dân Việt Nam tới hệ thống hoặc tổ chức ở ngoài lãnh thổ Việt Nam." />.</>,
      <>GoldChain ưu tiên giảm dữ liệu chuyển đi, mã hóa khi truyền, ký thỏa thuận xử lý dữ liệu, kiểm soát vùng lưu trữ nếu nhà cung cấp hỗ trợ và theo dõi bên nhận dữ liệu.</>,
      <>Khách hàng có thể yêu cầu thông tin tổng quát về nhóm bên nhận dữ liệu ở nước ngoài, mục đích chuyển và biện pháp bảo vệ đang áp dụng.</>,
    ],
  },
  {
    id: 'security',
    title: 'Biện pháp bảo mật',
    items: [
      <>Mã hóa đường truyền HTTPS/TLS, giới hạn truy cập theo vai trò, che dữ liệu nhạy cảm trên giao diện, nhật ký admin và kiểm soát thay đổi dữ liệu quan trọng.</>,
      <>Áp dụng xác thực phiên, OTP/TOTP cho thao tác nhạy cảm, phát hiện đăng nhập bất thường và cơ chế khóa rủi ro khi nghi ngờ tài khoản bị chiếm đoạt.</>,
      <>Dữ liệu định danh và tài chính được phân quyền chặt hơn; nhân sự chỉ được truy cập theo nhu cầu công việc và có thể bị ghi log kiểm tra.</>,
      <>Sử dụng sao lưu, kiểm tra lỗi, giám sát dịch vụ, cảnh báo sự cố và quy trình phản ứng khi có nguy cơ mất an toàn dữ liệu.</>,
      <>Không có hệ thống nào an toàn tuyệt đối; khách hàng cần bảo mật email, mật khẩu, OTP, thiết bị và báo ngay khi có dấu hiệu bất thường.</>,
    ],
  },
  {
    id: 'cookies',
    title: 'Cookie và công nghệ tương tự',
    items: [
      <>Cookie bắt buộc dùng để đăng nhập, bảo mật phiên, chống giả mạo yêu cầu và ghi nhớ lựa chọn riêng tư. Nếu tắt các cookie này, dịch vụ có thể không hoạt động ổn định.</>,
      <>Cookie tùy chọn có thể dùng để ghi nhớ giao diện, đo hiệu năng, phân tích lỗi hoặc cải thiện trải nghiệm. GoldChain sẽ cung cấp lựa chọn khi tính năng này được bật chính thức.</>,
      <>Khách hàng có thể xóa cookie trong trình duyệt. Việc xóa cookie có thể khiến khách hàng phải đăng nhập lại hoặc mất một số tùy chọn cá nhân hóa.</>,
    ],
  },
  {
    id: 'retention',
    title: 'Thời hạn lưu trữ và xóa dữ liệu',
    items: [
      <>GoldChain lưu dữ liệu trong thời gian cần thiết cho mục đích đã công bố, tài khoản còn hoạt động, giao dịch chưa hoàn tất, khiếu nại còn mở hoặc pháp luật yêu cầu lưu trữ.</>,
      <>Hồ sơ KYC/AML, chứng từ giao dịch, hóa đơn, dữ liệu kế toán, thuế và sổ cái có thể phải lưu lâu hơn yêu cầu xóa thông thường để đáp ứng nghĩa vụ pháp lý.</>,
      <>Khi hết mục đích hoặc hết thời hạn bắt buộc, GoldChain sẽ xóa, ẩn danh hóa hoặc lưu trữ hạn chế để không còn dùng cho mục đích vận hành thường nhật.</>,
      <>Dữ liệu sao lưu có thể tồn tại thêm trong chu kỳ backup nhưng được bảo vệ và sẽ bị ghi đè/xóa theo lịch kỹ thuật.</>,
    ],
  },
  {
    id: 'rights',
    title: 'Quyền của khách hàng',
    items: [
      <>Quyền được biết về hoạt động xử lý dữ liệu, loại dữ liệu, mục đích, tổ chức/cá nhân xử lý và hậu quả có thể phát sinh.</>,
      <>Quyền đồng ý, rút lại đồng ý, truy cập, xem, chỉnh sửa, yêu cầu cung cấp dữ liệu, xóa dữ liệu, hạn chế xử lý, phản đối xử lý và khiếu nại theo phạm vi pháp luật cho phép.</>,
      <>Quyền yêu cầu GoldChain giải thích quyết định từ chối KYC, khóa giao dịch hoặc hạn chế tài khoản nếu quyết định đó liên quan đáng kể đến dữ liệu cá nhân.</>,
      <>GoldChain có thể từ chối hoặc trì hoãn yêu cầu nếu yêu cầu không xác minh được danh tính, ảnh hưởng quyền lợi người khác, cản trở điều tra gian lận hoặc trái với nghĩa vụ pháp lý bắt buộc.</>,
    ],
  },
  {
    id: 'requests',
    title: 'Cách gửi yêu cầu quyền riêng tư',
    items: [
      <>Khách hàng gửi yêu cầu qua email <a href="mailto:privacy@goldchain.vn">privacy@goldchain.vn</a>, trung tâm hỗ trợ hoặc hotline 1800-6789, kèm thông tin định danh và mã tài khoản/giao dịch nếu có.</>,
      <>GoldChain xác nhận tiếp nhận trong thời gian hợp lý, ưu tiên yêu cầu khóa rủi ro khẩn cấp và có thể yêu cầu bổ sung giấy tờ để đảm bảo người gửi là chính chủ.</>,
      <>Thời gian xử lý phụ thuộc loại yêu cầu, độ phức tạp, nghĩa vụ lưu trữ, đối tác liên quan và quy định pháp luật; GoldChain sẽ thông báo nếu cần thêm thời gian.</>,
    ],
  },
  {
    id: 'incident',
    title: 'Sự cố dữ liệu và thông báo',
    items: [
      <>Khi phát hiện sự cố có thể ảnh hưởng đến dữ liệu cá nhân, GoldChain kích hoạt quy trình cô lập, điều tra, giảm thiểu thiệt hại, khôi phục và ghi nhận bằng chứng.</>,
      <>Nếu sự cố thuộc trường hợp phải thông báo, GoldChain sẽ thông báo cho cơ quan có thẩm quyền và/hoặc khách hàng trong thời hạn luật định, bao gồm thông tin cần thiết để khách hàng tự bảo vệ.</>,
      <>Khách hàng cần báo ngay khi nghi ngờ lộ mật khẩu, OTP, mất thiết bị, bị đăng nhập lạ, phát hiện giao dịch không nhận diện được hoặc nhận được yêu cầu cung cấp thông tin đáng ngờ.</>,
    ],
  },
  {
    id: 'children',
    title: 'Người chưa đủ 18 tuổi',
    items: [
      <>GoldChain không hướng tới người chưa đủ 18 tuổi và không cho phép người chưa đủ năng lực hành vi dân sự tự mở tài khoản giao dịch vàng.</>,
      <>Nếu phát hiện dữ liệu của người chưa đủ 18 tuổi được cung cấp không hợp lệ, GoldChain có thể khóa tài khoản, yêu cầu xác minh người giám hộ hợp pháp hoặc xóa dữ liệu trong phạm vi pháp luật cho phép.</>,
    ],
  },
  {
    id: 'changes',
    title: 'Cập nhật chính sách',
    items: [
      <>GoldChain có thể cập nhật chính sách khi có thay đổi pháp luật, hạ tầng, nhà cung cấp, sản phẩm, mô hình xử lý dữ liệu hoặc tiêu chuẩn bảo mật.</>,
      <>Phiên bản mới được công bố trên website/app và ghi ngày hiệu lực. Thay đổi quan trọng có thể được gửi qua email, thông báo trong app hoặc banner trước khi áp dụng.</>,
      <>Nếu khách hàng tiếp tục sử dụng dịch vụ sau ngày hiệu lực, khách hàng được xem là đã nhận biết chính sách mới trong phạm vi pháp luật cho phép.</>,
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
];

export default function PrivacyPolicy() {
  const tocItems = useMemo(() => ([
    { id: 'legal-bases', title: 'Cơ sở pháp lý', label: '00' },
    { id: 'data-map', title: 'Bản đồ dữ liệu', label: '01' },
    ...policySections.map((section, index) => ({
      id: section.id,
      title: section.title,
      label: String(index + 2).padStart(2, '0'),
    })),
  ]), []);

  const [activeSection, setActiveSection] = useState('legal-bases');
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
    <div className="terms-page privacy-page">
      <div className="terms-reading-progress" aria-hidden="true">
        <span style={{ width: `${readingProgress}%` }} />
      </div>

      <section className="terms-hero privacy-hero">
        <div className="terms-hero-copy">
          <div className="tag">QUYỀN RIÊNG TƯ & DỮ LIỆU</div>
          <h1>Chính sách bảo mật GoldChain</h1>
          <p>
            Chính sách này giải thích cách GoldChain thu thập, sử dụng, lưu trữ, chia sẻ và bảo vệ dữ liệu cá nhân
            khi khách hàng đăng ký, xác thực eKYC, giao dịch vàng, quản lý ví, nhận thông báo hoặc liên hệ hỗ trợ.
          </p>
          <div className="terms-hero-actions">
            <a href="#rights" className="btn btn-gold">
              <UserCheck size={16} />
              Xem quyền của tôi
            </a>
            <a href="mailto:privacy@goldchain.vn" className="btn btn-outline">
              <Mail size={16} />
              Gửi yêu cầu dữ liệu
            </a>
          </div>
        </div>

        <div className="terms-effective-card privacy-effective-card">
          <div className="terms-effective-icon">
            <ShieldCheck size={28} />
          </div>
          <div>
            <span>Ngày cập nhật</span>
            <strong>{effectiveDate}</strong>
          </div>
          <p>
            Bản này được thiết kế cho mô hình fintech vàng O2O: eKYC, ví VND, ví vàng, DCA, giao dịch online,
            rút vàng vật chất và đối soát với ngân hàng/đối tác.
          </p>
        </div>
      </section>

      <section className="terms-highlight-grid" aria-label="Điểm chính của chính sách bảo mật">
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

      <section className="privacy-glossary-panel">
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
        <label htmlFor="privacy-section-jump">Chuyển nhanh tới mục</label>
        <select
          id="privacy-section-jump"
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
        <aside className="terms-sidebar" aria-label="Mục lục chính sách bảo mật">
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

          <section className="terms-panel" id="legal-bases">
            <div className="terms-section-heading">
              <Landmark size={22} />
              <div>
                <span>Cơ sở tham chiếu</span>
                <h2>Khung pháp lý Việt Nam</h2>
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
              <strong>Lưu ý pháp lý</strong>
              <p>
                Chính sách này là bản triển khai sản phẩm cần được pháp chế/luật sư rà soát theo giấy phép,
                nhà cung cấp cloud, đối tác thanh toán, đối tác vàng và quy trình vận hành thực tế trước khi công bố thương mại.
              </p>
            </div>
          </section>

          <section className="terms-panel" id="data-map">
            <div className="terms-section-heading">
              <Database size={22} />
              <div>
                <span>Bản đồ dữ liệu</span>
                <h2>Chúng tôi xử lý những nhóm dữ liệu nào</h2>
              </div>
            </div>
            <div className="privacy-data-grid">
              {dataMap.map((item) => {
                const Icon = item.icon;
                return (
                  <article className="privacy-data-card" key={item.title}>
                    <div className="privacy-data-card-head">
                      <Icon size={18} />
                      <h3>{item.title}</h3>
                    </div>
                    <p><strong>Ví dụ:</strong> {item.examples}</p>
                    <p><strong>Mục đích:</strong> {item.purpose}</p>
                    <p><strong>Lưu trữ:</strong> {item.retention}</p>
                  </article>
                );
              })}
            </div>
          </section>

          <section className="terms-panel">
            <div className="terms-section-heading">
              <CheckCircle2 size={22} />
              <div>
                <span>Thao tác nhanh</span>
                <h2>Khách hàng có thể yêu cầu gì</h2>
              </div>
            </div>
            <div className="privacy-action-grid">
              {quickActions.map((item) => (
                <article className="privacy-action-card" key={item.title}>
                  <CheckCircle2 size={16} />
                  <div>
                    <h3>{item.title}</h3>
                    <p>{item.text}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>

          {policySections.map((section, index) => (
            <section className="terms-section privacy-section" id={section.id} key={section.id}>
              <div className="terms-section-number">{String(index + 2).padStart(2, '0')}</div>
              <div>
                <h2>{section.title}</h2>
                <ul>
                  {section.items.map((item, itemIndex) => (
                    <li key={`${section.id}-${itemIndex}`}>{item}</li>
                  ))}
                </ul>
              </div>
            </section>
          ))}

          <section className="terms-panel">
            <div className="terms-section-heading">
              <Scale size={22} />
              <div>
                <span>Nguồn tham khảo</span>
                <h2>Văn bản và cổng thông tin đã đối chiếu</h2>
              </div>
            </div>
            <div className="terms-source-list">
              {sources.map((source) => (
                <a key={source.href} href={source.href} target="_blank" rel="noreferrer">
                  {source.label}
                </a>
              ))}
            </div>
          </section>

          <section className="privacy-contact-strip">
            <div>
              <RefreshCw size={20} />
              <strong>Cập nhật lựa chọn riêng tư</strong>
              <span>Gửi yêu cầu để kiểm tra dữ liệu, cập nhật thông tin, rút lại đồng ý hoặc báo sự cố.</span>
            </div>
            <a className="btn btn-gold" href="mailto:privacy@goldchain.vn">
              <Mail size={16} />
              privacy@goldchain.vn
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
