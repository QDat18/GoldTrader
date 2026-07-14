/**
 * ContractModal.jsx
 * Modal xem hợp đồng sau giao dịch thành công.
 * Tab 1: Preview email kiểu Gmail
 * Tab 2: Xem hợp đồng đầy đủ (inline HTML, tiếng Việt đúng)
 */

import React, { useState, useEffect } from 'react';
import { downloadContractPDF, SELLER_INFO, getTransactionTypeLabel } from '../utils/contractService';

function fmtVND(v) {
  return new Intl.NumberFormat('vi-VN').format(Math.round(v)) + ' ₫';
}
function fmtDate(d) {
  if (!d) return '';
  const dt = d instanceof Date ? d : new Date(d);
  return dt.toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}
function typeStyle(type) {
  return type === 'buy'
    ? { color: '#34d399', bg: '#064e3b', border: '#065f46', label: 'MUA VÀNG' }
    : type === 'sell'
    ? { color: '#f87171', bg: '#4c0519', border: '#7f1d1d', label: 'BÁN VÀNG' }
    : { color: '#fbbf24', bg: '#451a03', border: '#78350f', label: 'RÚT VẬT CHẤT' };
}

// ─── EMAIL STATUS BADGE ───────────────────────────────────────────────────────
function EmailStatusBadge({ status }) {
  const map = {
    sending: { icon: null, pulse: true, color: '#fbbf24',  border: 'rgba(251,191,36,0.3)',  bg: 'rgba(251,191,36,0.08)',  text: 'Đang gửi Gmail...' },
    gmail:   { icon: '✅', pulse: false, color: '#34d399', border: 'rgba(52,211,153,0.3)',  bg: 'rgba(52,211,153,0.08)',  text: 'Gmail đã gửi thành công' },
    sent:    { icon: '✅', pulse: false, color: '#34d399', border: 'rgba(52,211,153,0.3)',  bg: 'rgba(52,211,153,0.08)',  text: 'Email đã gửi' },
    demo:    { icon: '📥', pulse: false, color: '#fbbf24', border: 'rgba(212,175,55,0.3)',  bg: 'rgba(212,175,55,0.08)', text: 'PDF đã tải về máy' },
    error:   { icon: '⚠️', pulse: false, color: '#f87171', border: 'rgba(248,113,113,0.3)', bg: 'rgba(248,113,113,0.08)', text: 'Lỗi gửi mail' },
  };
  const s = map[status] || map.demo;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '6px',
      padding: '5px 12px', borderRadius: '20px',
      background: s.bg, border: `1px solid ${s.border}`,
    }}>
      {s.pulse ? (
        <div style={{
          width: '7px', height: '7px', borderRadius: '50%', background: s.color,
          animation: 'gc-pulse 1.2s ease-in-out infinite',
        }} />
      ) : (
        <span style={{ fontSize: '12px' }}>{s.icon}</span>
      )}
      <span style={{ fontSize: '11px', color: s.color, fontWeight: 600 }}>{s.text}</span>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function ContractModal({ isOpen, onClose, contractData, pdfDoc, emailStatus }) {
  const [tab, setTab]         = useState('email');
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isOpen) { setTab('email'); setTimeout(() => setVisible(true), 10); }
    else setVisible(false);
  }, [isOpen]);

  if (!isOpen || !contractData) return null;

  const ts    = typeStyle(contractData.transactionType);
  const cDate = contractData.contractDate instanceof Date
    ? contractData.contractDate
    : new Date(contractData.contractDate);
  const qty = contractData.quantityGrams ?? contractData.quantityChi * 3.75;

  const handleDownload = () => { if (pdfDoc) downloadContractPDF(pdfDoc, contractData.contractNumber); };
  const handleClose    = () => { setVisible(false); setTimeout(onClose, 280); };

  return (
    <div
      id="contract-modal-overlay"
      onClick={e => { if (e.target === e.currentTarget) handleClose(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 2000,
        background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
        opacity: visible ? 1 : 0, transition: 'opacity 0.28s ease',
      }}
    >
      <div style={{
        width: '100%', maxWidth: '700px', maxHeight: '92vh',
        background: '#0a0a0a',
        border: '1px solid rgba(212,175,55,0.3)',
        borderRadius: '16px',
        boxShadow: '0 0 60px rgba(212,175,55,0.1), 0 40px 80px rgba(0,0,0,0.85)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        transform: visible ? 'translateY(0) scale(1)' : 'translateY(24px) scale(0.97)',
        transition: 'transform 0.32s cubic-bezier(0.34,1.56,0.64,1)',
      }}>

        {/* ── HEADER ── */}
        <div style={{
          background: 'linear-gradient(135deg,#0d0900,#1a1000,#0d0900)',
          borderBottom: '1px solid rgba(212,175,55,0.22)',
          padding: '18px 22px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '42px', height: '42px', borderRadius: '10px', flexShrink: 0,
              background: 'radial-gradient(circle,#D4AF37,#8B6914)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 16px rgba(212,175,55,0.35)', fontSize: '20px',
            }}>📜</div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>
                Hợp Đồng Giao Dịch Vàng
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '5px' }}>
                <span style={{
                  padding: '2px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 700,
                  background: ts.bg, color: ts.color, border: `1px solid ${ts.border}`, letterSpacing: '0.5px',
                }}>{ts.label}</span>
                <span style={{ fontSize: '10px', color: 'rgba(212,175,55,0.65)', fontFamily: 'monospace' }}>
                  {contractData.contractNumber}
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <EmailStatusBadge status={emailStatus} />
            <button
              id="contract-modal-close"
              onClick={handleClose}
              style={{
                width: '30px', height: '30px', borderRadius: '50%',
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                color: 'rgba(255,255,255,0.45)', cursor: 'pointer', fontSize: '15px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s',
              }}
              onMouseEnter={e => Object.assign(e.currentTarget.style, { background: 'rgba(255,255,255,0.1)', color: '#fff' })}
              onMouseLeave={e => Object.assign(e.currentTarget.style, { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.45)' })}
            >✕</button>
          </div>
        </div>

        {/* ── TABS ── */}
        <div style={{ display: 'flex', background: '#060606', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
          {[
            { id: 'email',    icon: '📧', label: 'Xem Email' },
            { id: 'contract', icon: '📄', label: 'Chi tiết Hợp đồng' },
          ].map(t => (
            <button key={t.id} id={`contract-tab-${t.id}`} onClick={() => setTab(t.id)} style={{
              flex: 1, padding: '11px', border: 'none', cursor: 'pointer',
              background: tab === t.id ? '#0a0a0a' : 'transparent',
              color: tab === t.id ? '#D4AF37' : 'rgba(255,255,255,0.38)',
              fontSize: '12px', fontWeight: tab === t.id ? 700 : 400,
              borderBottom: `2px solid ${tab === t.id ? '#D4AF37' : 'transparent'}`,
              transition: 'all 0.2s',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            }}>
              <span>{t.icon}</span><span>{t.label}</span>
            </button>
          ))}
        </div>

        {/* ── BODY ── */}
        <div style={{ overflowY: 'auto', flex: 1 }}>

          {/* ──── EMAIL TAB ──── */}
          {tab === 'email' && (
            <div style={{ padding: '18px 20px' }}>
              <div style={{ background: '#0f0f0f', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', overflow: 'hidden' }}>

                {/* Email header */}
                <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>
                      📧 Hợp đồng giao dịch vàng #{contractData.contractNumber}
                    </div>
                    <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.28)', flexShrink: 0, marginLeft: '12px' }}>
                      {fmtDate(cDate)}
                    </div>
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'rgba(255,255,255,0.45)', marginBottom: '4px' }}>
                    <span style={{ color: 'rgba(255,255,255,0.25)' }}>Từ: </span>
                    <span style={{ color: '#D4AF37' }}>GoldChain &lt;{SELLER_INFO.email}&gt;</span>
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'rgba(255,255,255,0.45)' }}>
                    <span style={{ color: 'rgba(255,255,255,0.25)' }}>Đến: </span>
                    <span>{contractData.buyer?.name} &lt;{contractData.buyer?.email || 'khachhang@email.com'}&gt;</span>
                  </div>
                </div>

                {/* Email body */}
                <div style={{ padding: '18px', fontSize: '12.5px', color: 'rgba(255,255,255,0.75)', lineHeight: '1.7' }}>
                  <p style={{ margin: '0 0 10px' }}>
                    Kính gửi <strong style={{ color: '#D4AF37' }}>{contractData.buyer?.name || 'Quý khách'}</strong>,
                  </p>
                  <p style={{ margin: '0 0 14px', color: 'rgba(255,255,255,0.55)' }}>
                    GoldChain xin trân trọng thông báo giao dịch của Quý khách đã được xử lý thành công.
                    Hợp đồng điện tử có đính kèm bên dưới.
                  </p>

                  {/* Summary box */}
                  <div style={{
                    background: 'linear-gradient(135deg,#120d00,#1a1000)',
                    border: '1px solid rgba(212,175,55,0.25)',
                    borderRadius: '8px', padding: '14px', marginBottom: '14px',
                  }}>
                    <div style={{ fontSize: '9.5px', color: 'rgba(212,175,55,0.65)', fontWeight: 700, letterSpacing: '1px', marginBottom: '10px' }}>
                      TÓM TẮT GIAO DỊCH
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      {[
                        ['Loại GD',    ts.label],
                        ['Sản phẩm',  contractData.goldName],
                        ['Số lượng',  `${contractData.quantityChi} chỉ (${qty.toFixed(4)} gam)`],
                        ['Đơn giá',   fmtVND(contractData.unitPrice)],
                        ['Tổng tiền', fmtVND(contractData.totalAmount)],
                        ['Mã HĐ',     contractData.contractNumber],
                      ].map(([l, v]) => (
                        <div key={l}>
                          <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', marginBottom: '2px' }}>{l}</div>
                          <div style={{ fontSize: '11px', fontWeight: 600, color: l === 'Tổng tiền' ? '#D4AF37' : '#fff' }}>{v}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <p style={{ margin: '0 0 10px', color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>
                    Hợp đồng PDF đính kèm có giá trị pháp lý đầy đủ. Quý khách vui lòng mở tệp đính kèm trong hộp thư Gmail để xem chi tiết.
                  </p>
                  <p style={{ margin: 0, color: 'rgba(255,255,255,0.4)', fontSize: '11.5px' }}>
                    Trân trọng,<br />
                    <strong style={{ color: '#D4AF37' }}>GoldChain Vàng Việt Nam</strong><br />
                    {SELLER_INFO.phone} | {SELLER_INFO.email}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ──── CONTRACT TAB ──── */}
          {tab === 'contract' && (
            <div style={{ padding: '18px 20px' }}>
              <div style={{
                background: '#080808',
                border: '2px solid rgba(212,175,55,0.35)',
                borderRadius: '10px', overflow: 'hidden',
                boxShadow: 'inset 0 0 40px rgba(212,175,55,0.03)',
              }}>
                {/* Contract header */}
                <div style={{
                  background: 'linear-gradient(135deg,#1a1000,#241800,#1a1000)',
                  borderBottom: '2px solid rgba(212,175,55,0.3)',
                  padding: '20px', textAlign: 'center',
                }}>
                  <div style={{ fontSize: '22px', marginBottom: '6px' }}>⚜</div>
                  <div style={{ fontSize: '20px', fontWeight: 900, color: '#D4AF37', letterSpacing: '4px' }}>GOLDCHAIN</div>
                  <div style={{ fontSize: '9px', color: 'rgba(212,175,55,0.55)', letterSpacing: '2px', marginBottom: '10px' }}>VÀNG VIỆT NAM</div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff', letterSpacing: '1px' }}>
                    HỢP ĐỒNG {getTransactionTypeLabel(contractData.transactionType)}
                  </div>
                  <div style={{ fontSize: '10px', color: 'rgba(212,175,55,0.75)', fontFamily: 'monospace', marginTop: '5px' }}>
                    Số: {contractData.contractNumber}
                  </div>
                  <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.35)', marginTop: '4px' }}>
                    Ngày ký: {fmtDate(cDate)}
                  </div>
                </div>

                {/* Parties */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
                  {/* Seller */}
                  <div style={{ padding: '16px', borderRight: '1px solid rgba(212,175,55,0.12)' }}>
                    <div style={{ fontSize: '9px', fontWeight: 800, color: '#D4AF37', letterSpacing: '1.5px', marginBottom: '10px', paddingBottom: '6px', borderBottom: '1px solid rgba(212,175,55,0.15)' }}>BÊN BÁN — PARTY A</div>
                    {[
                      ['Tên đơn vị',     SELLER_INFO.name],
                      ['Địa chỉ',        SELLER_INFO.address],
                      ['Điện thoại',     SELLER_INFO.phone],
                      ['Email',          SELLER_INFO.email],
                      ['Người đại diện', SELLER_INFO.representative],
                      ['Chức vụ',        SELLER_INFO.title],
                    ].map(([l, v]) => (
                      <div key={l} style={{ marginBottom: '7px' }}>
                        <div style={{ fontSize: '8.5px', color: 'rgba(212,175,55,0.5)', marginBottom: '2px' }}>{l}</div>
                        <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.82)', fontWeight: 500, lineHeight: 1.4 }}>{v}</div>
                      </div>
                    ))}
                  </div>
                  {/* Buyer */}
                  <div style={{ padding: '16px' }}>
                    <div style={{ fontSize: '9px', fontWeight: 800, color: '#fff', letterSpacing: '1.5px', marginBottom: '10px', paddingBottom: '6px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>BÊN MUA — PARTY B</div>
                    {[
                      ['Họ và tên',  contractData.buyer?.name  || 'Khách hàng'],
                      ['CCCD/CMND',  contractData.buyer?.cccd  || 'Chưa cập nhật'],
                      ['Điện thoại', contractData.buyer?.phone || 'Chưa cập nhật'],
                      ['Email',      contractData.buyer?.email || 'Chưa cập nhật'],
                      ['Mã KH',      contractData.buyer?.id ? `GC-${contractData.buyer.id.substr(0,8).toUpperCase()}` : 'N/A'],
                    ].map(([l, v]) => (
                      <div key={l} style={{ marginBottom: '7px' }}>
                        <div style={{ fontSize: '8.5px', color: 'rgba(255,255,255,0.35)', marginBottom: '2px' }}>{l}</div>
                        <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.82)', fontWeight: 500, lineHeight: 1.4 }}>{v}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Transaction table */}
                <div style={{ borderTop: '1px solid rgba(212,175,55,0.15)', overflow: 'hidden' }}>
                  <div style={{ background: 'rgba(212,175,55,0.07)', padding: '8px 16px', borderBottom: '1px solid rgba(212,175,55,0.15)' }}>
                    <span style={{ fontSize: '9px', fontWeight: 800, color: '#D4AF37', letterSpacing: '1.5px' }}>NỘI DUNG GIAO DỊCH</span>
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                    <thead>
                      <tr style={{ background: 'rgba(20,15,0,0.8)' }}>
                        {['Hàng hóa / Dịch vụ', 'Đơn giá (/chỉ)', 'Số lượng', 'Thành tiền'].map((h, i) => (
                          <th key={h} style={{
                            padding: '8px 14px', textAlign: i === 3 ? 'right' : 'left',
                            color: '#D4AF37', fontWeight: 700, fontSize: '9.5px',
                            borderBottom: '1px solid rgba(212,175,55,0.15)',
                          }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style={{ padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                          <div style={{ fontWeight: 700, color: '#fff' }}>{contractData.goldName}</div>
                          <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.35)', marginTop: '2px' }}>Vàng vật chất – GoldChain bảo chứng</div>
                        </td>
                        <td style={{ padding: '10px 14px', color: 'rgba(255,255,255,0.8)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>{fmtVND(contractData.unitPrice)}</td>
                        <td style={{ padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                          <div style={{ color: 'rgba(255,255,255,0.8)' }}>{contractData.quantityChi} chỉ</div>
                          <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.35)', marginTop: '2px' }}>≈ {qty.toFixed(4)} gam</div>
                        </td>
                        <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, color: '#D4AF37', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>{fmtVND(contractData.totalAmount)}</td>
                      </tr>
                      <tr style={{ background: 'rgba(212,175,55,0.04)' }}>
                        <td colSpan={3} style={{ padding: '10px 14px', fontWeight: 800, color: '#fff', fontSize: '13px' }}>TỔNG THANH TOÁN</td>
                        <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 900, color: '#D4AF37', fontSize: '15px' }}>{fmtVND(contractData.totalAmount)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Signatures */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderTop: '1px solid rgba(212,175,55,0.15)' }}>
                  {[
                    { label: 'BÊN BÁN', name: SELLER_INFO.representative, sub: SELLER_INFO.title, hasSeal: true, color: '#D4AF37' },
                    { label: 'BÊN MUA', name: contractData.buyer?.name || 'Khách hàng', sub: `CCCD: ${contractData.buyer?.cccd || 'N/A'}`, hasSeal: false, color: '#fff' },
                  ].map((p, i) => (
                    <div key={i} style={{
                      padding: '18px 16px', textAlign: 'center',
                      borderRight: i === 0 ? '1px solid rgba(212,175,55,0.12)' : 'none',
                    }}>
                      <div style={{ fontSize: '9px', fontWeight: 800, color: p.color, letterSpacing: '1.5px', marginBottom: '14px' }}>{p.label}</div>
                      {p.hasSeal ? (
                        <div style={{
                          width: '56px', height: '56px', borderRadius: '50%', margin: '0 auto 12px',
                          border: '2px solid rgba(212,175,55,0.5)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: 'radial-gradient(circle,rgba(212,175,55,0.08),transparent)',
                        }}>
                          <div style={{ textAlign: 'center', lineHeight: 1.3 }}>
                            <div style={{ fontSize: '7px', fontWeight: 800, color: '#D4AF37' }}>GoldChain</div>
                            <div style={{ fontSize: '6px', color: 'rgba(212,175,55,0.55)' }}>VN</div>
                          </div>
                        </div>
                      ) : (
                        <div style={{ height: '56px', width: '56px', margin: '0 auto 12px', border: '1px dashed rgba(255,255,255,0.12)', borderRadius: '4px' }} />
                      )}
                      <div style={{ height: '1px', background: `rgba(${p.hasSeal ? '212,175,55' : '255,255,255'},0.2)`, width: '75%', margin: '0 auto 7px' }} />
                      <div style={{ fontSize: '10.5px', fontWeight: 700, color: '#fff' }}>{p.name}</div>
                      <div style={{ fontSize: '8.5px', color: 'rgba(255,255,255,0.38)', marginTop: '2px' }}>{p.sub}</div>
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <div style={{ background: 'rgba(0,0,0,0.4)', borderTop: '1px solid rgba(212,175,55,0.18)', padding: '10px 16px', textAlign: 'center' }}>
                  <div style={{ fontSize: '9.5px', color: 'rgba(212,175,55,0.55)' }}>
                    {SELLER_INFO.name} | {SELLER_INFO.address} | {SELLER_INFO.phone}
                  </div>
                  <div style={{ fontSize: '8.5px', color: 'rgba(255,255,255,0.2)', marginTop: '3px' }}>
                    Tài liệu có giá trị pháp lý. Mã xác thực: {contractData.contractNumber}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── FOOTER ACTIONS ── */}
        <div style={{
          padding: '14px 22px', borderTop: '1px solid rgba(255,255,255,0.06)',
          background: '#060606', display: 'flex', justifyContent: 'flex-end', gap: '10px', flexShrink: 0,
        }}>
          <button
            id="contract-btn-download"
            onClick={handleDownload}
            style={{
              padding: '8px 18px', borderRadius: '8px', fontSize: '12px', fontWeight: 700,
              background: 'rgba(212,175,55,0.1)', color: '#D4AF37',
              border: '1px solid rgba(212,175,55,0.28)', cursor: 'pointer', transition: 'all 0.2s',
              display: 'flex', alignItems: 'center', gap: '5px',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(212,175,55,0.18)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(212,175,55,0.1)'; }}
          >
            ⬇ Tải PDF
          </button>
          <button
            id="contract-btn-close"
            onClick={handleClose}
            style={{
              padding: '8px 22px', borderRadius: '8px', fontSize: '12px', fontWeight: 700,
              background: 'linear-gradient(135deg,#D4AF37,#F5C842)',
              color: '#000', border: 'none', cursor: 'pointer', transition: 'opacity 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.opacity = '0.88'; }}
            onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
          >
            Đóng
          </button>
        </div>
      </div>

      <style>{`
        @keyframes gc-pulse {
          0%,100% { opacity:1; transform:scale(1); }
          50% { opacity:0.35; transform:scale(0.75); }
        }
      `}</style>
    </div>
  );
}
