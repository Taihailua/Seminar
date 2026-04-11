/**
 * auth.js — Login and Register logic
 * Replaces all static Stitch auth placeholders with real API calls.
 */
import { api, saveAuth, getAuth } from './api.js';

const ROLE_REDIRECT = {
  user: 'map.html',
  owner: 'owner-dashboard.html',
  admin: 'admin-dashboard.html',
};

/** If already logged in, redirect based on role */
function redirectIfLoggedIn() {
  const { token, role } = getAuth();
  if (token && role) {
    window.location.href = ROLE_REDIRECT[role] || 'map.html';
  }
}

/** Show/hide loading spinner on a button */
function setLoading(btn, loading) {
  if (loading) {
    btn.dataset.originalText = btn.textContent;
    btn.textContent = 'Đang xử lý...';
    btn.disabled = true;
  } else {
    btn.textContent = btn.dataset.originalText;
    btn.disabled = false;
  }
}

/** Display error message near the form */
function showError(container, message) {
  let errEl = container.querySelector('.auth-error');
  if (!errEl) {
    errEl = document.createElement('div');
    errEl.className = 'auth-error';
    errEl.style.cssText = 'color:#ff7351;background:rgba(185,41,2,0.15);padding:12px 16px;border-radius:8px;margin-top:12px;font-size:14px;';
    container.appendChild(errEl);
  }
  errEl.textContent = message;
  errEl.style.display = 'block';
}

function hideError(container) {
  const errEl = container.querySelector('.auth-error');
  if (errEl) errEl.style.display = 'none';
}

/** Wire up tab switching */
function setupTabs() {
  const tabs = document.querySelectorAll('[data-tab]');
  const panels = document.querySelectorAll('[data-panel]');
  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => t.classList.remove('active'));
      panels.forEach((p) => (p.style.display = 'none'));
      tab.classList.add('active');
      const panel = document.querySelector(`[data-panel="${tab.dataset.tab}"]`);
      if (panel) panel.style.display = 'block';
    });
  });
  // Show first tab by default
  if (tabs[0]) tabs[0].click();
}

/** Handle login form submission */
async function handleLogin(e) {
  e.preventDefault();
  const form = e.target;
  const btn = form.querySelector('button[type="submit"], button.login-btn, button:last-of-type');
  const usernameEl = form.querySelector('#login-username, [name="username"], input[placeholder*="dùng"]');
  const passwordEl = form.querySelector('#login-password, [name="password"], input[type="password"]');

  if (!usernameEl || !passwordEl) return;
  hideError(form);
  if (btn) setLoading(btn, true);

  try {
    const data = await api.post('/api/auth/login', {
      username: usernameEl.value.trim(),
      password: passwordEl.value,
    });
    saveAuth(data);
    window.location.href = ROLE_REDIRECT[data.role] || 'map.html';
  } catch (err) {
    showError(form, err.message || 'Đăng nhập thất bại. Vui lòng thử lại.');
    if (btn) setLoading(btn, false);
  }
}

/** Handle register form submission */
async function handleRegister(e) {
  e.preventDefault();
  const form = e.target;
  const btn = form.querySelector('button[type="submit"], button.register-btn, button:last-of-type');

  const usernameEl = form.querySelector('#reg-username, [name="reg-username"]')
    || [...form.querySelectorAll('input')].find((i) => i.placeholder?.toLowerCase().includes('tên tài khoản'));
  const emailEl = form.querySelector('#reg-email, [name="email"], input[type="email"]');
  const passwordEl = form.querySelector('#reg-password, [name="reg-password"]')
    || [...form.querySelectorAll('input[type="password"]')].pop();
  const roleEl = form.querySelector('[data-role].active, [data-role-selected], input[name="role"]:checked')
    || form.querySelector('[data-role="owner"].selected, .role-pill.selected[data-value]');

  // Detect role from active pill
  let role = 'user';
  const activePill = form.querySelector('.role-pill.active, .role-option.selected, [data-role].active');
  if (activePill) {
    const v = activePill.dataset.role || activePill.dataset.value || activePill.textContent.toLowerCase();
    if (v.includes('chủ') || v.includes('owner')) role = 'owner';
  }

  if (!usernameEl || !emailEl || !passwordEl) {
    showError(form, 'Vui lòng điền đầy đủ thông tin.');
    return;
  }
  hideError(form);
  if (btn) setLoading(btn, true);

  try {
    const data = await api.post('/api/auth/register', {
      username: usernameEl.value.trim(),
      email: emailEl.value.trim(),
      password: passwordEl.value,
      role,
    });
    saveAuth(data);
    window.location.href = ROLE_REDIRECT[data.role] || 'map.html';
  } catch (err) {
    showError(form, err.message || 'Đăng ký thất bại. Vui lòng thử lại.');
    if (btn) setLoading(btn, false);
  }
}

/** Wire role picker pills in register form */
function setupRolePills() {
  const pills = document.querySelectorAll('.role-pill, [data-role]');
  pills.forEach((pill) => {
    pill.style.cursor = 'pointer';
    pill.addEventListener('click', () => {
      pills.forEach((p) => p.classList.remove('active', 'selected'));
      pill.classList.add('active', 'selected');
    });
  });
  if (pills[0]) pills[0].classList.add('active');
}

/** Wire password visibility toggle */
function setupPasswordToggles() {
  document.querySelectorAll('[data-toggle-password], .password-toggle, .visibility-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const input = btn.closest('.input-wrapper, .field-wrapper, div')?.querySelector('input[type="password"], input[type="text"]');
      if (!input) return;
      input.type = input.type === 'password' ? 'text' : 'password';
      btn.textContent = input.type === 'password' ? '👁' : '🙈';
    });
  });
}

/** Init on page load */
document.addEventListener('DOMContentLoaded', () => {
  redirectIfLoggedIn();
  setupTabs();
  setupRolePills();
  setupPasswordToggles();

  // Find and wire login form
  const loginForm = document.querySelector('#login-form, form[data-form="login"], .login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  } else {
    // Fallback: wire the login button directly
    const loginBtn = document.querySelector('.login-btn, [id*="login"] button, button:has(+ .login-underline)');
    if (loginBtn) {
      loginBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const fakeEvent = { target: loginBtn.closest('form') || document.body, preventDefault: () => {} };
        handleLogin(fakeEvent);
      });
    }
  }

  // Find and wire register form
  const registerForm = document.querySelector('#register-form, form[data-form="register"], .register-form');
  if (registerForm) {
    registerForm.addEventListener('submit', handleRegister);
  }

  // Wire any "ĐĂNG NHẬP" or "TẠO TÀI KHOẢN" buttons that aren't in a form
  document.querySelectorAll('button, .btn').forEach((btn) => {
    if (btn.closest('form')) return; // Skip buttons inside a form, they use the form submit handler
    const text = btn.textContent.trim().toUpperCase();
    if (text.includes('ĐĂNG NHẬP') || text === 'LOGIN') {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const inputs = document.querySelectorAll('input');
        const username = [...inputs].find(i => i.type === 'text' || i.placeholder?.includes('dùng'))?.value;
        const password = [...inputs].find(i => i.type === 'password')?.value;
        if (username && password) {
          api.post('/api/auth/login', { username, password })
            .then(saveAuth)
            .then(() => { window.location.href = ROLE_REDIRECT[getAuth().role]; })
            .catch(err => alert('Lỗi: ' + err.message));
        }
      });
    }
    if (text.includes('TẠO TÀI KHOẢN') || text.includes('REGISTER')) {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const inputs = document.querySelectorAll('input');
        handleRegister({ preventDefault: () => {}, target: btn.closest('form') || document.querySelector('[data-panel="register"]') || document.body });
      });
    }
    if (text.includes('ĐĂNG XUẤT') || text === 'LOGOUT') {
      btn.addEventListener('click', () => {
        localStorage.clear();
        window.location.href = 'login.html';
      });
    }
  });
});
