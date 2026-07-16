require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { ethers } = require("ethers");
const { createClient } = require("@supabase/supabase-js");

const app = express();
app.use(cors());
app.use(express.json());

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey, {
  db: { schema: "financial_ledgers" },
});

// Configure Ethers.js
const SEPOLIA_URL = process.env.SEPOLIA_URL || "https://rpc.sepolia.org";
const PRIVATE_KEY = process.env.PRIVATE_KEY; // Backend Admin Wallet
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;

if (!PRIVATE_KEY || !CONTRACT_ADDRESS) {
  console.warn("⚠️ PRIVATE_KEY or CONTRACT_ADDRESS not found in environment. Blockchain Minting will simulate mode.");
}

// Minimal ABI just for mintGold
const ABI = [
  "function mintGold(address to, string orderId, string pdfHash, uint256 goldAmount, string uri) public returns (uint256)",
  "event GoldMinted(address indexed to, uint256 indexed tokenId, string orderId, string pdfHash)"
];

const provider = new ethers.JsonRpcProvider(SEPOLIA_URL);
const wallet = PRIVATE_KEY ? new ethers.Wallet(PRIVATE_KEY, provider) : null;
const contract = wallet ? new ethers.Contract(CONTRACT_ADDRESS, ABI, wallet) : null;

app.post("/api/mint", async (req, res) => {
  const { orderId, pdfHash, goldAmount, userWallet } = req.body;
  if (!orderId || !pdfHash) {
    return res.status(400).json({ success: false, error: "Missing orderId or pdfHash" });
  }

  try {
    const toAddress = userWallet || wallet?.address || "0x51E2b4352D023190E14B851239c5F53106B3dF62"; // Fallback wallet
    
    if (contract) {
      // Execute Real Blockchain Transaction
      console.log(`[Web3] Minting Token for Order ${orderId}...`);
      const tx = await contract.mintGold(toAddress, orderId, pdfHash, goldAmount || 0, "ipfs://gold-metadata");
      console.log(`[Web3] Transaction Submitted: ${tx.hash}`);
      
      const receipt = await tx.wait();
      console.log(`[Web3] Transaction Confirmed in block ${receipt.blockNumber}`);
      
      // Sync into Supabase (Phase 2 completion logic)
      const { error: dbErr } = await supabase.schema('public').from("blockchain_proofs").upsert({
        order_id: orderId,
        network: "Sepolia",
        contract_address: CONTRACT_ADDRESS,
        tx_hash: tx.hash,
        pdf_sha256: pdfHash,
        status: "CONFIRMED"
      });
      if (dbErr) console.error("Lỗi khi lưu blockchain_proofs:", dbErr);

      return res.json({ success: true, txHash: tx.hash });
    } else {
      // Simulation fallback for missing keys
      const mockTxHash = "0x" + require("crypto").randomBytes(32).toString("hex");
      console.log(`[Mock-Web3] Simulated minting for Order ${orderId}. TxHash: ${mockTxHash}`);
      
      const { error: dbErr2 } = await supabase.schema('public').from("blockchain_proofs").upsert({
        order_id: orderId,
        network: "Mock-Sepolia",
        contract_address: "MOCK_CONTRACT",
        tx_hash: mockTxHash,
        pdf_sha256: pdfHash,
        status: "CONFIRMED_MOCK"
      });
      if (dbErr2) console.error("Lỗi khi lưu blockchain_proofs (mock):", dbErr2);

      return res.json({ success: true, txHash: mockTxHash, simulated: true });
    }
  } catch (error) {
    console.error(`[Web3] Minting Error:`, error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/api/verify/:orderId", async (req, res) => {
  const { orderId } = req.params;
  if (!orderId) {
    return res.status(400).json({ success: false, error: "Missing orderId" });
  }

  try {
    // Luôn ưu tiên quét proof thực tế trên CSDL thay vì gọi Blockchain
    // do Blockchain JSON RPC rất chậm và Supabase là nguồn sự thật được đồng bộ 1-1.
    const { data, error } = await supabase.schema('public').from("blockchain_proofs")
      .select("pdf_sha256")
      .eq("order_id", orderId)
      .single();

    if (error || !data) {
      // Fallback: Tìm trong raw orders nếu chưa có blockchain_proof
      const { data: orderData, error: orderErr } = await supabase
        .from('orders')
        .select('pdf_hash')
        .eq('id', orderId)
        .single();
      
      if (orderErr || !orderData) {
        return res.json({ success: false, error: "Order not found" });
      }
      return res.json({ success: true, pdfHash: orderData.pdf_hash });
    }
    
    return res.json({ success: true, pdfHash: data.pdf_sha256 });
  } catch (e) {
    console.error("[Web3] Verify Error:", e.message);
    return res.status(500).json({ success: false, error: e.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 GoldTrader Web3 Auth Server listening on port ${PORT}`);
});
