import React from 'react';
import useStore from '../store/useStore';
import { Clock } from 'lucide-react';
import AssetOverview from '../components/dashboard/AssetOverview';
import OwnedGoldList from '../components/dashboard/OwnedGoldList';
import O2OGuide from '../components/dashboard/O2OGuide';
import RecentTransactions from '../components/dashboard/RecentTransactions';

export default function Dashboard() {
  const user = useStore(state => state.currentUser);
  const prices = useStore(state => state.goldPrices);
  const balances = useStore(state => state.goldBalances);
  const costBasis = useStore(state => state.goldCostBasis) || {};
  const wallet = useStore(state => state.walletBalance);
  const transactions = useStore(state => state.transactions);

  // Tính giá trị quy đổi vàng ra tiền mặt theo giá Cửa hàng mua vào hiện tại
  const priceKeys = Object.keys(prices);
  const avgBuyPrice = priceKeys.length > 0 
    ? priceKeys.reduce((sum, k) => sum + (prices[k]?.buy || 0), 0) / priceKeys.length 
    : 148000000;
  let totalGoldQty = 0;
  let totalGoldCost = 0;
  let totalGoldValue = 0;

  Object.keys(balances).forEach(key => {
    const qty = balances[key];
    if (qty > 0) {
      totalGoldQty += qty; 
      // Giá mua vào của tiệm cho loại vàng này
      const currentBuyPrice = prices[key]?.buy || avgBuyPrice;
      totalGoldCost += qty * (costBasis[key] || currentBuyPrice);
      totalGoldValue += qty * currentBuyPrice;
    }
  });

  const totalAssetsValue = wallet + totalGoldValue;
  const unrealizedPnl = totalGoldValue - totalGoldCost;
  const unrealizedPercent = totalGoldCost > 0 ? (unrealizedPnl / totalGoldCost) * 100 : 0;
  const pnlColor = unrealizedPnl >= 0 ? 'var(--emerald)' : 'var(--ruby)';
  const pnlSign = unrealizedPnl > 0 ? '+' : '';

  // Lọc ra các loại sản phẩm đang được sở hữu thực sự
  const ownedGoldList = Object.keys(balances).filter(k => balances[k] > 0);

  // Lấy 3 giao dịch gần đây nhất
  const recentTxns = transactions.slice(0, 3);

  return (
    <div style={{ padding: '32px 24px', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* KYC Banners */}
      {user.kycStatus === 'pending' && (
        <div className="neo-card" style={{ padding: '16px 20px', marginBottom: '24px', display: 'flex', alignItems: 'center', background: 'rgba(212, 175, 55, 0.05)', borderColor: 'rgba(212, 175, 55, 0.3)' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <Clock color="var(--gold)" size={24} />
            <div>
              <div style={{ fontSize: '14px', color: 'var(--gold)', fontWeight: 600 }}>Yêu cầu xác minh tài khoản đang chờ duyệt</div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>Cửa hàng đang kiểm tra hồ sơ eKYC của bạn. Quá trình này có thể mất từ 1-2 giờ làm việc.</div>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div className="h2" style={{ letterSpacing: '-1px' }}>Tổng quan tài sản tại cửa hàng</div>
        <div className="body-sm" style={{ color: 'var(--text-muted)' }}>
          Giá quy đổi tính theo giá tiệm mua vào hiện tại
        </div>
      </div>
      
      {/* KHỐI TỔNG TÀI SẢN & LÃI LỖ PNL */}
      <AssetOverview
        totalAssetsValue={totalAssetsValue}
        unrealizedPnl={unrealizedPnl}
        unrealizedPercent={unrealizedPercent}
        pnlColor={pnlColor}
        pnlSign={pnlSign}
        wallet={wallet}
        totalGoldValue={totalGoldValue}
        totalGoldCost={totalGoldCost}
        totalGoldQty={totalGoldQty}
      />

      {/* CHI TIẾT TỪNG LOẠI VÀNG ĐANG SỞ HỮU */}
      <OwnedGoldList 
        ownedGoldList={ownedGoldList} 
        balances={balances} 
        prices={prices} 
        avgBuyPrice={avgBuyPrice} 
      />

      <div className="grid-2" style={{ gap: '16px' }}>
        {/* HƯỚNG DẪN RÚT VÀNG VẬT CHẤT (O2O PROCESS) */}
        <O2OGuide />

        {/* LỊCH SỬ GIAO DỊCH GẦN NHẤT */}
        <RecentTransactions recentTxns={recentTxns} />
      </div>
    </div>
  );
}
