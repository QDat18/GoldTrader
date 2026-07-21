const fs = require('fs');
let b = fs.readFileSync('src/pages/admin/AdminKyc.jsx', 'utf8');

b = b.replace('const handleApproveKyc = async (id) => {\r\n  const handleApproveKyc = async (id) => {', 'const handleApproveKyc = async (id) => {');
b = b.replace('const handleApproveKyc = async (id) => {\n  const handleApproveKyc = async (id) => {', 'const handleApproveKyc = async (id) => {');

const badChunk = `        (payload) => {
          console.log('Realtime KYC update received in split page!', payload);    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(350px, 1fr) 2fr', gap: '24px', height: 'calc(100vh - 120px)' }}>`;

const goodChunk = `        (payload) => {
          console.log('Realtime KYC update received in split page!', payload);
          fetchAdminKycList();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(kycSubscription);
    };
  }, []);

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(350px, 1fr) 2fr', gap: '24px', height: 'calc(100vh - 120px)' }}>`;

const badChunkWindows = badChunk.replace(/\n/g, '\r\n');
if (b.includes(badChunk)) {
  b = b.replace(badChunk, goodChunk);
} else if (b.includes(badChunkWindows)) {
  b = b.replace(badChunkWindows, goodChunk);
}

fs.writeFileSync('src/pages/admin/AdminKyc.jsx', b);
