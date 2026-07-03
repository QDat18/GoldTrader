import store from '../store.js';

export const pageRegister = {
  render() {
    const user = store.state.currentUser;
    return `
      <div class="nav-bar">
        <a href="#home" class="logo">
          <div class="logo-mark"><span>G</span></div>
          <span class="logo-text">GOLD<em>CHAIN</em></span>
        </a>
        <div></div>
        <div class="nav-actions">
          <span class="body-sm">Đã có tài khoản?</span>
          <a href="#login" class="btn" style="text-decoration:none">Đăng nhập</a>
        </div>
      </div>
      <div style="max-width:600px;margin:0 auto;padding:32px 24px; flex: 1;">
        <div style="margin-bottom:24px">
          <div class="tag" style="margin-bottom:8px">BƯỚC 1/3</div>
          <div class="h2">Tạo tài khoản</div>
          <p class="body-sm" style="margin-top:4px">Hoàn tất đăng ký và xác minh danh tính (KYC) để bắt đầu giao dịch</p>
        </div>
        <div style="display:flex;gap:0;margin-bottom:28px">
          <div style="flex:1;padding:10px 0;border-bottom:2px solid var(--gold);text-align:center;font-size:12px;font-weight:500;color:var(--gold)">1. Thông tin cơ bản</div>
          <div style="flex:1;padding:10px 0;border-bottom:0.5px solid var(--gray-200);text-align:center;font-size:12px;color:var(--gray-400)">2. Xác minh danh tính</div>
          <div style="flex:1;padding:10px 0;border-bottom:0.5px solid var(--gray-200);text-align:center;font-size:12px;color:var(--gray-400)">3. Bảo mật</div>
        </div>
        <div class="card" style="padding:28px">
          <div class="grid-2" style="gap:14px">
            <div class="form-group" style="margin-bottom:0">
              <label class="form-label">Họ và tên</label>
              <input class="form-input" id="reg-name" placeholder="Nguyễn Văn An" value="${user.name}">
            </div>
            <div class="form-group" style="margin-bottom:0">
              <label class="form-label">Số điện thoại</label>
              <input class="form-input" id="reg-phone" placeholder="0912 345 678" value="${user.phone}">
            </div>
          </div>
          <div class="form-group" style="margin-top:14px">
            <label class="form-label">Email</label>
            <input class="form-input" id="reg-email" placeholder="email@example.com" type="email" value="${user.email}">
          </div>
          <div class="form-group">
            <label class="form-label">Mật khẩu</label>
            <input class="form-input" placeholder="Tối thiểu 8 ký tự, có chữ hoa và số" type="password" value="AnNguyen123">
            <div class="form-hint">Độ mạnh: <span style="color:var(--gold)">Trung bình</span></div>
          </div>
          <div style="background:var(--gold-pale);border:0.5px solid var(--gold);padding:12px 14px;margin-top:4px;margin-bottom:20px">
            <div style="font-size:12px;color:#7A5A10;font-weight:500">Xác minh danh tính (KYC) là bắt buộc</div>
            <div style="font-size:12px;color:#7A5A10;margin-top:4px">Bước tiếp theo bạn cần cung cấp ảnh CCCD 2 mặt để hoàn tất mở tài khoản giao dịch.</div>
          </div>
          <button class="btn-gold btn" id="btn-register-submit" style="width:100%;padding:11px">Tiếp tục — Xác minh danh tính</button>
        </div>
        <div style="margin-top:20px">
          <div class="h3" style="margin-bottom:12px">Các bước xác minh KYC</div>
          <div class="kyc-step">
            <div class="step-num done"><i class="ti ti-check" style="font-size:13px;color:var(--gold)"></i></div>
            <div>
              <div style="font-size:13px;font-weight:500">Thông tin cơ bản</div>
              <div class="body-sm">Họ tên, SĐT, email</div>
            </div>
          </div>
          <div class="kyc-step">
            <div class="step-num active">2</div>
            <div>
              <div style="font-size:13px;font-weight:500">Ảnh CCCD/Hộ chiếu</div>
              <div class="body-sm">Chụp ảnh 2 mặt giấy tờ tùy thân</div>
            </div>
          </div>
          <div class="kyc-step">
            <div class="step-num">3</div>
            <div>
              <div style="font-size:13px;font-weight:500">Xác thực khuôn mặt</div>
              <div class="body-sm">Selfie đối chiếu với giấy tờ</div>
            </div>
          </div>
        </div>
      </div>
    `;
  },
  init(container) {
    const registerBtn = container.querySelector('#btn-register-submit');
    if (registerBtn) {
      registerBtn.addEventListener('click', () => {
        const name = container.querySelector('#reg-name').value;
        const phone = container.querySelector('#reg-phone').value;
        const email = container.querySelector('#reg-email').value;

        // Update store profile info
        store.state.currentUser.name = name;
        store.state.currentUser.phone = phone;
        store.state.currentUser.email = email;
        store.state.currentUser.kycStatus = 'pending';
        store.state.currentUser.kycStep = 2; // Simulated in progress

        // Add to admin's list of kyc approvals
        const exists = store.state.kycSubmissions.some(s => s.name === name);
        if (!exists) {
          store.state.kycSubmissions.unshift({
            id: 'kyc-' + Math.floor(Math.random() * 1000),
            name: name,
            time: 'Vừa xong',
            type: 'CCCD',
            avatar: name.split(' ').map(n=>n[0]).join(''),
            status: 'pending'
          });
        }

        // Notify and go to user dashboard
        store.notify();
        alert('Tài khoản đã được đăng ký và yêu cầu xác minh KYC của bạn đã được gửi lên hệ thống.');
        window.location.hash = '#dashboard';
      });
    }
  }
};
