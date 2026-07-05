require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

// Khởi tạo kết nối Supabase sử dụng schema 'financial_ledgers'
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Thiếu VITE_SUPABASE_URL hoặc VITE_SUPABASE_ANON_KEY trong file .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  db: { schema: "financial_ledgers" },
});

const VANG_TODAY_API = "https://www.vang.today/api/prices";
const FETCH_INTERVAL_MS = 5 * 60 * 1000; // 5 phút

// Bảng dịch tên tiếng Anh từ API sang tiếng Việt có dấu cho Frontend
const NAME_VI = {
  "SJC 9999":             "SJC 9999",
  "SJC Ring":             "Nhẫn SJC 9999",
  "Bao Tin SJC":          "Bảo Tín SJC",
  "Bao Tin 9999":         "Bảo Tín 9999",
  "DOJI Hanoi":           "DOJI Hà Nội",
  "DOJI HCM":             "DOJI TP.HCM",
  "DOJI Jewelry":         "DOJI Nữ Trang",
  "PNJ Hanoi":            "PNJ Hà Nội",
  "PNJ 24K":              "PNJ 24K",
  "VN Gold SJC":          "VN Gold SJC",
  "Viettin SJC":          "Viettin SJC",
  "World Gold (XAU/USD)": "Vàng Thế Giới (XAU/USD)",
};

async function fetchAndSavePrices() {
  console.log(`\n[${new Date().toISOString()}] Đang lấy dữ liệu từ vang.today...`);
  try {
    const response = await fetch(VANG_TODAY_API);
    if (!response.ok) {
      throw new Error(`API vang.today trả về lỗi: ${response.status}`);
    }

    const json = await response.json();
    if (!json.success || !json.prices) {
      throw new Error("Định dạng dữ liệu trả về không hợp lệ");
    }

    const records = [];
    for (const [type_code, item] of Object.entries(json.prices)) {
      // Bỏ qua vàng thế giới (tính bằng USD, không phải VND)
      if (type_code === "XAUUSD") continue;

      const buyVnd = Number(item.buy);
      const sellVnd = Number(item.sell);
      const spreadVnd = Math.max(0, sellVnd - buyVnd);

      // Dùng tên tiếng Việt nếu có, không thì giữ nguyên tên gốc từ API
      const goldType = NAME_VI[item.name] || item.name;

      records.push({
        source: type_code,
        gold_type: goldType,
        buy_price_vnd: buyVnd,
        sell_price_vnd: sellVnd,
        spread_vnd: spreadVnd,
      });
    }

    if (records.length === 0) {
      console.log("⚠️ Không có dữ liệu hợp lệ nào từ API.");
      return;
    }

    console.log(`Đã phân tích xong ${records.length} bản ghi. Đang lưu vào Supabase...`);

    const { error } = await supabase.from("gold_price_snapshots").insert(records);

    if (error) {
      console.error("❌ Lỗi khi insert vào Supabase:", error);
    } else {
      console.log(`✅ Lưu thành công ${records.length} bản ghi giá vàng vào Database!`);

      // Cleanup: Xóa bản ghi cũ hơn 3 ngày
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 3);
      await supabase
        .from("gold_price_snapshots")
        .delete()
        .lt("recorded_at", cutoffDate.toISOString());
    }
  } catch (error) {
    console.error("❌ Lỗi trong quá trình chạy worker:", error.message);
  }
}

// Chạy lần đầu tiên ngay lập tức
fetchAndSavePrices();

// Lập lịch chạy lặp lại mỗi 5 phút
setInterval(fetchAndSavePrices, FETCH_INTERVAL_MS);

console.log("🚀 Vang.today Worker đã khởi động! Hệ thống sẽ tự động lấy giá mỗi 5 phút.");
