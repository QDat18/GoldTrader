import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';

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

                  // If it's a contract, we attach the PDF document
                  const isContract = templateName === 'HopDongMua' || templateName === 'HopDongBan';
                  const attachments = [];
                  
                  if (isContract && templateData) {
                    try {
                      const { generateContractPdf } = await import('./src/utils/contractGenerator.js');
                      
                      const pdfBuffer = await generateContractPdf(templateData);
                      
                      attachments.push({
                        filename: `HopDong_${templateData.contractId || 'ORD'}.pdf`,
                        content: pdfBuffer
                      });
                      
                      console.log(`📄 Generated contract PDF for ${templateData.contractId}`);
                    } catch (genErr) {
                      console.error('❌ Error generating contract PDF:', genErr);
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
            } else if (url === '/api/generate-pdf' && (req.method === 'POST' || req.method === 'OPTIONS')) {
              // PDF Contract Generator Endpoint
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
                  const templateData = JSON.parse(body);

                  if (!templateData.contractId) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, error: 'Thiếu mã hợp đồng (contractId).' }));
                    return;
                  }

                  const { generateContractPdf } = await import('./src/utils/contractGenerator.js');
                  const pdfBuffer = await generateContractPdf(templateData);

                  const filename = `HopDong_${templateData.contractId}.pdf`;
                  res.writeHead(200, {
                    'Content-Type': 'application/pdf',
                    'Content-Disposition': `attachment; filename="${filename}"`,
                    'Content-Length': pdfBuffer.length
                  });
                  res.end(pdfBuffer);

                  console.log(`📄 Generated PDF for contract ${templateData.contractId}`);
                } catch (err) {
                  console.error('❌ Error generating PDF:', err);
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
});
