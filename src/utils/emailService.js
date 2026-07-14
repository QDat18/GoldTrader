import { supabase } from '../supabaseClient';

export async function sendOtpEmail({ email, otp, purpose = 'xác thực tài khoản' }) {
  if (!email) {
    throw new Error('Vui lòng nhập email trước khi gửi mã xác thực.');
  }

  try {
    const { data, error } = await supabase.functions.invoke('send-otp-email', {
      body: {
        recipientEmail: email,
        otp,
        purpose,
      },
    });

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('[EmailService] sendOtpEmail failed:', error);

    const subject = encodeURIComponent(`[GoldChain] Mã xác thực ${purpose}`);
    const body = encodeURIComponent(`Mã xác thực của bạn là ${otp}.\n\nVui lòng nhập mã này vào màn hình xác thực để tiếp tục.`);
    const fallbackUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email)}&su=${subject}&body=${body}`;
    window.open(fallbackUrl, '_blank', 'noopener,noreferrer');

    return { success: true, fallback: true };
  }
}
