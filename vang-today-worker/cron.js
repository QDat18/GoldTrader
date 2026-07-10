const { createClient } = require("@supabase/supabase-js");

// GitHub Actions truyền biến môi trường qua secrets
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Thiếu biến môi trường Supabase");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  db: { schema: "financial_ledgers" },
});

const VANG_TODAY_API = "https://www.vang.today/api/prices";

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
};

async function main() {
  console.log(`[${new Date().toISOString()}] Đang lấy dữ liệu từ vang.today...`);

  // Lấy ngày hiện tại theo giờ Việt Nam (UTC+7)
  const nowVN = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }));
  const nowDateStr = nowVN.toLocaleDateString("en-US");

  const response = await fetch(VANG_TODAY_API);
  if (!response.ok) throw new Error(`API lỗi: ${response.status}`);

  const json = await response.json();
  if (!json.success || !json.prices) throw new Error("Dữ liệu không hợp lệ");

  const promises = Object.entries(json.prices)
    .filter(([type_code]) => type_code !== "XAUUSD")
    .map(async ([type_code, item]) => {
      const buyVnd = Number(item.buy);
      const sellVnd = Number(item.sell);
      const spreadVnd = Math.max(0, sellVnd - buyVnd);
      const goldType = NAME_VI[item.name] || item.name;

      // Truy vấn bản ghi gần nhất của loại vàng này kèm theo mốc thời gian recorded_at
      const { data, error } = await supabase
        .from("gold_price_snapshots")
        .select("buy_price_vnd, sell_price_vnd, recorded_at")
        .eq("source", type_code)
        .order("recorded_at", { ascending: false })
        .limit(1);

      if (error) {
        console.error(`⚠️ Lỗi khi tải giá cũ của ${goldType}:`, error.message);
      }

      const lastRecord = data && data[0];
      
      // Kiểm tra xem đã sang ngày mới (so với bản ghi gần nhất) chưa
      let isNewDay = false;
      if (lastRecord) {
        const lastRecordVN = new Date(new Date(lastRecord.recorded_at).toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }));
        isNewDay = lastRecordVN.toLocaleDateString("en-US") !== nowDateStr;
      }

      // Lưu khi không có bản ghi cũ, khi đã sang ngày mới, hoặc khi giá thay đổi
      const changed = !lastRecord || 
                      isNewDay ||
                      Number(lastRecord.buy_price_vnd) !== buyVnd || 
                      Number(lastRecord.sell_price_vnd) !== sellVnd;

      if (changed) {
        if (isNewDay) {
          console.log(`🌅 Chuyển sang ngày mới (${nowDateStr}) — Buộc lưu giá vàng ${goldType} làm mốc.`);
        }
        return {
          source: type_code,
          gold_type: goldType,
          buy_price_vnd: buyVnd,
          sell_price_vnd: sellVnd,
          spread_vnd: spreadVnd,
        };
      }
      return null;
    });

  const results = await Promise.all(promises);
  const records = results.filter(Boolean);

  if (records.length === 0) {
    console.log("⚠️ Không có giá vàng nào thay đổi so với bản ghi trước. Bỏ qua ghi Database.");
    return;
  }

  console.log(`Đã phát hiện ${records.length} loại vàng có thay đổi giá. Đang lưu vào Supabase...`);

  const { error } = await supabase.from("gold_price_snapshots").insert(records);
  if (error) throw error;

  console.log(`✅ Lưu thành công ${records.length} bản ghi!`);

  // Cleanup: Xóa bản ghi cũ hơn 30 ngày để hiển thị biểu đồ tháng
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30);
  await supabase.from("gold_price_snapshots").delete().lt("recorded_at", cutoff.toISOString());
}

main().then(() => process.exit(0)).catch(err => { console.error("❌", err.message); process.exit(1); });
