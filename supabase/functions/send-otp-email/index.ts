// supabase/functions/send-otp-email/index.ts
// Resend API – gửi mã OTP xác thực 6 số qua email
// Deploy: supabase functions deploy send-otp-email

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { recipientEmail, otp, purpose = 'xác thực tài khoản' } = await req.json()

    const RESEND_API_KEY  = Deno.env.get('RESEND_API_KEY')
    const EMAIL_FROM_NAME = Deno.env.get('EMAIL_FROM_NAME')    || 'GoldChain'
    const EMAIL_FROM_ADDR = Deno.env.get('EMAIL_FROM_ADDRESS') || 'onboarding@resend.dev'

    if (!RESEND_API_KEY) throw new Error('RESEND_API_KEY chưa được cài đặt')

    const htmlBody = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Mã Xác Thực – GoldChain</title>
</head>
<body style="margin:0;padding:0;background:#f0ead6;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f0ead6;padding:32px 0;">
<tr><td align="center">
<table width="520" cellpadding="0" cellspacing="0" border="0"
  style="max-width:520px;background:#0a0a0a;border-radius:16px;overflow:hidden;border:1px solid #3a2e10;">

  <!-- HEADER -->
  <tr>
    <td style="background:linear-gradient(135deg,#1a1200 0%,#2d1e00 50%,#1a1200 100%);
               padding:40px;text-align:center;border-bottom:2px solid #D4AF37;">
      <div style="font-size:32px;font-weight:900;color:#D4AF37;letter-spacing:8px;line-height:1;margin-bottom:8px;">
        GOLDCHAIN
      </div>
      <div style="font-size:9px;color:rgba(212,175,55,0.55);letter-spacing:4px;">
        BẢO MẬT TÀI KHOẢN
      </div>
    </td>
  </tr>

  <!-- ICON + MESSAGE -->
  <tr>
    <td style="padding:40px 44px 24px;text-align:center;">
      <div style="width:72px;height:72px;border-radius:50%;background:rgba(212,175,55,0.08);
                  border:2px solid rgba(212,175,55,0.22);margin:0 auto 22px;
                  font-size:30px;line-height:72px;text-align:center;">🔐</div>
      <p style="font-size:18px;font-weight:700;color:#fff;margin:0 0 12px;">
        Mã Xác Thực Của Bạn
      </p>
      <p style="font-size:13.5px;color:rgba(255,255,255,0.45);line-height:1.8;margin:0;">
        Vui lòng sử dụng mã dưới đây để <strong style="color:rgba(255,255,255,0.7);">${purpose}</strong>.<br>
        Mã có hiệu lực trong <strong style="color:#D4AF37;">5 phút</strong> và chỉ dùng được 1 lần.
      </p>
    </td>
  </tr>

  <!-- OTP BOX -->
  <tr>
    <td style="padding:0 44px 28px;">
      <div style="background:linear-gradient(135deg,rgba(212,175,55,0.1),rgba(212,175,55,0.04));
                  border:1.5px solid rgba(212,175,55,0.3);border-radius:14px;padding:32px;text-align:center;">
        <div style="font-size:10px;font-weight:800;color:rgba(212,175,55,0.5);
                    letter-spacing:3px;margin-bottom:16px;">MÃ XÁC THỰC OTP</div>
        <div style="font-size:44px;font-weight:900;letter-spacing:14px;color:#D4AF37;
                    font-family:'Courier New',Courier,monospace;">${otp}</div>
      </div>
    </td>
  </tr>

  <!-- WARNING BOX -->
  <tr>
    <td style="padding:0 44px 36px;">
      <div style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.07);
                  border-radius:10px;padding:16px 20px;">
        <p style="font-size:12.5px;color:rgba(255,255,255,0.38);line-height:1.8;margin:0;">
          ⚠️ &nbsp;Không chia sẻ mã này với bất kỳ ai, kể cả nhân viên GoldChain.<br>
          Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email và liên hệ
          <strong style="color:#D4AF37;">1800-6868</strong> ngay lập tức.
        </p>
      </div>
    </td>
  </tr>

  <!-- FOOTER -->
  <tr>
    <td style="background:rgba(0,0,0,0.5);border-top:1px solid rgba(212,175,55,0.14);
               padding:20px 44px;text-align:center;">
      <p style="font-size:11px;font-weight:700;color:rgba(212,175,55,0.5);margin:0 0 5px;letter-spacing:2px;">
        GOLDCHAIN VÀNG VIỆT NAM
      </p>
      <p style="font-size:10px;color:rgba(255,255,255,0.2);margin:0;">
        1800-6868 &nbsp;|&nbsp; contract@goldchain.vn
      </p>
      <p style="font-size:9px;color:rgba(255,255,255,0.12);margin:10px 0 0;">
        Email được tạo tự động từ hệ thống GoldChain.
      </p>
    </td>
  </tr>

</table>
</td></tr>
</table>
</body>
</html>`

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${EMAIL_FROM_NAME} <${EMAIL_FROM_ADDR}>`,
        to: [recipientEmail],
        subject: `[GoldChain] Mã xác thực ${purpose} – ${otp}`,
        html: htmlBody,
        text: `Mã xác thực của bạn để ${purpose} là: ${otp}\n\nMã có hiệu lực trong 5 phút và chỉ dùng được 1 lần.\nKhông chia sẻ mã này với bất kỳ ai.\n\nGoldChain | 1800-6868`,
      }),
    })

    const data = await response.json()
    if (!response.ok) throw new Error(JSON.stringify(data))

    console.log(`[send-otp-email] ✅ OTP sent to ${recipientEmail}. id=${data.id}`)

    return new Response(
      JSON.stringify({ success: true, emailId: data.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('[send-otp-email] ❌', error.message)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
