// supabase/functions/send-contract-email/index.ts
// Resend API – gửi email hợp đồng PDF sang Gmail khách hàng
// Deploy: supabase functions deploy send-contract-email

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const {
      contractNumber, recipientEmail, recipientName,
      transactionType, goldName, quantityChi,
      totalAmount, unitPrice, contractDate, orderId, pdfBase64,
    } = await req.json()

    const RESEND_API_KEY   = Deno.env.get('RESEND_API_KEY')
    const EMAIL_FROM_NAME  = Deno.env.get('EMAIL_FROM_NAME')  || 'GoldChain'
    const EMAIL_FROM_ADDR  = Deno.env.get('EMAIL_FROM_ADDRESS') || 'onboarding@resend.dev'

    if (!RESEND_API_KEY) throw new Error('RESEND_API_KEY chưa được cài đặt')

    const fmtVND = (v: number) =>
      new Intl.NumberFormat('vi-VN').format(Math.round(v)) + ' ₫'

    const typeLabel = transactionType === 'buy'  ? 'MUA VÀNG'
                    : transactionType === 'sell' ? 'BÁN VÀNG'
                    : 'RÚT VẬT CHẤT'
    const typeColor = transactionType === 'buy'  ? '#34d399'
                    : transactionType === 'sell' ? '#f87171'
                    : '#fbbf24'

    const fmtDate = contractDate
      ? new Date(contractDate).toLocaleString('vi-VN', {
          day:'2-digit', month:'2-digit', year:'numeric',
          hour:'2-digit', minute:'2-digit'
        })
      : ''

    // Strip data URI prefix nếu có
    let pdfContent = pdfBase64
    if (pdfBase64?.startsWith('data:')) pdfContent = pdfBase64.split(',')[1]

    // ─────────────────────────────────────────────────────────────
    // HTML Email – Premium Gold Theme
    // ─────────────────────────────────────────────────────────────
    const htmlBody = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Hợp Đồng Giao Dịch Vàng – GoldChain</title>
</head>
<body style="margin:0;padding:0;background:#f0ead6;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f0ead6;padding:32px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" border="0"
  style="max-width:600px;background:#0a0a0a;border-radius:16px;overflow:hidden;border:1px solid #3a2e10;">

  <!-- ── HEADER ── -->
  <tr>
    <td style="background:linear-gradient(135deg,#1a1200 0%,#2d1e00 50%,#1a1200 100%);
               padding:44px 40px 36px;text-align:center;border-bottom:2px solid #D4AF37;">
      <div style="font-size:36px;font-weight:900;color:#D4AF37;letter-spacing:10px;line-height:1;">GOLDCHAIN</div>
      <div style="font-size:10px;color:rgba(212,175,55,0.6);letter-spacing:4px;margin-top:8px;margin-bottom:24px;">
        VÀNG VIỆT NAM &nbsp;•&nbsp; SMART GOLD TRADING
      </div>
      <span style="display:inline-block;padding:8px 26px;border-radius:30px;
                   background:${typeColor}18;border:1.5px solid ${typeColor}55;
                   font-size:12px;font-weight:800;color:${typeColor};letter-spacing:2.5px;">
        ${typeLabel}
      </span>
    </td>
  </tr>

  <!-- ── GREETING ── -->
  <tr>
    <td style="padding:36px 44px 20px;">
      <p style="font-size:20px;font-weight:700;color:#fff;margin:0 0 12px;">
        Kính gửi Quý khách <span style="color:#D4AF37;">${recipientName || 'Quý khách'},</span>
      </p>
      <p style="font-size:14px;color:rgba(255,255,255,0.52);line-height:1.85;margin:0;">
        GoldChain xin trân trọng thông báo giao dịch vàng của Quý khách đã được xử lý thành công
        và được ghi nhận chính thức vào hệ thống. Hợp đồng điện tử có giá trị pháp lý đầy đủ
        được đính kèm trong email này để Quý khách lưu giữ.
      </p>
    </td>
  </tr>

  <!-- ── DIVIDER ── -->
  <tr>
    <td style="padding:4px 44px 20px;">
      <div style="height:1px;background:linear-gradient(90deg,transparent,rgba(212,175,55,0.35) 30%,rgba(212,175,55,0.35) 70%,transparent);"></div>
    </td>
  </tr>

  <!-- ── TRANSACTION SUMMARY ── -->
  <tr>
    <td style="padding:0 44px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0"
        style="background:rgba(212,175,55,0.05);border:1px solid rgba(212,175,55,0.2);border-radius:14px;padding:28px;">
        <tr>
          <td colspan="2" style="padding-bottom:18px;">
            <div style="font-size:10px;font-weight:800;color:#D4AF37;letter-spacing:3px;">TÓM TẮT GIAO DỊCH</div>
          </td>
        </tr>
        <tr>
          <td style="padding:9px 0;color:rgba(255,255,255,0.38);font-size:13px;width:46%;">Loại giao dịch</td>
          <td style="padding:9px 0;color:${typeColor};font-size:13px;font-weight:700;">${typeLabel}</td>
        </tr>
        <tr>
          <td style="padding:9px 0;color:rgba(255,255,255,0.38);font-size:13px;">Sản phẩm</td>
          <td style="padding:9px 0;color:#fff;font-size:13px;font-weight:600;">${goldName}</td>
        </tr>
        <tr>
          <td style="padding:9px 0;color:rgba(255,255,255,0.38);font-size:13px;">Số lượng</td>
          <td style="padding:9px 0;color:#fff;font-size:13px;">${quantityChi} chỉ</td>
        </tr>
        <tr>
          <td style="padding:9px 0;color:rgba(255,255,255,0.38);font-size:13px;">Đơn giá / chỉ</td>
          <td style="padding:9px 0;color:#fff;font-size:13px;">${fmtVND(unitPrice)}</td>
        </tr>
        <tr>
          <td colspan="2" style="padding:10px 0 0;">
            <div style="height:1px;background:rgba(212,175,55,0.2);"></div>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 0 4px;color:#fff;font-size:16px;font-weight:800;">TỔNG THANH TOÁN</td>
          <td style="padding:16px 0 4px;color:#D4AF37;font-size:24px;font-weight:900;">${fmtVND(totalAmount)}</td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- ── CONTRACT ID BLOCK ── -->
  <tr>
    <td style="padding:16px 44px 0;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td width="49%" style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);
                                  border-radius:10px;padding:16px 18px;">
            <div style="font-size:9px;color:rgba(212,175,55,0.45);letter-spacing:1.5px;margin-bottom:6px;">SỐ HỢP ĐỒNG</div>
            <div style="font-size:14px;font-family:'Courier New',monospace;font-weight:700;color:#D4AF37;">${contractNumber}</div>
          </td>
          <td width="2%"></td>
          <td width="49%" style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);
                                  border-radius:10px;padding:16px 18px;">
            <div style="font-size:9px;color:rgba(255,255,255,0.28);letter-spacing:1.5px;margin-bottom:6px;">NGÀY GHI NHẬN</div>
            <div style="font-size:13px;color:rgba(255,255,255,0.72);">${fmtDate}</div>
          </td>
        </tr>
      </table>
    </td>
  </tr>


  <!-- ── LEGAL NOTE ── -->
  <tr>
    <td style="padding:22px 44px 0;">
      <div style="border-left:3px solid rgba(212,175,55,0.35);padding-left:16px;">
        <p style="font-size:12.5px;color:rgba(255,255,255,0.38);line-height:1.85;margin:0;">
          Quý khách vui lòng lưu giữ hợp đồng này để tham chiếu khi cần thiết.
          Hợp đồng có giá trị pháp lý theo quy định của Luật Thương mại Việt Nam.
          Mọi thắc mắc xin liên hệ Hotline
          <strong style="color:#D4AF37;">1800-6868</strong> hoặc email
          <strong style="color:#D4AF37;">contract@goldchain.vn</strong>.
        </p>
      </div>
    </td>
  </tr>

  <!-- ── SIGN-OFF ── -->
  <tr>
    <td style="padding:30px 44px 36px;">
      <p style="font-size:14px;color:rgba(255,255,255,0.55);margin:0 0 5px;">Trân trọng,</p>
      <p style="font-size:20px;font-weight:900;color:#D4AF37;margin:0 0 4px;letter-spacing:1px;">GoldChain Vàng Việt Nam</p>
      <p style="font-size:12px;color:rgba(255,255,255,0.28);margin:0;">Nền tảng Tích lũy Vàng Số Thông Minh</p>
    </td>
  </tr>

  <!-- ── FOOTER ── -->
  <tr>
    <td style="background:rgba(0,0,0,0.5);border-top:1px solid rgba(212,175,55,0.14);
               padding:22px 44px;text-align:center;">
      <p style="font-size:11px;font-weight:700;color:rgba(212,175,55,0.55);margin:0 0 6px;letter-spacing:2px;">
        GOLDCHAIN VÀNG VIỆT NAM
      </p>
      <p style="font-size:10px;color:rgba(255,255,255,0.2);margin:0;">
        123 Đường Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh &nbsp;|&nbsp; 1800-6868 &nbsp;|&nbsp; contract@goldchain.vn
      </p>
      <p style="font-size:9px;color:rgba(255,255,255,0.12);margin:10px 0 0;">
        Email được tạo tự động từ hệ thống GoldChain. Vui lòng không phản hồi trực tiếp email này.
      </p>
    </td>
  </tr>

</table>
</td></tr>
</table>
</body>
</html>`

    const emailPayload: any = {
      from: `${EMAIL_FROM_NAME} <${EMAIL_FROM_ADDR}>`,
      to: [recipientEmail || 'test@example.com'],
      subject: `[GoldChain] Hợp đồng ${typeLabel} – ${contractNumber}`,
      html: htmlBody,
    }

    // Đính kèm PDF nếu có base64
    if (pdfContent) {
      emailPayload.attachments = [{
        filename: `HopDong_GoldChain_${contractNumber}.pdf`,
        content: pdfContent,
        type: 'application/pdf',
      }]
    }

    const resendRes  = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(emailPayload),
    })
    const resendData = await resendRes.json()

    if (!resendRes.ok) throw new Error(`Resend: ${JSON.stringify(resendData)}`)

    console.log(`[send-contract-email] ✅ Sent to ${recipientEmail}. id=${resendData.id}`)

    return new Response(
      JSON.stringify({ success: true, emailId: resendData.id, contractNumber }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('[send-contract-email] ❌', error.message)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
