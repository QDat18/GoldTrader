import React from 'react';
import { Link } from 'react-router-dom';
import useStore from '../store/useStore';
import { Clock, ShieldCheck, Wallet, ArrowRightLeft, MapPin, QrCode, FileText } from 'lucide-react';

export default function Dashboard() {
  const user = useStore(state => state.currentUser);
  const prices = useStore(state => state.goldPrices);
  const balances = useStore(state => state.goldBalances);
  const wallet = useStore(state => state.walletBalance);
  const transactions = useStore(state => state.transactions);

  // Tính giá trị quy đổi vàng ra tiền mặt theo giá Cửa hàng mua vào hiện tại (prices.xxx.buy)
  const sjcValue = balances.sjc * (prices.sjc?.buy || 8700000);
  const pnjValue = balances.pnj * (prices.pnj?.buy || 7870000);
  const dojiValue = balances.doji * (prices.doji?.buy || 8700000);
  const totalGoldValue = sjcValue + pnjValue + dojiValue;

  const totalAssetsValue = wallet + totalGoldValue;

  // Lấy 3 giao dịch gần đây nhất
  const recentTxns = transactions.slice(0, 3);

  return (
    <div style={{ padding: '32px 24px', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* KYC Banners */}
      {user.kycStatus === 'pending' && (
        <div className="neo-card" style={{ padding: '16px 20px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(212, 175, 55, 0.05)', borderColor: 'rgba(212, 175, 55, 0.3)' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <Clock color="var(--gold)" size={24} />
            <div>
              <div style={{ fontSize: '14px', color: 'var(--gold)', fontWeight: 600 }}>Yêu cầu xác minh tài khoản đang chờ duyệt</div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>Cửa hàng đang kiểm tra ảnh CCCD của bạn. Bạn vẫn có thể nạp tiền và mua vàng tích lũy bình thường.</div>
            </div>
          </div>
          <Link to="/admin" className="btn btn-gold" style={{ textDecoration: 'none', padding: '8px 16px' }}>Tới duyệt nhanh (Dev)</Link>
        </div>
      )}
      
      {user.kycStatus === 'verified' && (
        <div className="neo-card" style={{ padding: '16px 20px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.3)' }}>
          <ShieldCheck color="var(--emerald)" size={24} />
          <div>
            <div style={{ fontSize: '14px', color: 'var(--emerald)', fontWeight: 600 }}>Tài khoản đã xác minh (KYC Verified)</div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>Bạn đã được phê duyệt nhận vàng vật chất. Bạn có thể đến bất kỳ chi nhánh nào để rút vàng thật.</div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div className="h2">Tổng quan tài sản tại cửa hàng</div>
        <div className="body-sm" style={{ color: 'var(--text-muted)' }}>
          Giá quy đổi tính theo giá tiệm mua vào hiện tại
        </div>
      </div>
      
      {/* KHỐI TỔNG TÀI SẢN KHÔNG CÓ LÃI LỖ */}
      <div className="neo-card" style={{ marginBottom: '24px', padding: '32px' }}>
        <div className="body-sm" style={{ color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' }}>Tổng giá trị quy đổi hiện tại (Vàng + Ví VND)</div>
        <div style={{ fontSize: '44px', fontWeight: 600, color: 'var(--gold)', lineHeight: 1, marginBottom: '24px' }}>₫{totalAssetsValue.toLocaleString('vi-VN')}</div>
        
        <div style={{ display: 'flex', gap: '48px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '24px' }}>
          <div>
            <div className="body-sm" style={{ color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '12px' }}>Số dư ví VND</div>
            <div style={{ fontSize: '18px', color: '#fff', marginTop: '4px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Wallet size={16} color="var(--gold)" /> ₫{wallet.toLocaleString('vi-VN')}
            </div>
          </div>
          <div>
            <div className="body-sm" style={{ color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '12px' }}>Trị giá vàng tích lũy quy đổi</div>
            <div style={{ fontSize: '18px', color: '#fff', marginTop: '4px', fontWeight: 600 }}>
              ₫{totalGoldValue.toLocaleString('vi-VN')}
            </div>
          </div>
          <div>
            <div className="body-sm" style={{ color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '12px' }}>Tổng khối lượng sở hữu</div>
            <div style={{ fontSize: '18px', color: '#fff', marginTop: '4px', fontWeight: 600 }}>
              {(balances.sjc + balances.pnj + balances.doji).toFixed(3)} chỉ
            </div>
          </div>
        </div>
      </div>

      {/* CHI TIẾT TỪNG LOẠI VÀNG ĐANG SỞ HỮU */}
      <div className="grid-3" style={{ marginBottom: '24px', gap: '16px' }}>
        <div className="neo-card" style={{ padding: '20px 24px' }}>
          <div className="body-sm" style={{ color: 'var(--text-muted)', fontWeight: 600 }}>SỐ DƯ SJC</div>
          <div style={{ fontSize: '24px', fontWeight: 600, color: '#fff', marginTop: '8px' }}>{balances.sjc.toFixed(3)} chỉ</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>
            Trị giá quy đổi: <span style={{ color: 'var(--gold)', fontWeight: '500' }}>₫{sjcValue.toLocaleString('vi-VN')}</span>
          </div>
        </div>
        <div className="neo-card" style={{ padding: '20px 24px' }}>
          <div className="body-sm" style={{ color: 'var(--text-muted)', fontWeight: 600 }}>SỐ DƯ PNJ</div>
          <div style={{ fontSize: '24px', fontWeight: 600, color: '#fff', marginTop: '8px' }}>{balances.pnj.toFixed(3)} chỉ</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>
            Trị giá quy đổi: <span style={{ color: 'var(--gold)', fontWeight: '500' }}>₫{pnjValue.toLocaleString('vi-VN')}</span>
          </div>
        </div>
        <div className="neo-card" style={{ padding: '20px 24px' }}>
          <div className="body-sm" style={{ color: 'var(--text-muted)', fontWeight: 600 }}>SỐ DƯ DOJI</div>
          <div style={{ fontSize: '24px', fontWeight: 600, color: '#fff', marginTop: '8px' }}>{balances.doji.toFixed(3)} chỉ</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>
            Trị giá quy đổi: <span style={{ color: 'var(--gold)', fontWeight: '500' }}>₫{dojiValue.toLocaleString('vi-VN')}</span>
          </div>
        </div>
      </div>

      <div className="grid-2" style={{ gap: '16px' }}>
        
        {/* HƯỚNG DẪN RÚT VÀNG VẬT CHẤT (O2O PROCESS) */}
        <div className="neo-card" style={{ padding: '24px' }}>
          <div className="h3" style={{ marginBottom: '16px' }}>Hướng dẫn nhận Vàng vật chất tại quầy</div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(212,175,55,0.1)', border: '1.5px solid var(--gold)', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', color: 'var(--gold)', fontSize: '12px', fontWeight: 'bold', flexShrink: 0, marginTop: '2px' }}>
                1
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#fff' }}>Mua tích lũy trực tuyến</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Sử dụng số dư ví VND để mua vàng trực tuyến theo giá chốt niêm yết bất cứ lúc nào.
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(212,175,55,0.1)', border: '1.5px solid var(--gold)', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', color: 'var(--gold)', fontSize: '12px', fontWeight: 'bold', flexShrink: 0, marginTop: '2px' }}>
                2
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#fff' }}>Yêu cầu tạo hợp đồng & Hóa đơn số</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Hệ thống tự động sinh Hợp đồng điện tử ký số và mã QR xác thực động (TOTP) thay đổi mỗi 30 giây.
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(212,175,55,0.1)', border: '1.5px solid var(--gold)', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', color: 'var(--gold)', fontSize: '12px', fontWeight: 'bold', flexShrink: 0, marginTop: '2px' }}>
                3
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#fff' }}>Nhận vàng vật chất tại tiệm</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Đến trực tiếp cửa hàng, xuất trình mã QR và CCCD trùng khớp với hồ sơ để nhận vàng thật 100%.
                </div>
              </div>
            </div>

          </div>

          <div style={{ marginTop: '20px', padding: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '8px', display: 'flex', gap: '10px', alignItems: 'center' }}>
            <MapPin size={18} color="var(--gold)" />
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              <strong>Địa chỉ nhận vàng:</strong> Trụ sở chính GoldChain, Q.1, TP. Hồ Chí Minh.
            </span>
          </div>
        </div>

        {/* LỊCH SỬ GIAO DỊCH GẦN NHẤT */}
        <div className="neo-card" style={{ padding: '24px' }}>
          <div className="h3" style={{ marginBottom: '16px' }}>Các giao dịch gần đây</div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-silver)', color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: 500 }}>Loại giao dịch</th>
                  <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: 500 }}>Sản phẩm</th>
                  <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: 500 }}>Số lượng</th>
                  <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: 500 }}>Tổng tiền</th>
                  <th style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 500 }}>Thời gian</th>
                </tr>
              </thead>
              <tbody>
                {recentTxns.length > 0 ? recentTxns.map((txn, index) => (
                  <tr key={index} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '16px 8px' }}>
                      {txn.type === 'buy' ? <span style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--emerald)', padding: '4px 10px', borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}>Mua vào</span> :
                       txn.type === 'dca' ? <span style={{ background: 'rgba(212, 175, 55, 0.1)', color: 'var(--gold)', padding: '4px 10px', borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}>Tích lũy DCA</span> :
                       <span style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--ruby)', padding: '4px 10px', borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}>Bán ra</span>}
                    </td>
                    <td style={{ padding: '16px 8px', fontWeight: 500, color: '#fff' }}>{txn.goldTypeName}</td>
                    <td style={{ padding: '16px 8px', color: '#fff' }}>{txn.quantity.toFixed(3)} chỉ</td>
                    <td style={{ padding: '16px 8px', color: 'var(--gold)', fontWeight: 500 }}>₫{txn.total.toLocaleString('vi-VN')}</td>
                    <td style={{ padding: '16px 8px', textAlign: 'right', color: 'var(--text-muted)', fontSize: '13px' }}>{txn.time}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="5" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>Chưa có giao dịch mua bán nào</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <Link to="/history" className="btn btn-outline" style={{ width: '100%', marginTop: '20px', textDecoration: 'none', justifyContent: 'center' }}>
            Xem toàn bộ lịch sử
          </Link>
        </div>

      </div>
    </div>
  );
}
