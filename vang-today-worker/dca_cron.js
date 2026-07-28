const cron = require('node-cron');
const { createClient } = require('@supabase/supabase-js');
const nodemailer = require('nodemailer');
const path = require('path');

// Đọc .env ở thư mục gốc của project để lấy cấu hình SMTP
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
// Vẫn đọc .env folder hiện tại nếu có
require('dotenv').config();

// Cấu hình Email Transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Khởi tạo Supabase Admin Client
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SERVICE_KEY';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Công thức lấy giá vàng gần nhất của một mã vàng cụ thể
async function getGoldPrice(sourceCode) {
  try {
    const { data, error } = await supabase.schema('financial_ledgers')
      .from('gold_price_snapshots')
      .select('*')
      .eq('source', sourceCode)
      .order('recorded_at', { ascending: false })
      .limit(1);

    if (!error && data && data.length > 0) {
      return {
        buy: Number(data[0].buy_price_vnd),
        sell: Number(data[0].sell_price_vnd)
      };
    }
  } catch (err) {
    console.error(`Lỗi lấy giá vàng cho ${sourceCode}:`, err);
  }
  return null;
}

async function sendDcaEmail(user, plan, quantityPurchased, amountVnd, goldType, goldPriceBuy, txnId) {
  try {
    if (!user.email) return;
    const mailOptions = {
      from: process.env.SMTP_FROM || '"GoldChain Support" <noreply@goldchain.com>',
      to: user.email,
      subject: `Thông báo Hóa đơn Mua Vàng tự động (DCA) - ${txnId}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
          <h2 style="color: #D4AF37; text-align: center;">GOLDCHAIN - LỆNH MUA TỰ ĐỘNG THÀNH CÔNG</h2>
          <p>Kính gửi <b>${user.full_name}</b>,</p>
          <p>Hệ thống tự động tích lũy (DCA) của bạn vừa thực thi thành công một chu kỳ mua vàng mới. Vàng đã được cộng trực tiếp vào ví lưu ký của bạn.</p>
          <div style="background: #f9f9f9; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p><b>Mã Giao dịch:</b> ${txnId}</p>
            <p><b>Sản phẩm:</b> ${goldType.toUpperCase()}</p>
            <p><b>Số lượng mua:</b> ${quantityPurchased.toFixed(4)} chỉ</p>
            <p><b>Đơn giá mua:</b> ${goldPriceBuy.toLocaleString('vi-VN')} VND / chỉ</p>
            <p><b>Tổng thanh toán:</b> ${amountVnd.toLocaleString('vi-VN')} VND</p>
            <p><b>Thời gian chạy:</b> ${new Date().toLocaleString('vi-VN')}</p>
          </div>
          <p>Trân trọng,<br>Ban Quản Trị Hệ thống Giao dịch vàng GoldChain 4.0</p>
        </div>
      `
    };
    await transporter.sendMail(mailOptions);
    console.log(`[DCA CRON] Đã gửi email xác nhận cho ${user.email}`);
  } catch (emailErr) {
    console.error(`[DCA CRON] Không gửi được email:`, emailErr);
  }
}

// Hàm chạy tiến trình DCA định kỳ (Ví dụ: Chạy 09:00 AM mỗi ngày)
async function runDcaCron() {
  console.log(`[DCA CRON] Bắt đầu quét các lịch trình DCA cần chạy lúc: ${new Date().toLocaleString('vi-VN')}`);

  // 1. Phân tích ra hôm nay là Thứ mấy và Ngày mấy
  const today = new Date();
  const dayOfWeekNumber = today.getDay(); // 0(Sun) -> 6(Sat)
  const mapVnDays = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
  const todayDayOfWeek = mapVnDays[dayOfWeekNumber];
  const todayDate = `Ngày ${today.getDate()}`;
  const todayYYYYMMDD = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const currentHourMin = `${String(today.getHours()).padStart(2, '0')}:${String(today.getMinutes()).padStart(2, '0')}`;

  console.log(`[DCA CRON] Hôm nay là: ${todayDayOfWeek}, ${todayDate} (${todayYYYYMMDD}) - Bất kỳ Plan nào đặt lịch vào ${currentHourMin} sẽ chuẩn bị thực thi.`);

  // 2. Tìm các Plan đang chạy ('running')
  const { data: plans, error: planErr } = await supabase
    .from('dca_plans')
    .select('*, user_profiles(id, wallet_balance_vnd, full_name, email)')
    .eq('status', 'running');

  if (planErr || !plans) {
    console.error("[DCA CRON] Lỗi khi truy vấn kế hoạch:", planErr);
    return;
  }

  // 3. Lọc ra các Plan khớp giờ và ngày
  const targetPlans = plans.filter(p => {
    const rawVal = p.execution_day;
    let targetTime = '09:00'; // Default backward compat
    let targetDaysStr = rawVal;

    if (rawVal.includes('|')) {
      const parts = rawVal.split('|');
      targetTime = parts[0];
      targetDaysStr = parts.slice(1).join('|');
    }

    // Nếu khác giờ thì bỏ qua (cron chạy mỗi phút)
    if (currentHourMin !== targetTime) return false;

    const daysArr = targetDaysStr.split(',');
    return daysArr.includes(todayDayOfWeek) || daysArr.includes(todayDate) || daysArr.includes(todayYYYYMMDD);
  });

  if (targetPlans.length > 0) {
    console.log(`[DCA CRON] Tìm thấy ${targetPlans.length} kế hoạch DCA đến hạn vào đúng ${currentHourMin} hôm nay.`);
  } else {
    // Không hiện log liên tục mỗi phút nếu không có gì để chạy
    return;
  }

  // 3. Duyệt và Thực thi từng Plan
  for (const plan of targetPlans) {
    try {
      const user = plan.user_profiles;
      // Database dùng trường amount_vnd_per_cycle thay vì amount_vnd cũ
      const amountVnd = parseFloat(plan.amount_vnd_per_cycle || plan.amount_vnd);
      const goldType = plan.gold_type;

      const priceData = await getGoldPrice(goldType);
      const goldPriceBuy = priceData?.buy;

      if (!goldPriceBuy) {
        console.log(`[DCA CRON] Bỏ qua Plan ${plan.id} vì không có thông tin giá mua của loại ${goldType}.`);
        continue;
      }

      const balance = parseFloat(user.wallet_balance_vnd) || 0;

      // Kiểm tra Ví có đủ tiền không
      if (balance < amountVnd) {
        console.log(`[DCA CRON] Giao dịch thất bại cho User ${user.full_name}: Thiếu tiền (Đòi ${amountVnd}, Ví còn ${balance})`);

        // Tạo log Execution thất bại
        const dcaExecFailId = `EXEC-${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;
        await supabase.schema('financial_ledgers').from('dca_executions').insert({
          id: dcaExecFailId,
          plan_id: plan.id,
          user_id: user.id,
          gold_type: goldType,
          amount_vnd: amountVnd,
          unit_price_vnd: goldPriceBuy,
          quantity_grams: 0,
          status: 'FAILED',
          failure_reason: 'Insufficient Funds' // trong CSDL là failure_reason chứ k phải error_message
        });

        // Bắn thông báo về web
        await supabase.from('notifications').insert({
          user_id: user.id,
          type: 'alert',
          title: 'DCA Thất bại (Thiếu số dư)',
          desc: `Kế hoạch DCA quỹ ${amountVnd.toLocaleString('vi-VN')}đ mua SJC bị huỷ vì Ví VND không đủ tiền.`,
          time: `${today.getHours()}:${today.getMinutes()}`,
          unread: true
        });

        continue;
      }

      // NẾU ĐỦ TIỀN -> Thực thi mua Vàng
      const quantityPurchased = amountVnd / goldPriceBuy;
      const newBalance = balance - amountVnd;

      // Cập nhật ví VND
      await supabase.from('user_profiles').update({ wallet_balance_vnd: newBalance }).eq('id', user.id);

      // Lấy ví vàng và cập nhật
      const { data: goldWallets } = await supabase.from('gold_wallets').select('*').eq('user_id', user.id).eq('gold_type', goldType).single();
      const oldQty = goldWallets ? parseFloat(goldWallets.quantity_grams) : 0;
      await supabase.from('gold_wallets')
        .update({ quantity_grams: oldQty + quantityPurchased })
        .eq('user_id', user.id)
        .eq('gold_type', goldType);

      // --- MÔI TRƯỜNG PRODUCTION ---
      // 1. Tạo bản ghi thực thi dca_executions 
      const dcaExecId = `EXEC-${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;
      const { data: executionResult, error: execError } = await supabase.schema('financial_ledgers').from('dca_executions').insert({
        id: dcaExecId,
        plan_id: plan.id,
        user_id: user.id,
        gold_type: goldType,
        amount_vnd: amountVnd,
        unit_price_vnd: goldPriceBuy,
        quantity_grams: quantityPurchased,
        status: 'SUCCESS'
      }).select('id').single();

      if (execError) {
        console.error('[DCA CRON] Lỗi Insert dca_executions: ', execError);
      }

      // 2. Lưu giao dịch Transaction vào gold_transactions
      const txnId = `DCA-${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;
      const { error: txErr } = await supabase.schema('financial_ledgers').from('gold_transactions').insert({
        id: txnId,
        user_id: user.id,
        wallet_id: goldWallets ? goldWallets.id : 0, // Fallback tạm 0 nếu chưa có ví
        tx_type: 'DCA',
        gold_type: goldType,
        quantity_grams: quantityPurchased,
        unit_price_vnd: goldPriceBuy,
        total_amount_vnd: amountVnd,
        wallet_balance_after: newBalance,
        dca_execution_id: execError ? null : dcaExecId,
        status: 'SUCCESS'
      });
      if (txErr) {
        console.error('[DCA CRON] Lỗi Insert gold_transactions: ', txErr);
      }

      // 3. Tạo thêm gold_lots để khách chốt lời
      const { error: lotErr } = await supabase.schema('financial_ledgers').from('gold_lots').insert({
        user_id: user.id,
        gold_type: goldType,
        quantity_grams: quantityPurchased,
        quantity_remaining_grams: quantityPurchased,
        cost_price_vnd: goldPriceBuy,
        source_type: 'DCA',
        transaction_id: txnId,
        wallet_id: goldWallets ? goldWallets.id : 0
      });
      if (lotErr) {
        console.error('[DCA CRON] Lỗi Insert gold_lots: ', lotErr);
      }

      // Tự động Gửi Email Thành công
      await sendDcaEmail(user, plan, quantityPurchased, amountVnd, goldType, goldPriceBuy, txnId);

      // Cập nhật tăng số vòng đời (total_executions) cho Plan
      const newTotalExecutions = (plan.total_executions || 0) + 1;
      let newStatus = plan.status;

      // KIỂM TRA ĐÓNG KẾ HOẠCH NẾU LÀ GÓI "TÙY CHỈNH"
      if (plan.frequency === 'Tùy chỉnh (Chọn ngày)') {
        const rawVal = plan.execution_day;
        const targetDaysStr = rawVal.includes('|') ? rawVal.split('|').slice(1).join('|') : rawVal;
        const daysArr = targetDaysStr.split(',');
        if (newTotalExecutions >= daysArr.length) {
          newStatus = 'COMPLETED'; // Chốt sổ kế hoạch
        }
      }

      await supabase.from('dca_plans').update({
        total_executions: newTotalExecutions,
        status: newStatus
      }).eq('id', plan.id);

      await supabase.from('notifications').insert({
        user_id: user.id,
        type: 'transaction',
        title: newStatus === 'COMPLETED' ? 'Kế hoạch DCA đã hoàn thành!' : 'Tích lũy DCA tự động thành công',
        desc: newStatus === 'COMPLETED' 
          ? `Chúc mừng! Kế hoạch tích lũy SJC đã chạy đủ số kỳ và chính thức khép lại.` 
          : `Đã tự động mua ${quantityPurchased.toFixed(4)} chỉ ${goldType.toUpperCase()} bằng ₫${amountVnd.toLocaleString('vi-VN')} (Kỳ thứ ${newTotalExecutions})`,
        time: `${String(today.getHours()).padStart(2, '0')}:${String(today.getMinutes()).padStart(2, '0')}`,
        unread: true
      });

      console.log(`[DCA CRON] Thành công cho User ${user.full_name}: Mua kỳ #${newTotalExecutions} - ${quantityPurchased.toFixed(4)} chỉ ${goldType}. Trạng thái plan: ${newStatus}`);
    } catch (innerErr) {
      console.error(`[DCA CRON] Lỗi thực thi Plan ${plan.id}:`, innerErr);
    }
  }
}

// Lập lịch Cron (Chạy mỗi phút để support mọi mốc thời gian tùy chọn của user)
cron.schedule('* * * * *', () => {
  runDcaCron();
});

// Chạy một lần ngay khi vừa khởi động Server để User không phải chờ sang phút tiếp theo
runDcaCron();
module.exports = runDcaCron;
