const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Thiếu SUPABASE_URL hoặc SUPABASE_ANON_KEY trong tệp .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  db: { schema: 'financial_ledgers' }
});

const goldProducts = [
  // SJC
  { source: 'sjc', name: 'SJC 1 Lượng', baseBuy: 87000000, spread: 500000 },
  { source: 'sjc', name: 'SJC 1 Chỉ', baseBuy: 8700000, spread: 50000 },
  { source: 'sjc', name: 'Nhẫn SJC 99.99', baseBuy: 7870000, spread: 50000 },
  { source: 'sjc', name: 'Nữ trang SJC 99.99%', baseBuy: 7600000, spread: 150000 },
  // DOJI
  { source: 'doji', name: 'DOJI Hà Nội', baseBuy: 8580000, spread: 50000 },
  { source: 'doji', name: 'DOJI TP.HCM', baseBuy: 8580000, spread: 50000 },
  // PNJ
  { source: 'pnj', name: 'PNJ Hà Nội', baseBuy: 7870000, spread: 50000 },
  { source: 'pnj', name: 'PNJ TP.HCM', baseBuy: 7870000, spread: 50000 },
];

async function seed() {
  console.log("=== BẮT ĐẦU SEED LỊCH SỬ GIÁ VÀNG 30 NGÀY QUA ===");
  
  const records = [];
  const now = new Date();
  
  // Tổng cộng: 30 ngày, mỗi ngày lấy 24 mốc giờ (mỗi mốc cách nhau 1 tiếng)
  // Tổng cộng = 30 * 24 = 720 mốc thời gian.
  // 720 mốc * 8 sản phẩm = 5760 bản ghi.
  const TOTAL_HOURS = 30 * 24;

  console.log(`Đang tạo ${TOTAL_HOURS * goldProducts.length} bản ghi lịch sử giá...`);

  for (const prod of goldProducts) {
    let currentPrice = prod.baseBuy;
    
    for (let h = 0; h < TOTAL_HOURS; h++) {
      const timeOffset = new Date(now.getTime() - h * 60 * 60 * 1000);
      
      // Tạo bước nhảy ngẫu nhiên dạng random walk
      const fluctuation = 1 + (Math.random() - 0.5) * 0.003; // +-0.15% mỗi tiếng
      currentPrice = Math.round(currentPrice * fluctuation);

      const buyPrice = currentPrice;
      const sellPrice = buyPrice + prod.spread;

      records.push({
        gold_type: prod.name,
        source: prod.source,
        buy_price_vnd: buyPrice,
        sell_price_vnd: sellPrice,
        spread_vnd: prod.spread,
        recorded_at: timeOffset.toISOString()
      });
    }
  }

  // Chia làm các lô nhỏ (mỗi lô 1000 bản ghi) để tránh quá tải payload Supabase
  const batchSize = 1000;
  console.log(`Bắt đầu lưu trữ vào Supabase theo từng lô ${batchSize} dòng...`);
  
  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    const { error } = await supabase
      .from('gold_price_snapshots')
      .insert(batch);
      
    if (error) {
      console.error(`Lỗi chèn lô từ dòng ${i}:`, error);
      process.exit(1);
    }
    console.log(`✓ Đã lưu thành công lô từ ${i} đến ${Math.min(i + batchSize, records.length)}`);
  }

  console.log("=== SEED DỮ LIỆU LỊCH SỬ THÀNH CÔNG ===");
  process.exit(0);
}

seed();
