import store from '../store.js';

export const pageLogin = {
  render() {
    return `
      <div class="nav-bar">
        <a href="#home" class="logo">
          <div class="logo-mark"><span>G</span></div>
          <span class="logo-text">GOLD<em>CHAIN</em></span>
        </a>
        <div></div>
        <div class="nav-actions">
          <span class="body-sm">Chưa có tài khoản?</span>
          <a href="#register" class="btn-gold btn" style="text-decoration:none">Đăng ký</a>
        </div>
      </div>
      <div style="min-height:560px;display:flex;align-items:center;justify-content:center;background:var(--gray-50);padding:40px 24px; flex: 1;">
        <div style="width:380px">
          <div style="text-align:center;margin-bottom:28px">
            <div class="logo" style="justify-content:center;margin-bottom:12px">
              <div class="logo-mark"><span>G</span></div>
              <span class="logo-text">GOLD<em>CHAIN</em></span>
            </div>
            <div class="h2">Đăng nhập</div>
            <p class="body-sm" style="margin-top:4px">Quản lý danh mục vàng của bạn</p>
          </div>
          <div class="card" style="padding:28px">
            <div class="form-group">
              <label class="form-label">Email / Số điện thoại</label>
              <input class="form-input" id="login-email" placeholder="email@example.com" type="text" value="an.nguyen@goldchain.vn">
            </div>
            <div class="form-group">
              <label class="form-label">Mật khẩu</label>
              <div style="position:relative">
                <input class="form-input" id="login-password" placeholder="Nhập mật khẩu" type="password" style="padding-right:40px" value="Password123">
                <span id="btn-toggle-password" style="position:absolute;right:12px;top:50%;transform:translateY(-50%);color:var(--gray-300);font-size:16px;cursor:pointer">
                  <i class="ti ti-eye"></i>
                </span>
              </div>
            </div>
            <div style="display:flex;justify-content:flex-end;margin-bottom:20px">
              <a style="font-size:13px;color:var(--gold);cursor:pointer">Quên mật khẩu?</a>
            </div>
            <button class="btn-gold btn" id="btn-login-submit" style="width:100%;padding:11px">Đăng nhập</button>
            <div class="divider" style="margin:16px 0;display:flex;align-items:center;gap:12px">
              <div style="flex:1;height:0.5px;background:var(--gray-200)"></div>
              <span class="body-sm">hoặc</span>
              <div style="flex:1;height:0.5px;background:var(--gray-200)"></div>
            </div>
            <button class="btn" style="width:100%;display:flex;align-items:center;justify-content:center;gap:8px;padding:10px">
              <i class="ti ti-brand-google" style="font-size:16px"></i>Đăng nhập với Google
            </button>
          </div>
          <div style="text-align:center;margin-top:16px">
            <div style="background:var(--red-bg);border:0.5px solid var(--red);padding:10px 14px;font-size:12px;color:var(--red);margin-bottom:12px;display:none" id="err-msg">
              <i class="ti ti-alert-circle" style="font-size:14px;vertical-align:-2px;margin-right:6px"></i>Sai email hoặc mật khẩu. Còn 4 lần thử.
            </div>
            <button id="btn-show-error" class="body-sm" style="border:none;background:none;cursor:pointer;text-decoration:underline;color:var(--gray-400)">Xem trạng thái lỗi</button>
          </div>
        </div>
      </div>
      <div class="footer" style="padding:20px 24px; margin-top: auto;">
        <div class="footer-bottom" style="border-top:none;padding-top:0;margin-top:0">
          <span style="font-size:12px">© 2024 GoldChain JSC</span>
          <span style="font-size:12px;color:var(--gray-400)">Chính sách bảo mật · Điều khoản</span>
        </div>
      </div>
    `;
  },
  init(container) {
    // Toggle password visibility
    const passInput = container.querySelector('#login-password');
    const toggleBtn = container.querySelector('#btn-toggle-password');
    if (passInput && toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        const isPass = passInput.getAttribute('type') === 'password';
        passInput.setAttribute('type', isPass ? 'text' : 'password');
        toggleBtn.innerHTML = `<i class="ti ti-${isPass ? 'eye-off' : 'eye'}"></i>`;
      });
    }

    // Show error state
    const errorMsg = container.querySelector('#err-msg');
    const showErrorBtn = container.querySelector('#btn-show-error');
    if (errorMsg && showErrorBtn) {
      showErrorBtn.addEventListener('click', () => {
        errorMsg.style.display = errorMsg.style.display === 'none' ? 'block' : 'none';
      });
    }

    // Login submit
    const loginSubmit = container.querySelector('#btn-login-submit');
    if (loginSubmit) {
      loginSubmit.addEventListener('click', () => {
        // Set user to verified for demo purposes, or redirect
        const email = container.querySelector('#login-email').value;
        if (email.includes('admin')) {
          store.switchUserRole('admin');
          window.location.hash = '#admin';
        } else {
          store.switchUserRole('user');
          window.location.hash = '#dashboard';
        }
      });
    }
  }
};
