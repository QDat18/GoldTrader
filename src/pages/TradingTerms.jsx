import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  ArrowUp,
  CheckCircle2,
  Clock,
  FileText,
  Gavel,
  Landmark,
  LockKeyhole,
  ReceiptText,
  Scale,
  ShieldCheck,
} from 'lucide-react';

const effectiveDate = '11/07/2026';

const highlights = [
  {
    icon: ShieldCheck,
    title: 'KYC trước giao dịch giá trị cao',
    text: 'Khách hàng phải xác thực danh tính, tài khoản ngân hàng chính chủ và nguồn tiền hợp pháp trước khi mua, bán, nạp, rút hoặc nhận vàng vật chất.',
  },
  {
    icon: Clock,
    title: 'Giá được khóa tại thời điểm xác nhận',
    text: 'Báo giá có thể thay đổi theo thị trường. Lệnh chỉ có hiệu lực khi khách hàng xác nhận trong thời gian khóa giá và hệ thống ghi nhận thanh toán hợp lệ.',
  },
  {
    icon: ReceiptText,
    title: 'Có chứng từ và lịch sử đối soát',
    text: 'Mỗi lệnh phát sinh mã giao dịch, trạng thái xử lý, chứng từ điện tử và dữ liệu sổ cái để khiếu nại, kiểm toán hoặc đối chiếu tại quầy.',
  },
  {
    icon: LockKeyhole,
    title: 'Rút vàng bằng QR động',
    text: 'Rút vàng vật chất yêu cầu đối chiếu CCCD/VNeID, QR/TOTP còn hiệu lực, serial sản phẩm và biên bản bàn giao tại điểm giao nhận.',
  },
];

const legalBases = [
  {
    title: 'Bộ luật Dân sự 2015',
    tag: 'Hợp đồng',
    text: 'Nền tảng cho năng lực giao kết, nguyên tắc tự nguyện, thiện chí, trung thực, hiệu lực giao dịch dân sự, nghĩa vụ thanh toán và bồi thường thiệt hại.',
  },
  {
    title: 'Luật Thương mại 2005',
    tag: 'Mua bán hàng hóa',
    text: 'Áp dụng cho giao dịch thương mại, cung ứng dịch vụ, giao nhận hàng hóa, xử lý vi phạm hợp đồng và trách nhiệm của thương nhân.',
  },
  {
    title: 'Nghị định 24/2012/NĐ-CP và văn bản sửa đổi, bổ sung',
    tag: 'Kinh doanh vàng',
    text: 'Khung quản lý hoạt động kinh doanh vàng tại Việt Nam. Hoạt động vàng miếng, vàng nhẫn, vàng trang sức hoặc giao nhận vật chất phải thuộc phạm vi được phép hoặc thông qua đối tác đủ điều kiện.',
  },
  {
    title: 'Luật Giao dịch điện tử 2023',
    tag: 'Hợp đồng điện tử',
    text: 'Cơ sở cho dữ liệu điện tử, xác nhận lệnh, thông báo điện tử, chữ ký điện tử, nhật ký hệ thống và chứng từ điện tử khi các bên chấp thuận phương thức giao dịch online.',
  },
  {
    title: 'Luật Bảo vệ quyền lợi người tiêu dùng 2023',
    tag: 'Minh bạch thông tin',
    text: 'Yêu cầu công khai điều kiện giao dịch chung, giá, phí, rủi ro, phương thức khiếu nại, bảo vệ thông tin và xử lý yêu cầu của người tiêu dùng.',
  },
  {
    title: 'Nghị định 52/2013/NĐ-CP và Nghị định 85/2021/NĐ-CP',
    tag: 'Thương mại điện tử',
    text: 'Định hướng công bố thông tin trên website, quy trình đặt hàng, xác nhận đơn hàng, lưu trữ điều kiện giao dịch và trách nhiệm khi vận hành kênh online.',
  },
  {
    title: 'Nghị định 13/2023/NĐ-CP',
    tag: 'Dữ liệu cá nhân',
    text: 'Cơ sở cho việc thu thập, xử lý, lưu trữ, chia sẻ dữ liệu định danh, CCCD, ảnh KYC, dữ liệu giao dịch và quyền của chủ thể dữ liệu.',
  },
  {
    title: 'Luật Phòng, chống rửa tiền 2022',
    tag: 'AML/CFT',
    text: 'Định hướng nhận biết khách hàng, theo dõi giao dịch bất thường, yêu cầu chứng minh nguồn tiền, tạm dừng giao dịch rủi ro và phối hợp với cơ quan có thẩm quyền.',
  },
  {
    title: 'Pháp luật thanh toán, thuế, hóa đơn và an toàn thông tin',
    tag: 'Vận hành',
    text: 'Bao gồm quy định thanh toán không dùng tiền mặt, hóa đơn điện tử, lưu trữ chứng từ, an ninh mạng, an toàn thông tin mạng và nghĩa vụ thuế phát sinh tại từng thời điểm.',
  },
];

const benchmarkPractices = [
  'Theo thông lệ ngân hàng, giao dịch giá trị lớn cần tài khoản chính chủ, lịch sử định danh, kiểm soát gian lận, giới hạn giao dịch, nhật ký thiết bị và quyền tạm khóa khi có dấu hiệu bất thường.',
  'Theo thực tiễn của các doanh nghiệp vàng lớn, giao dịch mua bán vàng cần công khai loại vàng, hàm lượng, đơn vị tính, giá mua - bán, chứng từ, phương thức thanh toán và thời gian xử lý chuyển khoản.',
  'Theo thực tiễn giao nhận tại quầy, khách hàng cần xuất trình giấy tờ tùy thân, thông tin đơn hàng, chứng từ thanh toán, kiểm tra sản phẩm, serial hoặc bao bì trước khi ký nhận.',
  'Theo chuẩn bảo vệ người tiêu dùng, mọi khoản phí, biên độ giá, điều kiện hoàn tiền, trường hợp từ chối lệnh và cơ chế khiếu nại phải được hiển thị trước khi khách hàng xác nhận giao dịch.',
];

const termsSections = [
  {
    id: 'scope',
    title: 'Phạm vi áp dụng và chấp thuận điều khoản',
    items: [
      'Điều khoản này áp dụng cho mọi khách hàng truy cập, đăng ký, xác thực KYC, nạp tiền, mua vàng, bán vàng, tích lũy DCA, lưu ký, yêu cầu rút vàng vật chất hoặc sử dụng công cụ liên quan trên GoldChain.',
      'Bằng việc bấm “Xác nhận”, “Đặt lệnh”, “Mua”, “Bán”, “Rút vàng”, “Tạo kế hoạch DCA” hoặc tiếp tục sử dụng tài khoản sau khi điều khoản được công bố, khách hàng xác nhận đã đọc, hiểu và đồng ý bị ràng buộc bởi điều khoản này.',
      'Nếu khách hàng là tổ chức, người thao tác trên tài khoản cam kết có đầy đủ thẩm quyền đại diện hợp pháp. GoldChain có quyền yêu cầu hồ sơ ủy quyền, giấy phép kinh doanh, thông tin chủ sở hữu hưởng lợi và hồ sơ thuế.',
      'Nếu một chức năng đang ở giai đoạn thử nghiệm, mô phỏng hoặc chưa đủ điều kiện pháp lý để triển khai thương mại, GoldChain phải hiển thị trạng thái tương ứng và không xem số dư hoặc lệnh mô phỏng là cam kết giao nhận tài sản thật.',
    ],
  },
  {
    id: 'definitions',
    title: 'Định nghĩa',
    items: [
      '“GoldChain” là nền tảng giao dịch vàng O2O cho phép khách hàng theo dõi giá, đặt lệnh online, tích lũy vàng, quản lý ví, nhận thông báo và thực hiện thủ tục nhận vàng vật chất tại điểm giao nhận đủ điều kiện.',
      '“Khách hàng” là cá nhân hoặc tổ chức có tài khoản trên GoldChain, bao gồm khách chưa KYC, khách đã KYC, khách bị giới hạn giao dịch, khách tổ chức và người đại diện hợp lệ.',
      '“Ví VND” là công cụ ghi nhận số dư thanh toán nội bộ trên nền tảng để phục vụ đặt lệnh. Ví VND không phải tài khoản tiền gửi, không phát sinh lãi, không là ví điện tử độc lập nếu GoldChain chưa có giấy phép hoặc đối tác thanh toán phù hợp.',
      '“Ví vàng” là công cụ ghi nhận số lượng vàng theo loại, đơn vị, trạng thái khả dụng, trạng thái chờ giao nhận và lịch sử phát sinh. Ví vàng không mặc nhiên là chứng khoán, tiền gửi, sản phẩm đầu tư tập thể hoặc cam kết lợi nhuận.',
      '“Giá niêm yết” là giá mua vào, bán ra, spread, phí và dữ liệu tham chiếu được GoldChain công bố tại từng thời điểm. Giá có thể lấy từ nguồn thị trường, đối tác, sàn tham chiếu hoặc bảng giá nội bộ đã được công bố.',
      '“Khóa giá” là khoảng thời gian ngắn hệ thống giữ báo giá cho khách hàng trước khi xác nhận lệnh. Hết thời gian khóa giá, báo giá phải được làm mới.',
      '“Lệnh giao dịch” là yêu cầu mua, bán, chuyển đổi, rút vàng hoặc tạo kế hoạch DCA đã được hệ thống ghi nhận bằng mã giao dịch, thời gian, trạng thái, dữ liệu thiết bị và thông tin người thao tác.',
      '“Điểm giao nhận” là cửa hàng, chi nhánh, kho, quầy giao dịch hoặc đối tác được GoldChain công bố để giao nhận vàng vật chất.',
      '“QR động/TOTP” là mã xác thực có thời hạn dùng để đối chiếu lệnh rút vàng tại quầy, không được chụp gửi cho người khác và không thay thế giấy tờ tùy thân.',
    ],
  },
  {
    id: 'eligibility',
    title: 'Điều kiện tham gia',
    items: [
      'Khách hàng cá nhân phải từ đủ 18 tuổi, có đầy đủ năng lực hành vi dân sự, sử dụng thông tin định danh hợp pháp và chịu trách nhiệm về tính chính xác của dữ liệu cung cấp.',
      'Khách hàng không được sử dụng tài khoản để che giấu chủ sở hữu hưởng lợi, giao dịch hộ trái phép, rửa tiền, tài trợ khủng bố, gian lận, thao túng giá, lừa đảo, trốn thuế hoặc thực hiện giao dịch bị pháp luật cấm.',
      'Khách hàng phải sử dụng tài khoản ngân hàng, số điện thoại, email, giấy tờ tùy thân và phương thức thanh toán chính chủ, trùng khớp với hồ sơ KYC trừ trường hợp GoldChain đã chấp thuận bằng văn bản.',
      'GoldChain có quyền từ chối mở tài khoản, từ chối giao dịch, yêu cầu bổ sung hồ sơ hoặc chấm dứt cung cấp dịch vụ nếu khách hàng không đáp ứng điều kiện pháp lý, điều kiện rủi ro hoặc điều kiện vận hành.',
    ],
  },
  {
    id: 'kyc',
    title: 'Tài khoản, định danh và phân quyền',
    items: [
      'Khách chưa đăng nhập chỉ được xem thông tin công khai, bảng giá và nội dung hướng dẫn. Khách chưa KYC không được hoặc bị giới hạn mua, bán, rút vàng, nạp/rút số tiền lớn và sử dụng các chức năng nhạy cảm.',
      'KYC tối thiểu gồm họ tên, ngày sinh nếu có, số điện thoại, email, CCCD/hộ chiếu còn hiệu lực, ảnh giấy tờ, ảnh xác thực, tài khoản ngân hàng chính chủ và các thông tin khác theo yêu cầu kiểm soát rủi ro.',
      'GoldChain có thể áp dụng thẩm định tăng cường đối với giao dịch lớn, giao dịch bất thường, khách hàng tổ chức, khách hàng có dấu hiệu đại diện cho bên thứ ba hoặc hồ sơ có thông tin không nhất quán.',
      'Tài khoản có thể bị giới hạn, tạm khóa hoặc yêu cầu xác minh lại khi thay đổi thiết bị, thay đổi số điện thoại, đăng nhập bất thường, sai OTP nhiều lần, nghi ngờ lộ thông tin hoặc phát sinh cảnh báo AML/CFT.',
      'Admin của GoldChain có quyền duyệt KYC, từ chối KYC, ghi lý do từ chối, kiểm tra lệnh, quản lý tồn kho, đối soát QR tại quầy và xử lý các tác vụ vận hành theo phân quyền nội bộ.',
    ],
  },
  {
    id: 'products',
    title: 'Sản phẩm và dịch vụ',
    items: [
      'GoldChain có thể cung cấp mua vàng online, bán vàng online, ví vàng, ví VND nội bộ, kế hoạch tích lũy định kỳ DCA, lưu ký, rút vàng vật chất, bảng giá, cảnh báo giá, thông báo giao dịch và lịch sử đối soát.',
      'Loại vàng hỗ trợ có thể gồm vàng miếng, vàng nhẫn, vàng 9999, vàng thương hiệu đối tác hoặc sản phẩm khác được công bố. Mỗi loại có đơn vị tính, quy cách, hàm lượng, phí, điều kiện mua bán và điều kiện rút riêng.',
      'GoldChain chỉ thực hiện hoạt động kinh doanh vàng thuộc phạm vi được pháp luật cho phép, giấy phép hiện có hoặc thông qua đối tác/cửa hàng đủ điều kiện. Chức năng chưa đủ điều kiện thương mại phải được vận hành ở chế độ mô phỏng hoặc chờ kích hoạt.',
      'Số lượng vàng trong ví có thể là vàng khả dụng để bán lại trên nền tảng, vàng đang chờ thanh toán, vàng đang lưu ký, vàng đang chờ rút hoặc vàng đã hoàn tất bàn giao. Trạng thái hiển thị là căn cứ xử lý giao dịch.',
    ],
  },
  {
    id: 'price',
    title: 'Nguyên tắc giá, khóa giá và khớp lệnh',
    items: [
      'Giá niêm yết gồm giá GoldChain mua vào từ khách hàng, giá GoldChain bán ra cho khách hàng, spread, phí dịch vụ nếu có và thời điểm cập nhật. Giá có thể khác giữa loại vàng, khu vực, kênh online và điểm giao nhận.',
      'Giá trên màn hình là giá tham khảo cho đến khi khách hàng bấm xác nhận trong thời gian khóa giá và hệ thống kiểm tra đủ số dư, đủ tồn kho, đủ hạn mức, đủ KYC và không có cảnh báo rủi ro.',
      'Nếu thị trường biến động mạnh, nguồn giá gián đoạn, sai lệch kỹ thuật, lỗi nhập liệu, lỗi API, lỗi kết nối đối tác hoặc giá hiển thị bất thường so với thị trường, GoldChain có quyền hủy lệnh chưa hoàn tất và hoàn trả số tiền/vàng liên quan.',
      'Lệnh đã khớp hợp lệ được ghi nhận theo giá tại thời điểm xác nhận, không điều chỉnh theo biến động sau đó trừ trường hợp lỗi hệ thống rõ ràng, gian lận, yêu cầu của cơ quan có thẩm quyền hoặc thỏa thuận khác bằng văn bản.',
      'Khách hàng phải tự kiểm tra loại vàng, chiều giao dịch, số lượng, đơn vị tính, giá, phí, thuế dự kiến, phương thức nhận và tổng thanh toán trước khi xác nhận.',
    ],
  },
  {
    id: 'buy',
    title: 'Điều khoản mua vàng',
    items: [
      'Khách hàng chỉ được đặt lệnh mua khi tài khoản đủ điều kiện, ví VND đủ số dư khả dụng, lệnh nằm trong hạn mức và GoldChain hoặc đối tác có đủ tồn kho khả dụng theo loại vàng đã chọn.',
      'Khi lệnh mua được xác nhận, hệ thống ghi giảm số dư VND khả dụng, ghi tăng số lượng vàng tương ứng trong ví vàng hoặc trạng thái chờ giao nhận, đồng thời tạo mã giao dịch và chứng từ điện tử.',
      'Số lượng mua tối thiểu, bước nhảy số lượng, đơn vị làm tròn, quy đổi chỉ/lượng/gram và điều kiện rút vật chất được công bố tại màn hình đặt lệnh. Phần lẻ có thể chỉ dùng để bán lại online nếu chưa đủ quy cách nhận vàng vật chất.',
      'Lệnh mua đã khớp không được hủy theo ý chí đơn phương của khách hàng vì biến động giá sau thời điểm xác nhận. Trường hợp được hủy hoặc hoàn tiền chỉ gồm lỗi hệ thống, thanh toán không hợp lệ, không đủ tồn kho hoặc tình huống pháp lý bắt buộc.',
      'Nếu khách hàng thanh toán bằng tài khoản không chính chủ, sai nội dung, chuyển thiếu, chuyển thừa hoặc chuyển sau thời hạn, GoldChain có thể tạm treo xử lý, yêu cầu bổ sung chứng từ và hoàn tiền theo quy trình đối soát.',
    ],
  },
  {
    id: 'sell',
    title: 'Điều khoản bán vàng',
    items: [
      'Khách hàng chỉ được bán số vàng khả dụng trong ví, không bị phong tỏa, không đang chờ rút, không đang bị tranh chấp và không thuộc lệnh có cảnh báo gian lận hoặc yêu cầu tạm dừng.',
      'Khi lệnh bán được xác nhận, hệ thống ghi giảm số lượng vàng khả dụng, ghi tăng số dư VND hoặc trạng thái chờ thanh toán theo giá mua vào tại thời điểm khớp lệnh, trừ phí và nghĩa vụ thuế nếu có.',
      'Việc hạch toán giá vốn khi bán vàng ưu tiên theo nguyên tắc FIFO hoặc phương pháp được GoldChain công bố trong chính sách kế toán giao dịch. Khi chức năng FIFO chưa kích hoạt đầy đủ, hệ thống vẫn lưu lịch sử để phục vụ đối soát và cập nhật sau.',
      'GoldChain có thể yêu cầu xác minh bổ sung nếu khách hàng bán số lượng lớn, bán liên tục trong thời gian ngắn, bán ngay sau khi mua bằng nguồn tiền rủi ro hoặc có dấu hiệu giao dịch hộ bên thứ ba.',
      'Thời gian nhận tiền bán lại phụ thuộc kênh thanh toán, giờ giao dịch ngân hàng, ngày làm việc, mức độ đối soát và trạng thái KYC. Các giao dịch ngoài giờ có thể được xử lý vào ngày làm việc tiếp theo.',
    ],
  },
  {
    id: 'withdraw',
    title: 'Rút vàng vật chất tại quầy',
    items: [
      'Khách hàng chỉ được rút vàng vật chất khi đã KYC hợp lệ, vàng trong ví đủ quy cách rút, không bị phong tỏa, đã hoàn tất thanh toán và điểm giao nhận còn tồn kho phù hợp.',
      'Yêu cầu rút vàng phải thể hiện loại vàng, số lượng, điểm giao nhận, thời gian dự kiến, phí rút/lưu kho nếu có, mã đơn, QR động/TOTP và trạng thái phê duyệt của hệ thống.',
      'Khi đến quầy, khách hàng phải xuất trình CCCD/hộ chiếu/VNeID, thông tin tài khoản, mã đơn, QR động còn hiệu lực và ký nhận biên bản bàn giao. GoldChain có quyền từ chối giao nếu thông tin không khớp hoặc mã đã hết hạn.',
      'Khách hàng phải kiểm tra sản phẩm, bao bì, tem, serial, hàm lượng, quy cách, số lượng và chứng từ trước khi rời quầy. Sau khi ký nhận, giao dịch bàn giao được xem là hoàn tất trừ trường hợp có lỗi kỹ thuật hoặc tranh chấp được lập biên bản ngay tại điểm giao nhận.',
      'Nhận thay chỉ được chấp nhận khi GoldChain công bố hỗ trợ và người nhận thay có giấy ủy quyền hợp lệ, giấy tờ tùy thân, dữ liệu xác thực bổ sung và được GoldChain/đối tác chấp thuận trước.',
    ],
  },
  {
    id: 'dca',
    title: 'Tích lũy vàng định kỳ DCA',
    items: [
      'Kế hoạch DCA là chỉ thị của khách hàng cho phép hệ thống tự động đặt lệnh mua vàng theo số tiền, loại vàng, tần suất, ngày thực hiện và điều kiện giá do khách hàng lựa chọn.',
      'Mỗi lần thực thi DCA chỉ diễn ra khi ví VND đủ số dư, tài khoản không bị hạn chế, nguồn giá khả dụng và loại vàng được hỗ trợ. Nếu không đủ điều kiện, hệ thống có thể bỏ qua kỳ mua, ghi nhận thất bại và gửi thông báo.',
      'Khách hàng có quyền tạm dừng, chỉnh sửa hoặc hủy kế hoạch DCA trước thời điểm hệ thống bắt đầu xử lý kỳ giao dịch tiếp theo. Lệnh DCA đã khớp được xử lý như lệnh mua vàng thông thường.',
      'DCA không phải tư vấn đầu tư, không cam kết lợi nhuận và không loại bỏ rủi ro biến động giá. Khách hàng chịu trách nhiệm về tần suất, số tiền, thời điểm và khả năng tài chính của mình.',
    ],
  },
  {
    id: 'wallet-payment',
    title: 'Ví VND, thanh toán và đối soát tiền',
    items: [
      'Số dư ví VND phản ánh nghĩa vụ thanh toán nội bộ giữa khách hàng và GoldChain/đối tác trong phạm vi dịch vụ, không phải tiền gửi ngân hàng, không có bảo hiểm tiền gửi và không phát sinh lãi.',
      'Nạp tiền chỉ được thực hiện qua kênh GoldChain công bố như chuyển khoản ngân hàng chính chủ, VietQR định danh, cổng thanh toán của đối tác được cấp phép hoặc phương thức hợp pháp khác.',
      'Rút tiền hoặc nhận tiền bán vàng chỉ chuyển về tài khoản ngân hàng chính chủ đã xác thực, trừ trường hợp pháp luật hoặc quy trình vận hành cho phép phương thức khác.',
      'GoldChain có thể áp dụng hạn mức theo ngày, theo tháng, theo cấp KYC, theo loại giao dịch, theo rủi ro hoặc theo yêu cầu của đối tác thanh toán/cơ quan quản lý.',
      'Giao dịch chuyển khoản sai chủ tài khoản, sai nội dung, sai số tiền, sai ngân hàng, trùng lệnh, bị ngân hàng hoàn trả hoặc bị cơ quan có thẩm quyền yêu cầu tạm giữ sẽ được xử lý theo quy trình đối soát riêng.',
    ],
  },
  {
    id: 'fees-taxes',
    title: 'Phí, thuế, hóa đơn và chứng từ',
    items: [
      'Các khoản có thể phát sinh gồm spread mua bán, phí giao dịch, phí lưu ký, phí rút vàng, phí giao nhận, phí chuyển khoản, phí hủy lệnh, phí xử lý ngoại lệ, thuế và lệ phí theo quy định pháp luật.',
      'GoldChain phải hiển thị hoặc dẫn chiếu biểu phí trước khi khách hàng xác nhận giao dịch. Nếu phí thay đổi, mức phí mới chỉ áp dụng theo thời điểm công bố và không hồi tố đối với lệnh đã hoàn tất trừ khi pháp luật yêu cầu.',
      'Chứng từ điện tử, hóa đơn điện tử hoặc biên nhận được phát hành theo loại giao dịch, tư cách khách hàng, quy định thuế và khả năng tích hợp của hệ thống/đối tác.',
      'Khách hàng chịu trách nhiệm kê khai, nộp thuế và cung cấp thông tin hóa đơn chính xác nếu pháp luật yêu cầu. GoldChain có thể khấu trừ, thu hộ hoặc báo cáo thông tin giao dịch khi có nghĩa vụ pháp lý.',
    ],
  },
  {
    id: 'customer-obligations',
    title: 'Quyền và nghĩa vụ của khách hàng',
    items: [
      'Được cung cấp thông tin rõ ràng về giá, phí, loại vàng, điều kiện giao dịch, trạng thái lệnh, lịch sử giao dịch, phương thức khiếu nại và thông báo thay đổi quan trọng.',
      'Có quyền yêu cầu truy xuất lịch sử giao dịch, chứng từ, trạng thái xử lý và thông tin cá nhân trong phạm vi pháp luật cho phép.',
      'Có nghĩa vụ bảo mật mật khẩu, OTP, email, điện thoại, thiết bị đăng nhập, QR rút vàng và thông tin tài khoản. Mọi giao dịch phát sinh từ thông tin xác thực hợp lệ có thể được xem là do khách hàng thực hiện cho đến khi có căn cứ ngược lại.',
      'Phải thông báo ngay cho GoldChain khi nghi ngờ mất thiết bị, lộ OTP, lộ mật khẩu, bị chiếm đoạt tài khoản, phát hiện giao dịch bất thường hoặc có sai lệch thông tin KYC.',
      'Không được khai thác lỗi hệ thống, can thiệp dữ liệu, tự động hóa trái phép, tạo nhiều tài khoản để né hạn mức, giao dịch hộ không được phép hoặc sử dụng GoldChain cho mục đích vi phạm pháp luật.',
    ],
  },
  {
    id: 'platform-obligations',
    title: 'Quyền và nghĩa vụ của GoldChain',
    items: [
      'Cung cấp giao diện đặt lệnh, bảng giá, lịch sử giao dịch, thông báo, trạng thái xử lý và kênh hỗ trợ phù hợp với phạm vi dịch vụ đã công bố.',
      'Lưu trữ dữ liệu giao dịch, nhật ký truy cập, chứng từ điện tử, trạng thái KYC, trạng thái đối soát và hồ sơ khiếu nại trong thời hạn cần thiết theo pháp luật và mục đích vận hành hợp pháp.',
      'Tạm dừng, từ chối hoặc hủy giao dịch khi có nghi ngờ gian lận, rửa tiền, tài khoản không chính chủ, lỗi giá, lỗi hệ thống, vi phạm điều khoản, yêu cầu của ngân hàng/đối tác hoặc yêu cầu của cơ quan có thẩm quyền.',
      'Bảo vệ dữ liệu cá nhân, áp dụng biện pháp an toàn thông tin hợp lý, phân quyền truy cập nội bộ, ghi nhận thao tác admin và thông báo sự cố theo yêu cầu pháp luật nếu có.',
      'Cập nhật điều khoản, biểu phí, hạn mức, quy trình KYC, quy trình rút vàng và phương thức thanh toán khi pháp luật, thị trường, đối tác hoặc mô hình vận hành thay đổi.',
    ],
  },
  {
    id: 'data-security',
    title: 'Dữ liệu cá nhân, bảo mật và chứng cứ điện tử',
    items: [
      'Dữ liệu được xử lý có thể gồm thông tin định danh, ảnh CCCD/hộ chiếu, ảnh xác thực, thông tin ngân hàng, số điện thoại, email, địa chỉ, thiết bị, IP, cookie, hành vi đăng nhập, lệnh giao dịch và lịch sử hỗ trợ.',
      'Mục đích xử lý gồm mở tài khoản, KYC, phòng chống gian lận, phòng chống rửa tiền, đặt lệnh, thanh toán, giao nhận vàng, chăm sóc khách hàng, giải quyết tranh chấp, báo cáo quản trị và tuân thủ pháp luật.',
      'GoldChain có thể chia sẻ dữ liệu cần thiết cho ngân hàng, đối tác thanh toán, đối tác giao nhận, đơn vị KYC, kiểm toán, tư vấn pháp lý, nhà cung cấp hạ tầng hoặc cơ quan có thẩm quyền theo căn cứ hợp pháp.',
      'Nhật ký hệ thống, mã OTP, QR, địa chỉ IP, thời gian thao tác, mã giao dịch, bản ghi trạng thái và chứng từ điện tử là nguồn chứng cứ để đối soát trừ khi khách hàng chứng minh được lỗi hệ thống hoặc hành vi gian lận của bên thứ ba.',
      'Khách hàng có quyền yêu cầu truy cập, chỉnh sửa, hạn chế xử lý hoặc rút lại đồng ý trong phạm vi pháp luật cho phép, nhưng việc rút lại có thể khiến GoldChain không thể tiếp tục cung cấp dịch vụ.',
    ],
  },
  {
    id: 'aml',
    title: 'Phòng chống rửa tiền, gian lận và giao dịch bất thường',
    items: [
      'GoldChain áp dụng nguyên tắc nhận biết khách hàng, xác minh chủ sở hữu hưởng lợi, theo dõi hành vi giao dịch, giới hạn giao dịch và yêu cầu chứng minh nguồn tiền trong các trường hợp cần thiết.',
      'Các dấu hiệu có thể bị kiểm tra gồm chia nhỏ giao dịch để né hạn mức, dùng nhiều tài khoản liên quan, thanh toán không chính chủ, mua bán vòng, giao dịch bất thường so với hồ sơ, yêu cầu rút vật chất ngay sau khi nạp tiền rủi ro hoặc sử dụng thông tin giả.',
      'GoldChain có quyền tạm giữ trạng thái xử lý, chưa cho rút tiền/vàng, yêu cầu bổ sung hồ sơ, báo cáo hoặc cung cấp thông tin cho cơ quan có thẩm quyền khi có căn cứ pháp lý.',
      'Khách hàng chịu trách nhiệm chứng minh nguồn tiền, mục đích giao dịch và tính hợp pháp của tài sản khi được yêu cầu hợp lý.',
    ],
  },
  {
    id: 'cancel-refund',
    title: 'Hủy lệnh, hoàn tiền và xử lý lỗi',
    items: [
      'Khách hàng có thể hủy lệnh trước khi bấm xác nhận hoặc trước khi lệnh chuyển sang trạng thái đang xử lý nếu giao diện cho phép. Sau khi lệnh đã khớp hợp lệ, việc hủy phụ thuộc điều kiện tại điều khoản này.',
      'Hoàn tiền có thể áp dụng khi thanh toán không chính chủ, thanh toán sai nội dung, chuyển thừa, lệnh thất bại do lỗi hệ thống, không đủ tồn kho, cơ quan/đối tác yêu cầu từ chối hoặc GoldChain không thể cung cấp dịch vụ.',
      'Số tiền hoàn trả được chuyển về tài khoản nguồn hoặc tài khoản chính chủ đã KYC sau khi đối soát, trừ phí ngân hàng, phí xử lý hoặc nghĩa vụ pháp lý nếu có.',
      'Thời gian hoàn tiền phụ thuộc ngân hàng, ngày làm việc, trạng thái đối soát và độ phức tạp của hồ sơ. GoldChain phải thông báo mốc xử lý dự kiến và lý do nếu cần kéo dài.',
      'Nếu lỗi do khách hàng cung cấp sai thông tin, làm lộ OTP, giao dịch hộ trái phép hoặc vi phạm điều khoản, GoldChain có thể từ chối bồi thường phần thiệt hại phát sinh từ lỗi của khách hàng.',
    ],
  },
  {
    id: 'risk',
    title: 'Công bố rủi ro',
    items: [
      'Giá vàng biến động liên tục theo thị trường trong nước, thế giới, tỷ giá, chính sách quản lý, thanh khoản và cung cầu. Khách hàng có thể lãi hoặc lỗ khi mua bán vàng.',
      'Spread mua bán, phí, thuế và thời gian xử lý có thể ảnh hưởng đến kết quả giao dịch. Giá bán ra cho khách hàng thường cao hơn giá mua vào từ khách hàng.',
      'Rút vàng vật chất phụ thuộc tồn kho, quy cách sản phẩm, giờ làm việc, điểm giao nhận, yêu cầu KYC và tình trạng hệ thống. Không phải mọi số dư vàng lẻ đều có thể rút ngay thành sản phẩm vật chất.',
      'Rủi ro công nghệ gồm gián đoạn internet, lỗi thiết bị, lỗi API giá, lỗi ngân hàng, tấn công mạng, trì hoãn OTP, sai lệch hiển thị hoặc bảo trì hệ thống.',
      'Blockchain proof hoặc mã băm chứng từ nếu có chỉ hỗ trợ kiểm tra tính toàn vẹn dữ liệu, không phải bảo lãnh lợi nhuận, không thay thế chứng từ pháp lý bắt buộc và không tự chứng minh quyền sở hữu nếu dữ liệu đầu vào sai.',
      'Thay đổi pháp luật, chính sách của NHNN, quy định thanh toán, thuế, hóa đơn hoặc quản lý vàng có thể khiến một số chức năng bị giới hạn, tạm dừng hoặc điều chỉnh.',
    ],
  },
  {
    id: 'complaints',
    title: 'Khiếu nại, hỗ trợ và giải quyết tranh chấp',
    items: [
      'Kênh tiếp nhận gồm hotline, email, biểu mẫu hỗ trợ, trung tâm thông báo trong app hoặc điểm giao nhận. Khách hàng cần cung cấp mã giao dịch, thời gian, số tiền/số vàng, chứng từ thanh toán và mô tả sự việc.',
      'GoldChain ghi nhận khiếu nại trong vòng 01 ngày làm việc kể từ khi nhận đủ thông tin cơ bản. Trường hợp khẩn cấp liên quan mất tài khoản hoặc rút vàng trái phép được ưu tiên khóa rủi ro trước khi xác minh.',
      'Thời hạn xử lý thông thường là 07 đến 30 ngày làm việc tùy độ phức tạp, ngân hàng/đối tác liên quan và yêu cầu chứng từ. Trường hợp cần thêm thời gian, GoldChain phải thông báo lý do và mốc cập nhật tiếp theo.',
      'Tranh chấp trước hết được giải quyết bằng thương lượng, đối soát dữ liệu, kiểm tra chứng từ và biên bản làm việc. Nếu không đạt kết quả, tranh chấp được giải quyết theo pháp luật Việt Nam tại cơ quan có thẩm quyền hoặc phương thức khác do các bên thỏa thuận.',
    ],
  },
  {
    id: 'force-majeure',
    title: 'Bảo trì, tạm ngừng dịch vụ và bất khả kháng',
    items: [
      'GoldChain có thể bảo trì định kỳ hoặc khẩn cấp để nâng cấp hệ thống, vá lỗi bảo mật, nâng cấp dữ liệu giá, đồng bộ đối tác hoặc đáp ứng yêu cầu quản lý rủi ro.',
      'Trong thời gian bảo trì, một số chức năng như đặt lệnh, nạp/rút, rút vàng, DCA hoặc thông báo có thể bị tạm dừng. GoldChain sẽ thông báo trước nếu điều kiện cho phép.',
      'Bất khả kháng gồm thiên tai, chiến tranh, dịch bệnh, đình công, sự cố điện viễn thông, sự cố ngân hàng, thay đổi pháp luật, quyết định của cơ quan nhà nước, tấn công mạng quy mô lớn hoặc sự kiện ngoài khả năng kiểm soát hợp lý.',
      'Bên bị ảnh hưởng bởi bất khả kháng được miễn trách nhiệm trong phạm vi thiệt hại trực tiếp do sự kiện đó gây ra, với điều kiện đã nỗ lực giảm thiểu và thông báo cho bên còn lại trong thời gian hợp lý.',
    ],
  },
  {
    id: 'amendments',
    title: 'Sửa đổi điều khoản và hiệu lực',
    items: [
      'GoldChain có thể cập nhật điều khoản để phù hợp pháp luật, giấy phép, yêu cầu đối tác, mô hình kinh doanh, tính năng mới hoặc kiểm soát rủi ro.',
      'Phiên bản mới được công bố trên website/app, ghi ngày hiệu lực và có thể gửi thông báo tới khách hàng. Nếu khách hàng tiếp tục sử dụng dịch vụ sau ngày hiệu lực, khách hàng được xem là đồng ý với phiên bản mới.',
      'Nếu một điều khoản bị vô hiệu, phần còn lại vẫn có hiệu lực. Điều khoản vô hiệu được thay thế bằng quy định hợp pháp có mục đích kinh tế và pháp lý gần nhất.',
      'Điều khoản này được điều chỉnh bởi pháp luật Việt Nam. Ngôn ngữ áp dụng là tiếng Việt. Bản dịch nếu có chỉ để tham khảo.',
    ],
  },
  {
    id: 'contact',
    title: 'Thông tin liên hệ và lưu ý pháp lý',
    items: [
      'Bộ phận hỗ trợ: cs@goldchain.vn hoặc hotline 1800-6789 trong khung giờ được công bố trên hệ thống.',
      'Thông báo pháp lý, khiếu nại chính thức và yêu cầu dữ liệu cá nhân cần gửi kèm thông tin định danh, mã tài khoản, mã giao dịch liên quan và tài liệu chứng minh quyền yêu cầu.',
      'Nội dung điều khoản này là khung pháp lý sản phẩm cần được rà soát bởi pháp chế/luật sư và cập nhật theo giấy phép, đối tác thanh toán, đối tác vàng, chính sách thuế và mô hình vận hành thực tế trước khi công bố thương mại.',
    ],
  },
];

const sources = [
  {
    label: 'Cơ sở dữ liệu Quốc gia về văn bản pháp luật',
    href: 'https://vbpl.vn/',
  },
  {
    label: 'Cổng văn bản Chính phủ',
    href: 'https://vanban.chinhphu.vn/',
  },
  {
    label: 'Ngân hàng Nhà nước Việt Nam - quản lý ngoại hối và kinh doanh vàng',
    href: 'https://www.sbv.gov.vn/vi/web/sbv_portal/quan-ly-hoat-dong-ngoai-hoi-va-hoat-dong-kinh-doanh-vang',
  },
  {
    label: 'SJC - quy định thanh toán giao dịch mua bán vàng',
    href: 'https://sjc.com.vn/cham-soc-khach-hang/quydinhthanhtoan',
  },
];

export default function TradingTerms() {
  const tocItems = useMemo(() => ([
    { id: 'legal-bases', title: 'Khung pháp lý và thông lệ vận hành', label: '00' },
    ...termsSections.map((section, index) => ({
      id: section.id,
      title: section.title,
      label: String(index + 1).padStart(2, '0'),
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
    <div className="terms-page">
      <div className="terms-reading-progress" aria-hidden="true">
        <span style={{ width: `${readingProgress}%` }} />
      </div>

      <section className="terms-hero">
        <div className="terms-hero-copy">
          <div className="tag">PHÁP LÝ GIAO DỊCH</div>
          <h1>Điều khoản giao dịch GoldChain</h1>
          <p>
            Bộ điều khoản áp dụng cho giao dịch mua, bán, tích lũy, lưu ký và rút vàng vật chất trên nền tảng GoldChain,
            được xây dựng theo pháp luật Việt Nam hiện hành và tham chiếu thông lệ vận hành của ngân hàng, tổ chức thanh toán
            và doanh nghiệp vàng lớn tại Việt Nam.
          </p>
          <div className="terms-hero-actions">
            <Link to="/trade" className="btn btn-gold">
              <FileText size={16} />
              Vào trang giao dịch
            </Link>
            <a href="#legal-bases" className="btn btn-outline">
              <Scale size={16} />
              Xem cơ sở pháp lý
            </a>
          </div>
        </div>

        <div className="terms-effective-card">
          <div className="terms-effective-icon">
            <Gavel size={28} />
          </div>
          <div>
            <span>Ngày cập nhật</span>
            <strong>{effectiveDate}</strong>
          </div>
          <p>
            Điều khoản có thể thay đổi khi có quy định mới về kinh doanh vàng, thanh toán không dùng tiền mặt,
            bảo vệ dữ liệu cá nhân, thuế, hóa đơn hoặc phòng chống rửa tiền.
          </p>
        </div>
      </section>

      <section className="terms-highlight-grid" aria-label="Điểm chính">
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

      <div className="terms-mobile-jump">
        <label htmlFor="terms-section-jump">Chuyển nhanh tới mục</label>
        <select
          id="terms-section-jump"
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
        <aside className="terms-sidebar" aria-label="Mục lục điều khoản">
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
                <h2>Khung pháp lý và thông lệ vận hành</h2>
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

          <section className="terms-panel">
            <div className="terms-section-heading">
              <CheckCircle2 size={22} />
              <div>
                <span>Thông lệ từ tổ chức lớn</span>
                <h2>Nguyên tắc được đưa vào điều khoản</h2>
              </div>
            </div>
            <ul className="terms-check-list">
              {benchmarkPractices.map((item) => (
                <li key={item}>
                  <CheckCircle2 size={16} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="terms-warning">
            <AlertCircle size={20} />
            <div>
              <strong>Lưu ý triển khai</strong>
              <p>
                Đây là bản điều khoản chi tiết để đưa vào sản phẩm. Trước khi dùng cho vận hành thương mại,
                cần đối chiếu giấy phép, đối tác thanh toán, đối tác vàng, quy trình kế toán, chính sách thuế
                và ý kiến pháp chế/luật sư phụ trách.
              </p>
            </div>
          </section>

          {termsSections.map((section, index) => (
            <section className="terms-section" id={section.id} key={section.id}>
              <div className="terms-section-number">{String(index + 1).padStart(2, '0')}</div>
              <div>
                <h2>{section.title}</h2>
                <ul>
                  {section.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </section>
          ))}

          <section className="terms-panel">
            <div className="terms-section-heading">
              <FileText size={22} />
              <div>
                <span>Nguồn tham khảo</span>
                <h2>Văn bản và thực tiễn đã đối chiếu</h2>
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
