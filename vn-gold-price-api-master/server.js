const express = require("express");
const puppeteer = require("puppeteer");
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const app = express();

require("dotenv").config();

app.use(cors());
app.use(express.json());

// Initialize Supabase Client pointing to financial_ledgers schema
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

let supabase = null;
if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey, {
    db: { schema: 'financial_ledgers' }
  });
  console.log("Supabase client initialized for schema 'financial_ledgers'");
} else {
  console.warn("Supabase credentials missing. Database sync is disabled.");
}

function formatUpdatedAt(timestamp) {
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return timestamp; // Trả về chuỗi gốc nếu parse lỗi
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear().toString();
  return `${hours}:${minutes} ${month}/${day}/${year}`;
}

// Hàm chuẩn hóa giá tiền sang VNĐ/chỉ (1 chỉ = 3.75g = 1/10 lượng)
function normalizePriceToVnd(valStr) {
  if (!valStr) return 0;
  // Loại bỏ các ký tự đặc biệt, chỉ giữ số và dấu chấm
  const cleaned = valStr.replace(/[^0-9.]/g, '');
  const num = parseFloat(cleaned);
  if (isNaN(num)) return 0;

  // Case 1: Đã ở dạng VNĐ/chỉ (ví dụ: 7,870,000 đến 10,000,000)
  if (num >= 5000000 && num <= 15000000) {
    return num;
  }
  // Case 2: Đã ở dạng VNĐ/lượng (ví dụ: 50,000,000 đến 150,000,000)
  if (num >= 50000000 && num <= 150000000) {
    return num / 10;
  }
  // Case 3: Dạng nghìn VNĐ/lượng (ví dụ SJC ghi 87,000 tức là 87,000,000 đ/lượng)
  if (num >= 50000 && num <= 150000) {
    return num * 100; // 87000 * 100 = 8,700,000 đ/chỉ
  }
  // Case 4: Dạng triệu VNĐ/lượng (ví dụ DOJI ghi 87.0 tức là 87.0 triệu đ/lượng)
  if (num >= 50 && num <= 150) {
    return num * 100000; // 87.0 * 100,000 = 8,700,000 đ/chỉ
  }
  // Case 5: Dạng triệu VNĐ/chỉ (ví dụ: 8.7 tức là 8,700,000 đ/chỉ)
  if (num >= 5 && num <= 15) {
    return num * 1000000;
  }

  return num;
}

// Logic chính cào dữ liệu và đồng bộ vào Database
async function crawlAndSaveAll() {
  if (!supabase) {
    console.error("Database connection not initialized.");
    return { success: false, error: "Database not initialized" };
  }

  let browser;
  const records = [];
  const errors = [];

  try {
    browser = await puppeteer.launch({
      headless: "new",
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  } catch (launchErr) {
    console.error("Failed to launch Puppeteer:", launchErr);
    return { success: false, error: launchErr.message };
  }

  // 1. Scrape SJC
  try {
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
    await page.goto(process.env.SJC_URL, { waitUntil: 'networkidle2', timeout: 30000 });
    await page.waitForSelector("table");

    const sjcData = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll("table tbody tr"));
      return rows.slice(1).map((row) => {
        const columns = Array.from(row.querySelectorAll("td"));
        return columns.reduce((acc, column, index) => {
          const value = column.textContent.trim().replace(/[\n\r]+/g, "");
          if (index === 1 || index === 2) {
            acc[index === 1 ? "buy" : "sell"] = value;
          } else {
            acc["type"] = value;
          }
          return acc;
        }, {});
      });
    });
    sjcData.pop(); // loại bỏ hàng tổng cộng cuối cùng

    const updatedAt = await page.evaluate(() => {
      const el = document.querySelector(".w350.m5l.float_left.red_text.bg_white");
      return el ? el.textContent.trim() : null;
    });
    const formattedTime = updatedAt ? formatUpdatedAt(updatedAt) : formatUpdatedAt(new Date());

    sjcData.forEach(item => {
      if (item.type && item.buy && item.sell) {
        const buyVnd = normalizePriceToVnd(item.buy);
        const sellVnd = normalizePriceToVnd(item.sell);
        records.push({
          source: 'sjc',
          gold_type: item.type,
          buy_price_vnd: buyVnd,
          sell_price_vnd: sellVnd,
          spread_vnd: Math.max(0, sellVnd - buyVnd)
        });
      }
    });
    console.log(`Scraped SJC successfully: ${sjcData.length} items`);
  } catch (err) {
    console.error("Error scraping SJC:", err);
    errors.push(`SJC: ${err.message}`);
  }

  // 2. Scrape DOJI
  try {
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
    await page.goto(process.env.DOJI_URL, { waitUntil: 'networkidle2', timeout: 30000 });
    await page.waitForSelector("._table");

    const dojiData = await page.evaluate(() => {
      const secondTable = document.querySelectorAll("._table")[1] || document.querySelectorAll("._table")[0];
      const types = Array.from(secondTable.querySelectorAll("._taxonomy ._block")).map((block) => block.textContent.trim());
      const buyPrices = Array.from(secondTable.querySelectorAll("._buy ._block")).map((block) => block.textContent.trim());
      const sellPrices = Array.from(secondTable.querySelectorAll("._Sell ._block")).map((block) => block.textContent.trim());
      const updatedAt = secondTable.querySelector("._desc") ? secondTable.querySelector("._desc").textContent.trim().replace("Cập nhập lúc:", "").trim() : null;

      const list = types.map((type, index) => ({
        type,
        buy: buyPrices[index],
        sell: sellPrices[index],
      }));
      list.pop();
      return { list, updatedAt };
    });

    dojiData.list.forEach(item => {
      if (item.type && item.buy && item.sell) {
        const buyVnd = normalizePriceToVnd(item.buy);
        const sellVnd = normalizePriceToVnd(item.sell);
        records.push({
          source: 'doji',
          gold_type: item.type,
          buy_price_vnd: buyVnd,
          sell_price_vnd: sellVnd,
          spread_vnd: Math.max(0, sellVnd - buyVnd)
        });
      }
    });
    console.log(`Scraped DOJI successfully: ${dojiData.list.length} items`);
  } catch (err) {
    console.error("Error scraping DOJI:", err);
    errors.push(`DOJI: ${err.message}`);
  }

  // 3. Scrape PNJ
  try {
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
    await page.goto(process.env.PNJ_URL, { waitUntil: 'networkidle2', timeout: 30000 });
    await page.waitForSelector(".bang-gia-vang-outer table");

    const pnjData = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll(".bang-gia-vang-outer table tbody tr"));
      const list = rows.map((row) => {
        const columns = row.querySelectorAll("td");
        return {
          type: columns[0].textContent.trim(),
          buy: columns[1].querySelector("span") ? columns[1].querySelector("span").textContent.trim() : columns[1].textContent.trim(),
          sell: columns[2].querySelector("span") ? columns[2].querySelector("span").textContent.trim() : columns[2].textContent.trim(),
        };
      });
      const updatedAt = document.getElementById("time-now") ? document.getElementById("time-now").textContent.trim() : null;
      return { list, updatedAt };
    });

    const formattedTime = pnjData.updatedAt ? formatUpdatedAt(pnjData.updatedAt) : formatUpdatedAt(new Date());

    pnjData.list.forEach(item => {
      if (item.type && item.buy && item.sell) {
        const buyVnd = normalizePriceToVnd(item.buy);
        const sellVnd = normalizePriceToVnd(item.sell);
        records.push({
          source: 'pnj',
          gold_type: item.type,
          buy_price_vnd: buyVnd,
          sell_price_vnd: sellVnd,
          spread_vnd: Math.max(0, sellVnd - buyVnd)
        });
      }
    });
    console.log(`Scraped PNJ successfully: ${pnjData.list.length} items`);
  } catch (err) {
    console.error("Error scraping PNJ:", err);
    errors.push(`PNJ: ${err.message}`);
  }

  await browser.close();

  // Lưu vào Database
  if (records.length > 0) {
    console.log(`Attempting to save ${records.length} snapshots to Supabase table 'gold_price_snapshots'...`);
    const { data, error } = await supabase
      .from('gold_price_snapshots')
      .insert(records);

    if (error) {
      console.error("Error inserting snapshots:", error);
      return { success: false, savedCount: 0, error: error.message, scrapeErrors: errors };
    } else {
      console.log(`Successfully saved ${records.length} snapshots to Database!`);

      // Dọn dẹp bản ghi cũ hơn 3 ngày để tránh phình dữ liệu
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 3);
      console.log(`[Database Cleanup] Deleting gold price snapshots older than ${cutoffDate.toISOString()}...`);
      
      try {
        const { error: delErr } = await supabase
          .from('gold_price_snapshots')
          .delete()
          .lt('recorded_at', cutoffDate.toISOString());

        if (delErr) {
          console.error("[Database Cleanup] Error running clean query:", delErr);
        } else {
          console.log("[Database Cleanup] Clean up complete!");
        }
      } catch (delCatch) {
        console.error("[Database Cleanup] Exception during cleanup:", delCatch);
      }

      return { success: true, savedCount: records.length, scrapeErrors: errors };
    }
  }

  return { success: false, savedCount: 0, error: "No records scraped", scrapeErrors: errors };
}

// Endpoint thủ công kích hoạt cào dữ liệu
app.post("/api/crawl", async (req, res) => {
  console.log("Manual crawl request received");
  const result = await crawlAndSaveAll();
  if (result.success) {
    res.json({ message: "Crawl and save completed successfully!", details: result });
  } else {
    res.status(500).json({ message: "Crawl failed", details: result });
  }
});

// Các endpoint API gốc của dự án (Backward Compatibility)
app.get("/api/sjc", async (req, res) => {
	try {
		const browser = await puppeteer.launch({ headless: "new", args: ['--no-sandbox'] });
		const page = await browser.newPage();
		await page.goto(process.env.SJC_URL);
		await page.waitForSelector("table");
		const data = await page.evaluate(() => {
			const rows = Array.from(document.querySelectorAll("table tbody tr"));
			return rows.slice(1).map((row) => {
				const columns = Array.from(row.querySelectorAll("td"));
				return columns.reduce((acc, column, index) => {
					const value = column.textContent.trim().replace(/[\n\r]+/g, "");
					if (index === 1 || index === 2) {
						acc[index === 1 ? "buy" : "sell"] = (parseFloat(value.replace(/,/g, "")) / 10000).toLocaleString();
					} else {
						acc["type"] = value;
					}
					return acc;
				}, {});
			});
		});
		data.pop();
		const updatedAt = await page.evaluate(() => {
			return document.querySelector(".w350.m5l.float_left.red_text.bg_white").textContent.trim();
		});
		const formatedData = {
			updatedAt: formatUpdatedAt(updatedAt),
			data,
		};
		await browser.close();
		res.json(formatedData);
	} catch (error) {
		console.error("Error scraping SJC data:", error);
		res.status(500).send("Error scraping data");
	}
});

app.get("/api/doji", async (req, res) => {
	try {
		const browser = await puppeteer.launch({ headless: "new", args: ['--no-sandbox'] });
		const page = await browser.newPage();
		await page.goto(process.env.DOJI_URL);
		await page.waitForSelector("._table");
		const data = await page.evaluate(() => {
			const secondTable = document.querySelectorAll("._table")[1] || document.querySelectorAll("._table")[0];
			const types = Array.from(secondTable.querySelectorAll("._taxonomy ._block")).map((block) => block.textContent.trim());
			const buyPrices = Array.from(secondTable.querySelectorAll("._buy ._block")).map((block) => block.textContent.trim());
			const sellPrices = Array.from(secondTable.querySelectorAll("._Sell ._block")).map((block) => block.textContent.trim());
			const updatedAt = secondTable.querySelector("._desc").textContent.trim().replace("Cập nhập lúc:", "").trim();
			const list = types.map((type, index) => ({
				type,
				buy: buyPrices[index],
				sell: sellPrices[index],
			}));
			list.pop();
			return { updatedAt, data: list };
		});
		await browser.close();
		res.json(data);
	} catch (error) {
		console.error("Error scraping DOJI data:", error);
		res.status(500).send("Error scraping data");
	}
});

app.get("/api/pnj", async (req, res) => {
	try {
		const browser = await puppeteer.launch({ headless: "new", args: ['--no-sandbox'] });
		const page = await browser.newPage();
		await page.goto(process.env.PNJ_URL);
		await page.waitForSelector(".bang-gia-vang-outer table");
		const data = await page.evaluate(() => {
			const rows = Array.from(document.querySelectorAll(".bang-gia-vang-outer table tbody tr"));
			return rows.map((row) => {
				const columns = row.querySelectorAll("td");
				return {
					type: columns[0].textContent.trim(),
					buy: columns[1].querySelector("span").textContent.trim(),
					sell: columns[2].querySelector("span").textContent.trim(),
				};
			});
		});
		const updatedAt = await page.evaluate(() => {
			return document.getElementById("time-now").textContent.trim();
		});
		await browser.close();
		const formattedData = {
      updatedAt: formatUpdatedAt(updatedAt),
			data,
		};
		res.json(formattedData);
	} catch (error) {
		console.error("Error scraping PNJ data:", error);
		res.status(500).send("Error scraping data");
	}
});

// GET /api/v2/gold/sjc - Lấy thông tin giá vàng SJC mới nhất dạng vnappmob
app.get("/api/v2/gold/sjc", async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ error: "Database connection not initialized" });
  }

  // Lấy 30 bản ghi SJC mới nhất
  const { data, error } = await supabase
    .from('gold_price_snapshots')
    .select('*')
    .eq('source', 'sjc')
    .order('recorded_at', { ascending: false })
    .limit(30);

  if (error) {
    console.error("Error fetching SJC v2 snapshots:", error);
    return res.status(500).json({ error: error.message });
  }

  const latestByType = {};
  if (data) {
    data.forEach(row => {
      if (!latestByType[row.gold_type]) {
        latestByType[row.gold_type] = row;
      }
    });
  }

  const findPriceVal = (keywords, field) => {
    for (const [type, row] of Object.entries(latestByType)) {
      const lowerType = type.toLowerCase();
      if (keywords.every(kw => lowerType.includes(kw))) {
        return Number(row[field === 'buy' ? 'buy_price_vnd' : 'sell_price_vnd']);
      }
    }
    return null;
  };

  // Fallbacks mặc định trong trường hợp chưa cào được data
  const buy_1l = findPriceVal(['1l'], 'buy') || findPriceVal(['10l'], 'buy') || 87000000;
  const sell_1l = findPriceVal(['1l'], 'sell') || findPriceVal(['10l'], 'sell') || 87500000;
  
  const buy_1c = findPriceVal(['5c'], 'buy') || findPriceVal(['1c'], 'buy') || findPriceVal(['2c'], 'buy') || 8700000;
  const sell_1c = findPriceVal(['5c'], 'sell') || findPriceVal(['1c'], 'sell') || findPriceVal(['2c'], 'sell') || 8750000;

  const buy_nhan1c = findPriceVal(['nhẫn'], 'buy') || findPriceVal(['nhan'], 'buy') || 7870000;
  const sell_nhan1c = findPriceVal(['nhẫn'], 'sell') || findPriceVal(['nhan'], 'sell') || 7920000;

  const buy_trangsuc49 = findPriceVal(['nữ trang'], 'buy') || findPriceVal(['trang sức'], 'buy') || findPriceVal(['nu trang'], 'buy') || findPriceVal(['trang suc'], 'buy') || 7600000;
  const sell_trangsuc49 = findPriceVal(['nữ trang'], 'sell') || findPriceVal(['trang sức'], 'sell') || findPriceVal(['nu trang'], 'sell') || findPriceVal(['trang suc'], 'sell') || 7750000;

  res.json({
    results: [
      {
        buy_1l,
        sell_1l,
        buy_1c,
        sell_1c,
        buy_nhan1c,
        sell_nhan1c,
        buy_trangsuc49,
        sell_trangsuc49
      }
    ]
  });
});

// POST /api/v2/gold/sjc - Đẩy dữ liệu giá vàng mới trực tiếp vào database
app.post("/api/v2/gold/sjc", async (req, res) => {
  const {
    buy_1l, sell_1l,
    buy_1c, sell_1c,
    buy_nhan1c, sell_nhan1c,
    buy_trangsuc49, sell_trangsuc49
  } = req.body;

  if (!supabase) {
    return res.status(500).json({ error: "Database connection not initialized" });
  }

  const records = [];
  const nowStr = formatUpdatedAt(new Date());

  if (buy_1l && sell_1l) {
    records.push({
      source: 'sjc',
      gold_type: 'SJC 1L - 10L - 1KG',
      buy_price_vnd: Number(buy_1l),
      sell_price_vnd: Number(sell_1l),
      spread_vnd: Math.max(0, Number(sell_1l) - Number(buy_1l))
    });
  }

  if (buy_1c && sell_1c) {
    records.push({
      source: 'sjc',
      gold_type: 'SJC 5c - 2c - 1c',
      buy_price_vnd: Number(buy_1c),
      sell_price_vnd: Number(sell_1c),
      spread_vnd: Math.max(0, Number(sell_1c) - Number(buy_1c))
    });
  }

  if (buy_nhan1c && sell_nhan1c) {
    records.push({
      source: 'sjc',
      gold_type: 'Vàng nhẫn SJC 99,99 1 chỉ, 2 chỉ, 5 chỉ',
      buy_price_vnd: Number(buy_nhan1c),
      sell_price_vnd: Number(sell_nhan1c),
      spread_vnd: Math.max(0, Number(sell_nhan1c) - Number(buy_nhan1c))
    });
  }

  if (buy_trangsuc49 && sell_trangsuc49) {
    records.push({
      source: 'sjc',
      gold_type: 'Vàng nữ trang 99,99%',
      buy_price_vnd: Number(buy_trangsuc49),
      sell_price_vnd: Number(sell_trangsuc49),
      spread_vnd: Math.max(0, Number(sell_trangsuc49) - Number(buy_trangsuc49))
    });
  }

  if (records.length === 0) {
    return res.status(400).json({ error: "No valid gold price fields provided" });
  }

  const { data, error } = await supabase
    .from('gold_price_snapshots')
    .insert(records);

  if (error) {
    console.error("Error inserting manual gold prices:", error);
    return res.status(500).json({ error: error.message });
  }

  return res.status(201).send("Created");
});

// GET /api/v2/gold/doji - Lấy thông tin giá vàng DOJI mới nhất dạng vnappmob
app.get("/api/v2/gold/doji", async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ error: "Database connection not initialized" });
  }

  const { data, error } = await supabase
    .from('gold_price_snapshots')
    .select('*')
    .eq('source', 'doji')
    .order('recorded_at', { ascending: false })
    .limit(30);

  if (error) {
    console.error("Error fetching DOJI v2 snapshots:", error);
    return res.status(500).json({ error: error.message });
  }

  const latestByType = {};
  if (data) {
    data.forEach(row => {
      if (!latestByType[row.gold_type]) {
        latestByType[row.gold_type] = row;
      }
    });
  }

  const findPriceVal = (keywords, field) => {
    for (const [type, row] of Object.entries(latestByType)) {
      const lowerType = type.toLowerCase();
      if (keywords.every(kw => lowerType.includes(kw))) {
        return Number(row[field === 'buy' ? 'buy_price_vnd' : 'sell_price_vnd']);
      }
    }
    return null;
  };

  const buy_hcm = findPriceVal(['hcm'], 'buy') || findPriceVal(['hồ chí minh'], 'buy') || 8580000;
  const sell_hcm = findPriceVal(['hcm'], 'sell') || findPriceVal(['hồ chí minh'], 'sell') || 8630000;
  const buy_hn = findPriceVal(['hn'], 'buy') || findPriceVal(['hà nội'], 'buy') || 8580000;
  const sell_hn = findPriceVal(['hn'], 'sell') || findPriceVal(['hà nội'], 'sell') || 8630000;

  res.json({
    results: [
      {
        buy_hcm,
        sell_hcm,
        buy_hn,
        sell_hn
      }
    ]
  });
});

// POST /api/v2/gold/doji - Đẩy dữ liệu giá vàng DOJI mới trực tiếp vào database
app.post("/api/v2/gold/doji", async (req, res) => {
  const { buy_hcm, sell_hcm, buy_hn, sell_hn } = req.body;
  if (!supabase) {
    return res.status(500).json({ error: "Database connection not initialized" });
  }

  const records = [];

  if (buy_hcm && sell_hcm) {
    records.push({
      source: 'doji',
      gold_type: 'DOJI HCM',
      buy_price_vnd: Number(buy_hcm),
      sell_price_vnd: Number(sell_hcm),
      spread_vnd: Math.max(0, Number(sell_hcm) - Number(buy_hcm))
    });
  }

  if (buy_hn && sell_hn) {
    records.push({
      source: 'doji',
      gold_type: 'DOJI HN',
      buy_price_vnd: Number(buy_hn),
      sell_price_vnd: Number(sell_hn),
      spread_vnd: Math.max(0, Number(sell_hn) - Number(buy_hn))
    });
  }

  if (records.length === 0) {
    return res.status(400).json({ error: "No valid gold price fields provided" });
  }

  const { data, error } = await supabase
    .from('gold_price_snapshots')
    .insert(records);

  if (error) {
    console.error("Error inserting manual DOJI prices:", error);
    return res.status(500).json({ error: error.message });
  }

  return res.status(201).send("Created");
});

// GET /api/v2/gold/pnj - Lấy thông tin giá vàng PNJ mới nhất dạng vnappmob
app.get("/api/v2/gold/pnj", async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ error: "Database connection not initialized" });
  }

  const { data, error } = await supabase
    .from('gold_price_snapshots')
    .select('*')
    .eq('source', 'pnj')
    .order('recorded_at', { ascending: false })
    .limit(30);

  if (error) {
    console.error("Error fetching PNJ v2 snapshots:", error);
    return res.status(500).json({ error: error.message });
  }

  const latestByType = {};
  if (data) {
    data.forEach(row => {
      if (!latestByType[row.gold_type]) {
        latestByType[row.gold_type] = row;
      }
    });
  }

  const findPriceVal = (keywords, field) => {
    for (const [type, row] of Object.entries(latestByType)) {
      const lowerType = type.toLowerCase();
      if (keywords.every(kw => lowerType.includes(kw))) {
        return Number(row[field === 'buy' ? 'buy_price_vnd' : 'sell_price_vnd']);
      }
    }
    return null;
  };

  const buy_hcm = findPriceVal(['hcm'], 'buy') || findPriceVal(['hồ chí minh'], 'buy') || 7870000;
  const sell_hcm = findPriceVal(['hcm'], 'sell') || findPriceVal(['hồ chí minh'], 'sell') || 7920000;
  const buy_hn = findPriceVal(['hn'], 'buy') || findPriceVal(['hà nội'], 'buy') || 7870000;
  const sell_hn = findPriceVal(['hn'], 'sell') || findPriceVal(['hà nội'], 'sell') || 7920000;

  res.json({
    results: [
      {
        buy_hcm,
        sell_hcm,
        buy_hn,
        sell_hn
      }
    ]
  });
});

// POST /api/v2/gold/pnj - Đẩy dữ liệu giá vàng PNJ mới trực tiếp vào database
app.post("/api/v2/gold/pnj", async (req, res) => {
  const { buy_hcm, sell_hcm, buy_hn, sell_hn } = req.body;
  if (!supabase) {
    return res.status(500).json({ error: "Database connection not initialized" });
  }

  const records = [];

  if (buy_hcm && sell_hcm) {
    records.push({
      source: 'pnj',
      gold_type: 'PNJ HCM',
      buy_price_vnd: Number(buy_hcm),
      sell_price_vnd: Number(sell_hcm),
      spread_vnd: Math.max(0, Number(sell_hcm) - Number(buy_hcm))
    });
  }

  if (buy_hn && sell_hn) {
    records.push({
      source: 'pnj',
      gold_type: 'PNJ HN',
      buy_price_vnd: Number(buy_hn),
      sell_price_vnd: Number(sell_hn),
      spread_vnd: Math.max(0, Number(sell_hn) - Number(buy_hn))
    });
  }

  if (records.length === 0) {
    return res.status(400).json({ error: "No valid gold price fields provided" });
  }

  const { data, error } = await supabase
    .from('gold_price_snapshots')
    .insert(records);

  if (error) {
    console.error("Error inserting manual PNJ prices:", error);
    return res.status(500).json({ error: error.message });
  }

  return res.status(201).send("Created");
});

// Thiết lập lập lịch cào dữ liệu định kỳ mỗi 5 phút (300,000ms)
const CRAWL_INTERVAL_MS = 5 * 60 * 1000;
setInterval(async () => {
  console.log(`[Scheduled Worker] Starting auto-crawl at: ${new Date().toISOString()}`);
  try {
    const res = await crawlAndSaveAll();
    console.log(`[Scheduled Worker] Crawl complete. Success: ${res.success}, Saved: ${res.savedCount}`);
  } catch (err) {
    console.error(`[Scheduled Worker] Fatal error:`, err);
  }
}, CRAWL_INTERVAL_MS);

// Kích hoạt cào lần đầu tiên ngay khi khởi chạy server
setTimeout(async () => {
  console.log("[Startup] Triggering initial crawl...");
  try {
    const res = await crawlAndSaveAll();
    console.log(`[Startup] Initial crawl completed. Success: ${res.success}, Saved: ${res.savedCount}`);
  } catch (err) {
    console.error("[Startup] Initial crawl failed:", err);
  }
}, 5000);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
	console.log(`Server listening on port ${PORT}`);
});
