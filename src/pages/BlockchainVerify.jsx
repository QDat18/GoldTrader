import React, { useState } from 'react';
import { ShieldCheck, CheckCircle2, AlertCircle, UploadCloud } from 'lucide-react';

const BlockchainVerify = () => {
  const [file, setFile] = useState(null);
  const [hashResult, setHashResult] = useState('');
  const [orderId, setOrderId] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verifyStatus, setVerifyStatus] = useState(null); 

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    if (!selectedFile) return;

    try {
      const buffer = await selectedFile.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      setHashResult(hashHex);
      setVerifyStatus(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!hashResult || !orderId) return;

    setVerifying(true);
    setVerifyStatus(null);

    try {
      // Gọi API Backend (Bỏ qua RLS / Quét qua Smart Contract & Database Proofs an toàn)
      const apiUrl = import.meta.env.VITE_WORKER_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/verify/${orderId}`);
      const result = await response.json();
      
      if (!result.success || !result.pdfHash) {
        setVerifyStatus("failed");
      } else {
        // So khớp hash của file được upload với Hash nằm trên Blockchain/Proofs
        if (result.pdfHash === hashResult) {
          setVerifyStatus("success");
        } else {
          setVerifyStatus("failed");
        }
      }
    } catch (error) {
      console.error(error);
      setVerifyStatus("failed");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div style={{ padding: '40px 24px', maxWidth: '800px', margin: '0 auto', minHeight: 'calc(100vh - 64px)' }}>
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h2 style={{ color: 'var(--gold)', fontWeight: 700, marginBottom: '16px' }}>Xác Thực Hóa Đơn Web3</h2>
        <p style={{ color: 'var(--text-muted)' }}>
          Tải lên hóa đơn điện tử để kiểm chứng tính toàn vẹn của giao dịch trên chuỗi khối Blockchain.
        </p>
      </div>

      <div className="card" style={{ padding: '40px', borderRadius: '24px', background: 'linear-gradient(145deg, rgba(30,30,35,0.9) 0%, rgba(20,20,24,0.9) 100%)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}>
        <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div>
            <label style={{ display: 'block', fontSize: '14px', color: 'var(--text-muted)', marginBottom: '8px' }}>Mã Đơn Hàng (Order ID)</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="VD: ORD-12345"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              required
              style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '14px', color: 'var(--text-muted)', marginBottom: '8px' }}>Tải PDF Hóa đơn gốc</label>
            <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.2)', border: '1px dashed rgba(255,255,255,0.2)', borderRadius: '12px', padding: '32px', cursor: 'pointer' }}>
              <input type="file" accept="application/pdf" style={{ display: 'none' }} onChange={handleFileChange} required />
              <UploadCloud size={32} color={file ? 'var(--emerald)' : 'var(--text-muted)'} style={{ marginBottom: '16px' }} />
              <div style={{ fontSize: '14px', color: file ? 'var(--emerald)' : '#fff', fontWeight: 600, textAlign: 'center' }}>
                {file ? file.name : 'Nhấn để chọn hoặc kéo thả file vào đây'}
              </div>
            </label>
          </div>

          {hashResult && (
            <div style={{ padding: '16px', background: 'rgba(0,0,0,0.3)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', wordBreak: 'break-all' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>Mã băm tập tin (SHA-256):</div>
              <code style={{ color: 'var(--gold)', fontSize: '14px' }}>{hashResult}</code>
            </div>
          )}

          <button 
            type="submit" 
            className="btn btn-gold" 
            disabled={!file || !orderId || verifying}
            style={{ borderRadius: '99px', padding: '16px', fontSize: '16px', fontWeight: 700, marginTop: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
          >
            {verifying ? (
              <span>Đang kiểm tra Blockchain...</span>
            ) : (
              <>
                <ShieldCheck size={20} color="#000" />
                Tiến Hành Xác Thực
              </>
            )}
          </button>
        </form>

        {verifyStatus === 'success' && (
          <div style={{ marginTop: '32px', padding: '24px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--emerald)', borderRadius: '16px', textAlign: 'center' }}>
            <CheckCircle2 size={48} color="var(--emerald)" style={{ marginBottom: '16px' }} />
            <h3 style={{ color: 'var(--emerald)', marginBottom: '8px', fontSize: '20px', fontWeight: 700 }}>Hợp Lệ & Nguyên Bản!</h3>
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px', margin: 0, lineHeight: 1.6 }}>
              Mã băm hoàn toàn khớp với bản ghi trên Blockchain. Hóa đơn của bạn là xác thực và chưa bị chỉnh sửa!
            </p>
          </div>
        )}

        {verifyStatus === 'failed' && (
          <div style={{ marginTop: '32px', padding: '24px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--ruby)', borderRadius: '16px', textAlign: 'center' }}>
            <AlertCircle size={48} color="var(--ruby)" style={{ marginBottom: '16px' }} />
            <h3 style={{ color: 'var(--ruby)', marginBottom: '8px', fontSize: '20px', fontWeight: 700 }}>Phát Hiện Giả Mạo!</h3>
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px', margin: 0, lineHeight: 1.6 }}>
              Mã băm không tồn tại trên chuỗi khối khối. Tập tin có thể không phải do hệ thống phát hành hoặc đã bị sửa đổi trái phép.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BlockchainVerify;
