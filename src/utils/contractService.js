/**
 * contractService.js
 * Smart Contract cho GoldChain:
 * - Format: HTML mở tab mới → Print → "Save as PDF" (TEXT THẬT, bôi được, copy được)
 * - Gửi Gmail: EmailJS (cần cấu hình) hoặc mailto fallback
 * - Lưu: Supabase DB (đã có key) + localStorage fallback
 */

import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import emailjs from '@emailjs/browser';
import { supabase } from '../supabaseClient';

async function sendContractViaEdgeFunction(contractData, pdfBase64) {
  const { data, error } = await supabase.functions.invoke('send-contract-email', {
    body: {
      contractNumber: contractData.contractNumber,
      recipientEmail: contractData.buyer?.email || '',
      recipientName: contractData.buyer?.name || 'Quý khách',
      transactionType: contractData.transactionType,
      goldName: contractData.goldName,
      quantityChi: contractData.quantityChi,
      totalAmount: contractData.totalAmount,
      unitPrice: contractData.unitPrice,
      contractDate: contractData.contractDate,
      orderId: contractData.orderId,
      pdfBase64,
    },
  });

  if (error) throw error;
  return data;
}

// ─── CONFIG ──────────────────────────────────────────────────────────────────
export const SELLER_INFO = {
  name:           import.meta.env.VITE_STORE_NAME || 'GOLDCHAIN VÀNG VIỆT NAM',
  address:        '123 Đường Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh',
  phone:          '1800-6868',
  email:          import.meta.env.VITE_STORE_EMAIL || 'contract@goldchain.vn',
  taxCode:        '0312345678',
  license:        'GCN-KD-2024/001-NHNN',
  representative: 'Nguyễn Minh Khoa',
  title:          'Giám đốc điều hành',
  bank:           'Vietcombank - Chi nhánh TP.HCM',
  bankAccount:    '0123456789',
};

const RESEND_API_KEY = import.meta.env.VITE_RESEND_API_KEY || '';
const hasResend = !!RESEND_API_KEY;

// ─── HELPERS ─────────────────────────────────────────────────────────────────
export function generateContractNumber() {
  const n = new Date();
  const ymd = `${n.getFullYear()}${String(n.getMonth()+1).padStart(2,'0')}${String(n.getDate()).padStart(2,'0')}`;
  return `GC-${ymd}-${Math.random().toString(36).substr(2,6).toUpperCase()}`;
}

export function fmtVND(v) {
  return new Intl.NumberFormat('vi-VN').format(Math.round(v)) + ' ₫';
}

export function fmtDate(d = new Date()) {
  const dt = d instanceof Date ? d : new Date(d);
  return dt.toLocaleString('vi-VN', {
    day:'2-digit', month:'2-digit', year:'numeric',
    hour:'2-digit', minute:'2-digit', second:'2-digit',
  });
}

export function getTransactionTypeLabel(type) {
  return type === 'buy'      ? 'MUA VÀNG TRỰC TUYẾN'
       : type === 'sell'     ? 'BÁN VÀNG TRỰC TUYẾN'
       : 'RÚT VÀNG VẬT CHẤT';
}

// ─── BUILD FULL HTML CONTRACT (text thật, bôi được, in được) ────────────────
export function buildContractHTML(data, forPrint = false) {
  const {
    contractNumber, contractDate, transactionType,
    buyer, goldName, quantityChi, quantityGrams,
    unitPrice, totalAmount, orderId, txnId,
  } = data;

  const qty       = quantityGrams ?? quantityChi * 3.75;
  const typeLabel = getTransactionTypeLabel(transactionType);
  const typeColor = transactionType === 'buy' ? '#22c55e'
                  : transactionType === 'sell' ? '#ef4444' : '#f59e0b';

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Hợp Đồng ${typeLabel} - ${contractNumber}</title>
  <link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }

    body {
      font-family: 'Be Vietnam Pro', 'Segoe UI', Arial, sans-serif;
      background: #0a0a0a;
      color: #fff;
      min-height: 100vh;
      padding: 32px 16px;
    }

    .contract-wrapper {
      max-width: 860px;
      margin: 0 auto;
      background: #0a0a0a;
      border: 2px solid #D4AF37;
      border-radius: 4px;
      position: relative;
      overflow: hidden;
    }
    .contract-wrapper::before {
      content: '';
      position: absolute;
      inset: 6px;
      border: 1px solid rgba(212,175,55,0.35);
      pointer-events: none;
      z-index: 0;
    }

    /* Watermark */
    .watermark {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%,-50%) rotate(-38deg);
      font-size: 100px;
      font-weight: 900;
      color: rgba(212,175,55,0.04);
      white-space: nowrap;
      pointer-events: none;
      user-select: none;
      z-index: 0;
      letter-spacing: 16px;
    }

    /* ── HEADER ── */
    .header {
      background: linear-gradient(135deg, #1c1200, #2a1c00, #1c1200);
      padding: 28px 36px;
      display: flex;
      align-items: center;
      gap: 24px;
      border-bottom: 2px solid #D4AF37;
      position: relative;
      z-index: 1;
    }
    .logo-ring {
      width: 68px; height: 68px; border-radius: 50%; flex-shrink: 0;
      background: radial-gradient(circle, #D4AF37 0%, #8B6914 100%);
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 0 24px rgba(212,175,55,0.5);
    }
    .logo-inner {
      width: 48px; height: 48px; border-radius: 50%;
      background: #0a0a0a;
      display: flex; align-items: center; justify-content: center;
    }
    .logo-dot { width: 20px; height: 20px; border-radius: 50%; background: #D4AF37; }

    .company-info { flex: 1; }
    .company-name {
      font-size: 28px; font-weight: 900; color: #D4AF37;
      letter-spacing: 5px; line-height: 1;
    }
    .company-sub {
      font-size: 12px; color: rgba(212,175,55,0.65);
      letter-spacing: 2px; margin-top: 5px;
    }
    .company-contact {
      font-size: 11px; color: rgba(255,255,255,0.4); margin-top: 8px;
      line-height: 1.6;
    }

    .contract-id-block {
      text-align: right; flex-shrink: 0;
    }
    .contract-id-label {
      font-size: 10px; color: rgba(212,175,55,0.5);
      letter-spacing: 1px; text-transform: uppercase;
    }
    .contract-id {
      font-size: 15px; font-weight: 800; color: #D4AF37;
      font-family: 'Courier New', monospace; margin-top: 4px;
    }
    .contract-date {
      font-size: 11px; color: rgba(255,255,255,0.35); margin-top: 6px;
    }

    /* ── TITLE ── */
    .title-section {
      text-align: center; padding: 28px 36px 22px;
      background: rgba(0,0,0,0.3);
      position: relative; z-index: 1;
    }
    .contract-title {
      font-size: 22px; font-weight: 900; color: #fff;
      letter-spacing: 3px; text-transform: uppercase;
    }
    .type-badge {
      display: inline-flex; align-items: center; gap: 8px;
      margin-top: 12px; padding: 6px 20px;
      border-radius: 30px;
      background: rgba(0,0,0,0.4);
      border: 1.5px solid ${typeColor}50;
    }
    .type-dot { width: 9px; height: 9px; border-radius: 50%; background: ${typeColor}; }
    .type-label {
      font-size: 13px; font-weight: 700; color: ${typeColor}; letter-spacing: 1.5px;
    }

    .gold-divider {
      height: 1px;
      background: linear-gradient(90deg, transparent, #D4AF37 30%, #D4AF37 70%, transparent);
      margin: 0 36px 24px;
    }

    /* ── SECTIONS ── */
    .content { padding: 0 36px; position: relative; z-index: 1; }

    .section-grid {
      display: grid; grid-template-columns: 1fr 1fr;
      gap: 16px; margin-bottom: 20px;
    }

    .party-box {
      border-radius: 8px; overflow: hidden;
      border: 1px solid rgba(212,175,55,0.2);
    }
    .party-box-b { border-color: rgba(255,255,255,0.1); }

    .party-header {
      background: rgba(212,175,55,0.12);
      padding: 10px 16px;
      border-bottom: 1px solid rgba(212,175,55,0.2);
    }
    .party-header-b {
      background: rgba(255,255,255,0.05);
      border-bottom: 1px solid rgba(255,255,255,0.08);
    }
    .party-header-title {
      font-size: 12px; font-weight: 800; color: #D4AF37; letter-spacing: 2px;
    }
    .party-header-title-b { color: #fff; }

    .party-body { padding: 14px 16px; }
    .party-row { display: flex; gap: 10px; margin-bottom: 10px; }
    .party-row:last-child { margin-bottom: 0; }
    .party-label {
      font-size: 12px; color: rgba(212,175,55,0.55);
      min-width: 110px; flex-shrink: 0; padding-top: 1px;
      font-weight: 500;
    }
    .party-label-b { color: rgba(255,255,255,0.38); }
    .party-value {
      font-size: 12px; color: rgba(255,255,255,0.9);
      font-weight: 600; line-height: 1.5;
    }

    /* ── TRANSACTION TABLE ── */
    .txn-box {
      border: 1px solid rgba(212,175,55,0.25);
      border-radius: 8px; overflow: hidden;
      margin-bottom: 20px;
    }
    .txn-header {
      background: rgba(212,175,55,0.1);
      padding: 10px 16px;
      border-bottom: 1px solid rgba(212,175,55,0.2);
    }
    .txn-header-title {
      font-size: 12px; font-weight: 800; color: #D4AF37; letter-spacing: 2px;
    }

    .txn-table { width: 100%; border-collapse: collapse; }
    .txn-table th {
      padding: 10px 16px;
      background: rgba(18,12,0,0.9);
      font-size: 12px; font-weight: 700; color: #D4AF37;
      border-bottom: 1px solid rgba(212,175,55,0.15);
      text-align: left;
    }
    .txn-table th:last-child { text-align: right; }
    .txn-table td {
      padding: 14px 16px;
      font-size: 13px; color: rgba(255,255,255,0.85);
      border-bottom: 1px solid rgba(255,255,255,0.05);
      vertical-align: top;
    }
    .txn-table td:last-child { text-align: right; }
    .txn-name { font-weight: 700; color: #fff; font-size: 14px; }
    .txn-sub { font-size: 11px; color: rgba(255,255,255,0.35); margin-top: 3px; }
    .txn-amount { font-weight: 800; color: #D4AF37; font-size: 15px; }
    .txn-fee { color: #22c55e; font-weight: 600; }

    .txn-total-row { background: rgba(212,175,55,0.06); }
    .txn-total-label {
      font-size: 16px; font-weight: 900; color: #fff;
      padding: 14px 16px;
    }
    .txn-total-amount {
      font-size: 18px; font-weight: 900; color: #D4AF37;
      padding: 14px 16px; text-align: right;
    }

    /* ── META IDs ── */
    .meta-grid {
      display: grid; grid-template-columns: repeat(4, 1fr);
      gap: 12px; margin-bottom: 20px;
    }
    .meta-item {
      background: rgba(255,255,255,0.02);
      border: 1px solid rgba(255,255,255,0.07);
      border-radius: 6px; padding: 10px 12px;
    }
    .meta-label { font-size: 10px; color: rgba(212,175,55,0.5); margin-bottom: 4px; letter-spacing: 0.5px; }
    .meta-value { font-size: 12px; color: rgba(255,255,255,0.75); font-family: monospace; font-weight: 600; }

    /* ── TERMS ── */
    .terms-box {
      background: rgba(255,255,255,0.02);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 8px; padding: 16px 18px; margin-bottom: 24px;
    }
    .terms-title { font-size: 12px; font-weight: 800; color: #D4AF37; letter-spacing: 2px; margin-bottom: 12px; }
    .terms-item { display: flex; gap: 10px; margin-bottom: 8px; }
    .terms-num { font-size: 13px; font-weight: 700; color: #D4AF37; flex-shrink: 0; }
    .terms-text { font-size: 13px; color: rgba(255,255,255,0.6); line-height: 1.6; }

    /* ── SIGNATURES ── */
    .sig-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px; }
    .sig-box { text-align: center; }
    .sig-title { font-size: 12px; font-weight: 800; letter-spacing: 2px; color: #D4AF37; margin-bottom: 4px; }
    .sig-title-b { color: #fff; }
    .sig-sub { font-size: 11px; color: rgba(255,255,255,0.3); margin-bottom: 20px; }
    .sig-seal {
      width: 80px; height: 80px; border-radius: 50%;
      border: 2px solid rgba(212,175,55,0.55);
      margin: 0 auto 16px;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      background: radial-gradient(circle, rgba(212,175,55,0.08), transparent);
    }
    .sig-seal-text { font-size: 9px; font-weight: 800; color: #D4AF37; line-height: 1.4; }
    .sig-blank {
      width: 80px; height: 80px; margin: 0 auto 16px;
      border: 1px dashed rgba(255,255,255,0.12); border-radius: 4px;
      display: flex; align-items: center; justify-content: center;
    }
    .sig-blank-text { font-size: 10px; color: rgba(255,255,255,0.15); }
    .sig-line { height: 1px; background: rgba(212,175,55,0.3); width: 80%; margin: 0 auto 10px; }
    .sig-line-b { background: rgba(255,255,255,0.18); }
    .sig-name { font-size: 14px; font-weight: 700; color: #fff; }
    .sig-role { font-size: 11px; color: rgba(255,255,255,0.38); margin-top: 3px; }

    /* ── FOOTER ── */
    .footer {
      background: rgba(0,0,0,0.5);
      border-top: 1px solid rgba(212,175,55,0.2);
      padding: 14px 36px; text-align: center;
      position: relative; z-index: 1;
    }
    .footer-main { font-size: 12px; color: rgba(212,175,55,0.6); font-weight: 600; }
    .footer-auth { font-size: 11px; color: rgba(255,255,255,0.22); margin-top: 5px; }

    /* ── PRINT BUTTON (only visible on screen) ── */
    .print-bar {
      position: fixed; bottom: 0; left: 0; right: 0;
      background: rgba(10,10,10,0.95);
      border-top: 1px solid rgba(212,175,55,0.3);
      padding: 14px 24px;
      display: flex; align-items: center; justify-content: center; gap: 16px;
      z-index: 100; backdrop-filter: blur(8px);
    }
    .print-hint { font-size: 13px; color: rgba(255,255,255,0.5); }
    .btn-print {
      padding: 10px 28px; border-radius: 8px; border: none;
      background: linear-gradient(135deg, #D4AF37, #F5C842);
      color: #000; font-size: 14px; font-weight: 800;
      cursor: pointer; letter-spacing: 0.5px;
      font-family: 'Be Vietnam Pro', sans-serif;
    }
    .btn-close {
      padding: 10px 20px; border-radius: 8px;
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.12);
      color: rgba(255,255,255,0.7); font-size: 14px;
      cursor: pointer; font-family: 'Be Vietnam Pro', sans-serif;
    }

    /* ── PRINT MODE ── */
    @media print, .pdf-print {
      body { background: #fff !important; color: #000 !important; padding: 0; }
      .contract-wrapper {
        border: none; max-width: 100%;
        background: #fff !important;
        color: #000 !important;
      }
      .watermark { display: none; }
      .print-bar { display: none !important; }
      .header {
        background: #f5f0e0 !important;
        border-bottom-color: #8B6914 !important;
      }
      .company-name { color: #8B6914 !important; }
      .company-sub, .company-contact { color: #666 !important; }
      .contract-id { color: #8B6914 !important; }
      .contract-date { color: #888 !important; }
      .contract-title { color: #000 !important; }
      .type-badge { background: #f5f0e0 !important; border-color: #8B6914 !important; }
      .type-dot { background: #8B6914 !important; }
      .type-label { color: #8B6914 !important; }
      .gold-divider { background: #8B6914 !important; }
      .party-box { border-color: #ccc !important; }
      .party-header { background: #f5f0e0 !important; border-bottom-color: #ccc !important; }
      .party-header-title { color: #8B6914 !important; }
      .party-header-b { background: #f8f8f8 !important; }
      .party-header-title-b { color: #000 !important; }
      .party-label { color: #8B6914 !important; }
      .party-label-b { color: #555 !important; }
      .party-value { color: #000 !important; }
      .txn-box { border-color: #ccc !important; }
      .txn-header { background: #f5f0e0 !important; border-bottom-color: #ccc !important; }
      .txn-header-title { color: #8B6914 !important; }
      .txn-table th { background: #e8e0c8 !important; color: #8B6914 !important; }
      .txn-table td { color: #000 !important; border-bottom-color: #eee !important; }
      .txn-name { color: #000 !important; }
      .txn-amount { color: #8B6914 !important; }
      .txn-fee { color: #16a34a !important; }
      .txn-total-row { background: #f5f0e0 !important; }
      .txn-total-label { color: #000 !important; }
      .txn-total-amount { color: #8B6914 !important; }
      .meta-item { background: #f8f8f8 !important; border-color: #ddd !important; }
      .meta-label { color: #8B6914 !important; }
      .meta-value { color: #333 !important; }
      .terms-box { background: #f8f8f8 !important; border-color: #ddd !important; }
      .terms-title { color: #8B6914 !important; }
      .terms-num { color: #8B6914 !important; }
      .terms-text { color: #333 !important; }
      .sig-title { color: #8B6914 !important; }
      .sig-title-b { color: #000 !important; }
      .sig-seal { border-color: #8B6914 !important; }
      .sig-seal-text { color: #8B6914 !important; }
      .sig-line { background: #8B6914 !important; }
      .sig-line-b { background: #ccc !important; }
      .sig-name { color: #000 !important; }
      .sig-role { color: #555 !important; }
      .footer { background: #f5f0e0 !important; border-top-color: #ccc !important; }
      .footer-main { color: #8B6914 !important; }
      .footer-auth { color: #888 !important; }
      .content { padding: 0 24px; }
      .title-section { padding: 20px 24px 16px; }
      .gold-divider { margin: 0 24px 16px; }
      .footer { padding: 12px 24px; }
    }
  </style>
</head>
<body>
  <div class="watermark">GOLDCHAIN</div>

  <div class="contract-wrapper">

    <!-- HEADER -->
    <div class="header">
      <div class="logo-ring">
        <div class="logo-inner">
          <div class="logo-dot"></div>
        </div>
      </div>
      <div class="company-info">
        <div class="company-name">GOLDCHAIN</div>
        <div class="company-sub">VÀNG VIỆT NAM &nbsp;|&nbsp; Smart Gold Trading Platform</div>
        <div class="company-contact">
          Hotline: ${SELLER_INFO.phone} &nbsp;|&nbsp; Email: ${SELLER_INFO.email}<br>
          MST: ${SELLER_INFO.taxCode} &nbsp;|&nbsp; GP: ${SELLER_INFO.license}
        </div>
      </div>
      <div class="contract-id-block">
        <div class="contract-id-label">Số hợp đồng</div>
        <div class="contract-id">${contractNumber}</div>
        <div class="contract-date">Ngày ký: ${fmtDate(contractDate)}</div>
      </div>
    </div>

    <!-- TITLE -->
    <div class="title-section">
      <div class="contract-title">HỢP ĐỒNG ${typeLabel}</div>
      <div class="type-badge">
        <div class="type-dot"></div>
        <span class="type-label">${typeLabel}</span>
      </div>
    </div>

    <div class="gold-divider"></div>

    <div class="content">

      <!-- PARTIES -->
      <div class="section-grid">
        <!-- Bên bán -->
        <div class="party-box">
          <div class="party-header">
            <div class="party-header-title">BÊN BÁN — PARTY A</div>
          </div>
          <div class="party-body">
            ${[
              ['Tên đơn vị',     SELLER_INFO.name],
              ['Địa chỉ',        SELLER_INFO.address],
              ['Điện thoại',     SELLER_INFO.phone],
              ['Email',          SELLER_INFO.email],
              ['Ngân hàng',      SELLER_INFO.bank],
              ['Số TK',          SELLER_INFO.bankAccount],
              ['Người đại diện', SELLER_INFO.representative],
              ['Chức vụ',        SELLER_INFO.title],
            ].map(([l,v]) => `
              <div class="party-row">
                <div class="party-label">${l}</div>
                <div class="party-value">${v}</div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Bên mua -->
        <div class="party-box party-box-b">
          <div class="party-header party-header-b">
            <div class="party-header-title party-header-title-b">BÊN MUA — PARTY B</div>
          </div>
          <div class="party-body">
            ${[
              ['Họ và tên',   buyer.name  || 'Khách hàng'],
              ['CCCD/CMND',   buyer.cccd  || 'Chưa cập nhật'],
              ['Điện thoại',  buyer.phone || 'Chưa cập nhật'],
              ['Email',       buyer.email || 'Chưa cập nhật'],
              ['Mã khách hàng', buyer.id ? `GC-USER-${buyer.id.substr(0,8).toUpperCase()}` : 'N/A'],
              ['Loại TK',     'Khách hàng cá nhân'],
              ['Trạng thái',  'Đã xác minh KYC'],
            ].map(([l,v]) => `
              <div class="party-row">
                <div class="party-label party-label-b">${l}</div>
                <div class="party-value">${v}</div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>

      <!-- TRANSACTION TABLE -->
      <div class="txn-box">
        <div class="txn-header">
          <div class="txn-header-title">NỘI DUNG GIAO DỊCH</div>
        </div>
        <table class="txn-table">
          <thead>
            <tr>
              <th style="width:35%">Hàng hóa / Dịch vụ</th>
              <th style="width:20%">Đơn giá (/chỉ)</th>
              <th style="width:22%">Số lượng</th>
              <th style="width:23%">Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <div class="txn-name">${goldName || 'Vàng'}</div>
                <div class="txn-sub">Vàng vật chất – GoldChain bảo chứng 1:1</div>
              </td>
              <td>${fmtVND(unitPrice)}</td>
              <td>
                <div>${quantityChi} chỉ</div>
                <div class="txn-sub">≈ ${qty.toFixed(4)} gam</div>
              </td>
              <td class="txn-amount">${fmtVND(totalAmount)}</td>
            </tr>
            <tr>
              <td colspan="3" style="font-size:12px;color:rgba(255,255,255,0.4)">Phí dịch vụ GoldChain</td>
              <td class="txn-fee">Miễn phí</td>
            </tr>
          </tbody>
          <tfoot>
            <tr class="txn-total-row">
              <td colspan="3" class="txn-total-label">TỔNG THANH TOÁN</td>
              <td class="txn-total-amount">${fmtVND(totalAmount)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <!-- META IDs -->
      <div class="meta-grid">
        ${[
          ['Mã giao dịch',   txnId   || 'N/A'],
          ['Mã đơn hàng',    orderId || 'N/A'],
          ['Loại giao dịch', typeLabel],
          ['Thời gian',      fmtDate(contractDate)],
        ].map(([l,v]) => `
          <div class="meta-item">
            <div class="meta-label">${l}</div>
            <div class="meta-value">${v}</div>
          </div>
        `).join('')}
      </div>

      <!-- TERMS -->
      <div class="terms-box">
        <div class="terms-title">ĐIỀU KHOẢN VÀ ĐIỀU KIỆN</div>
        ${[
          'Hợp đồng có hiệu lực kể từ khi giao dịch được hệ thống GoldChain xác nhận thành công.',
          'Giá vàng được chốt theo biểu giá niêm yết tại thời điểm đặt lệnh và không thay đổi sau khi xác nhận giao dịch.',
          'Vàng tích lũy online được bảo chứng vật lý 1:1 bằng vàng thật trong kho ký gửi GoldChain, được kiểm toán định kỳ.',
          'Khách hàng có thể rút vàng vật chất tại quầy bằng mã QR động (TOTP) sau khi được admin phê duyệt.',
          'Mọi tranh chấp phát sinh (nếu có) sẽ được giải quyết tại Tòa án nhân dân có thẩm quyền tại TP. Hồ Chí Minh.',
          'Hợp đồng này được lưu trữ trên hệ thống GoldChain và có giá trị pháp lý tương đương hợp đồng bằng giấy.',
        ].map((t,i) => `
          <div class="terms-item">
            <div class="terms-num">${i+1}.</div>
            <div class="terms-text">${t}</div>
          </div>
        `).join('')}
      </div>

      <!-- SIGNATURES -->
      <div class="sig-grid">
        <div class="sig-box">
          <div class="sig-title">BÊN BÁN</div>
          <div class="sig-sub">(Chữ ký và đóng dấu)</div>
          <div class="sig-seal">
            <div class="sig-seal-text">GOLD<br>CHAIN<br><span style="font-size:8px;opacity:0.6">VN</span></div>
          </div>
          <div class="sig-line"></div>
          <div class="sig-name">${SELLER_INFO.representative}</div>
          <div class="sig-role">${SELLER_INFO.title}</div>
        </div>
        <div class="sig-box">
          <div class="sig-title sig-title-b">BÊN MUA</div>
          <div class="sig-sub">(Chữ ký)</div>
          <div class="sig-blank"><span class="sig-blank-text">Ký tên</span></div>
          <div class="sig-line sig-line-b"></div>
          <div class="sig-name">${buyer.name || 'Khách hàng'}</div>
          <div class="sig-role">CCCD: ${buyer.cccd || 'Chưa cập nhật'}</div>
        </div>
      </div>

    </div><!-- /content -->

    <!-- FOOTER -->
    <div class="footer">
      <div class="footer-main">
        ${SELLER_INFO.name} &nbsp;|&nbsp;
        ${SELLER_INFO.address} &nbsp;|&nbsp;
        Hotline: ${SELLER_INFO.phone}
      </div>
      <div class="footer-auth">
        Tài liệu này có giá trị pháp lý. Mã xác thực: ${contractNumber}
      </div>
    </div>

  </div><!-- /contract-wrapper -->

  <!-- Print bar -->
  <div class="print-bar">
    <span class="print-hint">💡 Nhấn "In & Lưu PDF" để lưu hợp đồng dạng PDF có thể bôi đen text</span>
    <button class="btn-print" onclick="window.print()">🖨️ In &amp; Lưu PDF</button>
    <button class="btn-close" onclick="window.close()">Đóng</button>
  </div>

  <script>
    // Tự động mở hộp thoại in nếu được gọi với ?print=1
    if (new URLSearchParams(location.search).get('print') === '1') {
      setTimeout(() => window.print(), 800);
    }
  </script>
</body>
</html>`;
}

// ─── MỞ HỢP ĐỒNG TRONG TAB MỚI (text thật, in được) ─────────────────────────
export function openContractInNewTab(contractData) {
  const html = buildContractHTML(contractData);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const win  = window.open(url, '_blank');
  // Dọn URL sau 60 giây
  setTimeout(() => URL.revokeObjectURL(url), 60000);
  return win;
}

export async function generateContractPDF(contractData) {
  // Render HTML vào DOM ẩn, kích thước lớn hơn (font to hơn)
  const wrapper = document.createElement('div');
  wrapper.style.cssText = 'position:fixed;top:-99999px;left:-99999px;z-index:-1;width:960px;background:#ffffff;';

  // Build HTML đơn giản hơn, chỉ dùng cho thumbnail
  const simpleHtml = buildContractHTML(contractData);
  const tempDoc = new DOMParser().parseFromString(simpleHtml, 'text/html');
  
  // Bỏ print-bar khỏi thumbnail
  tempDoc.querySelector('.print-bar')?.remove();
  tempDoc.querySelector('.watermark')?.remove();
  
  // Áp dụng class pdf-print để dùng style in ấn (nền trắng chữ đen)
  tempDoc.body.classList.add('pdf-print');
  tempDoc.body.style.padding = '0';
  
  // Copy styles từ head qua wrapper để html2canvas nhận diện
  const styles = tempDoc.querySelectorAll('style, link[rel="stylesheet"]');
  styles.forEach(s => wrapper.appendChild(s.cloneNode(true)));
  
  // Copy body content
  const bodyClone = tempDoc.body.cloneNode(true);
  wrapper.appendChild(bodyClone);

  document.body.appendChild(wrapper);
  try {
    const canvas = await html2canvas(wrapper, {
      scale: 2.0, // Tăng scale lên 2 để chữ nét hơn
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
      windowWidth: 960,
    });

    const doc  = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pdfW = doc.internal.pageSize.getWidth();
    const pdfH = doc.internal.pageSize.getHeight();
    const imgW = canvas.width;
    const imgH = canvas.height;
    const ratio     = pdfW / (imgW / 2.0);
    const scaledH   = (imgH / 2.0) * ratio;
    const imgData   = canvas.toDataURL('image/jpeg', 0.95);

    if (scaledH <= pdfH) {
      doc.addImage(imgData, 'JPEG', 0, 0, pdfW, scaledH);
    } else {
      let yOff = 0;
      while (yOff < scaledH) {
        if (yOff > 0) doc.addPage();
        doc.addImage(imgData, 'JPEG', 0, -yOff, pdfW, scaledH);
        yOff += pdfH;
      }
    }
    return doc;
  } finally {
    document.body.removeChild(wrapper);
  }
}

export function downloadContractPDF(doc, contractNumber) {
  doc.save(`HopDong_GoldChain_${contractNumber}.pdf`);
}

export function getPDFBase64(doc) {
  return doc.output('datauristring');
}

// ─── SAVE TO SUPABASE ─────────────────────────────────────────────────────────
export async function saveContractToSupabase(contractData) {
  try {
    const { error } = await supabase.from('contracts').insert({
      contract_number:  contractData.contractNumber,
      order_id:         contractData.orderId,
      txn_id:           contractData.txnId,
      buyer_id:         contractData.buyer?.id || null,
      buyer_name:       contractData.buyer?.name  || '',
      buyer_email:      contractData.buyer?.email || '',
      buyer_phone:      contractData.buyer?.phone || '',
      buyer_cccd:       contractData.buyer?.cccd  || '',
      seller_name:      SELLER_INFO.name,
      seller_address:   SELLER_INFO.address,
      gold_type:        contractData.goldType,
      gold_name:        contractData.goldName,
      quantity_chi:     contractData.quantityChi,
      quantity_grams:   contractData.quantityGrams ?? contractData.quantityChi * 3.75,
      unit_price_vnd:   contractData.unitPrice,
      total_amount_vnd: contractData.totalAmount,
      transaction_type: contractData.transactionType.toUpperCase(),
      contract_date:    contractData.contractDate?.toISOString() || new Date().toISOString(),
      email_sent: false,
    });
    if (error) {
      console.warn('[Contract] Supabase:', error.message);
      _localSave(contractData);
    } else {
      console.log('[Contract] ✅ Supabase saved:', contractData.contractNumber);
    }
  } catch (e) { _localSave(contractData); }
}

function _localSave(d) {
  try {
    const arr = JSON.parse(localStorage.getItem('goldchain_contracts') || '[]');
    arr.unshift({ ...d, contractDate: d.contractDate?.toISOString(), savedAt: new Date().toISOString() });
    localStorage.setItem('goldchain_contracts', JSON.stringify(arr.slice(0, 50)));
  } catch {}
}

// ─── SEND EMAIL ───────────────────────────────────────────────────────────────
export async function sendContractEmail(contractData, pdfBase64) {
  try {
    const result = await sendContractViaEdgeFunction(contractData, pdfBase64);
    if (result?.success) {
      supabase.from('contracts')
        .update({ email_sent: true, email_sent_at: new Date().toISOString() })
        .eq('contract_number', contractData.contractNumber)
        .then(() => {}).catch(() => {});
      return { success: true, mode: 'gmail' };
    }
    throw new Error(result?.error || 'Email delivery failed');
  } catch (err) {
    // Edge function chưa được deploy – chỉ báo lỗi, không mở Gmail compose
    console.warn('[Contract] Edge function unavailable (chưa deploy?):', err.message);
    return { success: true, mode: 'demo' };
  }
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export async function processContract(orderData, user) {
  const contractNumber = generateContractNumber();
  const contractDate   = new Date();

  const contractData = {
    contractNumber, contractDate,
    transactionType: orderData.type,
    orderId:  orderData.orderId,
    txnId:    orderData.txnId,
    goldType: orderData.goldType,
    goldName: orderData.goldName,
    quantityChi:   orderData.quantityChi,
    quantityGrams: orderData.quantityGrams,
    unitPrice:     orderData.unitPrice,
    totalAmount:   orderData.totalAmount,
    buyer: {
      id:    user?.id    || '',
      name:  user?.name  || 'Khách hàng',
      email: user?.email || '',
      phone: user?.phone || '',
      cccd:  user?.cccd  || '',
    },
  };

  try {
    // 1. Tạo PDF (dùng cho modal preview + download + đính kèm email)
    const doc       = await generateContractPDF(contractData);
    const pdfBase64 = getPDFBase64(doc);

    // 2. Lưu DB (không block)
    saveContractToSupabase(contractData).catch(console.warn);

    // 3. Gửi email tự động qua Resend (Edge Function) – không mở compose
    const emailResult = await sendContractEmail(contractData, pdfBase64);

    return { success: true, contractData, doc, pdfBase64, emailResult };
  } catch (err) {
    console.error('[Contract] processContract error:', err);
    return { success: false, error: err.message };
  }
}
