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

  const response = await fetch(VANG_TODAY_API);
  if (!response.ok) throw new Error(`API lỗi: ${response.status}`);

  const json = await response.json();
  if (!json.success || !json.prices) throw new Error("Dữ liệu không hợp lệ");

  const records = [];
  for (const [type_code, item] of Object.entries(json.prices)) {
    if (type_code === "XAUUSD") continue;
    records.push({
      source: type_code,
      gold_type: NAME_VI[item.name] || item.name,
      buy_price_vnd: Number(item.buy),
      sell_price_vnd: Number(item.sell),
      spread_vnd: Math.max(0, Number(item.sell) - Number(item.buy)),
    });
  }

  const { error } = await supabase.from("gold_price_snapshots").insert(records);
  if (error) throw error;

  console.log(`✅ Lưu thành công ${records.length} bản ghi!`);

  // Cleanup: Xóa bản ghi cũ hơn 3 ngày
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 3);
  await supabase.from("gold_price_snapshots").delete().lt("recorded_at", cutoff.toISOString());
}

main().then(() => process.exit(0)).catch(err => { console.error("❌", err.message); process.exit(1); });
