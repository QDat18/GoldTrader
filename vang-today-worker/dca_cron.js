const cron = require('node-cron');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Khởi tạo Supabase Admin Client để vượt rào (bypass RLS) khi chạy cron
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'YOUR_SERVICE_KEY'; // Ở server cần Service Key thay vì Anon key

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Công thức lấy giá vàng gần nhất (Giả lập giống trên Web)
async function getLatestGoldPrices() {
  try {
    const { data, error } = await supabase.from('gold_prices').select('*').order('created_at', { ascending: false }).limit(1);
    if (!error && data && data.length > 0) {
      return data[0].prices || {};
    }
  } catch (err) {
    console.error("Lỗi lấy giá vàng:", err);
  }
  return null;
}

// Hàm chạy tiến trình DCA định kỳ (Ví dụ: Chạy 09:00 AM mỗi ngày)
async function runDcaCron() {
  console.log(`[DCA CRON] Bắt đầu quét các lịch trình DCA cần chạy lúc: ${new Date().toLocaleString('vi-VN')}`);
  
  // Lấy giá vàng hiện tại
  const currentPrices = await getLatestGoldPrices();
  if (!currentPrices) {
    console.log("[DCA CRON] Không tìm thấy giá vàng để thực hiện giao dịch.");
    return;
  }

  // 1. Phân tích ra hôm nay là Thứ mấy và Ngày mấy
  const today = new Date();
  const dayOfWeekNumber = today.getDay(); // 0(Sun) -> 6(Sat)
  const mapVnDays = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
  const todayDayOfWeek = mapVnDays[dayOfWeekNumber];
  const todayDate = `Ngày ${today.getDate()}`; // Ví dụ: Ngày 1, Ngày 15

  console.log(`[DCA CRON] Hôm nay là: ${todayDayOfWeek}, ${todayDate}`);

  // 2. Tìm các Plan đang chạy ('running') có 'execution_day' thuộc hôm nay
  const { data: plans, error: planErr } = await supabase
    .from('dca_plans')
    .select('*, user_profiles(id, wallet_balance_vnd, full_name)')
    .eq('status', 'running');
    
  if (planErr || !plans) {
    console.error("[DCA CRON] Lỗi khi truy vấn kế hoạch:", planErr);
    return;
  }

  // Lọc ra các Plan đúng hẹn (Weekly == todayDayOfWeek Hoặc Monthly == todayDate)
  // Ghi chú: Có thể tối ưu bằng câu truy vấn SQL (OR) nhưng JS array filter cho nhanh và an toàn
  const targetPlans = plans.filter(p => p.execution_day === todayDayOfWeek || p.execution_day === todayDate);
  
  console.log(`[DCA CRON] Tìm thấy ${targetPlans.length} kế hoạch DCA đến hạn hôm nay.`);

  // 3. Duyệt và Thực thi từng Plan
  for (const plan of targetPlans) {
    try {
      const user = plan.user_profiles;
      const amountVnd = parseFloat(plan.amount_vnd);
      const goldType = plan.gold_type;
      const goldPriceBuy = currentPrices[goldType]?.buy;

      if (!goldPriceBuy) {
        console.log(`[DCA CRON] Bỏ qua Plan ${plan.id} vì không có thông tin giá mua của loại ${goldType}.`);
        continue;
      }

      const balance = parseFloat(user.wallet_balance_vnd) || 0;

      // Kiểm tra Ví có đủ tiền không
      if (balance < amountVnd) {
        console.log(`[DCA CRON] Giao dịch thất bại cho User ${user.full_name}: Thiếu tiền (Đòi ${amountVnd}, Ví còn ${balance})`);
        
        // Tạo log Execution thất bại
        await supabase.from('dca_executions').insert({
          plan_id: plan.id,
          user_id: user.id,
          amount_vnd: amountVnd,
          gold_price: goldPriceBuy,
          quantity_purchased: 0,
          status: 'Failed - Insufficient Funds'
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

      // Lưu giao dịch Transaction
      // (Bỏ qua đoạn tính toán Lãi trung bình cục bộ vì đây là Worker, cần User chủ động nạp lại trang Web để Store tự tính lại)
      const txnId = `DCA-${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;
      await supabase.from('transactions').insert({
        id: txnId,
        user_id: user.id,
        type: 'dca',
        gold_type: goldType,
        quantity: quantityPurchased,
        price: goldPriceBuy,
        total: amountVnd,
        status: 'OK'
      });

      // Tạo log Execution thành công
      await supabase.from('dca_executions').insert({
        plan_id: plan.id,
        user_id: user.id,
        amount_vnd: amountVnd,
        gold_price: goldPriceBuy,
        quantity_purchased: quantityPurchased,
        status: 'OK'
      });

      // Bắn thông báo giao dịch chuẩn
      await supabase.from('notifications').insert({
        user_id: user.id,
        type: 'transaction',
        title: 'Tích lũy DCA tự động thành công',
        desc: `Đã mua ${quantityPurchased.toFixed(4)} chỉ ${goldType.toUpperCase()} bằng ₫${amountVnd.toLocaleString('vi-VN')}`,
        time: `${String(today.getHours()).padStart(2, '0')}:${String(today.getMinutes()).padStart(2, '0')}`,
        unread: true
      });

      console.log(`[DCA CRON] Thành công cho User ${user.full_name}: Mua ${quantityPurchased.toFixed(4)} chỉ ${goldType} giá ${amountVnd.toLocaleString('vi-VN')} VND.`);
    } catch (innerErr) {
      console.error(`[DCA CRON] Lỗi thực thi Plan ${plan.id}:`, innerErr);
    }
  }
}

// Lập lịch Cron (Giả sử: Chạy vào lúc 09:00 AM hàng ngày)
cron.schedule('0 9 * * *', () => {
  runDcaCron();
});

// Hàm hỗ trợ chạy chay một lần (Môi trường Dev)
// runDcaCron();
module.exports = runDcaCron;
