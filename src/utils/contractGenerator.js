import PDFDocument from "pdfkit";
import fs from "fs";

// ============================================================
// FONT REGISTRATION (Windows System Fonts - Times New Roman)
// ============================================================
const FONTS = {
  regular: "C:\\Windows\\Fonts\\times.ttf",
  bold: "C:\\Windows\\Fonts\\timesbd.ttf",
  italic: "C:\\Windows\\Fonts\\timesi.ttf",
  boldItalic: "C:\\Windows\\Fonts\\timesbi.ttf"
};

const HAS_FONTS = Object.values(FONTS).every(f => fs.existsSync(f));

// ============================================================
// CONSTANTS - Chuẩn văn bản hành chính Việt Nam (NĐ 30/2020)
// ============================================================
const CM = 28.35;
const MARGIN_LEFT = Math.round(3 * CM);   // 85pt
const MARGIN_RIGHT = Math.round(2 * CM);  // 57pt
const MARGIN_TOP = Math.round(2 * CM);    // 57pt
const MARGIN_BOTTOM = Math.round(2 * CM); // 57pt
const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT;

const FONT_BODY = 13;
const FONT_HEADING = 13;
const FONT_SMALL = 11;
const LINE_GAP = 4;
const PARA_AFTER = 6;
const SUB_INDENT = 28;

// ============================================================
// HELPERS
// ============================================================
function getDateParts(dateStr) {
  let d = new Date();
  if (dateStr) {
    const p = dateStr.split(" ")[0].split("/");
    if (p.length === 3) d = new Date(p[2], p[1] - 1, p[0]);
  }
  return {
    day: d.getDate().toString().padStart(2, "0"),
    month: (d.getMonth() + 1).toString().padStart(2, "0"),
    year: d.getFullYear().toString()
  };
}

function registerFonts(doc) {
  if (!HAS_FONTS) return;
  doc.registerFont("TNR", FONTS.regular);
  doc.registerFont("TNR-Bold", FONTS.bold);
  doc.registerFont("TNR-Italic", FONTS.italic);
  doc.registerFont("TNR-BoldItalic", FONTS.boldItalic);
}

function fontR(doc) { return doc.font("TNR"); }
function fontB(doc) { return doc.font("TNR-Bold"); }
function fontI(doc) { return doc.font("TNR-Italic"); }

function formatVND(val) {
  if (!val) return "0";
  const s = String(val).replace(/[^\d]/g, "");
  return s.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

// Parse a number that may use dots as thousand separators or decimal points
function parseNum(val) {
  if (!val) return 0;
  let s = String(val).trim();
  // If the string contains multiple dots, they're thousand separators (VN style)
  const dots = (s.match(/\./g) || []).length;
  if (dots > 1) {
    // e.g. "147.200.000" -> 147200000
    s = s.replace(/\./g, "");
  } else if (dots === 1) {
    // Could be "0.0134" (decimal) or "1.500" (thousand sep)
    // If the part after dot has 3 digits and no other decimals, it's a thousand sep
    const parts = s.split(".");
    if (parts[1] && parts[1].length === 3 && parts[0].length <= 3) {
      s = s.replace(/\./g, ""); // thousand separator
    }
    // else keep as decimal
  }
  // Remove any remaining non-numeric chars except dots and minus
  s = s.replace(/[^\d.\-]/g, "");
  return parseFloat(s) || 0;
}

function calcFee(priceStr, qtyStr, totalStr) {
  // Extract quantity from strings like "0.0316 (0.1185g)" -> take first number
  let qtyClean = String(qtyStr || "0");
  const qtyMatch = qtyClean.match(/[\d]+\.[\d]+|[\d]+/);
  const qty = qtyMatch ? parseFloat(qtyMatch[0]) : 0;

  const price = parseNum(priceStr);
  const total = parseNum(totalStr);
  const raw = Math.round(price * qty);
  const fee = total - raw;
  return { raw, fee: Math.abs(fee), hasFee: Math.abs(fee) > 1 };
}

// Ensure there's enough space, otherwise add page
function ensureSpace(doc, needed) {
  if (doc.y + needed > PAGE_HEIGHT - MARGIN_BOTTOM) {
    doc.addPage();
  }
}

// Get current page index (0-based)
function currentPage(doc) {
  return doc.bufferedPageRange().count - 1 + (doc._pageBufferStart || 0);
}

// ============================================================
// TEXT HELPERS
// ============================================================
// Justified body text with indent (for sub-items 1.1, 1.2...)
function bodyJ(doc, str) {
  ensureSpace(doc, 40);
  fontR(doc).fontSize(FONT_BODY);
  doc.text(str, { width: CONTENT_WIDTH, lineGap: LINE_GAP, align: "justify", indent: SUB_INDENT });
  doc.y += PARA_AFTER;
}

// Left-aligned body text (for info fields that shouldn't stretch)
function bodyL(doc, str) {
  ensureSpace(doc, 30);
  fontR(doc).fontSize(FONT_BODY);
  doc.text(str, { width: CONTENT_WIDTH, lineGap: LINE_GAP, align: "left", indent: SUB_INDENT });
  doc.y += PARA_AFTER;
}

// Section heading (Điều X.)
function heading(doc, str) {
  ensureSpace(doc, 60);
  doc.moveDown(0.4);
  fontB(doc).fontSize(FONT_HEADING);
  doc.text(str, { width: CONTENT_WIDTH, lineGap: LINE_GAP, align: "left" });
  doc.y += PARA_AFTER;
}

// ============================================================
// MAIN PDF GENERATOR
// ============================================================
export function generateContractPdf(data) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        margins: { top: MARGIN_TOP, bottom: MARGIN_BOTTOM, left: MARGIN_LEFT, right: MARGIN_RIGHT },
        bufferPages: true
      });

      const chunks = [];
      doc.on("data", c => chunks.push(c));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", e => reject(e));

      registerFonts(doc);

      const { day, month, year } = getDateParts(data.date);
      const isBuy = data.type !== "sell";
      const feeInfo = calcFee(data.price, data.quantity, data.total);

      // We'll track page numbers for TOC (page index where each Điều starts)
      const tocPages = {};

      // ==============================================================
      // PAGE 1 (index 0): BÌA HỢP ĐỒNG
      // ==============================================================
      // Viền kép trang trí
      const bx = 20, by = 20, bw = PAGE_WIDTH - 40, bh = PAGE_HEIGHT - 40;
      doc.rect(bx, by, bw, bh).strokeColor("#B38728").lineWidth(2.5).stroke();
      doc.rect(bx + 7, by + 7, bw - 14, bh - 14).strokeColor("#B38728").lineWidth(0.75).stroke();

      // Đường trang trí trên
      const ornY = 130;
      doc.moveTo(80, ornY).lineTo(PAGE_WIDTH - 80, ornY).strokeColor("#B38728").lineWidth(1.2).stroke();
      doc.moveTo(80, ornY + 4).lineTo(PAGE_WIDTH - 80, ornY + 4).strokeColor("#B38728").lineWidth(0.4).stroke();

      // Tiêu đề bìa - CỠ CHỮ LỚN
      doc.fillColor("#000000");
      doc.y = 200;
      fontB(doc).fontSize(28);
      doc.text("HỢP ĐỒNG", MARGIN_LEFT, doc.y, { width: CONTENT_WIDTH, align: "center" });
      doc.moveDown(0.15);
      fontB(doc).fontSize(24);
      doc.text("MUA BÁN VÀNG TÍCH LŨY", MARGIN_LEFT, doc.y, { width: CONTENT_WIDTH, align: "center" });
      doc.moveDown(0.15);
      fontB(doc).fontSize(20);
      doc.text("ĐIỆN TỬ", MARGIN_LEFT, doc.y, { width: CONTENT_WIDTH, align: "center" });

      // Đường trang trí dưới tiêu đề
      doc.moveDown(1.2);
      const ornY2 = doc.y;
      doc.moveTo(160, ornY2).lineTo(PAGE_WIDTH - 160, ornY2).strokeColor("#B38728").lineWidth(0.75).stroke();

      // Các bên
      doc.moveDown(3);
      fontI(doc).fontSize(16).fillColor("#555");
      doc.text("Giữa", MARGIN_LEFT, doc.y, { width: CONTENT_WIDTH, align: "center" });
      doc.moveDown(1.2);
      fontB(doc).fontSize(18).fillColor("#000");
      doc.text("CÔNG TY CỔ PHẦN GOLDCHAIN", MARGIN_LEFT, doc.y, { width: CONTENT_WIDTH, align: "center" });
      doc.moveDown(1.2);
      fontI(doc).fontSize(16).fillColor("#555");
      doc.text("và", MARGIN_LEFT, doc.y, { width: CONTENT_WIDTH, align: "center" });
      doc.moveDown(1.2);
      fontB(doc).fontSize(18).fillColor("#000");
      doc.text((data.name || "KHÁCH HÀNG").toUpperCase(), MARGIN_LEFT, doc.y, { width: CONTENT_WIDTH, align: "center" });

      // Phần dưới bìa
      doc.y = PAGE_HEIGHT - 210;
      const ornY3 = doc.y;
      doc.moveTo(80, ornY3).lineTo(PAGE_WIDTH - 80, ornY3).strokeColor("#B38728").lineWidth(1.2).stroke();
      doc.moveTo(80, ornY3 + 4).lineTo(PAGE_WIDTH - 80, ornY3 + 4).strokeColor("#B38728").lineWidth(0.4).stroke();

      doc.moveDown(1.2);
      fontB(doc).fontSize(15).fillColor("#B38728");
      doc.text(`Số: ${data.contractId || "ORD-UNKNOWN"}`, MARGIN_LEFT, doc.y, { width: CONTENT_WIDTH, align: "center" });
      doc.moveDown(0.4);
      fontR(doc).fontSize(14).fillColor("#000");
      doc.text(`Ngày ${day} tháng ${month} năm ${year}`, MARGIN_LEFT, doc.y, { width: CONTENT_WIDTH, align: "center" });

      // ==============================================================
      // PAGE 2 (index 1): MỤC LỤC (trang riêng, sẽ điền số trang sau)
      // ==============================================================
      doc.addPage();
      // We'll fill this page AFTER writing all content (second pass)
      // For now, leave it mostly blank and mark the Y positions

      // ==============================================================
      // PAGE 3+ (index 2+): NỘI DUNG HỢP ĐỒNG - chảy liên tục
      // ==============================================================
      doc.addPage();
      doc.fillColor("#000000");

      // Quốc hiệu: 13pt in hoa in đậm căn giữa
      fontB(doc).fontSize(13);
      doc.text("CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM", MARGIN_LEFT, MARGIN_TOP, { width: CONTENT_WIDTH, align: "center" });

      // Tiêu ngữ: 14pt viết hoa đầu, in đậm, căn giữa
      fontB(doc).fontSize(14);
      doc.text("Độc lập – Tự do – Hạnh phúc", MARGIN_LEFT, doc.y, { width: CONTENT_WIDTH, align: "center" });
      doc.moveDown(0.15);

      // Gạch ngang = đúng chiều dài chữ tiêu ngữ
      const tnText = "Độc lập – Tự do – Hạnh phúc";
      const tnW = fontB(doc).fontSize(14).widthOfString(tnText);
      const tnX = (PAGE_WIDTH - tnW) / 2;
      doc.moveTo(tnX, doc.y).lineTo(tnX + tnW, doc.y).lineWidth(0.75).strokeColor("#000").stroke();

      doc.moveDown(1.5);

      // Tiêu đề hợp đồng: 15pt in hoa in đậm căn giữa
      fontB(doc).fontSize(15);
      doc.text("HỢP ĐỒNG MUA BÁN VÀNG TÍCH LŨY ĐIỆN TỬ", MARGIN_LEFT, doc.y, { width: CONTENT_WIDTH, align: "center" });
      doc.moveDown(0.2);
      fontI(doc).fontSize(FONT_BODY);
      doc.text(`Số: ${data.contractId || "ORD-UNKNOWN"}`, MARGIN_LEFT, doc.y, { width: CONTENT_WIDTH, align: "center" });

      doc.moveDown(1);

      // Căn cứ pháp lý
      fontI(doc).fontSize(FONT_BODY);
      doc.text("– Căn cứ Bộ luật Dân sự số 91/2015/QH13 ngày 24 tháng 11 năm 2015;", { width: CONTENT_WIDTH, lineGap: LINE_GAP, align: "left" });
      doc.text("– Căn cứ Luật Thương mại số 36/2005/QH11 ngày 14 tháng 6 năm 2005;", { width: CONTENT_WIDTH, lineGap: LINE_GAP, align: "left" });
      doc.text("– Căn cứ Luật Bảo vệ quyền lợi người tiêu dùng số 19/2023/QH15;", { width: CONTENT_WIDTH, lineGap: LINE_GAP, align: "left" });
      doc.text("– Căn cứ Luật Giao dịch điện tử số 20/2023/QH15;", { width: CONTENT_WIDTH, lineGap: LINE_GAP, align: "left" });
      doc.text("– Căn cứ nhu cầu và sự thỏa thuận tự nguyện của các Bên.", { width: CONTENT_WIDTH, lineGap: LINE_GAP, align: "left" });

      doc.moveDown(0.5);
      fontR(doc).fontSize(FONT_BODY);
      doc.text(`Hôm nay, ngày ${day} tháng ${month} năm ${year}, tại trụ sở Công ty Cổ phần GoldChain, chúng tôi gồm có:`, { width: CONTENT_WIDTH, lineGap: LINE_GAP, align: "justify" });

      doc.moveDown(0.8);

      // --- BÊN A ---
      fontB(doc).fontSize(FONT_HEADING);
      doc.text("BÊN A (BÊN BÁN): CÔNG TY CỔ PHẦN GOLDCHAIN", { width: CONTENT_WIDTH, align: "left" });
      doc.y += PARA_AFTER;
      bodyL(doc, "Trụ sở chính: Tầng 15, Tòa nhà Lotte Center, 54 Liễu Giai, Ba Đình, Hà Nội.");
      bodyL(doc, "Mã số thuế: 0109876543.");
      bodyL(doc, "Đại diện: Ông Nguyễn Văn A – Chức vụ: Tổng Giám đốc.");
      bodyL(doc, "Điện thoại: 1900 6868 – Email: support@goldchain.vn.");
      bodyL(doc, "Số tài khoản: 123456789 – Ngân hàng Vietcombank, Chi nhánh Hà Nội.");

      doc.moveDown(0.5);

      // --- BÊN B ---
      fontB(doc).fontSize(FONT_HEADING);
      doc.text("BÊN B (BÊN MUA): KHÁCH HÀNG", { width: CONTENT_WIDTH, align: "left" });
      doc.y += PARA_AFTER;
      bodyL(doc, `Họ và tên: ${data.name || "___________________________"}.`);

      const cccdLine = data.cccd
        ? `CCCD/CMND/Hộ chiếu số: ${data.cccd}${data.cccdIssuedDate ? `, cấp ngày ${data.cccdIssuedDate}` : ""}${data.cccdIssuedPlace ? ` tại ${data.cccdIssuedPlace}` : ""}.`
        : "CCCD/CMND/Hộ chiếu số: _______________, cấp ngày ___/___/______ tại ________________.";
      bodyL(doc, cccdLine);
      bodyL(doc, `Số điện thoại: ${data.phone || "___________________________"}.`);
      bodyL(doc, `Email: ${data.email || "___________________________"}.`);
      const addrLine = data.address
        ? `Địa chỉ thường trú: ${data.address}.`
        : "Địa chỉ thường trú: ________________________________________________.";
      bodyL(doc, addrLine);

      doc.moveDown(0.5);
      fontI(doc).fontSize(FONT_BODY);
      doc.text("Hai Bên thống nhất ký kết hợp đồng mua bán vàng tích lũy điện tử với các điều khoản cụ thể sau đây:", { width: CONTENT_WIDTH, lineGap: LINE_GAP, align: "justify" });
      doc.moveDown(0.8);

      // ==============================================================
      // CÁC ĐIỀU KHOẢN - Chảy liên tục, KHÔNG ép page break
      // ==============================================================

      // ĐIỀU 1
      tocPages["d1"] = doc.bufferedPageRange().start + doc.bufferedPageRange().count - 1;
      heading(doc, "Điều 1. ĐỐI TƯỢNG HỢP ĐỒNG");
      const prodDesc = data.goldType ? `Vàng tích lũy thương hiệu ${data.goldType} ép vỉ` : "Vàng tích lũy thương hiệu Nhẫn tròn trơn SJC 9999 ép vỉ";
      bodyJ(doc, `1.1. Sản phẩm giao dịch mua bán: ${prodDesc}.`);
      bodyJ(doc, `1.2. Số lượng: ${data.quantity || "___"} chỉ.`);
      bodyJ(doc, `1.3. Loại giao dịch: ${isBuy ? "Mua" : "Bán"} vàng tích lũy trực tuyến.`);

      // ĐIỀU 2
      tocPages["d2"] = doc.bufferedPageRange().start + doc.bufferedPageRange().count - 1;
      heading(doc, "Điều 2. GIÁ CẢ VÀ PHƯƠNG THỨC THANH TOÁN");
      bodyJ(doc, `2.1. Đơn giá tại thời điểm khớp lệnh: ${formatVND(data.price)} VND/lượng.`);
      if (feeInfo.hasFee && feeInfo.fee > 0 && feeInfo.fee < parseNum(data.total)) {
        bodyJ(doc, `2.2. Tổng giá trị thanh toán của hợp đồng: ${formatVND(data.total)} VND (Giá trị này đã bao gồm ${formatVND(feeInfo.fee)} VND tiền phí giao dịch, phí nền tảng hoặc các loại thuế phí khác theo quy định của hệ thống).`);
      } else {
        bodyJ(doc, `2.2. Tổng giá trị thanh toán của hợp đồng: ${formatVND(data.total)} VND.`);
      }
      bodyJ(doc, "2.3. Phương thức thanh toán: Khấu trừ/cộng trực tiếp vào Ví VND trực tuyến của Bên Mua trên ứng dụng GoldChain.");

      // ĐIỀU 3
      tocPages["d3"] = doc.bufferedPageRange().start + doc.bufferedPageRange().count - 1;
      heading(doc, "Điều 3. CHẤT LƯỢNG, ĐÓNG GÓI VÀ GIAO NHẬN");
      bodyJ(doc, "3.1. Bên Bán cam kết cung cấp sản phẩm vàng vật chất chính hãng 100%, đạt tiêu chuẩn chất lượng niêm yết tại thời điểm giao dịch.");
      bodyJ(doc, "3.2. Sản phẩm vàng vật chất được đóng gói niêm phong nguyên bản nhà sản xuất (SJC/PNJ/DOJI).");
      bodyJ(doc, "3.3. Vàng giao dịch thành công sẽ ghi nhận vào ví tích lũy của Bên Mua. Bên Mua có quyền rút nhận vàng vật chất tỷ lệ 1:1 tại quầy giao dịch được ủy quyền.");

      // ĐIỀU 4
      tocPages["d4"] = doc.bufferedPageRange().start + doc.bufferedPageRange().count - 1;
      heading(doc, "Điều 4. QUYỀN VÀ NGHĨA VỤ CỦA BÊN BÁN");
      bodyJ(doc, "4.1. Bảo chứng đầy đủ 100% lượng vàng vật chất tương ứng trong kho ký gửi được kiểm toán định kỳ bởi đơn vị kiểm toán độc lập.");
      bodyJ(doc, "4.2. Bảo mật thông tin cá nhân và dữ liệu giao dịch của Bên Mua theo quy định pháp luật về bảo vệ dữ liệu cá nhân.");
      bodyJ(doc, "4.3. Duy trì hoạt động ổn định của hệ thống giao dịch trực tuyến, đảm bảo tính sẵn sàng 24/7.");
      bodyJ(doc, "4.4. Thông báo kịp thời cho Bên Mua khi có sự thay đổi về điều kiện giao dịch, biểu phí hoặc chính sách bảo hành.");

      // ĐIỀU 5
      tocPages["d5"] = doc.bufferedPageRange().start + doc.bufferedPageRange().count - 1;
      heading(doc, "Điều 5. QUYỀN VÀ NGHĨA VỤ CỦA BÊN MUA");
      bodyJ(doc, "5.1. Thanh toán đầy đủ giá trị hợp đồng theo quy định của hệ thống tại thời điểm khớp lệnh.");
      bodyJ(doc, "5.2. Cung cấp thông tin định danh eKYC chính xác, trung thực; tự bảo mật tài khoản cá nhân và chịu trách nhiệm về mọi giao dịch phát sinh từ tài khoản của mình.");
      bodyJ(doc, "5.3. Được quyền tự do mua, bán, rút hoặc chuyển nhượng số vàng sở hữu hợp pháp theo quy chế giao dịch của hệ thống.");

      // ĐIỀU 6
      tocPages["d6"] = doc.bufferedPageRange().start + doc.bufferedPageRange().count - 1;
      heading(doc, "Điều 6. BẢO HÀNH SẢN PHẨM");
      bodyJ(doc, "6.1. Bên Bán cam kết đảm bảo chuẩn tuổi vàng và trọng lượng đối với sản phẩm theo đúng niêm yết của thương hiệu phát hành. Tuy nhiên, Bên Bán có quyền từ chối trách nhiệm nếu sản phẩm khi khách hàng rút vật chất bị biến dạng, móp méo hoặc không còn nguyên vỉ nilon niêm phong nguyên bản của nhà sản xuất.");
      bodyJ(doc, "6.2. Hỗ trợ kiểm định chất lượng miễn phí tại hệ thống quầy giao dịch được ủy quyền.");

      // ĐIỀU 7
      tocPages["d7"] = doc.bufferedPageRange().start + doc.bufferedPageRange().count - 1;
      heading(doc, "Điều 7. CHUYỂN GIAO RỦI RO VÀ QUYỀN SỞ HỮU");
      bodyJ(doc, "7.1. Quyền sở hữu được chuyển giao ngay sau khi giao dịch khớp lệnh thành công và được ghi nhận trên sổ cái Blockchain.");
      bodyJ(doc, "7.2. Rủi ro đối với vàng lưu ký trong kho do Bên Bán chịu hoàn toàn cho đến khi Bên Mua rút vàng vật chất tại quầy giao dịch.");

      // ĐIỀU 8
      tocPages["d8"] = doc.bufferedPageRange().start + doc.bufferedPageRange().count - 1;
      heading(doc, "Điều 8. BẢO MẬT THÔNG TIN");
      bodyJ(doc, "8.1. Hai bên cam kết bảo mật mọi thông tin cá nhân, tài khoản ngân hàng và lịch sử giao dịch phát sinh từ hợp đồng này, tuân thủ Luật Bảo vệ dữ liệu cá nhân và các quy định liên quan.");
      bodyJ(doc, "8.2. Thông tin chỉ được tiết lộ khi có yêu cầu bằng văn bản từ cơ quan Nhà nước có thẩm quyền theo pháp luật Việt Nam.");

      // ĐIỀU 9
      tocPages["d9"] = doc.bufferedPageRange().start + doc.bufferedPageRange().count - 1;
      heading(doc, "Điều 9. XỬ LÝ VI PHẠM HỢP ĐỒNG");
      bodyJ(doc, "9.1. Bên vi phạm bất kỳ điều khoản nào phải bồi thường toàn bộ thiệt hại thực tế phát sinh cho bên kia theo quy định pháp luật.");
      bodyJ(doc, "9.2. Trường hợp hệ thống gặp sự cố ngoài tầm kiểm soát, hai bên ưu tiên hoàn trả nguyên trạng số dư trước giao dịch.");

      // ĐIỀU 10
      tocPages["d10"] = doc.bufferedPageRange().start + doc.bufferedPageRange().count - 1;
      heading(doc, "Điều 10. SỰ KIỆN BẤT KHẢ KHÁNG");
      bodyJ(doc, "10.1. Sự kiện bất khả kháng bao gồm thiên tai, chiến tranh, thay đổi luật pháp đột ngột, các sự cố đứt cáp quang mạng diện rộng, lỗi mạng lưới Blockchain toàn cầu, hoặc các cuộc tấn công an ninh mạng (hacker) nhằm vào hệ thống máy chủ lưu trữ dữ liệu.");
      bodyJ(doc, "10.2. Bên gặp sự kiện bất khả kháng được miễn trách nhiệm nếu đã áp dụng mọi biện pháp khắc phục nhưng không hiệu quả, và phải thông báo cho bên kia trong vòng 72 giờ kể từ khi sự kiện xảy ra.");

      // ĐIỀU 11
      tocPages["d11"] = doc.bufferedPageRange().start + doc.bufferedPageRange().count - 1;
      heading(doc, "Điều 11. GIẢI QUYẾT TRANH CHẤP");
      bodyJ(doc, "11.1. Hợp đồng này được điều chỉnh theo pháp luật nước Cộng hòa Xã hội Chủ nghĩa Việt Nam.");
      bodyJ(doc, "11.2. Tranh chấp được giải quyết qua thương lượng, hòa giải. Nếu không thành, đưa ra Tòa án Nhân dân có thẩm quyền tại Thành phố Hà Nội để giải quyết.");

      // ĐIỀU 12
      tocPages["d12"] = doc.bufferedPageRange().start + doc.bufferedPageRange().count - 1;
      heading(doc, "Điều 12. ĐIỀU KHOẢN CHUNG");
      bodyJ(doc, "12.1. Hợp đồng này được ký kết dưới hình thức điện tử, tự động khớp lệnh và lưu trữ dữ liệu. Hai bên công nhận giá trị pháp lý tương đương bản giấy theo Luật Giao dịch điện tử số 20/2023/QH15.");
      bodyJ(doc, "12.2. Hợp đồng có hiệu lực ngay khi giao dịch khớp lệnh thành công và xác nhận qua email.");
      bodyJ(doc, "12.3. Hợp đồng được lập thành 02 bản điện tử có giá trị ngang nhau, mỗi Bên giữ 01 bản.");

      // ==============================================================
      // KHỐI CHỮ KÝ
      // ==============================================================
      doc.moveDown(2);
      ensureSpace(doc, 150);

      const sigY = doc.y;
      const colW = CONTENT_WIDTH / 2;

      fontB(doc).fontSize(FONT_BODY);
      doc.text("ĐẠI DIỆN BÊN A", MARGIN_LEFT, sigY, { width: colW, align: "center" });
      doc.text("ĐẠI DIỆN BÊN B", MARGIN_LEFT + colW, sigY, { width: colW, align: "center" });

      fontI(doc).fontSize(FONT_SMALL);
      doc.text("(Ký tên, đóng dấu)", MARGIN_LEFT, sigY + 20, { width: colW, align: "center" });
      doc.text("(Ký tên)", MARGIN_LEFT + colW, sigY + 20, { width: colW, align: "center" });

      fontI(doc).fontSize(FONT_SMALL).fillColor("#B38728");
      doc.text("Đã ký bằng chữ ký số", MARGIN_LEFT, sigY + 65, { width: colW, align: "center" });
      doc.text("Đã xác thực điện tử", MARGIN_LEFT + colW, sigY + 65, { width: colW, align: "center" });

      fontB(doc).fontSize(FONT_BODY).fillColor("#000");
      doc.text("CÔNG TY CP GOLDCHAIN", MARGIN_LEFT, sigY + 100, { width: colW, align: "center" });
      doc.text((data.name || "KHÁCH HÀNG").toUpperCase(), MARGIN_LEFT + colW, sigY + 100, { width: colW, align: "center" });

      // ==============================================================
      // SECOND PASS: Điền MỤC LỤC (trang 2) với số trang thực tế
      // ==============================================================
      doc.switchToPage(1);
      doc.y = MARGIN_TOP;
      doc.fillColor("#000000");

      fontB(doc).fontSize(18);
      doc.text("MỤC LỤC", MARGIN_LEFT, doc.y, { width: CONTENT_WIDTH, align: "center" });
      doc.moveDown(1.5);

      const tocEntries = [
        { key: "d1",  label: "Điều 1.  Đối tượng hợp đồng" },
        { key: "d2",  label: "Điều 2.  Giá cả và phương thức thanh toán" },
        { key: "d3",  label: "Điều 3.  Chất lượng, đóng gói và giao nhận" },
        { key: "d4",  label: "Điều 4.  Quyền và nghĩa vụ của Bên Bán" },
        { key: "d5",  label: "Điều 5.  Quyền và nghĩa vụ của Bên Mua" },
        { key: "d6",  label: "Điều 6.  Bảo hành sản phẩm" },
        { key: "d7",  label: "Điều 7.  Chuyển giao rủi ro và quyền sở hữu" },
        { key: "d8",  label: "Điều 8.  Bảo mật thông tin" },
        { key: "d9",  label: "Điều 9.  Xử lý vi phạm hợp đồng" },
        { key: "d10", label: "Điều 10. Sự kiện bất khả kháng" },
        { key: "d11", label: "Điều 11. Giải quyết tranh chấp" },
        { key: "d12", label: "Điều 12. Điều khoản chung" }
      ];

      fontR(doc).fontSize(FONT_BODY);
      const dotChar = ".";

      tocEntries.forEach(({ key, label }) => {
        // Page index 1 is Page 1 (TOC page), Page index 2 is Page 2... so pageNum is exactly tocPages[key]
        const pageNum = (tocPages[key] !== undefined ? tocPages[key] : "?").toString();
        const labelWidth = fontR(doc).fontSize(FONT_BODY).widthOfString(label);
        const numWidth = fontR(doc).fontSize(FONT_BODY).widthOfString(pageNum);
        const dotsWidth = CONTENT_WIDTH - labelWidth - numWidth - 10;
        const singleDotW = fontR(doc).fontSize(FONT_BODY).widthOfString(dotChar);
        const dotCount = Math.max(0, Math.floor(dotsWidth / singleDotW));
        const dots = dotChar.repeat(dotCount);

        const y = doc.y;
        fontR(doc).fontSize(FONT_BODY);
        doc.text(label, MARGIN_LEFT, y, { continued: true, width: CONTENT_WIDTH });
        doc.text(" " + dots + " ", { continued: true });
        doc.text(pageNum);
        doc.y += 4;
      });

      // ==============================================================
      // THIRD PASS: Đánh số trang ở footer giữa trang
      // ==============================================================
      const totalPages = doc.bufferedPageRange().count;
      const footerY = PAGE_HEIGHT - MARGIN_BOTTOM + 20;

      for (let i = 0; i < totalPages; i++) {
        doc.switchToPage(i);
        if (i === 0) continue; // Không đánh số trang bìa (index 0)

        // Tạm thời bỏ margin bottom để việc ghi số trang ở dưới lề không kích hoạt ngắt trang tự động tạo thêm trang trắng
        doc.page.margins.bottom = 0;

        fontR(doc).fontSize(10).fillColor("#666");
        doc.text(
          `– ${i} –`,
          MARGIN_LEFT,
          footerY,
          { width: CONTENT_WIDTH, align: "center" }
        );
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
