import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Building, QrCode, Layers, ShieldAlert, CheckCircle2, Database } from 'lucide-react';

export default function AdminLayout() {
  return (
    <div className="admin-container">
      {/* Sidebar Navigation */}
      <aside className="admin-sidebar">
        <div>
          <div className="tag" style={{ marginBottom: '8px', fontSize: '10px' }}>FINTECH PLATFORM</div>
          <div className="h3" style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px', letterSpacing: '-0.5px', color: 'var(--text-main)' }}>
            <Building size={20} style={{ color: 'var(--gold)' }} />
            Admin Panel
          </div>
        </div>

        <nav className="admin-nav-list">
          <NavLink to="/admin/kyc" className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}>
            <ShieldAlert size={16} /> Duyệt eKYC
          </NavLink>
          <NavLink to="/admin/orders" className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}>
            <CheckCircle2 size={16} /> Quản lý đơn hàng
          </NavLink>
          <NavLink to="/admin/o2o" className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}>
            <QrCode size={16} /> Xác thực O2O tại quầy
          </NavLink>
          <NavLink to="/admin/inventory" className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}>
            <Database size={16} /> Quản lý Kho vàng
          </NavLink>
          <NavLink to="/admin/hedging" className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}>
            <Layers size={16} /> Vị thế Hedging
          </NavLink>
        </nav>

        <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.04)', fontSize: '11px', color: 'var(--text-muted)' }}>
          <div>Hệ thống điều phối chính</div>
          <div style={{ color: 'var(--gold)', marginTop: '2px', fontWeight: 500 }}>Chế độ LMS Sidebar</div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="admin-content">
        <Outlet />
      </main>
    </div>
  );
}
