import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
<<<<<<< Updated upstream

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['@supabase/supabase-js', 'tslib']
  },
  build: {
    chunkSizeWarningLimit: 1000,
  }
=======
import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';

function generateContractPDF(data) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', err => reject(err));

      // Resolve Windows system font paths
      const fontRegular = 'C:\\Windows\\Fonts\\times.ttf';
      const fontBold = 'C:\\Windows\\Fonts\\timesbd.ttf';
      const fontItalic = 'C:\\Windows\\Fonts\\timesi.ttf';

      // Check if windows font files exist, else fallback to basic Helvetica
      const hasFonts = fs.existsSync(fontRegular) && fs.existsSync(fontBold) && fs.existsSync(fontItalic);
      if (hasFonts) {
        doc.registerFont('VN-Regular', fontRegular);
        doc.registerFont('VN-Bold', fontBold);
        doc.registerFont('VN-Italic', fontItalic);
        doc.font('VN-Regular');
      } else {
        console.warn('⚠️ Times New Roman fonts not found at C:\\Windows\\Fonts. Falling back to default PDF fonts.');
      }

      const getFont = (style) => {
        if (!hasFonts) {
          if (style === 'bold') return 'Helvetica-Bold';
          if (style === 'italic') return 'Helvetica-Oblique';
          return 'Helvetica';
        }
        if (style === 'bold') return 'VN-Bold';
        if (style === 'italic') return 'VN-Italic';
        return 'VN-Regular';
      };

      // ----------------------------------------------------
      // COVER PAGE (BÌA HỢP ĐỒNG)
      // ----------------------------------------------------
      doc.lineWidth(1);
      doc.rect(40, 40, doc.page.width - 80, doc.page.height - 80).stroke();
      doc.rect(43, 43, doc.page.width - 86, doc.page.height - 86).stroke();

      doc.moveDown(4);
      doc.font(getFont('bold')).fontSize(14).text('📖  ✍️', { align: 'center' });
      doc.moveDown(3);

      doc.font(getFont('bold')).fontSize(24).text('HỢP ĐỒNG MUA BÁN VÀNG', { align: 'center' });
      doc.moveDown(0.3);
      doc.fontSize(16).text(data.type === 'buy' ? 'TÍCH LŨY ĐIỆN TỬ' : 'TÍCH LŨY TRỰC TUYẾN', { align: 'center' });
      doc.moveDown(3);

      doc.font(getFont('italic')).fontSize(13).text('GIỮA', { align: 'center' });
      doc.moveDown(2);

      doc.font(getFont('bold')).fontSize(13).text('CÔNG TY CỔ PHẦN GOLDCHAIN', { align: 'center' });
      doc.moveDown(2);

      doc.font(getFont('italic')).fontSize(13).text('VÀ', { align: 'center' });
      doc.moveDown(2);

      doc.font(getFont('bold')).fontSize(13).text((data.name || 'KHÁCH HÀNG').toUpperCase(), { align: 'center' });
      doc.moveDown(4);

      doc.font(getFont('regular')).fontSize(13).text(`SỐ HĐ: ${data.contractId}`, { align: 'center' });
      doc.moveDown(0.5);
      
      const d = new Date();
      doc.text(`Ngày ${d.getDate()} tháng ${d.getMonth() + 1} năm ${d.getFullYear()}`, { align: 'center' });

      // Enable automatic borders for subsequent pages
      doc.on('pageAdded', () => {
        doc.lineWidth(0.5);
        doc.rect(40, 40, doc.page.width - 80, doc.page.height - 80).stroke();
      });

      // ----------------------------------------------------
      // PAGE 2: CONTRACT TEXT
      // ----------------------------------------------------
      doc.addPage();

      // Quốc hiệu tiêu ngữ
      doc.font(getFont('bold')).fontSize(13).text('CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM', { align: 'center' });
      doc.font(getFont('bold')).fontSize(13).text('Độc lập – Tự do – Hạnh phúc', { align: 'center' });
      doc.moveDown(0.2);
      doc.font(getFont('regular')).fontSize(13).text('----------------', { align: 'center' });
      doc.moveDown(1);

      // Contract Title
      doc.font(getFont('bold')).fontSize(15).text('HỢP ĐỒNG MUA BÁN VÀNG TÍCH LŨY', { align: 'center' });
      doc.font(getFont('regular')).fontSize(13).text(`Số: ${data.contractId}`, { align: 'center' });
      doc.moveDown(1.5);

      // Base clauses (Căn cứ)
      const bases = [
        '- Căn cứ Bộ luật Dân sự số 91/2015/QH13 ngày 24 tháng 11 năm 2015;',
        '- Căn cứ Luật Thương mại số 36/2005/QH11 ngày 14 tháng 6 năm 2005;',
        '- Căn cứ Luật Bảo vệ quyền lợi người tiêu dùng số 19/2023/QH15 ngày 20 tháng 6 năm 2023;',
        '- Căn cứ nhu cầu và sự thỏa thuận tự nguyện của các Bên.'
      ];
      bases.forEach(b => {
        doc.font(getFont('italic')).fontSize(13).text(b, { align: 'left', indent: 15 });
      });
      doc.moveDown(1.5);

      // Opening
      doc.font(getFont('regular')).fontSize(13).text(`Hôm nay, ngày ${d.getDate()} tháng ${d.getMonth() + 1} năm ${d.getFullYear()}, tại văn phòng Công ty Cổ phần GoldChain, chúng tôi gồm:`, { align: 'justify' });
      doc.moveDown(1);

      // Bên A
      doc.font(getFont('bold')).fontSize(13).text('BÊN A: BÊN BÁN (CÔNG TY CỔ PHẦN GOLDCHAIN)');
      doc.font(getFont('regular')).fontSize(13);
      doc.text('• Trụ sở chính: Tầng 15, Tòa nhà Lotte Center, 54 Liễu Giai, Phường Cống Vị, Quận Ba Đình, Hà Nội.');
      doc.text('• Mã số thuế: 0109876543');
      doc.text('• Đại diện bởi: Ông Nguyễn Văn A     Chức vụ: Tổng Giám đốc');
      doc.text('• Điện thoại: 1900 6868     Email: support@goldchain.vn');
      doc.text('• Số tài khoản: 123456789 tại Vietcombank - Chi nhánh Hà Nội');
      doc.moveDown(1);

      // Bên B
      doc.font(getFont('bold')).fontSize(13).text('BÊN B: BÊN MUA (KHÁCH HÀNG)');
      doc.font(getFont('regular')).fontSize(13);
      doc.text(`• Họ và tên: ${data.name}`);
      doc.text(`• CCCD/CMND số: ${data.cccd || 'Đã xác thực eKYC trực tuyến'}`);
      doc.text(`• Số điện thoại: ${data.phone || 'Đã liên kết hệ thống'}`);
      doc.text(`• Email liên kết: ${data.email}`);
      doc.text('• Địa chỉ: Theo thông tin eKYC đã đăng ký trên hệ thống GoldChain.');
      doc.moveDown(1.5);

      doc.font(getFont('regular')).fontSize(13).text('Hai Bên thống nhất ký kết hợp đồng mua bán này với các điều khoản cụ thể sau đây:', { align: 'justify' });
      doc.moveDown(1.5);

      // Write Clause helper functions
      const writeClauseHeader = (title) => {
        doc.font(getFont('bold')).fontSize(13).text(title);
        doc.moveDown(0.3);
      };

      const writeClauseText = (text) => {
        doc.font(getFont('regular')).fontSize(13).text(text, { align: 'justify', indent: 15 });
        doc.moveDown(0.5);
      };

      // --- 12 CLAUSES ---
      writeClauseHeader('ĐIỀU 1. ĐỐI TƯỢNG HỢP ĐỒNG');
      writeClauseText(`1.1. Sản phẩm giao dịch mua bán: Vàng tích lũy thương hiệu ${data.goldType}.`);
      writeClauseText(`1.2. Số lượng giao dịch: ${data.quantity}.`);
      writeClauseText(`1.3. Loại giao dịch: Giao dịch ${data.type === 'buy' ? 'Mua vàng tích lũy trực tuyến' : 'Bán vàng tích lũy trực tuyến'} hệ thống.`);

      writeClauseHeader('ĐIỀU 2. GIÁ CẢ VÀ PHƯƠNG THỨC THANH TOÁN');
      writeClauseText(`2.1. Đơn giá giao dịch tại thời điểm khớp lệnh thành công: ${data.price} VND/chỉ.`);
      writeClauseText(`2.2. Tổng giá trị thanh toán của hợp đồng: ${data.total} VND.`);
      writeClauseText('2.3. Phương thức thanh toán: Thanh toán trực tuyến bằng cách khấu trừ hoặc cộng số dư vào Ví VND trực tuyến của khách hàng trên ứng dụng GoldChain.');

      writeClauseHeader('ĐIỀU 3. CHẤT LƯỢNG, SỐ LƯỢNG, ĐÓNG GÓI VÀ GIAO NHẬN VÀNG');
      writeClauseText('3.1. Chất lượng: Bên Bán cam kết cung cấp sản phẩm vàng vật chất chuẩn chính hãng 100% đạt tiêu chuẩn chất lượng niêm yết.');
      writeClauseText('3.2. Đóng gói: Sản phẩm vàng vật chất được đóng gói niêm phong nguyên bản của nhà sản xuất (SJC/PNJ/DOJI).');
      writeClauseText('3.3. Giao nhận: Vàng giao dịch thành công sẽ ghi nhận trực tuyến vào ví tích lũy của Bên Mua. Bên Mua có quyền thực hiện yêu cầu rút nhận vàng vật chất tỷ lệ 1:1 trực tiếp tại bất kỳ quầy giao dịch được ủy quyền nào của Bên Bán.');

      writeClauseHeader('ĐIỀU 4. QUYỀN VÀ NGHĨA VỤ CỦA BÊN BÁN');
      writeClauseText('4.1. Bên Bán có trách nhiệm bảo chứng đầy đủ 100% lượng vàng vật chất tương ứng trong kho ký gửi để bàn giao cho Bên Mua khi Bên Mua có yêu cầu rút.');
      writeClauseText('4.2. Bảo mật thông tin cá nhân và dữ liệu giao dịch của Bên Mua.');
      writeClauseText('4.3. Duy trì hoạt động ổn định của hệ thống giao dịch trực tuyến.');

      writeClauseHeader('ĐIỀU 5. QUYỀN VÀ NGHĨA VỤ CỦA BÊN MUA');
      writeClauseText('5.1. Bên Mua có nghĩa vụ thanh toán đầy đủ giá trị hợp đồng theo quy định của hệ thống.');
      writeClauseText('5.2. Cung cấp thông tin định danh eKYC chính xác và tự bảo mật thông tin tài khoản cá nhân.');
      writeClauseText('5.3. Được quyền tự do mua, bán, rút hoặc chuyển nhượng số vàng sở hữu hợp pháp.');

      writeClauseHeader('ĐIỀU 6. BẢO HÀNH');
      writeClauseText('6.1. Bên Bán cam kết bảo hành chất lượng sản phẩm vàng trọn đời đối với tất cả vàng miếng và vàng nhẫn được phát hành bởi các thương hiệu đối tác.');
      writeClauseText('6.2. Hỗ trợ kiểm định chất lượng miễn phí cho Bên Mua tại hệ thống quầy giao dịch.');

      writeClauseHeader('ĐIỀU 7. CHUYỂN GIAO RỦI RO VÀ QUYỀN SỞ HỮU');
      writeClauseText('7.1. Quyền sở hữu đối với số vàng giao dịch sẽ được chuyển giao từ Bên Bán sang Bên Mua ngay sau khi giao dịch khớp lệnh thành công và được ghi nhận trên sổ cái Blockchain.');
      writeClauseText('7.2. Rủi ro đối với vàng lưu ký trong kho được chịu hoàn toàn bởi Bên Bán cho đến khi Bên Mua thực hiện rút vàng vật chất thực tế tại quầy.');

      writeClauseHeader('ĐIỀU 8. BẢO MẬT THÔNG TIN');
      writeClauseText('8.1. Hai bên cam kết bảo mật mọi thông tin cá nhân, tài khoản ngân hàng và lịch sử giao dịch phát sinh từ hợp đồng này.');
      writeClauseText('8.2. Thông tin chỉ được tiết lộ khi có yêu cầu bằng văn bản từ cơ quan Nhà nước có thẩm quyền theo quy định của pháp luật Việt Nam.');

      writeClauseHeader('ĐIỀU 9. XỬ LÝ VI PHẠM HỢP ĐỒNG');
      writeClauseText('9.1. Nếu một bên vi phạm bất kỳ điều khoản nào của hợp đồng này thì phải bồi thường toàn bộ thiệt hại thực tế phát sinh cho bên kia.');
      writeClauseText('9.2. Trường hợp hệ thống gặp sự cố giao dịch ngoài tầm kiểm soát, hai bên đồng ý ưu tiên hoàn trả nguyên trạng thái số dư trước giao dịch.');

      writeClauseHeader('ĐIỀU 10. BẤT KHẢ KHÁNG');
      writeClauseText('10.1. Sự kiện bất khả kháng bao gồm thiên tai, chiến tranh, thay đổi luật pháp đột ngột hoặc các sự cố kỹ thuật hạ tầng mạng internet quốc gia diện rộng.');
      writeClauseText('10.2. Bên gặp sự kiện bất khả kháng được miễn trách nhiệm nếu chứng minh được đã áp dụng mọi biện pháp khắc phục cần thiết nhưng không hiệu quả.');

      writeClauseHeader('ĐIỀU 11. GIẢI QUYẾT TRANH CHẤP VÀ LUẬT ÁP DỤNG');
      writeClauseText('11.1. Hợp đồng này được điều chỉnh và giải thích theo quy định của pháp luật nước Cộng hòa Xã hội Chủ nghĩa Việt Nam.');
      writeClauseText('11.2. Mọi tranh chấp phát sinh sẽ được giải quyết trước tiên qua thương lượng, hòa giải. Nếu không giải quyết được, tranh chấp sẽ được đưa ra giải quyết tại Tòa án Nhân dân có thẩm quyền tại Thành phố Hà Nội.');

      writeClauseHeader('ĐIỀU 12. ĐIỀU KHOẢN CHUNG');
      writeClauseText('12.1. Hợp đồng này được ký dưới hình thức hợp đồng điện tử thông minh, tự động khớp và lưu trữ dữ liệu. Hai bên công nhận giá trị pháp lý tuyệt đối của phiên bản này.');
      writeClauseText('12.2. Hợp đồng có hiệu lực lập tức kể từ thời điểm giao dịch khớp lệnh thành công và được xác nhận gửi qua email này.');

      doc.moveDown(1.5);

      // Signatures layout
      const sigTop = doc.y;
      
      // Prevent signature wrapping awkwardly at page bottom
      if (sigTop > 650) {
        doc.addPage();
      }

      const currentSigY = doc.y;
      doc.font(getFont('bold')).fontSize(13);
      doc.text('ĐẠI DIỆN BÊN A (BÊN BÁN)', 60, currentSigY);
      doc.text('ĐẠI DIỆN BÊN B (BÊN MUA)', 350, currentSigY);

      doc.font(getFont('italic')).fontSize(11);
      doc.text('(Đã ký bằng chữ ký số hệ thống)', 60, currentSigY + 20);
      doc.text('(Đã xác thực chữ ký điện tử)', 350, currentSigY + 20);

      doc.font(getFont('bold')).fontSize(13);
      doc.text('CÔNG TY CỔ PHẦN GOLDCHAIN', 60, currentSigY + 45);
      doc.text((data.name || 'KHÁCH HÀNG').toUpperCase(), 350, currentSigY + 45);

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      react(),
      {
        name: 'smtp-email-sender',
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            const url = req.url.split('?')[0];
            if (url === '/api/send-email' && (req.method === 'POST' || req.method === 'OPTIONS')) {
              // Enable CORS
              res.setHeader('Access-Control-Allow-Origin', '*');
              res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
              res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

              if (req.method === 'OPTIONS') {
                res.writeHead(204);
                res.end();
                return;
              }

              let body = '';
              req.on('data', chunk => { body += chunk; });
              req.on('end', async () => {
                try {
                  const data = JSON.parse(body);
                  const { to, subject, templateName, templateData } = data;

                  if (!to || !subject || !templateName) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, error: 'Thiếu thông tin người nhận, tiêu đề hoặc tên mẫu.' }));
                    return;
                  }

                  // Read template from TemplateMail folder
                  const templatePath = path.resolve(process.cwd(), 'TemplateMail', `${templateName}.html`);
                  if (!fs.existsSync(templatePath)) {
                    res.writeHead(404, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, error: `Không tìm thấy mẫu email: ${templateName}` }));
                    return;
                  }

                  let html = fs.readFileSync(templatePath, 'utf8');

                  // Replace templating parameters {{param}}
                  if (templateData) {
                    Object.entries(templateData).forEach(([key, val]) => {
                      html = html.replaceAll(`{{${key}}}`, val || '');
                    });
                  }

                  // Get SMTP configurations
                  const host = env.SMTP_HOST || 'smtp.ethereal.email';
                  const port = parseInt(env.SMTP_PORT || '587');
                  const secure = env.SMTP_SECURE === 'true';
                  let user = env.SMTP_USER;
                  let pass = env.SMTP_PASS;
                  let mailFrom = env.SMTP_FROM || 'GoldChain Support <noreply@goldchain.vn>';

                  let transporter;
                  let testUrl = null;

                  if (!user || user === 'your_email@gmail.com') {
                    // Falls back to Ethereal Email if not defined in .env
                    console.log('⚠️ SMTP credentials not configured. Generating Ethereal Test Account...');
                    const testAccount = await nodemailer.createTestAccount();
                    transporter = nodemailer.createTransport({
                      host: testAccount.smtp.host,
                      port: testAccount.smtp.port,
                      secure: testAccount.smtp.secure,
                      auth: {
                        user: testAccount.user,
                        pass: testAccount.pass
                      }
                    });
                    mailFrom = `GoldChain Demo <${testAccount.user}>`;
                  } else {
                    transporter = nodemailer.createTransport({
                      host,
                      port,
                      secure,
                      auth: { user, pass }
                    });
                  }

                  let attachments = [];
                  if (templateName === 'HopDongMua' || templateName === 'HopDongBan') {
                    try {
                      const pdfBuffer = await generateContractPDF(templateData);
                      attachments.push({
                        filename: `HopDong_${templateData.contractId}.pdf`,
                        content: pdfBuffer,
                        contentType: 'application/pdf'
                      });
                      console.log(`📄 PDF Contract generated successfully for ${templateData.contractId}`);
                    } catch (pdfErr) {
                      console.error('❌ Error generating PDF contract:', pdfErr);
                    }
                  }

                  const info = await transporter.sendMail({
                    from: mailFrom,
                    to,
                    subject,
                    html,
                    attachments
                  });

                  console.log(`✉️ Email successfully sent to ${to}: ${info.messageId}`);
                  
                  if (!user || user === 'your_email@gmail.com') {
                    testUrl = nodemailer.getTestMessageUrl(info);
                    console.log(`🔗 Ethereal Preview URL: ${testUrl}`);
                  }

                  res.writeHead(200, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ 
                    success: true, 
                    messageId: info.messageId,
                    previewUrl: testUrl
                  }));

                } catch (err) {
                  console.error('❌ Error sending email via SMTP:', err);
                  res.writeHead(500, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ success: false, error: err.message }));
                }
              });
            } else {
              next();
            }
          });
        }
      }
    ],
    optimizeDeps: {
      include: ['@supabase/supabase-js', 'tslib']
    },
    build: {
      chunkSizeWarningLimit: 1000,
    }
  };
>>>>>>> Stashed changes
});
